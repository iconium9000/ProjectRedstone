console.log('game.js init (mazeGame)')


module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  var plrIf = new Object

  function sndMsg(ky,sndr,rcvr,msg) {
    apIO.apSnd({
      ky: ky,
      sndr: sndr,
      rcvr: rcvr,
      msg: msg
    })
  }

  var apIO_init = apInitB => {
    plrIf.usr = apInitB.usrInfo.usr

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'
      sndMsg('rqst update',plrIf.usr.id,'srvr')
    }
  }

  var apIO_tick = usrIO => {

  }

  var apIO_apRcv = rcvMsg => {
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    switch (ky) {

    }
  }

  var apIO = apInitA.caleInit.apIO = {
    init: apIO_init,
    tick: apIO_tick,
    apRcv: apIO_apRcv
  }

  apInitA.cale(apInitA.caleInit)
  console.log('hello world')

}
