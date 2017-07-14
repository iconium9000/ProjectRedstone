// chunks

console.log('game.js init')

module.exports = apInitA => {
  var fs = apInitA.fs
  var fu = apInitA.fu
  var pt = apInitA.pt

  var usrInfo = {}
  var map = {}
  var changes = {}
  var mapQ = []

  class LittleChunk {
    constructor(pt, str) {
      this.bigChunk = map.bigChunks.get(pt)
      this.bigChunk.array[str] = this
      if (usrInfo.calr == 'clnt') {
        snd('nwChk', 'srvr', str)
      }
    }

    export () {
      return `${JSON.stringify(this.point)}, ${this.string}`
    }

    import (exp) {
      console.log(exp)
    }
  }
  LittleChunk.size = 5

  class BigChunk {
    constructor(pt, str) {
      this.array = {}
    }
  }
  BigChunk.size = 1e3

  function snd(ky, rcvr, msg) {
    apIO.apSnd({
      ky: ky,
      sndr: usrInfo.usr.id,
      rcvr: rcvr,
      msg: msg
    })
  }

  function init(apInitB) {
    var usrs = usrInfo.usrs = apInitB.usrInfo.usrs
    var usr = usrInfo.usr = usrs[apInitB.usrInfo.usr.id]
    var calr = usrInfo.calr = apInitB.calr

    map.tick = fu.tick()

    if (calr == 'clnt') {
      document.body.style.backgroundColor = 'black'
      window.usrInfo = usrInfo

      snd('getMap', 'srvr')
    } else if (calr == 'srvr') {
      fu.setInterval(srvrTick, 0.1)
    }
  }

  function srvrTick() {
    map.tick()
    snd('update', 'all -srvr', changes)
    changes = {}
  }

  function clntTick(usrIO) {

    var mws = usrIO.mws
    var g = usrIO.dsply.g
    map.tick()

    if (mws.hsDn || mws.isDn) {
      map.chunks.get(mws)
    }

    map.bigChunks.forEach(bc => {
      g.strokeStyle = 'red'
      pt.drawRect(g, bc.point, BigChunk.size / 2)

      fu.forEach(bc.array, c => {
        g.strokeStyle = 'green'
        pt.drawRect(g, c.point, LittleChunk.size / 2)
      })
    })

    g.fillStyle = 'white'
    pt.fillCircle(g, mws, 10)
    g.fillText(map.tick.dt, 10, 10)
    if (usrInfo.ended) {
      g.fillText('disconnected', 10, 30)
    }
  }

  function rcv(msg) {
    var usr = usrInfo.usr
    var ky = msg.ky
    var sndr = usrInfo.usrs[msg.sndr]
    var rcvr = msg.rcvr
    msg = msg.msg

    switch (ky) {

      case 'getMap':
        var msg = {
          cells: {}
        }
        map.chunks.forEach(c => msg.cells[c.string] = c.export())
        snd('sndMap', sndr.id, msg)
        break

      case 'sndMap':
        for (var i in msg.cells) {
          map.chunks.get(null, i).import(msg.cells[i])
        }
        break

      case 'nwChk':

        map.chunks.get(null, msg)
        changes[msg] = 'add'
        break

      case 'update':
        for (var i in msg) {
          switch (msg[i]) {
            case 'add':
              map.chunks.get(null, i)
              break

          }
        }
        break

      case 'clear':
        snd('end', 'all -srvr')
        process.exit()
        break

      case 'end':
        usrInfo.ended = true
        break

    }

  }

  var parseInfo = {
    ptToPt: pt.ptToPt2,
    strToPt: pt.strToPt2,
    strFrmPt: pt.strFrmPt2
  }

  parseInfo.parse = fu.getParse(BigChunk.size, Math.round, parseInt)
  map.bigChunks = new fu.Chunk(BigChunk, parseInfo)
  parseInfo.parse = fu.getParse(LittleChunk.size, Math.round, parseInt)
  map.chunks = new fu.Chunk(LittleChunk, parseInfo)

  var apIO = apInitA.caleInit.apIO = {
    init: init,
    tick: clntTick,
    apRcv: rcv
  }
  apInitA.cale(apInitA.caleInit)
}
