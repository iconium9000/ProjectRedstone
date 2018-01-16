// template

console.log('game.js init')

module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  {
    scale = 300
    planet_r = 1
    litspeed = 0.001
    speed = 0.01
    nudge = 0.01
    tiny = 1e-14

    red_star = pt.point(1,0,0)
    green_star = pt.point(0,1,0)
    blue_star = pt.point(0,0,1)
    red_star.v = pt.point(0,1,0)
    green_star.v = pt.point(0,0,1)
    blue_star.v = pt.point(1,0,0)
    red_star.s = speed * 0.4
    green_star.s = speed * 0.4
    blue_star.s = speed * 0.4
    stars = [red_star, green_star, blue_star]
    stars.forEach(s => s.c = pt.copy(s))

    player = pt.point(1,0,0)
    player.r = 4
    player.v = pt.point(0,1,0)

    points = []
    lines = []
    planes = []
    fu.forlen(300, i => points.push(pt.unit(pt.math(n => 2 * n - 1, pt.rand()))))
    for (var i = 0; i < points.length; ++i) {
      var p = points[i]
      p.c = pt.math(i => 0.1 + (i > tiny ? 0.9 * i : 0), {
        x: pt.dot(p,red_star),
        y: pt.dot(p,green_star),
        z: pt.dot(p,blue_star)
      })
      p.l = []
      p.i = i
    }
    fu.forlen(points.length,
      i => fu.forlen(points.length - i - 1,
        j => lines.push([points[i],points[j+i+1]])))
    fu.forEach(lines, l => l[2] = pt.dist(l[0], l[1]))
    lines.sort((a,b)=>a[2]-b[2])
    for (var i = 0; i < lines.length; ++i) {
      for (var j = i+1; j < lines.length; ++j) {
        var a = lines[i]
        var b = lines[j]
        if (a[3] || b[3]) continue
        var a1 = a[0], a2 = a[1]
        var b1 = b[0], b2 = b[1]
        var u1 = pt.sub(b1,a1)
        var u2 = pt.sub(b2,a1)
        var u3 = pt.scale(a1,-1)
        var u4 = pt.sub(a2,a1)
        var v1 = pt.scale(pt.div(u1,u3), -1)
        var v2 = pt.scale(pt.div(u2,u3), -1)
        var v4 = pt.div(u4,u3)
        var t1 = pt.point(v1.y, v1.z)
        var t2 = pt.point(v2.y, v2.z)
        var t4 = pt.point(v4.y, v4.z)
        var v11 = pt.point(v1.x,v1.x)
        var v21 = pt.point(v2.x,v2.x)
        var v41 = pt.point(v4.x,v4.x)
        var v21_t2 = pt.sub(v21,t2)
        var w1 = pt.div(pt.sub(t1,v11), v21_t2)
        var w4 = pt.div(pt.sub(t4,v41), v21_t2)
        var k1 = (w4.y - w4.x) / (w1.x - w1.y)
        var k2 = w1.x*k1 + w4.x
        var k3 = v1.x*k1 + v2.x*k2 + v4.x
        if (k1 + k2 + k3 > 1+tiny && ((k1 > tiny && k2 > tiny))) {
          b[3] = true
        }
      }
    }
    for (var i = 0; i < lines.length; ++i) {
      if (lines[i][3]) lines.splice(i--,1)
    }
    for (var i = 0; i < lines.length; ++i) {
      lines[i][1].l[lines[i][0].i] = lines[i]
    }
    for (var i1 = 0; i1 < points.length; ++i1) {
      var p1 = points[i1]
      for (var i2 = i1+1; i2 < points.length; ++i2) {
        var p2 = points[i2]
        if (!p2.l[i1]) continue
        for (var i3 = i2+1; i3 < points.length; ++i3) {
          var p3 = points[i3]
          if (!p3.l[i1] || !p3.l[i2]) continue
          planes.push([p1,p2,p3])
        }
      }
    }
  }

  function getColor(p) {
    var c = pt.math(i => {
      i = i > 1+tiny ?
        'ff' :
        i < tiny ?
          '00' :
          (i*255).toString(16)
      return i[1] ? `${i[0]}${i[1]}` : `0${i[0]}`
    }, p)
    return `#${c.x}${c.y}${c.z}`
  }

  // {
  //   t_points = []
  //   fu.forlen(10, i => t_points.push({
  //     x: Math.random(),
  //     y: Math.random(),
  //     z: 0
  //   }))
  //   t_lines = []
  //   for (var i = 0; i < t_points.length; ++i) {
  //     for (var j = i+1; j < t_points.length; ++j) {
  //       t_lines.push([t_points[i], t_points[j]])
  //     }
  //   }
  //   t_lines.forEach(l => l[2] = pt.dist(l[0],l[1]))
  //   t_lines.sort((a,b)=>a[2]-b[2])
  //   for (var i = 0; i < t_lines.length; ++i) {
  //     for (var j = i+1; j < t_lines.length; ++j) {
  //       var a = t_lines[i]
  //       var b = t_lines[j]
  //       if (a[3] || b[3]) {
  //         continue
  //       }
  //
  //       var u1 = pt.sub(a[0],b[0])
  //       var u2 = pt.sub(a[1],b[0])
  //       var u3 = pt.sub(b[1],b[0])
  //       var u4 = {x:-u2.y * u3.x, y:u1.y * u3.x, z:0}
  //       var u5 = {x:-u2.x * u3.y, y:u1.x * u3.y, z:0}
  //       var u = u1.y * u2.x - u1.x * u2.y
  //       var k = pt.factor(pt.sub(u4,u5), u)
  //       if (k.x + k.y > 1 && k.x > 0 && k.y > 0) {
  //         b[3] = true
  //       }
  //     }
  //   }
  // }

  var apIO_tick = usrIO => {
    var g = usrIO.dsply.g
    var dt = usrIO.evnts.dt
    var mws = usrIO.mws
    var kydn = usrIO.kys.isDn
    var dsply = {
      x: usrIO.dsply.w,
      y: usrIO.dsply.h,
      z: 0
    }
    var cntr_pt = pt.factor(dsply, 2)

    {
      Z = player
      Y = player.v
      X = pt.cross(Y, Z)

      if (kydn['a']) {
        pt.sume(player.v, pt.scale(X, -nudge))
      }
      if (kydn['d']) {
        pt.sume(player.v, pt.scale(X, nudge))
      }
      var temp_speed = 0//litspeed
      if (kydn['w']) {
        temp_speed += speed
      }
      if (kydn['s']) {
        temp_speed -= speed
      }

      pt.set(player, pt.unit(pt.sum(player, pt.scale(player.v, temp_speed))))
      player.v = pt.unit(pt.sub(player.v,
        pt.scale(player, pt.dot(player, player.v))))
      Z = player
      Y = player.v
      X = pt.cross(Y, Z)


      function move_star(star) {
        pt.factore(star,1.2)
        pt.set(star, pt.unit(pt.sum(star, pt.scale(star.v, star.s))))
        star.v = pt.unit(pt.sub(star.v, pt.scale(star, pt.dot(star, star.v))))
        pt.scalee(star,1.2)
      }
      stars.forEach(move_star)

      var proj = (p,X,Y,Z) => {
        p = {
          x: pt.dot(p, X),
          y: -pt.dot(p, Y),
          z: pt.dot(p, Z)
        }

        return pt.sum(cntr_pt, pt.scale(p, scale))
      }

      fu.forEach(points, p => {
        p.j = proj(p,X,Y,Z)
        p.c = pt.math(i => 0.1 + (i > tiny ? 0.9 * i : 0), {
          x: pt.dot(p,red_star),
          y: pt.dot(p,green_star),
          z: pt.dot(p,blue_star)
        })
      })
      g.lineWidth = 3
      planes.forEach(p => {
        var p1 = p[0]
        var p2 = p[1]
        var p3 = p[2]
        var p4 = pt.cross(pt.sub(p2,p1),pt.sub(p3,p1))
        if ((pt.dot(p4,Z) < 0) == (pt.dot(p4,p1) > 0)) return

        g.fillStyle = getColor(pt.factor(pt.sum(p1.c,pt.sum(p2.c,p3.c)), 3))
        g.beginPath()
        g.moveTo(p1.j.x,p1.j.y)
        g.lineTo(p2.j.x,p2.j.y)
        g.lineTo(p3.j.x,p3.j.y)
        g.fill()
      })
      // g.fillStyle = g.strokeStyle = 'white'
      // pt.fillCircle(g, proj(player,X,Y,Z), player.r)
      stars.forEach(star => {
        star.j = proj(star,X,Y,Z)
        g.fillStyle = getColor(star.c)
        var cntr = pt.sub(pt.point(star.j.x, star.j.y),cntr_pt)
        if (star.j.z > 0 || pt.length(cntr) > scale)
          pt.fillCircle(g, star.j, 3)
      })
    }

    // {
    //   // g.fillStyle = g.strokeStyle = 'red'
    //   // t_points.forEach(p => p.j = pt.mult(p,dsply))
    //   // t_points.forEach(p => pt.fillCircle(g, p.j, 3))
    //   // t_lines.forEach(l => l[3] || pt.drawLine(g, l[0].j, l[1].j))
    // }

    // g.fillStyle = 'white'
    // pt.fillCircle(g, mws, 10)
  }

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
