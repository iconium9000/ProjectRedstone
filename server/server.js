console.log('server.js init')

module.exports = srvrInit => {

  // gt exp frm 'express'
  var express = require('express')
  var exp = express()
  // gt serv frm 'http' & exp
  var serv = require('http').Server(exp)
  // gt sktIO frm 'socket' & serv
  var io = require('socket.io')(serv, {})

  // cpy fu frm srvrInit functions
  var fu = srvrInit.functions

  // init sktIO/exp(srvr)
  exp.get('/', (req, res) => res.sendFile(srvrInit.dirname + srvrInit.entryFolder + srvrInit.index))
  exp.use(srvrInit.entryFolder, express.static(srvrInit.dirname + srvrInit.entryFolder))
  serv.listen(srvrInit.port)

  /*
  mk usrInfo[obj]
    usrs[ky mp]
    usr {nam: 'server', id: 'srvr', op: true}
    def usr as usrs @ usr id */
  var usrInfo = {
    usrs: {}
  }
  usrInfo.usr = usrInfo.usrs.srvr = {
    nam: 'server',
    id: 'srvr',
    op: true
  }
  /*
  def rcvMsg(msg) in usrMsgMp @ 'srvr'
    cal srvrInit apIO apRcv(msg)
    if msg ky is 'nw usr'
      ad msg to usrInfo usrs @ msg id
      log `new usr ${msg nam}`
    if msg ky is 'rmv usr'
      rmv msg id frm usrInfo usrs
      log `new usr ${msg nam}` */
  var usrMsgMp = {
    'srvr': msg => {
      srvrInit.apIO.apRcv(msg)

      switch (msg.ky) {
        case 'nw usr':
          usrInfo.usrs[msg.id] = msg
          console.log(`new user ${msg.msg.nam}`)
          break

        case 'rmv usr':
          delete usrInfo.usrs[msg.id]
          console.log(`rmv user ${msg.msg.nam}`)
          break

      }
    }
  }
  /*
  // cpy apSnd(msg) in srvrInit apIO
  //   cal sndMsg(msg) */
  srvrInit.apIO.apSnd = sndMsg

  /*
  def sndMsg(msg, sndUsr)
    mk msgMp[ky mp:str:bol]
    gt rcvrs frm splt msg rcvr
    fr al rcvrs
      if 'all': st msgMp @ al usr ids to true
      if 'sndr': st msgMp @ clntUsr id to true
      if 'srvr': st msgMp @ srvr id to true
      if 'ops': st msgMp @ al usr ids to true if usr is opd
      if '<id>': st msgMp @ <id> to true
      if '-sndr': st msgMp @ msg sndr id to false
      if '-srvr': st msgMp @ srvr id to false
      if '-ops': st msgMp @ al usr ids to false if usr is opd
      if '-<id>': st msgMp @ <id> to false
    fr ech msgMp elmt id
      if msgMp @ elmt id
        cal fun(msg) in usrMsgMp @ elmt id  */
  function sndMsg(msg) {
    var msgMp = {}
    msg.rcvr.split(' ').forEach(tkn => {
      var ad = tkn[0] != '-'
      if (!ad) {
        tkn = tkn.replace('-', '')
      }

      switch (tkn) {
        case 'all':
          fu.forEach(usrInfo.usrs, u => msgMp[u.id] = ad)
          break

        case 'sndr':
          msgMp[msg.sndr] = ad
          break

        case 'ops':
          fu.forEach(usrinfo.usrs, u => {
            if (u.op) {
              msgMp[u.id] = ad
            }
          })
          break

        default:
          msgMp[tkn] = ad
          break
      }
    })

    for (var i in msgMp) {
      if (msgMp[i] && usrMsgMp[i]) {
        usrMsgMp[i](msg)
      }
    }
  }

  /*
  lstn fr stdIn @ 'data' d =>
    gt trm frm fu strsplit d
    mk msg
      ky: trm ky
      sndr: usrInfo usr id
      rcvr: 'all'
      msg: trm msg
    cal sndMsg*/
  process.openStdin().addListener('data', d => {
    var trm = fu.strsplit(d.toString().trim(), ' ')
    sndMsg({
      ky: trm.ky,
      sndr: usrInfo.usr.id,
      rcvr: 'all',
      msg: trm.msg
    })
  })

  /*
  mk apInitB
    calr: 'srvr'
    prcs: srvr process
    usrInfo: usrInfo
    */
  var apInitB = {
    calr: 'srvr',
    prcs: process,
    usrInfo: usrInfo
  }

  // cal srvrInit init(apInitB) p2
  srvrInit.apIO.init(apInitB)

  // skt on 'connection' skt => skt on 'handShake' nam => srvrClntInit(skt, nam)
  io.sockets.on('connection', skt => skt.on('handShake', nm => srvrClntInit(skt, nm)))

  // log 'Server is Active'
  console.log('server.js active')

  // srvrClntInit(skt, nam)
  function srvrClntInit(skt, nam) {
    /*
    mk clntUsr
      nam
      id: fu randKey(usrInfo usrs)
      op: true */
    var clntUsr = {
      nam: nam,
      id: fu.randKey(usrInfo.usrs),
      op: true
    }

    // ad clntUsr to usrInfo usrs @ clntUsr id
    usrInfo.usrs[clntUsr.id] = clntUsr

    /*
    mk clntUsrInfo
      usrs: ptr frm usrInfo usrs
      usr: clntUsr */
    var clntUsrInfo = {
      usrs: usrInfo.usrs,
      usr: clntUsr
    }

    /*
    def clntRcv(msg)
      skt snd msg @ 'msg' */
    var clntRcv = msg => skt.emit('msg', msg)

    // ad clntRcv(msg) to usrMsgMp @ clntUsr id
    usrMsgMp[clntUsr.id] = clntRcv

    // skt on 'msg' msg => cal sndMsg(msg)
    skt.on('msg', msg => sndMsg(msg))

    /*
    skt on 'disconnect' msg =>
      mk msg{ky: 'rmv usr', sndr: clntUsr id, rcvr: 'all', msg: clntUsr}
      cal sndMsg(msg) */
    skt.on('disconnect', msg => sndMsg({
      ky: 'rmv usr',
      sndr: clntUsr.id,
      rcvr: 'all',
      msg: clntUsr
    }))

    /*
    mk msg{ky: 'nw usr', sndr: clntUsr id, rcvr: 'all', clntUsr}
    cal sndMsg(msg) */
    var msg = {
      ky: 'nw usr',
      sndr: clntUsr.id,
      rcvr: 'all',
      msg: clntUsr
    }

    sndMsg(msg)

    // ad msg to clntUsrInfo
    clntUsrInfo.msg = msg

    // skt snd usrInfo @ 'handShake'
    skt.emit('handShake', clntUsrInfo)
  }


}
