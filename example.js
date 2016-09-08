const Mpcpp = require('./index')

const client = Mpcpp.connect({
	port: 6600,
	host: 'localhost',
})

client.on('ready', () => {
	console.log('ready')
})

client.on('system', (name) => {
	console.log('system update', name)
})

client.on('system-player', () => {

	client.status((err, status) => {
		if (err) throw err
		console.log('status', status)
	})

	client.currentSong((err, song) => {
		if (err) throw err
		console.log('current song', song)

		client.currentAlbum((err, album) => {
			if (err) throw err
			console.log('current album', album)
		})
	})

	client.artist('Kula Shaker', (err, albums) => {
		if (err) throw err
		console.log('artist', albums)
	})

	client.date('2016', (err, albums) => {
		if (err) throw err
		console.log('date', albums)
	})

	// exact match
	client.find(['artist', 'Kula Shaker', 'date', '1996'], (err, songs) => {
		if (err) throw err
		console.log('find', songs)
	})

	// insensitive partial match
	client.search(['artist', 'kula', 'date', '1996'], (err, songs) => {
		if (err) throw err
		console.log('search', songs)
	})
})
