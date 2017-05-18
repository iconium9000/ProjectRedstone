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

  randKey: array => {
    var r
    do {
      r = Math.random()
    } while (array[r]);
    return r
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

try {
  module.exports = fu
} catch (e) {}
