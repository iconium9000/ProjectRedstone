console.log("game.js: init")

function getNow() {
  return (new Date()).getTime()
}

module.exports = apInitA => {
  var fs = apInitA.fs
  var fu = apInitA.fu
  var pt = apInitA.pt

  // static a, kenetic b


  var usrInfo = {}

  var saveData = () => {}

  function snd(ky, rcvr, msg) {
    apIO.apSnd({
      ky: ky,
      sndr: usrInfo.usr.id,
      rcvr: rcvr,
      msg
    })
  }

  var abs = Math.abs

  function inRect(p, a, b) {
    var dx = abs(a.x - b.x)
    var dy = abs(a.y - b.y)
    var apx = abs(p.x - a.x)
    var apy = abs(p.y - a.y)
    var bpx = abs(p.x - b.x)
    var bpy = abs(p.y - b.y)
    return apx < dx && bpx < dx && apy < dy && bpy < dy
  }

  var ofSt = pt.zero()

  var map = {
    planets: {},
    planetKeys: [],
    msls: []
  }
  var scoreQ = []
  var int = {
    prv: getNow()
  }
  var getScore = p => {
    if (scoreQ.length == 0) {
      return 0
    } else if (scoreQ.length == 1) {
      return 0
    } else {
      var a = scoreQ[scoreQ.length - 2]
      var b = scoreQ[scoreQ.length - 1]
      var as = a.plnts[p.id].score
      var bs = b.plnts[p.id].score
      var at = a.timeStamp
      var bt = b.timeStamp
      var s = bs // (bs - as) / (bt - at) * (int.now - bt) + bs
      p.usr = b.plnts[p.id].usr
      return p.score = parseInt(s)
    }
  }

  var nplanets = 1e2
  var size = 7e2
  var randRadius = () => Math.random() * 10 + 10
  var rateFun = r => r * 5e-5
  var randScore = r => Math.random() * 50
  var msleSpeed = 5e-2
  var startScore = 100

  var getRandPlanet = () => map.planets[map.planetKeys[parseInt((nplanets - 1) * Math.random())]]
  var getPlanet = () => {
    for (var i = 0; i < nplanets * 2; ++i) {
      var p = getRandPlanet()
      if (p && !p.usr) {
        return p
      }
    }
    return getRandPlanet()
  }

  var colors = ['red', 'green', 'blue', 'purple', 'orange', 'cyan', 'brown', 'yellow']
  var getRandColor = () => colors[parseInt((colors.length - 1) * Math.random())]
  var getColor = () => {
    for (var i = 0; i < 30; ++i) {
      var c = getRandColor()
      for (var i in usrInfo.usrs) {
        if (usrInfo.usrs[i].color == c) {
          c = null
          break
        }
      }
      if (c) {
        return c
      }
    }
    return getRandColor()
  }

  var tInt = {
    prv: getNow()
  }
  var tickUpdate = () => {
    tInt.now = getNow()
    tInt.dt = tInt.now - tInt.prv

    fu.forEach(map.planets, p => {
      if (p.usr) {
        p.score += tInt.dt * p.rate
      }
    })

    for (var m in map.msls) {
      var ms = map.msls[m]
      var trgt = map.planets[ms.trgt]
      pt.sume(ms, pt.scale(pt.unit(pt.sub(trgt, ms)), tInt.dt * msleSpeed))

      for (var p in map.planets) {
        var pl = map.planets[p]

        if (pt.dist(ms, pl) < pl.r + ms.r) {
          if (p == ms.trgt) {
            if (pl.usr == ms.usr) {
              pl.score += 1
            } else if (pl.score - 1 < 0) {
              pl.score = 0
              pl.usr = ms.usr
            } else {
              pl.score -= 1
            }
            delete map.msls[m]
            break
          } else {
            point.push1(pl, ms)
          }
        }
      }
    }

    var kys = Object.keys(map.msls)
    for (var i = 0; i < kys.length; ++i) {
      var a = map.msls[kys[i]]
      for (var j = i + 1; j < kys.length; ++j) {
        var b = map.msls[kys[j]]
        if (pt.dist(a, b) < a.r + b.r) {
          point.push2(a, b)
        }
      }
    }

    tInt.prv = tInt.now
  }

  var uInt = {
    prv: getNow()
  }
  var update = () => {
    uInt.now = getNow()
    uInt.dt = uInt.now - uInt.prv

    var pm = {}
    fu.forEach(map.planets, p => pm[p.id] = {
      score: p.score,
      usr: p.usr
    })

    var msls = {}
    for (var i in map.msls) {
      msls[i] = map.msls[i]
    }
    snd('update', 'all -srvr', {
      timeStamp: uInt.now,
      plnts: pm,
      msls: msls
    })

    uInt.prv = uInt.now
  }

  var textSize = 10

  var apIO = apInitA.caleInit.apIO = {
    init: apInitB => {
      var usrs = usrInfo.usrs = apInitB.usrInfo.usrs
      var usr = usrInfo.usr = usrs[apInitB.usrInfo.usr.id]
      var calr = usrInfo.calr = apInitB.calr

      if (calr == 'clnt') {
        document.body.style.backgroundColor = 'black'
        snd('rqstMap', 'srvr')
        
      } else if (calr == 'srvr') {
        for (var i = 0; i < nplanets; ++i) {
          var id = fu.randKey(map.planets)
          var p = pt.scale(pt.rand(), size)

          p.z = 0
          p.id = id
          p.r = randRadius()
          p.rate = rateFun(p.r)
          p.score = randScore(p.r)
          for (var j in map.planets) {
            var p2 = map.planets[j]
            if (pt.dist(p, p2) < p.r + p2.r) {
              point.push2(p, p2)
            }

          }

          map.planets[id] = p
        }

        setInterval(tickUpdate, 10)
        setInterval(update, 1e2)
      }
    },
    tick: usrIO => {
      int.now = getNow()
      int.dt = int.now - int.prv

      var lineDash = () => g.setLineDash([5, 3])

      var g = usrIO.dsply.g
      var mws = usrIO.mws
      mws.r = 10
      mws.z = 0

      g.font = textSize + 'px Verdana'
      g.textAlign = 'center'
      var lw = 3
      g.lineWidth = lw
      map.selected = map.selected || {}

      var sql = scoreQ.length
      if (sql >= 2) {
        sqA = scoreQ[sql - 2]
        sqB = scoreQ[sql - 1]

        var at = sqA.timeStamp
        var bt = sqB.timeStamp
        var dt = bt - at

        fu.forEach(sqB.msls, m => {
          g.fillStyle = usrInfo.usrs[m.usr].color
          var a = sqA.msls[m.id]
          if (a) {
            var b = m
            var s = pt.factor(pt.sub(b, a), bt - at)
            var proj = pt.sum(pt.scale(s, getNow() - bt), b)
            pt.sume(proj, ofSt)
            pt.fillRect(g, proj, m.r)
          }
        })
      }

      mws.planet = null
      fu.forEach(map.planets, p => {
        g.strokeStyle = g.fillStyle = p.usr ? usrInfo.usrs[p.usr].color : 'white'
        p.proj = pt.sum(p, ofSt)
        pt.fillCircle(g, p.proj, p.r)
        var distLTr = pt.dist(mws, p.proj) < p.r
        if (distLTr || map.selected[p.id]) {
          if (p.usr == usrInfo.usr.id) {
            lineDash()
            pt.drawCircle(g, p.proj, p.r + 3 * lw)
            g.setLineDash([0])
          }
          if (distLTr) {
            mws.planet = p
          }
          pt.drawCircle(g, p.proj, p.r + lw)
        } else if (p.usr == usrInfo.usr.id) {
          lineDash()
          pt.drawCircle(g, p.proj, p.r + lw)
          g.setLineDash([0])
        }
        g.fillStyle = 'black'

        g.fillText(getScore(p), p.x + ofSt.x, p.y + ofSt.y + textSize / 2)
      })

      var plts = map.planets
      var u = usrInfo.usr
      if (mws.hsUp && mws.rect) {
        for (var i in map.planets) {
          var p = map.planets[i]
          if (p.usr == u.id && inRect(p, mws.rect, mws)) {
            map.selected[p.id] = true
          }
        }
        mws.rect = null
      } else if (mws.planet) {
        var p = mws.planet
        if (mws.hsDn) {
          if (p.usr == u.id) {
            map.selected[p.id] = true
            mws.target = p
            console.log(`mws dn ${mws.target}`)
          } else {
            snd('fire', 'srvr', {
              srcs: map.selected,
              trgt: p.id
            })
            map.selected = {}
          }
        }
        if (mws.hsUp) {
          mws.rect = null
          console.log(`mws up ${mws.target && mws.target.id != p.id}`)
          if (mws.target && mws.target.id != p.id) {
            snd('fire', 'srvr', {
              srcs: map.selected,
              trgt: p.id
            })
            map.selected = {}
          }
        }
        if (mws.isDn) {

        } else {
          if (mws.target) {
            console.log(`mws target fail`)
          }
          mws.target = false
        }
        g.strokeStyle = u.color
        lineDash()
        for (var s in map.selected) {
          pt.drawLine(g, plts[s].proj, p.proj)
        }
      } else if (mws.hsDn) {
        mws.rect = pt.copy(mws)
      }

      g.strokeStyle = u.color
      lineDash()
      if (mws.rect) {
        g.rect(mws.x, mws.y, mws.rect.x - mws.x, mws.rect.y - mws.y)
        g.stroke()
      }

      g.fillStyle = 'white'
      pt.fillCircle(g, usrIO.mws)
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

        case 'rqstMap':
          snd('rplyMap', sndr.id, map)
          break

        case 'rplyMap':
          map.planets = msg.planets
          map.planetKeys = Object.keys(map.planets)
          var planet = getPlanet()
          planet.score = 100

          snd('supGuys', 'all', {
            planet: planet.id,
            color: getColor()
          })
          break

        case 'supGuys':
          console.log(`${sndr.nam} 'supGuys ${msg.color}'`)
          sndr.color = msg.color
          map.planets[msg.planet].usr = sndr.id
          map.planets[msg.planet].score = startScore
          // console.log(map.planets[msg.planet])
          // console.log(usrInfo.usrs[sndr.id])
          break

        case 'rmv usr':
          fu.forEach(map.planets, p => {
            if (p.usr && p.usr == msg.id) {
              p.usr = null
            }
          })
          break

        case 'update':
          var now = getNow()
          msg.lag = int.lag = now - msg.timeStamp
          scoreQ.push(msg)
          window.msg = msg
          break

        case 'fire': // srcs, trgt
          for (var s in msg.srcs) {
            if (msg.target == s) {
              continue
            }
            var p = map.planets[s]
            var nm = parseInt(p.score)
            p.score -= nm
            for (var i = 0; i < nm; ++i) {
              var m = pt.sum(p, pt.rand())

              m.id = fu.randKey(map.msls)
              m.r = 3
              m.src = p.id
              m.trgt = msg.trgt
              m.usr = sndr.idff
              map.msls[m.id] = m
            }
          }
          update()
          break

        case 'save':
          if (usrInfo.calr == 'srvr') {
            fs.writeFile('data.txt', JSON.stringify(saveData(), null, '\t'))
          }
          console.log(`'${sndr.nam}' saved Level!`)
          break

        case 'clear':
          if (usrInfo.calr == 'srvr') {
            process.exit(0)
          }
      }

    }
  }

  apInitA.cale(apInitA.caleInit)

}
