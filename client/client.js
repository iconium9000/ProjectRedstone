console.log('client.js init')

// clnt init(`clntInit`)
module.exports = clntInit => {

  // gt fu frm clntInit
  var fu = clntInit.functions

  // gt skt frm clntInit
  var skt = clntInit.socket

  // mk usrIO w usrIO(fu)
  var usrIO = getUsrIO(fu)

  // mk reqFrame(window) frm fu
  var reqFrame = fu.reqFrame(window)

  /*
  mk tick()
    cal usrIO dsply()
    cal clntInit apIO tick(usrIO)
    cal usrIO mws()
    cal usrIO kys()
    cal usrIO evnts()
    cal reqFrame(tick)*/
  function tick() {
    usrIO.dsply()
    clntInit.apIO.tick(usrIO)
    usrIO.mws()
    usrIO.kys()
    usrIO.evnts()
    reqFrame(tick)
  }

  // skt on 'handShake' usrInfo =>
  skt.on('handShake', usrInfo => {

    // clr crsr
    $(canvas).css('cursor', 'none')

    /*
    mk apSnd(msg) in clntInit apIO
      skt snd msg to srvr @ 'msg' */
    clntInit.apIO.apSnd = msg => skt.emit('msg', msg)

    // skt on 'msg' msg =>
    skt.on('msg', msg => {
      switch (msg.ky) {

        case 'nw usr':
          /*
          if msg ky is 'nw usr'
            log `new usr: '${msg nam}'`
            cpy msg to usrInfo usrs @ msg id */

          console.log(`new user: '${msg.nam}'`)
          usrInfo.usrs[msg.id] = msg
          break

        case 'rmv usr':
          /*
          if msg ky is 'rmv usr'
            log `rmv usr: '${msg nam}'`
            rmv msg id frm usrInfo usrs */

          console.log(`rmv user: '${msg.nam}'`)
          delete usrInfo.usrs[msg.id]
          break

        default:
          /*
          else
            cal clntInit apIO apRcv(msg)*/

          clntInit.apIO.apRcv(msg)
      }
    })

    /*
    mk apInitB
      calr: 'clnt'
      wndo: window
      usrIO
      usrInfo */
    var apInitB = {
      calr: 'clnt',
      wndo: window,
      usrIO: usrIO,
      usrInfo: usrInfo
    }

    // init clntInit apIO init(apInitB)
    clntInit.apIO.init(apInitB)

    // cal tick()
    tick()
  })

  /*
  snd nam rqst to usr @ 'prompt'
  usr on 'prompt' gt nam frm usr => snd nam to clnt @ 'prompt'
  clnt on 'prompt' nam => snd w skt to srvr nam @ 'handShake' */
  skt.emit('handShake', prompt('What is your name?', 'Johnny Appleseed'))
}

function getUsrIO(fu) {
  function keys() {
    keys.isDn = keys.isDn || {}
    keys.hsDn = {}
    keys.hsUp = {}
  }

  function events() {
    var e = events
    e.nw = (new Date()).getTime()
    e.dt = e.nw - e.lst
    e.lst = e.nw
    e.tk = e.tk ? e.tk + 1 : 1
  }

  function display() {
    var e = display
    e.cnvs = e.cnvs || document.getElementById('canvas')
    e.g = e.g || e.cnvs.getContext('2d')
    e.width = e.cnvs.width = window.innerWidth - 20
    e.height = e.cnvs.height = window.innerHeight - 22
  }

  function mouse() {
    var e = mouse
    if (e.x == undefined) {
      pt.apply(e, pt.zero())
    }

    e.hsDn = e.hsDrgd = e.hsUp = false
    e.prv = pt.copy(e)
    e.prv.isDn = e.isDn
  }

  var setMouse = e => {
    mouse.x = e.clientX - 7
    mouse.y = e.clientY - 7
  }

  $(document).mousemove(e => {
    setMouse(e)
    mouse.hsDrgd = mouse.isDn
  })
  $(document).mousedown(e => {
    setMouse(e)
    mouse.hsDrgd = false
    mouse.isDn = true
    mouse.hsDn = true
  })
  $(document).mouseup(e => {
    setMouse(e)
    mouse.isDn = false
    mouse.hsUp = true
  })

  $(document).keypress(e => {
    var c = fu.etochar(e)
    keys.isDn[c] = true
    keys.hsDn[c] = true
  })
  $(document).keyup(e => {
    var c = fu.etochar(e)
    keys.isDn[c] = false
    keys.hsUp[c] = true
  })
  document.onkeydown = e => {
    keys.hsDn[e.key] = true
  }

  return {
    kys: keys,
    evnts: events,
    dsply: display,
    mws: mouse
  }
}
