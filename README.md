# MPCPP

A small wrapper around [mpd.js](https://github.com/andrewrk/mpd.js).

It provides handy shortcuts for playback actions (`pause`, `next`…) and option toggles (`random`, `repeat`…).

Also it formats responses for `status` and `currentSong` commands.

## Query current playlist

`currentAlbum()` returns the album associated with the current song
`albums('artist', cb)` returns an array of all the albums of the given artist

Run `example.js` to get a preview.

## Related projects

[Louxor](https://www.npmjs.com/package/louxor) - A web player for MPD

## Licence

MIT
