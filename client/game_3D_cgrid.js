// space

console.log('game.js space init')

// mws, string, point translations
cel_size = 20

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
    z: parseFloat(s[2]),
    s: string
  }
}
function point_to_string(point) {
  return `${point.x},${point.y},${point.z}`
}

cord_buds = [
  {x:1, y:0, z:0}, // 0
  {x:-1,y:0, z:0}, // 1
  {x:0, y:-1,z:0}, // 2
  {x:0, y:1, z:0}, // 3
  {x:0, y:0, z:1}, // 4
  {x:0, y:0, z:-1},// 5
]

op_buds = [1,0,3,2,5,4]
trn_bud = {
  '012':[0,1,2],'013':[0,1,3],'014':[0,1,4],'015':[0,1,5],
  '023':[2,3,0],'123':[2,3,1],'234':[2,3,4],'235':[2,3,5],
  '045':[4,5,0],'145':[4,5,1],'245':[4,5,2],'345':[4,5,3]
}

function get_bud(cel) {
  var s = ''
  fu.forEach(cel.buds, (bud,i) => s += i)
  return trn_bud[s]
}


module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  cntr_pt = pt.zero()
  pln_ht = 0

  cels = {}
  celq = {}

  dn_stat = true

  function set_buds(cel) {
    cel.buds = []

    fu.forlen(6, i => {
      var bud = cels[point_to_string(pt.sum(cel.p, cord_buds[i]))]
      if (!bud) return
      cel.buds[i] = bud
    })

    cel.bud_t = get_bud(cel)
    cel.i_buds = !cel.bud_t ? [] : [
      cel.buds[cel.bud_t[0]],
      cel.buds[cel.bud_t[1]],
      cel.buds[cel.bud_t[2]]
    ]
    celq[cel.p.s] = cel
  }

  var apIO_tick = usrIO => {
    var g = usrIO.dsply.g
    var mws = usrIO.mws

    var mws_pt = mws_to_point(cntr_pt, mws)
    mws_pt.z = pln_ht
    mws_pt.s = point_to_string(mws_pt)
    var mws_cel = cels[mws_pt.s]

    if (mws.hsDn)
      mws_stat = !mws_cel

    if (mws.hsDn || mws.isDn || mws.hsUp) {
      if (!mws_cel && mws_stat) {
        mws_cel = {
          p: mws_pt,
          buds: [],
          i_buds: [],
          s1: 1,
          s2: 1
        }
        cels[mws_cel.p.s] = mws_cel
        set_buds(mws_cel)
        fu.forEach(mws_cel.buds, set_buds)
      }
      else if (mws_cel && !mws_stat) {
        delete cels[mws_cel.p.s]
        fu.forEach(mws_cel.buds, set_buds)
      }
    }

    if (usrIO.kys.hsUp[' '] && mws_cel) {
      mws_cel.s1 = mws_cel.s1 == 3 ? 0 : 3
      celq[mws_cel.p.s] = mws_cel
    }

    // draw
    {
      fu.forEach(cels, cel => cel.j = point_to_mws(cntr_pt, cel.p))
      fu.forEach(cels, cel => {
        if (cel.p.z != pln_ht) return

        for (var i = 0; i < 2; ++i) {
          var bud = cel.buds[i]
          if (bud) {
            if (bud.s1 == 3 || cel.s1 == 3)
              g.strokeStyle = 'green'
            else if (bud.s1 == 2 || cel.s1 == 2)
              g.strokeStyle = 'red'
            else g.strokeStyle = 'grey'

            pt.drawLine(g, cel.j, bud.j)
          }
        }
      })
      var cels_0 = {}
      var cels_1 = {}
      var cels_2 = {}
      fu.forEach(cels, cel => {
        var z = Math.abs(cel.p.z - pln_ht)
        var s = `${cel.p.x} ${cel.p.y}`
        if (z == 0)
          cels_0[s] = cel
        else if (z == 1)
          cels_1[s] = cel
        else if (z < 3) {
          var cel2 = cels_2[s]
          if (cel2) {
            var z2 = Math.abs(cel2.p.z - pln_ht)
            if (z > z2) cels_2[s] = cel
          }
          else {
            cels_2[s] = cel
          }
        }

      })
      var draw = cel => {
        var z = cel.p.z == pln_ht ? 8 : 3 - Math.abs(cel.p.z - pln_ht)

        g.fillStyle =
          cel.s1 == 4 ? `#0000${z}0` :
          cel.s1 == 3 ? `#00${z}000` :
          cel.s1 == 2 ? `#${z}00000` :
          cel.s1 == 1 ? `#${z}0${z}0${z}0` : `#${z}000${z}0`

        var r = (cel.p.z != pln_ht ? -2 : 0) + cel_size / 2 - 2

        if (cel.p.z - pln_ht > 0)
          pt.fillCircle(g, cel.j, r)
        else
          pt.fillRect(g, cel.j, r)
      }
      fu.forEach(cels_2, draw)
      fu.forEach(cels_0, draw)
      fu.forEach(cels_1, draw)

      g.fillStyle = 'white'
      pt.fillCircle(g, mws, cel_size / 2 - 2)
      pt.fillRect(g, point_to_mws(cntr_pt, mws_pt), cel_size / 2 - 2)
    }

    if (usrIO.kys.hsDn['Enter'])
    // for (var i = 0; i < 10; ++i)
    {
      var newq = {}

      fu.forEach(celq, cel => {
        if (cel.s1 == cel.s2) return

        cel.s2 = cel.s1
        fu.forEach(cel.buds, bud => newq[bud.p.s] = bud)
      })

      fu.forEach(celq, cel => {
        if (cel.s1 == 3) return

        var c = [0,0,0,0]
        fu.forEach(cel.buds, bud => {
          if (bud.i_buds[0] != cel && bud.i_buds[1] != cel)
            ++c[bud.s2]
        })

        if (cel.bud_t) {
          var bud_0 = cel.i_buds[0].s2
          var bud_1 = cel.i_buds[1].s2
          var bud_2 = cel.i_buds[2].s2

          if (bud_0 > 1 && bud_1 < 2) {
            cel.s1 = 2
          }
          else if (bud_2 < 2) {
            cel.s1 = 1
          }
          else if (bud_2 == 2) {
            cel.s1 = 0
          }
          else if (bud_2 == 3) {
            cel.s1 = 2
          }
        }
        else if (cel.s1 == 0) {
          if (c[3]) cel.s1 = 2
          else if (!c[2]) cel.s1 = 1
        }
        else if (c[0]) {
          cel.s1 = 0
        }
        else if (c[2] || c[3]) {
          cel.s1 = 2
        }
      })

      fu.forEach(celq, cel => {
        if (cel.s1 == cel.s2) return

        cel.s2 = cel.s1
        fu.forEach(cel.buds, bud => newq[bud.p.s] = bud)
      })

      celq = newq
    }

    if (usrIO.kys.hsDn['ArrowLeft']) {
      if (cel_size > 10) cel_size -= 5
    }
    else if (usrIO.kys.hsDn['ArrowRight']) {
      cel_size += 5
    }
    else if (usrIO.kys.hsDn['ArrowUp']) {
      ++pln_ht
    }
    else if (usrIO.kys.hsDn['ArrowDown']) {
      --pln_ht
    }
  }

  function sndMsg(ky,sndr,rcvr,msg) {
    apIO.apSnd({
      ky: ky,
      sndr: sndr,
      rcvr: rcvr,
      msg: msg
    })
  }
  var apIO_init = apInitB => {
    plrIf = new Object
    plrIf.usr = apInitB.usrInfo.usr

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'
      sndMsg('rqst update',plrIf.usr.id,'srvr')
    }
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
}
