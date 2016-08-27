const Mpcpp = require('./index')

const client = Mpcpp.connect({
	port: 6600,
	host: 'localhost',
})

client.on('ready', () => {
	console.log("ready")
})

client.on('system', (name) => {
	console.log("system update", name)
})

client.on('system-player', () => {

	client.status((err, status) => {
		if (err) throw err
		console.log("status", status)
	})

	client.currentSong((err, song) => {
		if (err) throw err
		console.log("song", song)
	})

	client.albums('Kula Shaker', (err, albums) => {
		if (err) throw err
		console.log('albums', albums)
	})
})
