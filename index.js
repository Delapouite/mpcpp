const mpd = require('mpd')

const Mpcpp = Object.create(mpd)
Mpcpp.COMMANDS = {
	DB: ['currentSong', 'status'],
	PLAYBACK: ['play', 'pause', 'stop', 'next', 'prev'],
	OPTIONS_TOGGLES: ['consume', 'random', 'repeat', 'single']
}

Mpcpp.connect = (opts) => {
	const m = Object.create(mpd.connect(opts))

	// getters

	m.get = (cmd, cb) => {
		m.sendCommand(cmd, (err, res) => {
			cb(err, Mpcpp.parseKeyValueMessage(res))
		})
	}

	m.status = (cb) => {
		m.get('status', (err, res) => {
			cb(err, formatStatus(res))
		})
	}

	m.currentSong = (cb) => {
		m.get('currentsong', (err, res) => {
			cb(err, formatSong(res))
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
	Mpcpp.COMMANDS.OPTIONS_TOGGLES.forEach((b) => {
		s[b] = s[b] === '1'
	})
	s.paused = s.state !== 'play'
	return s
}

function formatSong (s) {
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
	});

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
	s.lastModified = s['Last-Modified']
	delete s['Last-Modified']
	if (s.AlbumArtist) {
		s.albumArtist = s.AlbumArtist
		delete s.AlbumArtist
	}
	return s
}

module.exports = Mpcpp
