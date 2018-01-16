log = console.log

log('app.js init')

log(process.argv)

var pkgs = {
  fu: require('./client/functions.js'),
  pt: require('./client/point.js'),
  fs: require('fs'),
  srvr: require('./server/server.js')
}

var apInitA = {
  fu: pkgs.fu,
  pt: pkgs.pt,
  fs: pkgs.fs,
  // TODO othr pkgs

  cale: pkgs.srvr,
  caleInit: {
    port: 2000,
    dirname: __dirname,
    entryFolder: '/client',
    index: '/index.html',
    functions: pkgs.fu
  }
}

require('./client/game.js')(apInitA)
