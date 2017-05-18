console.log("game.js: init")

module.exports = apInitA => {
  var fs = apInitA.fs
  var fu = apInitA.fu
  var pt = apInitA.pt

  var usrInfo = {}

  var saveData = () => {}

  var apIO = apInitA.caleInit.apIO = {
    init: apInitB => {
      usrInfo.usrs = apInitB.usrInfo.usrs
      usrInfo.usr = apInitB.usrInfo.usr
      usrInfo.calr = apInitB.calr

      if (apInitB.calr == 'clnt') {
        document.body.style.backgroundColor = 'black'
      }
    },
    tick: usrIO => {
      var g = usrIO.dsply.g

      g.fillStyle = 'white'
      pt.fillCircle(g, usrIO.mws, 10)
    },
    apRcv: msg => {
      var ky = msg.ky
      var sndr = usrInfo.usrs[msg.sndr]
      var rcvr = msg.rcvr
      var msg = msg.msg

      switch (ky) {
        case 'msg':
          console.log(`${sndr.nam}: '${msg}'`)
          break

        case 'save':
          if (usrInfo.calr == 'srvr') {
            fs.writeFile('data.txt', JSON.stringify(saveData(), null, '\t'))
          }
          console.log(`'${sndr.nam}' saved Level!`)
          break
      }

    }
  }

  apInitA.cale(apInitA.caleInit)

}
