console.log('functions.js init')

// requries module to be defined

var fu = module.exports = {
  IdEmitter: class IdEmitter {
    on(key, id, fun) {
      var a = this[key] = this[key] || {}
      a[id] = fun
    }

    emit(key, id, msg) {
      var a = this[key]
      for (var i in a) {
        a[i](id, msg)
      }
    }

    emitId(key, sndr, rcvr, msg) {
      if (this[key] && this[key][rcvr]) {
        this[key][rcvr](sndr, msg)
      }
    }

    remove(id) {
      for (var i in this) {
        delete this[i][id]
      }
    }
  },

  Emitter: class Emitter {
    on(key, fun) {
      var a = this[key] = this[key] || []
      a.push(fun)
    }

    emit(key, msg) {
      var a = this[key]
      for (var i in a) {
        a[i](msg)
      }
    }
  },


  seed: s => () => {
    s = Math.sin(s + Math.E) * 10000
    return s - Math.floor(s)
  },

  cubicInterp: (f, x) => {
    var x1 = Math.floor(x)
    var x0 = x1 - 1
    var x2 = x1 + 1
    var x3 = x1 + 2
    var y0 = f(x0)
    var y1 = f(x1)
    var y2 = f(x2)
    var y3 = f(x3)
    x = x - x1
    var y = y1 + 0.5 * x * (y2 - y0 + x * (2.0 * y0 - 5.0 * y1 + 4.0 * y2 - y3 + x * (3.0 * (y1 - y2) + y3 - y0)))
    return y
  },

  setCookie: (cname, cvalue, exdays) => {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  },

  bicubicInterp: (f, x, y) => {
    var ci = fu.cubicInterp
    var x1 = Math.floor(x)

    var x0 = x1 - 1
    var x2 = x1 + 1
    var x3 = x1 + 2

    ary = {}
    ary[x0] = ci(i => f(x0, i), y)
    ary[x1] = ci(i => f(x1, i), y)
    ary[x2] = ci(i => f(x2, i), y)
    ary[x3] = ci(i => f(x3, i), y)
    return ci(i => ary[i], x)
  },

  noise1: (w, h, s) => {
    var rand = s ? fu.seed(s) : Math.random
    var ary = {}
    var map = i => ary[i] = ary[i] || rand()
    return i => fu.cubicInterp(map, i / w) * h
  },

  noise2: (w, h, s) => {
    var rand = s ? fu.seed(s) : Math.random
    var ary = {}
    var map = (i, j) => {
      if (!ary[i]) {
        ary[i] = {}
      }
      return ary[i][j] = ary[i][j] || rand()
    }
    return (i, j) => fu.bicubicInterp(map, i / w, j / w) * h
  },

  fillPixels: (g, x, y, w, h, f) => {
    var image = g.getImageData(x, y, w, h)
    var data = image.data
    f(data)
    g.putImageData(image, x, y)
  },


  /*
  factor[num]: round factor
  align[fun]: round function
  parse[fun]: parse function
  */

  getParse: (factor, align, parse) => num => parse(align(parse(num) / factor) * factor),

  Chunk: class Chunk {
    /*
    chunks are stored in a key map by coordinate
      the keys of the chunk are strings which correspond to points on the map
    cunks contain...
      ... given object

    cnstrctr[fun](str,pt) => unque object
    parseInfo[obj]: info for parse
      parse[fun](obj) => number rounded to proper format
      ptToPt[fun](parse) => pt => pt rounded to proper format
      strToPt[fun](parse) => str => pt w rounded to proper format
      strFrmPt[fun](parse) => pt => str w rounded to proper format */
    constructor(clss, parseInfo) {
      this.clss = clss
      this.parse = parseInfo.parse
      this.ptToPt = parseInfo.ptToPt(this.parse)
      this.strToPt = parseInfo.strToPt(this.parse)
      this.strFrmPt = parseInfo.strFrmPt(this.parse)
      this.array = {}
    }

    get(pt, str) {
      if (pt || str) {
        str = this.strFrmPt(pt = pt ? this.ptToPt(pt) : this.strToPt(str))
        var chk = this.array[str] = this.array[str] || new this.clss(pt, str)
        chk.string = str
        chk.point = pt
        return chk
      } else {
        return null
      }
    }

    clear(pt, str) {
      if (pt || str) {
        str = this.strFrmPt(pt = pt ? this.ptToPt(pt) : this.strToPt(str))
        var chk = this.array[str]
        delete this.array[str]
        return chk
      } else {
        return null
      }
    }

    // fun(index, object)
    forEach(fun) {
      for (var i in this.array) {
        fun(this.array[i])
      }
    }

  },

  gttt: (n, mx, mn) => n < mn ? mn : n > mx ? mx : n,

  strsplit: (string, char) => {
    var index = string.indexOf(char)
    if (index < 0) {
      return {
        ky: string,
        msg: ''
      }
    } else {
      return {
        ky: string.substr(0, index),
        msg: string.substr(index + 1)
      }
    }
  },

  getFirstKeyElement: obj => {
    for (var i in obj) {
      return obj[i]
    }
  },

  now: () => (new Date()).getTime() * 1e-3,

  tick: () => {
    function t() {
      t.now = fu.now()
      t.dt = t.now - t.prv
      t.prv = t.now
      t.ticks += 1
      return t
    }
    t.strt = t.now = t.prv = fu.now()
    t.ticks = 0
    return t
  },

  setInterval: (fu, dt) => setInterval(fu, dt * 1e3),

  strkey: (array, element) => {
    var k = Object.keys(array)
    var i = 0
    var string = ''
    while (i < k.length) {
      string += array[k[i]][element]
      if (i++ < k.length - 1) {
        string += ', '
      }
    }
    return `[${string}]`
  },

  randKey: () => {
    var r
    do {
      r = `${Math.random()}`
    } while (fu.randKey.array[r]);
    return fu.randKey.array[r] = r
  },

  getSign: n => {
    return n > 0 ? 1 : n < 0 ? -1 : 0
  },

  forEach: (a, f) => {
    for (var i in a) {
      f(a[i])
    }
  },

  isEqual: v => {
    for (var i = 1; i < arguments.length; ++i) {
      if (v == arguments[i]) {
        return true
      }
    }
    return false
  },

  etochar: e => String.fromCharCode(e.which | 0x20),

  swap: (v, a, b) => {
    var t = v[a]
    v[a] = v[b]
    v[b] = t
  },


  reqFrame: window => window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame || ((callback) => window.setTimeout(callback, 30))
}

fu.randKey.array = []
