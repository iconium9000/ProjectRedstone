// splix

console.log('game.js init')


module.exports = apInitA => {
  var fs = apInitA.fs
  var fu = apInitA.fu
  var pt = apInitA.pt

  // CONST ---------------------------------------------------------------------

  var stdColor = '#404040'
  var colors = ['red', 'green', 'blue', 'yellow', 'purple', 'magenta']

  var chunkSize = 2
  var gridSize = 10
  var cellSize = 25
  var cellWidth = 10
  var plrRadius = 2
  var gridWidth = gridSize * cellSize

  var arrows = {
    'ArrowRight': pt.point(1, 0),
    'ArrowLeft': pt.point(-1, 0),
    'ArrowUp': pt.point(0, -1),
    'ArrowDown': pt.point(0, 1)
  }

  var arrowKeys = Object.keys(arrows)

  // FUNCTIONS -----------------------------------------------------------------

  function randArrow() {
    return arrows[arrowKeys[Math.floor(4 * Math.random())]]
  }

  function randColor() {
    return colors[Math.floor(colors.length * Math.random())]
  }

  // VARS ----------------------------------------------------------------------

  var centerPoint = pt.zero()

  console.log('splix.io game')

  var usrInfo = {}

  // SRVR INIT -----------------------------------------------------------------

  function srvrInit() {

  }

  // CLNT INIT -----------------------------------------------------------------

  function clntInit() {
    document.body.style.backgroundColor = 'black'


  }

  // SRVR TICK -----------------------------------------------------------------

  function srvrTick() {

  }

  // CLNT TICK -----------------------------------------------------------------

  function clntTick(usrIO) {

  }

  // SRVR: NEW CELL ------------------------------------------------------------
  function newCell(cx, cy, gx, gy) {
    var cell = {
      x: cx * gridSize + gx,
      y: cy * gridSize + gy,
      z: 0,
      cx: cx,
      cy: cy,
      gx: gx,
      gy: gy,

      c: stdColor
    }
    cell.str = `${cell.x},${cell.y}`
    return cell
  }

  // SRVR/CLNT: GET CELL -------------------------------------------------------
  function getCell(p) {
    var cx = fu.gttt(Math.floor(p.x / gridSize), chunkSize - 1, 0)
    var cy = fu.gttt(Math.floor(p.y / gridSize), chunkSize - 1, 0)
    var gx = fu.gttt(Math.floor(p.x % gridSize), gridSize - 1, 0)
    var gy = fu.gttt(Math.floor(p.y % gridSize), gridSize - 1, 0)

    return usrInfo.chunks[cx][cy][gx][gy]
  }

  // SRVR: NEW PLAYER ----------------------------------------------------------
  function newPlr(id) {
    var plr = {
      id: id,
      x: Math.floor(Math.random() * chunkSize * gridSize),
      y: Math.floor(Math.random() * chunkSize * gridSize),
      z: 0,
      c: randColor(),
      v: randArrow(),
      cs: {}
    }

    plr.moves = [pt.copy(plr)]

    var p = pt.zero()
    var r = plrRadius
    for (p.x = -r; p.x <= r; ++p.x) {
      for (p.y = -r; p.y <= r; ++p.y) {
        var c = getCell(pt.sum(p, plr))
        c.c = plr.c
        c.plr = plr.id
        plr.cs[c.str] = c
        usrInfo.chunkModQ.push(c)
      }
    }

    return plr
  }

  // CLNT: DRAW ----------------------------------------------------------------

  // DRAW CELL
  function drawCell(g, c, cp) {
    g.fillStyle = c.c
    pt.fillRect(g, pt.sub(pt.scale(c, cellSize), cp), cellWidth)
  }

  // DRAW PLAYER
  function drawPlr(g, plr, cp) {
    var tf = p => pt.sub(pt.scale(p, cellSize), cp)
    var s = tf(plr)

    g.strokeStyle = plr.c
    g.beginPath()
    g.moveTo(s.x, s.y)
    for (var i = plr.moves.length - 1; i >= 0; --i) {
      var mv = tf(plr.moves[i])
      g.lineTo(mv.x, mv.y)
    }
    g.stroke()
  }

  // SRVR: CHUNK ---------------------------------------------------------------

  function setChunks() {
    var chunks = []
    for (var cx = 0; cx < chunkSize; ++cx) {
      chunks[cx] = []
      for (var cy = 0; cy < chunkSize; ++cy) {
        chunks[cx][cy] = []
        chunks[cx][cy].x = cx * gridSize * cellSize
        chunks[cx][cy].y = cy * gridSize * cellSize

        for (var gx = 0; gx < gridSize; ++gx) {
          chunks[cx][cy][gx] = []
          for (var gy = 0; gy < gridSize; ++gy) {
            chunks[cx][cy][gx][gy] = newCell(cx, cy, gx, gy)
          }
        }
      }
    }
    return chunks
  }

  // SRVR ----------------------------------------------------------------------

  function snd(ky, rcvr, msg) {
    apIO.apSnd({
      ky: ky,
      sndr: usrInfo.usr.id,
      rcvr: rcvr,
      msg: msg
    })
  }

  var apIO = apInitA.caleInit.apIO = {
    init: apInitB => {

      usrInfo.usrs = apInitB.usrInfo.usrs
      usrInfo.usr = usrInfo.usrs[apInitB.usrInfo.usr.id]
      usrInfo.calr = apInitB.calr
      usrInfo.isServer = apInitB.calr == 'srvr'

      if (usrInfo.isServer) {
        srvrInit()
      } else {
        clntInit()
      }

    },
    tick: clntTick,
    apRcv: rcvMsg
  }
  apInitA.cale(apInitA.caleInit)
}
