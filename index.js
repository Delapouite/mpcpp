const mpd = require('mpd')

const Mpcpp = Object.create(mpd)
Mpcpp.COMMANDS = {
	DB: ['currentSong', 'status'],
	PLAYBACK: ['play', 'pause', 'stop', 'next', 'previous', 'clear'],
	OPTIONS_TOGGLES: ['consume', 'random', 'repeat', 'single']
}

Mpcpp.connect = (opts) => {
	const m = Object.create(mpd.connect(opts))

	m.state = {
		status: {},
		currentSong: {}
	}

	// getters

	m.get = (cmd, cb) => {
		m.sendCommand(cmd, (err, res) => {
			cb(err, Mpcpp.parseKeyValueMessage(res))
		})
	}

	// strict match
	m.find = (query, cb) => {
		m.sendCommand(Mpcpp.cmd('playlistfind', query), (err, res) => {
			if (err) return cb(err)

			const songs = Mpcpp.parseArrayMessage(res).map(formatSong)
			cb(null, songs)
		})
	}

	// insensitive partial match
	m.search = (query, cb) => {
		m.sendCommand(Mpcpp.cmd('playlistsearch', query), (err, res) => {
			if (err) return cb(err)

			const songs = Mpcpp.parseArrayMessage(res).map(formatSong)
			cb(null, songs)
		})
	}

	m.status = (cb) => {
		m.get('status', (err, res) => {
			const status = formatStatus(res)
			m.state.status = status
			cb(err, status)
		})
	}

	m.currentSong = (cb) => {
		m.get('currentsong', (err, res) => {
			const currentSong = formatSong(res)
			m.state.currentSong = currentSong
			cb(err, currentSong)
		})
	}

	m.currentAlbum = (cb) => {
		const { album, artist } = m.state.currentSong
		if (!album || !artist) return cb(null, {})

		m.find(['album', album, 'artist', artist], (err, songs) => {
			if (!songs || !songs.length) cb(null, {})

			const album = {
				title: songs[0].album,
				date: songs[0].date,
				songs
			}

			cb(null, album)
		})
	}

	// TODO deprecate in v2
	m.albums = (artist, cb) => {
		m.find(['artist', artist], (err, songs) => {
			if (err) return cb(err)

			cb(null, formatAlbums(songs))
		})
	}

	// all albums for a given artist
	m.artist = (artist, cb) => {
		m.find(['artist', artist], (err, songs) => {
			if (err) return cb(err)

			cb(null, formatAlbums(songs))
		})
	}

	// all albums for a given date
	m.date = (date, cb) => {
		m.find(['date', date], (err, songs) => {
			if (err) return cb(err)

			cb(null, formatAlbums(songs))
		})
	}

	m.playlists = (cb) => {
		m.sendCommand('listplaylists', (err, res) => {
			if (err) return cb(err)

			const playlists = Mpcpp.parseArrayMessage(res).map(p => p.playlist)
			cb(null, playlists)
		})
	}

	m.loadPlaylist = (name, cb) => {
		m.clear()
		m.sendCommand(Mpcpp.cmd('load', [name]), (err) => {
			if (err) return cb(err)

			m.play()
		})
	}

	// setters
	m.add = (uri, cb) => {
		m.sendCommand(Mpcpp.cmd('add', [uri]), cb)
	}

	// shortcuts

	Mpcpp.COMMANDS.PLAYBACK
	.forEach((cmd) => {
		m[cmd] = (cb) => {
			m.sendCommand(cmd, cb)
		}
	})

	m.toggle = () => {
		m.state.status.paused ? m.play() : m.pause()
	}
	Mpcpp.COMMANDS.PLAYBACK.push('toggle')

	m.playId = (id, cb) => {
		m.sendCommand(Mpcpp.cmd('playid', [id]), cb)
	}

	function clearAndPlay (cb) {
		return (err, albums) => {
			if (err) return cb(err)
			m.clear()
			albums.map(a => a.songs.forEach(s => m.add(s.file)))
			m.play()
		}
	}

	m.playArtist = (artist, cb) => {
		m.artist(artist, clearAndPlay(cb))
	}

	m.playDate = (date, cb) => {
		m.date(date, clearAndPlay(cb))
	}

	Mpcpp.COMMANDS.OPTIONS_TOGGLES.forEach((cmd) => {
		m[cmd] = (b, cb) => {
			let n
			if (b === 0) n = 1
			else if (b == 1) n = 0
			else n = m.state.status.random ? 0 : 1
			m.sendCommand(Mpcpp.cmd(cmd, [n]), cb)
		}
	})

	return m
}

// formatters

function formatStatus (s) {
	s.paused = s.state !== 'play'
	// bool
	Mpcpp.COMMANDS.OPTIONS_TOGGLES.forEach((b) => {
		s[b] = s[b] === '1'
	});

	// number
	[
		'volume',
		'playlist',
		'playlistlength',
		'song',
		'songid',
		'time',
		'elapsed',
		'bitrate',
		'nextsong',
		'nextsongid',
		'xfade',
		'mixrampdb'
	]
	.forEach((f) => {
		s[f] = parseInt(s[f])
	})

	// case
	s.playlistLength = s.playlistlength
	delete s.playlistlength
	s.songId = s.songid
	delete s.songid
	s.nextSong = s.nextsong
	delete s.nextsong
	s.nextSongId = s.nextsongid
	delete s.nextsongid

	return s
}

function formatSong (s) {
	// case
	[
		'Album',
		'Artist',
		'Date',
		'Id',
		'Pos',
		'Title',
		'Time',
		'Track'
	]
	.forEach((f) => {
		s[f.toLowerCase()] = s[f]
		delete s[f]
	})
	s.lastModified = s['Last-Modified']
	delete s['Last-Modified']
	if (s.AlbumArtist) {
		s.albumArtist = s.AlbumArtist
		delete s.AlbumArtist
	}

	// number
	[
		'time',
		'id',
		'pos',
		'date'
	]
	.forEach((f) => {
		// use of parseInt to extract only the year from dates
		s[f] = parseInt(s[f])
	})

	return s
}

function formatAlbums (songs) {
	const albums = songs.reduce((acc, s) => {
		let album = acc[s.album]
		if (!album) {
			album = {
				title: s.album,
				date: s.date,
				artist: s.artist,
				songs: []
			}
			acc[s.album] = album
		}
		album.songs.push(s)
		return acc
	}, {})
	return Object.values(albums)
}

module.exports = Mpcpp
