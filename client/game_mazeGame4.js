// maze game 4

console.log('game.js init (mazeGame)')

/*
  draw (per tck)
    calc ofst
    forEach atrib
      draw cell @ cell + ofst

  atribs
    gate (obj)
      wire rqrd
      ...

      bhvr newGate()

    wire
      gate rqrd
      door optnl
      prtl optnl
      pad optnl
      spc optnl
      plr optnl
      ky optnl
      sqr optnl rqrs ky or pad

      bhvr
        on add & rmv cal newGate()
    door
      wire rqrd
      gate rqrd
      prtl banned
      pad banned
      spc rqrd if gate isOpen else banned
      plr optnl
      ky optnl
      sqr optnl rqrs ky

      bhvr
        on add
          add wire
          if gate isOpen add spc else rmv
    prtl
      wire rqrd
      gate rqrd
      door banned
      pad banned
      spc rqrd
      plr optnl
      ky optnl
      sqr optnl rqrs ky

      bhvr
        TODO
    pad
      wire rqrd
      gate rqrd
      door banned
      prtl banned
      spc rqrd
      plr optnl
      ky optnl
      sqr optnl

      bhvr
        TODO
    spc
      wire optnl
      gate optnl rqrs wire
      door optnl rqrs gate isOpen
      prtl optnl rqrs wire
      plr optnl
      ky optnl
      sqr optnl rqrs ky or pad

      bhvr
        TODO
    plr
      wire optnl
      gate optnl rqrs wire
      door optnl
      prtl optnl
      pad optnl
      spc rqrd fr mvmnt
      ky optnl
      sqr optnl rqrs ky or pad

      bhvr
        TODO
    ky
      wire optnl
      gate optnl rqrs wire
      door optnl
      prtl optnl
      pad optnl
      spc rqrd fr mvmnt
      plr rqrd fr mvmnt
      sqr optnl

      bhvr
        TODO
    sqr
      wire optnl
      gate optnl rqrs wire
      door optnl
      prtl optnl
      pad or ky rqrd
      spc optnl
      plr optnl

      bhvr
        TODO
  input
    usr cmds
      save
        clnt
          snd 'save' msg to srvr
        srvr
          rcv 'save' msg
          compress map
          create JSON string obj
          save JSON string obj to text file 'mazeGame4.txt'
      revert
        clnt
          snd 'revert' msg to srvr
        srvr
          rcv 'revert' msg
          read text file

      quit
        clnt
          snd 'quit' msg to srvr
        srvr
          call save
          snd 'quit' msg to clnts
          exit process

      clear
        clnt
          snd 'quit' msg to srvr
        srvr
          snd 'quit' msg to srvr

    kys
      i: wire
      d: door
      p: prtl
      h: pad
      x: spc
      j: plr
      k: ky
      s: sqr

    mws (per tck)
      calc ofst
      get cell @ mws - ofst
      actions
        drag map
          on mws hs
          game mode
          pan mode
        select cell
          on mws hsDn
          on mws isDn
        deselect cell
          on mws hsDn
          on mws isDn

  save

  modes

  update

  spread

  snd

  rcv

*/

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

var cellSize = 20   // square radius
var cellWidth = 15  // square radius


// -----------------------------------------------------------------------------
// OBJECTS
// -----------------------------------------------------------------------------

var pt
var cntr
var map = {}

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // INIT FUNCTIONS
  // ---------------------------------------------------------------------------

  // mapInit
  function mapInit() {
    cntr = pt.zero()
  }

  // ---------------------------------------------------------------------------
  // MOUSE FUNCTIONS
  // ---------------------------------------------------------------------------

  // translate mws into 'string', 'point', and 'cell'
  // return
  //    string: <cord in string form>
  //    point: <cord in point form>
  //    cell: <cell (if exists) @ cord>
  function getMouse(mws) {
    var p = pt.pt.factor(pt.sub(mws, cntr), cellSize)

    return {
      point: p
    }
  }



// -----------------------------------------------------------------------------
// INTERFACE
// -----------------------------------------------------------------------------

module.exports = apInitA => {

  fu = apInitA.fu
  pt = apInitA.pt

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


    mapInit()

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'
      sndMsg('rqst update',plrIf.usr.id,'srvr')
    }
  }

  var apIO_tick = usrIO => {
    var p =  getMouse(usrIO.mws)

    var g = usrIO.dsply.g
    var w = usrIO.dsply.w
    var h = usrIO.dsply.h

    g.strokeStyle = 'white'
    pt.drawCircle(g, pt.scale(p.point, cellSize), 10)
  }

  var apIO_apRcv = rcvMsg => {
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    console.log(rcvMsg)

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
