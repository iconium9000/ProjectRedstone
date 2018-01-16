// project redstone v2
var log = console.log
var sfy = JSON.stringify
log('game.js init')

// -----------------------------------------------------------------------------

// mws, string, point translations
function mws_to_point(cp, mws) {
  return pt.math(Math.round, pt.factor(pt.sub(mws, cp), cel_size))
}
function point_to_mws(cp, point) {
  return pt.sum(pt.scale(point, cel_size), cp)
}
function string_to_point(string) {
  var s = string.split(',')
  return {
    x: parseFloat(s[0]),
    y: parseFloat(s[1]),
    z: 0,
    s: string
  }
}
function point_to_string(point) {
  return `${point.x},${point.y}`
}
function drawArrowLine(g, pointA, pointB, radA, radB) {
  if (pointA != pointB) {
    pt.drawLine(g, pointB, pointA)

    var vect = pt.sub(pointB, pointA)
    var length = pt.length(vect)
    var arrow = arrow_time * length //Math.ceil(length / 20) * 20
    var scale = (elapsed_time % arrow) / arrow
    arrow = scale * length

    if (arrow > length - radB) pt.drawCircle(g, pointB, radB + 2)
    else if (radA > arrow) pt.drawCircle(g, pointA, radA + 2)

    pt.fillCircle(g, pt.sum(pt.scale(vect, scale), pointA), arrow_size)
  }
}

// -----------------------------------------------------------------------------
// vars

cel_size = 40

cntr_pt = null // _ZERO_CNTR_PT
mws_pt = null // _ZERO_MWS_PT
mws_cel = null

sel_cels = []

funs = {}
lexs = {}

scp_fun = null  // _ZERO_SCP_FUN

// tick
var apIO_tick = usrIO => {
  // if (!scp_fun) return

  var g = usrIO.dsply.g
  var mws = usrIO.mws

  mws_pt = mws_to_point(cntr_pt, mws) // _ZERO_MWS_PT
  mws_pt.s = point_to_string(mws_pt)
  mws_pt.proj = point_to_mws(cntr_pt, mws_pt)

  // user interface
  {


  }

  // DRAW
  {
    // g.fillStyle = 'grey'
    // pt.fillRect(g, mws_pt.proj, 4)

    g.fillStyle = 'white'
    pt.fillCircle(g, mws, 4)
  }

}

// -----------------------------------------------------------------------------

// exports
module.exports = apInitA => {

  fu = apInitA.fu
  pt = apInitA.pt

  cntr_pt = pt.zero() // _ZERO_CNTR_PT

  plrIf = new Object

  var apIO_init = apInitB => {
    plrIf.usr = apInitB.usrInfo.usr
    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

      sndMsg = (ky,rcvr,msg) =>
        apIO.apSnd({ky:ky, sndr:'srvr', rcvr:rcvr, msg:msg})
    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'

      sndMsg = (ky,rcvr,msg) =>
        apIO.apSnd({ky:ky, sndr:plrIf.usr.id, rcvr:rcvr, msg:msg})
    }
  }

  var apIO_apRcv = rcvMsg => {
    var me = plrIf.usr.id
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    try {
      switch (ky) {

      }
    }
    catch (e) {
      if (sndr == me) alert(e)
      log('ERROR', e)
    }
  }

  apIO = apInitA.caleInit.apIO = {
    init: apIO_init,
    tick: apIO_tick,
    apRcv: apIO_apRcv
  }
  apInitA.cale(apInitA.caleInit)
}

// -----------------------------------------------------------------------------
