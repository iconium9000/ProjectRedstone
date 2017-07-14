// greed

module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  var plrs = []

  var apIO_init = apInitB => {


  }

  var apIO_tick = clntTick => {

  }

  var apIO_apRcv = rcvMsg => {

    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    switch (ky) {
      case 'nw usr':

        plrs[msg.id] = {
          name: msg.name,
          score: 0
        }

        console.log(plrs)

        break

      case 'rmv usr':

        // TODO

        delete plrs[msg.id]

        break
    }
  }

  var apIO = apInitA.caleInit.apIO = {
    init: apIO_init,
    tick: apIO_tick,
    apRcv: apIO_apRcv
  }

  function sndMsg(ky,sndr,rcvr,msg) {
    apIO.sndMsg({
      ky: ky,
      sndr: sndr,
      rcvr: rcvr,
      msg: msg
    })
  }

  apInitA.cale(apInitA.caleInit)

}
