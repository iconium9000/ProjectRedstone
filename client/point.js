console.log("point.js: init")
var pt = module.exports = {
  point: (x, y, z) => {
    return {
      x: x ? x : 0,
      y: y ? y : 0,
      z: z ? z : 0,
    }
  },

  zero: function() {
    return {
      x: 0,
      y: 0,
      z: 0
    }
  },

  equal: function(a,b) {
    return a.x == b.x && a.y == b.y && a.z == b.z
  },

  rand: function() {
    return {
      x: Math.random(),
      y: Math.random(),
      z: Math.random()
    }
  },

  angle: function(a) {
    return {
      x: Math.cos(a),
      y: Math.sin(a),
      z: 0
    }
  },

  apply: function(obj, p) {
    obj.x = p.x
    obj.y = p.y
    obj.z = p.z
    return obj
  },

  tan: function(p) {
    return (p.x > 0 ? 0 : Math.PI) + Math.atan(p.y / p.x)
  },

  sqr: p => p.x * p.x + p.y * p.y + p.z * p.z,

  length: p => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z),

  dist: function(a, b) {
    var x = a.x - b.x
    var y = a.y - b.y
    var z = a.z - b.z
    return Math.sqrt(x * x + y * y + z * z)
  },

  unit: function(p) {
    var l = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
    return {
      x: p.x / l,
      y: p.y / l,
      z: p.z / l
    }
  },

  copy: function(a) {
    return {
      x: a.x,
      y: a.y,
      z: a.z
    }
  },

  set: function(p, c) {
    p.x = c.x
    p.y = c.y
    p.z = c.z
    return p
  },

  sum: function(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z
    }
  },

  sume: function(p, ps) {
    p.x += ps.x
    p.y += ps.y
    p.z += ps.z
    return p
  },

  sub: function(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z
    }
  },

  sube: function(p, ps) {
    p.x -= ps.x
    p.y -= ps.y
    p.z -= ps.z
    return p
  },

  dot: function(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z
  },

  cross: function(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    }
  },

  scale: function(p, s) {
    return {
      x: p.x * s,
      y: p.y * s,
      z: p.z * s
    }
  },

  factor: function(p, f) {
    return {
      x: p.x / f,
      y: p.y / f,
      z: p.z / f
    }
  },

  pow: function(p, f) {
    var r = Math.pow(p.x * p.x + p.y * p.y, f / 2)
    var o = f * Math.atan(p.y / p.x) + Math.PI * (p.x >= 0 ? p.y >= 0 ? 0 : 2 : 1)
    return {
      x: r * Math.cos(o),
      y: r * Math.sin(o),
      z: p.z
    }
  },

  mod: function(p, f) {
    return {
      x: p.x % f,
      y: p.y % f,
      z: p.z % f
    }
  },

  math: function(f, p) {
    return {
      x: f(p.x),
      y: f(p.y),
      z: f(p.z)
    }
  },

  inverse: function(p) {
    return {
      x: p.y,
      y: -p.x,
      z: p.z
    }
  },

  drawLine: function(g, a, b) {
    g.beginPath()
    if (b) {
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
    } else {
      g.moveTo(a.a.x, a.a.y)
      g.lineTo(a.b.x, a.b.y)
    }
    g.stroke()
  },

  drawCircle: function(g, c, r) {
    g.beginPath()
    g.arc(c.x, c.y, r || c.r, 0, 2 * Math.PI)
    g.stroke()
  },

  fillCircle: function(g, c, r) {
    g.beginPath()
    g.arc(c.x, c.y, r || c.r, 0, 2 * Math.PI)
    g.fill()
  },

  drawRect: function(g, c, r) {
    g.beginPath()
    r = r || c.r
    g.rect(c.x - r, c.y - r, 2 * r, 2 * r)
    g.stroke()
  },

  fillRect: function(g, c, r) {
    g.beginPath()
    r = r || c.r
    g.rect(c.x - r, c.y - r, 2 * r, 2 * r)
    g.fill()
  },

  aryToPt2: ary => {
    return {
      x: ary[0],
      y: ary[1],
      z: 0
    }
  },

  aryToPt3: ary => {
    return {
      x: ary[0],
      y: ary[1],
      z: ary[2]
    }
  },

  ptToPt2: parse => pt2 => {
    return {
      x: parse(pt2.x),
      y: parse(pt2.y),
      z: 0
    }
  },

  ptToPt3: parse => pt3 => {
    return {
      x: parse(pt3.x),
      y: parse(pt3.y),
      z: parse(pt3.z)
    }
  },

  strToPt2: parse => {
    var f = pt.ptToPt2(parse)
    return str => f(pt.aryToPt2(str.split(',')))
  },

  strToPt3: parse => {
    var f = pt.ptToPt3(parse)
    return str => f(pt.aryToPt3(str.split(',')))
  },

  strFrmPt2: parse => pt2 => `${parse(pt2.x)},${parse(pt2.y)}`,
  strFrmPt3: parse => pt3 => `${parse(pt3.x)},${parse(pt3.y)},${parse(pt3.z)}`


}
pt.draw = function(g, c) {
  g.lineWidth = 7
  g.fillStyle = c.c
  pt.fillCircle(g, c)
  g.strokeStyle = c.lc
  pt.drawCircle(g, c)
  if (c.a != null) {
    pt.drawLine(g, {
      a: c,
      b: pt.sum(c, pt.scale(pt.angle(c.a), 2 * c.r))
    })
  }
}
pt.drawProjLine = function(g, l, ax) {
  var a = l.a
  var b = l.b
  if (a.p2 && b.p2) {
    pt.drawLine(g, {
      a: a.p2,
      b: b.p2
    })
  } else if (a.p2) {
    pt.drawLine(g, {
      a: a.p2,
      b: pt.midPoint({
        a: a.p3,
        b: b.p3
      }, ax)
    })
  } else if (b.p2) {
    pt.drawLine(g, {
      a: b.p2,
      b: pt.midPoint({
        a: a.p3,
        b: b.p3
      }, ax)
    })
  }
}
/*
p = {
	x,
	y,
	z,
	n: {x,y,z}
}

*/
pt.planeBump = function(c, p) {
  var u = pt.unit(p.n)
  var d = pt.dot(u, c) - pt.dot(u, p)
  var dif = c.r - Math.abs(d)
  if (dif > 0 || d > 0) {
    if (d != 0) {
      pt.set(c, pt.sum(c, pt.scale(u, -d - c.r)))
    }
    pt.set(c.v, pt.sum(c.v, pt.scale(u, -2 * pt.dot(u, c.v))))
  }
}
pt.bump = function(a, b) {
  var d = pt.dist(a, b)
  if (a.r + b.r < d) {
    return false
  }
  var u = pt.unit(pt.sub(a, b))
  var inpulse = pt.bump.inpulse
  var av = pt.scale(u, pt.dot(u, a.v))
  var bv = pt.scale(u, pt.dot(u, b.v))
  pt.sume(a.v, pt.scale(pt.sub(bv, av), inpulse))
  pt.sume(b.v, pt.scale(pt.sub(av, bv), inpulse))
  var cp = pt.scale(pt.sum(pt.scale(a, b.r), pt.scale(b, a.r)), 1 / (a.r + b.r))
  pt.set(a, pt.sum(cp, pt.scale(pt.sub(a, cp), a.r / pt.dist(a, cp))))
  pt.set(b, pt.sum(cp, pt.scale(pt.sub(b, cp), b.r / pt.dist(b, cp))))
  return true
}
pt.bump.inpulse = 1
/*
ax = {
	d: planeDist
	p2: { x, y, z }
	p3: { x, y, z }
	x: {
		p2: { x, y, z },
		p3: { x, y, z }
	},
	y: {
		p2: { x, y, z },
		p3: { x, y, z }
	},
	z: {
		p2: { x, y, z },
		p3: { x, y, z }
	},
}
l = {
	a: { x, y, z }
	b: { x, y, z }
}

*/
pt.proj = function(p, ax) {
  var t = pt.sub(p, ax.p3)
  var z = pt.dot(ax.z.p3, t)
  if (z < ax.d) {
    return null
  }
  var x = pt.dot(ax.x.p3, t) * ax.d / z
  var y = pt.dot(ax.y.p3, t) / z
  return pt.sum(ax.p2, pt.sum(pt.scale(ax.x.p2, x), pt.sum(pt.scale(ax.y.p2, y), pt.scale(ax.z.p2, z))))
}
// --------------------------------------------
// Camera Angle
// ax: {ax,ay,x:{x,y,z},y:{x,y,z},z:{x,y,z}}
// pl: {x,y,z} -> axis origin
// cam: {up, dn, rt, lf} -> optional camera controls
// fcs: {x,y,z} -> optional point to look at
// spd: rotationSpeed * dt -> camera Rotation speed
// --------------------------------------------
pt.camAngle = function(ax, pl, cam, fcs, spd) {
  if (fcs) {
    var dif = pt.sub(fcs, pl)
    ax.ay = pt.tan({
      x: dif.z,
      y: -dif.x
    })
    ax.ax = pt.tan({
      y: dif.y,
      x: pt.length({
        x: dif.x,
        y: 0,
        z: dif.z
      })
    })
  } else if (cam) {
    if (cam.up || cam.dn) {
      ax.ax += spd * (cam.dn ? 1 : -1)
    }
    if (cam.rt || cam.lf) {
      ax.ay += spd * (cam.lf ? 1 : -1) * (Math.cos(ax.ax) > 0 ? 1 : -1)
    }
  }
  var sx = Math.sin(ax.ax)
  var sy = Math.sin(ax.ay)
  var cx = Math.cos(ax.ax)
  var cy = Math.cos(ax.ay)
  ax.x = {
    x: cy,
    y: 0,
    z: sy
  }
  ax.z = {
    x: -sy * cx,
    y: sx,
    z: cy * cx
  }
  ax.y = pt.cross(ax.z, ax.x)
}
pt.midPoint = function(l3, ax) {
  var pa = pt.sub(l3.a, ax.p3)
  var pb = pt.sub(l3.b, ax.p3)
  var a = {
    x: pt.dot(ax.x.p3, pa),
    y: pt.dot(ax.y.p3, pa),
    z: pt.dot(ax.z.p3, pa),
  }
  var b = {
    x: pt.dot(ax.x.p3, pb),
    y: pt.dot(ax.y.p3, pb),
    z: pt.dot(ax.z.p3, pb),
  }
  var t = (ax.d - a.z) / (b.z - a.z)
  var x = (b.x - a.x) * t + a.x
  var y = (b.y - a.y) * t + a.y
  var z = ax.d
  var p = pt.sum(ax.p2, pt.sum(pt.scale(ax.x.p2, x), pt.sum(pt.scale(ax.y.p2, y), pt.scale(ax.z.p2, z))))
  return p
}
/*
c = {
	x		// x cord
	y		// y cord
	z 		// z cord
	a		// force angle
	v {		// velocity
		x	// vx cord
		y	// vy cord
		z	// vz cord
	}
	c		// color
	lc		// line color

}

k = {
	bp [{x,y,z,n{x,y,z}}...]	// boundPlanes
	float dt 					// deltaT
	float fc 					// force
	float dg					// dragSpeed
	float rs 					// rotateSpeed
	fs {x,y,z} 					// focus

	if singleKey
		if force evaluates to true
			accelerate in the c.a direction
		else roate at rate k.rs
	else
		if focus (k.fs) evaluates to true
			point a at
		if force (k.fc) evaluates to true
			accelerate in the c.a direction
		if r.rs evaluates to true
			rotate at rate k.rs
}
*/
pt.move = function(c, k) {
  if (k.fs) {
    c.a = pt.tan(pt.sub(k.fs, c))
  } else if (k.rs) {
    c.a += k.dt * k.rs
  }
  if (k.fc) {
    pt.set(c.v, pt.sum(c.v, pt.scale(pt.angle(c.a), k.dt * k.fc)))
  }
  for (var i = 0; i < k.bp.length; ++i) {
    pt.planeBump(c, k.bp[i])
  }
  pt.set(c.v, pt.sub(c.v, pt.scale(c.v, k.dt * k.dg)))
  pt.set(c, pt.sum(c, pt.scale(c.v, k.dt)))
}

pt.solveConstants = {
  operators: [
    ['(', ')', '[', ']', '{', '}'],
    ['^'],
    ['*', '/'],
    ['+', '-', '++', '--'],
    ['>', '<', '>=', '<=', '==', '!='],
    ['?', ':'],
    ['=', '^=', '*=', '/=', '+=', '-='],
    [',', ' ']
  ],
  opChars: {},

  types: {
    's': [],
    'xy': '2d var',
    'xyz': '3d var'
  }
}

var sc = pt.solveConstants
for (var i in sc.operators) {
  var subI = sc.operators[i]
  for (var j in subI) {
    var subJ = subI[j]
    for (var k in subJ) {
      var c = subJ[k]
      sc.opChars[c] = c
    }
  }
}


pt.push1 = (a, b) => {
  var u = pt.sub(b, a)
  var l = pt.length(u)
  pt.set(b, pt.sum(a, pt.scale(u, (a.r + b.r) / l)))
}

pt.push2 = (a, b) => {
  var cp = pt.scale(pt.sum(pt.scale(a, b.r), pt.scale(b, a.r)), 1 / (a.r + b.r))
  pt.set(a, pt.sum(cp, pt.scale(pt.sub(a, cp), a.r / pt.dist(a, cp))))
  pt.set(b, pt.sum(cp, pt.scale(pt.sub(b, cp), b.r / pt.dist(b, cp))))
}

pt.solve = function(input) {



}

pt.vectTest = function() {
  console.log('hello')
}
