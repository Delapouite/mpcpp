const mpd = require('mpd')

const Mpcpp = Object.create(mpd)
Mpcpp.COMMANDS = {
	DB: ['currentSong', 'status'],
	PLAYBACK: ['play', 'pause', 'stop', 'next', 'prev'],
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

	// shortcuts

	Mpcpp.COMMANDS.PLAYBACK
	.forEach((cmd) => {
		m[cmd] = (cb) => {
			m.sendCommand(cmd, cb)
		}
	})

	Mpcpp.COMMANDS.OPTIONS_TOGGLES.forEach((cmd) => {
		m[cmd] = (b, cb) => {
			const n = b ? 1 : 0
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
