const values = require('object.values')
const mpd = require('mpd')

const Mpcpp = Object.create(mpd)
Mpcpp.COMMANDS = {
	DB: ['currentSong', 'status'],
	PLAYBACK: ['play', 'pause', 'stop', 'next', 'previous'],
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

	m.albums = (artist, cb) => {
		m.sendCommand(Mpcpp.cmd('playlistfind', ['artist', artist]), (err, res) => {
			if (err) return cb(err)

			const songs = Mpcpp.parseArrayMessage(res).map(formatSong)
			const albums = songs.reduce((acc, s) => {
				let album = acc[s.album]
				if (!album) {
					album = {
						title: s.album,
						date: s.date,
						songs: []
					}
					acc[s.album] = album
				}
				album.songs.push(s)
				return acc
			}, {})

			cb(null, values(albums))
		})
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

module.exports = Mpcpp
