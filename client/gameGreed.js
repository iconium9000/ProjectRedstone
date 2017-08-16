// greed

console.log('game.js init (greed)')

module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  var grd = {
    plrs: {},
    ids: [],
    turns: 0,
    rollsPerTurn: 1,
    status: 'is deciding what to do',

    score: 0,
    ndice: 6,
    dice: [],
    tally: []
  }
  var plrIf = new Object

  var sndMsg = (ky,sndr,rcvr,msg) => {
    apIO.apSnd({
      ky: ky,
      sndr: sndr,
      rcvr: rcvr,
      msg: msg
    })
  }

  function checkTally(dice) {
    var tally = []
    for (var i = 0; i <= 6; ++i) {
      tally[i] = []
    }

    for (var i in dice) {
      if (dice[i].sel == 'desel') {
        tally[0].push(dice[i])
      } else {
        tally[dice[i].val].push(dice[i])
      }
    }

    return tally
  }

  function rollDice() {
    grd.dice = []

    grd.ndice = grd.ndice || 6

    for (var i = 0; i < grd.ndice; ++i) {
      grd.dice.push({
        val: Math.ceil(Math.random() * 6),
        sel: null
      })
    }
    fu.forEach(grd.dice, d => d.sel = null)
    grd.tempScore = checkScore(grd.dice, checkTally(grd.dice))
  }

  var scoreChart = [
    [], // null
    //   0     1     2     3     4     5     6
    [    0,  100,  200, 1000, 2000, 4000, 8000],  // 1
    [    0,    0,    0,  200,  400,  800, 1600],  // 2
    [    0,    0,    0,  300,  600, 1200, 2400],  // 3
    [    0,    0,    0,  400,  800, 1600, 3200],  // 4
    [    0,   50,  100,  500, 1000, 2000, 4000],  // 5
    [    0,    0,    0,  600, 1200, 2400, 4800],  // 5
  ]

  function hideDice(i) {
    var dice = grd.dice
    var dc = dice[i]


    var tally = checkTally(dice)
    if (dc.sel == 'desel') {
      for (var i in dice) {
        if (dice[i].val == dc.val) {
          dice[i].sel = null
        }
      }
    } else if (dc.sel == 'selected') {
      dc.sel = 'desel'
    } else if (dc.sel == 'allornothing') {
      fu.forEach(tally[dc.val], t=>{
        t.sel = 'desel'
      })
    }

    grd.tempScore = checkScore(dice, grd.tally = checkTally(dice))
  }

  function checkScore(dice, tally) {
    grd.tempScore = 0

    // straight 3000
    var straight = dice.length == 6
    for (var i = 1; i <= 6; ++i) {
      if (!straight || tally[i].length != 1) {
        straight = false
        break
      }
    }
    if (straight) {
      fu.forEach(dice, d => d.sel = 'straight')
      return 3000
    }

    // 3 pairs
    var pairs = 0
    for (var i = 1; i <= 6; ++i) {
      pairs += tally.length == 2
    }
    if (pairs == 3) {
      fu.forEach(dice, d=> d.sel = '3pairs')
      return 1000
    }

    var tempScore = 0
    // individual
    for (var i = 1; i <= 6; ++i) {
      var t = tally[i].length
      var s = scoreChart[i][t]
      var sel
      tempScore += s
      if (s == 0) {
        sel = null
      } else if (i == 1 || i == 5) {
        sel = 'selected'
      } else {
        sel = 'allornothing'
      }
      fu.forEach(tally[i], d => d.sel = sel)
    }

    return tempScore
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

    // setup vars
    var g = usrIO.dsply.g
    var w = usrIO.dsply.w
    var h = usrIO.dsply.h
    var d = w > h ? h : w
    var cntr = pt.point(w / 2, h / 2, 0)
    var plrs = grd.plrs
    var ids = grd.ids
    var tau = 2 * Math.PI
    var cnst = tau / ids.length
    var uid = plrIf.usr.id
    var pid = ids[grd.turns % ids.length]
    var ptrn = plrs[pid]

    var defLineWidth = 3
    var thinLineWidth = 1

    var textSpacing = 20
    var textSmidge = textSpacing / 5
    var outerRadius = d / 3
    var playerRadius = d / 10
    var playerRadiusOffset = playerRadius + 7
    var diceOuterRadius = d / 6
    var diceSelRadius = 25
    var dicePointRadius = 2
    var diceRadius = 6
    var mouseRadius = 10
    var optionsRadius = 30

    var mws = usrIO.mws
    // get mouse has released information
    var hsUp = mws.hsUp

    var optionsSpacer = pt.point(diceOuterRadius / 2)

    // if no player's turn don't turn on
    if (!ptrn) {
      return
    }

    // get plrtrn's
    var utrn = ptrn.id == uid

    // set colors
    g.fillStyle = 'black'
    g.strokeStyle = 'white'
    g.lineWidth = defLineWidth

    // draw outer circle
    pt.drawCircle(g, cntr, outerRadius)

    // set font stuff
    g.font = 'bold 14px arial'
    g.fillStyle = 'white'

    // status info
    g.textAlign = 'left'
    g.fillText(`It is ${ptrn.nam}'s turn`,textSpacing, textSpacing)
    g.fillText(`${ptrn.nam} ${grd.status}`, textSpacing, 2 * textSpacing)
    g.fillText(`${ptrn.nam}'s score is ${ptrn.score}`, textSpacing, 3 * textSpacing)

    // tell plr if it is plr's turn
    if (ptrn.id == uid) {
      g.textAlign = 'right'
      g.fillText(`It is your turn, ${ptrn.nam}`, w - textSpacing, textSpacing)
    }

    // display current score
    g.textAlign = 'center'
    g.fillText(`${grd.score}`,cntr.x, cntr.y - textSpacing / 2 + textSmidge)
    g.fillText(`+${grd.tempScore}`,cntr.x, cntr.y + textSpacing / 2 + textSmidge)

    // if this plr's turn....
    if (ptrn.id == uid) {
      // get left and right points
      var leftPt = pt.sub(cntr, optionsSpacer)
      var rightPt = pt.sum(cntr, optionsSpacer)

      if (grd.rollsPerTurn) {

        if (grd.tempScore) {
          g.fillText(`pass`, leftPt.x, leftPt.y + textSmidge)
          pt.drawCircle(g, leftPt, optionsRadius)
        }

        if (hsUp && pt.dist(mws, leftPt) < optionsRadius + mouseRadius) {
          grd.status = 'is passing...'
          sndMsg('pass', uid, 'srvr')
        }

        if (grd.tempScore) {
          g.fillText(`roll`, rightPt.x, rightPt.y - textSpacing / 2 + textSmidge)
          g.fillText(`again`, rightPt.x, rightPt.y + textSpacing / 2 + textSmidge)
          pt.drawCircle(g, rightPt, optionsRadius)

          if (hsUp && pt.dist(mws, rightPt) < optionsRadius + mouseRadius) {
            grd.status = 'is rolling again...'
            sndMsg('rollAgain', uid, 'srvr')
          }
        }
      } else {
        g.fillText(`start`, leftPt.x, leftPt.y - textSpacing / 2 + textSmidge)
        g.fillText(`over`, leftPt.x, leftPt.y + textSpacing / 2 + textSmidge)
        pt.drawCircle(g, leftPt, optionsRadius)
        if (hsUp && pt.dist(mws, leftPt) < optionsRadius + mouseRadius) {
          grd.status = 'is starting over...'
          sndMsg('startOver', uid, 'srvr')
        }

        g.fillText(`keep`, rightPt.x, rightPt.y - textSpacing / 2 + textSmidge)
        g.fillText(`going`, rightPt.x, rightPt.y + textSpacing / 2 + textSmidge)
        pt.drawCircle(g, rightPt, optionsRadius)
        if (hsUp && pt.dist(mws, rightPt) < optionsRadius + mouseRadius) {
          grd.status = 'is rolling with the last roll...'
          sndMsg('keepGoing', uid, 'srvr')
        }
      }
    }

    // draw plyrs around circle
    for (var i = 0; i < ids.length; ++i) {
      // get plr id
      var id = ids[(i + grd.turns) % ids.length]
      var plr = plrs[id]
      var pnt = pt.sum(cntr, pt.scale(pt.angle(-cnst * i - Math.PI / 2), outerRadius))

      // set colors
      g.fillStyle = 'black'
      g.strokeStyle = i ? 'white' : 'green'

      // draw circle
      // draw double circle plr is current plr
      if (id == uid) {
        pt.fillCircle(g, pnt, playerRadiusOffset)
        pt.drawCircle(g, pnt, playerRadius)
        pt.drawCircle(g, pnt, playerRadiusOffset)
      } else {
        pt.fillCircle(g, pnt, playerRadius)
        pt.drawCircle(g, pnt, playerRadius)
      }

      // display plrs name and score
      g.fillStyle = g.strokeStyle
      g.fillText(plr.nam, pnt.x, pnt.y - textSpacing / 2)
      g.fillText('Score: ' + plr.score, pnt.x, pnt.y + textSpacing / 2)
    }

    // get ndice and set colors
    var ndice = grd.dice.length
    g.strokeStyle = g.fillStyle = 'white'

    // draw dice
    for (var i in grd.dice) {
      // get dice's center
      var p = pt.sum(cntr, pt.scale(pt.angle(tau * i / ndice), diceOuterRadius))

      // get dice @ index
      var dc = grd.dice[i]

      // draw circle if dice is able to be selected
      if (dc.sel) {
        //
        if (hsUp && pt.dist(p, mws) < diceSelRadius + mouseRadius) {
          sndMsg('hideDice',uid,'srvr',i)
        }
        g.lineWidth = dc.sel == 'desel' ? thinLineWidth : defLineWidth
        pt.drawCircle(g, p, diceSelRadius)
      }

      var val = dc.rand ? Math.ceil(6 * Math.random()) : dc.val
      if (val == 1) {
        pt.fillCircle(g,p,dicePointRadius)
      } else {
        for (var i = 0; i < val; ++i){
          pt.fillCircle(g,pt.sum(p, pt.scale(pt.angle(tau * i / val), diceRadius)), dicePointRadius)
        }
      }
    }
    g.lineWidth = defLineWidth


    g.fillStyle = 'white'
    pt.fillCircle(g, mws, mouseRadius)

  }

  var apIO_apRcv = rcvMsg => {

    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    var ids = grd.ids
    var pid = ids[grd.turns % ids.length]
    var ptrn = grd.plrs[pid]

    switch (ky) {

      case 'clear':
        process.exit(0)
        break

      case 'clearScores':
        fu.forEach(grd.plrs, p => p.score = 0)
        sndMsg('update','srvr', 'all -srvr', grd)

        break

      case 'startOver':
        grd.score = 0
        ++grd.rollsPerTurn
        grd.ndice = 6
        rollDice()

        if (grd.tempScore) {
          ++grd.rollsPerTurn
          grd.status = 'started over'
        } else {
          grd.rollsPerTurn = 1
          grd.score = 0
          grd.ndice = 6
          grd.status = 'is deciding what to do'
          do {
            ++grd.turns
            rollDice()
          } while (!grd.tempScore)
        }

        sndMsg('update','srvr', 'all -srvr', grd)
        break

      case 'keepGoing':
        ++grd.rollsPerTurn
        rollDice()

        if (grd.tempScore) {
          ++grd.rollsPerTurn
          grd.status = 'kept going'
        } else {
          grd.rollsPerTurn = 1
          grd.score = 0
          grd.ndice = 6
          grd.status = 'is deciding what to do'
          do {
            ++grd.turns
            rollDice()
          } while (!grd.tempScore)
        }

        sndMsg('update','srvr', 'all -srvr', grd)

        break

      case 'rollAgain':
        grd.score += grd.tempScore

        grd.ndice = 0
        fu.forEach(grd.dice, d => grd.ndice += !d.sel || d.sel == 'desel')
        rollDice()

        if (grd.tempScore) {
          ++grd.rollsPerTurn
          grd.status = 'rolled again'
        } else {
          grd.rollsPerTurn = 1
          grd.score = 0
          grd.ndice = 6
          grd.status = 'is deciding what to do'
          do {
            ++grd.turns
            rollDice()
          } while (!grd.tempScore)
        }

        sndMsg('update','srvr', 'all -srvr', grd)

        break

      case 'pass':

        grd.score += grd.tempScore
        grd.plrs[sndr].score += grd.score


        grd.ndice = 0
        fu.forEach(grd.dice, d => grd.ndice += !d.sel || d.sel == 'desel')
        rollDice()
        grd.tempScore = 0

        fu.forEach(grd.dice, d => d.sel = !(d.rand = true))

        grd.rollsPerTurn = 0
        ++grd.turns

        grd.status = 'is deciding what to do'

        sndMsg('update','srvr', 'all -srvr', grd)
        break

      case 'hideDice':
        if (sndr == grd.ids[grd.turns % grd.ids.length]) {
          hideDice(msg)
          sndMsg('update','srvr', 'all -srvr', grd)
        }
        break

      case 'rqst update':
        sndMsg('update','srvr', sndr, grd)
        break

      case 'update':
        grd = msg
        break

      case 'nw usr':
        if (plrIf.srvr) {
          grd.plrs[msg.id] = {
            nam: msg.nam,
            id: msg.id,
            score: 0
          }
          grd.ids = Object.keys(grd.plrs)
          rollDice(6)
          sndMsg('update','srvr', 'all -srvr', grd)
        }

        break

      case 'rmv usr':
        // TODO

        delete grd.plrs[msg.id]
        grd.ids = Object.keys(grd.plrs)
        sndMsg('update','srvr', 'all -srvr', grd)
        break
    }
  }

  var apIO = apInitA.caleInit.apIO = {
    init: apIO_init,
    tick: apIO_tick,
    apRcv: apIO_apRcv
  }

  apInitA.cale(apInitA.caleInit)

}
