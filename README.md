# MPCPP

A small wrapper around [mpd.js](https://github.com/andrewrk/mpd.js).

It provides handy shortcuts for playback actions (`pause`, `next`…) and option toggles (`random`, `repeat`…).

Also it formats responses for `status` and `currentSong` commands.

## Query current playlist

`albums('artist', cb)` returns an array of all the albums of the given artist

Run `example.js` to get a preview.

## Licence

MIT
