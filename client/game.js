// project_redstone

var log = console.log
log('game.js project_redstone init')

var lvl = {
  funs: {}
}

module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  plrIf = new Object
  var backgroundColor = 'black'
  var selected_mode = null
  var center_point = pt.zero()

  var selected_cel = null
  var prev_cel_id = null
  main = cel_scope = init_def(null, 'main', 1)

  prev_cel_id = null
  prev_cel = null
  cel_moved = false

  tick_speed = 1

  init_nat(cel_scope, 0, {}, vsn => {
    var avn = vsn.avns[0]
    for (var i = 0; i < avn.bus; ++i) {
      avn.outs[i] = !avn.nins[i]
    }
  })
  init_nat(cel_scope, 'tog', {}, vsn => {
    var avn = vsn.avns['tog']
    for (var i = 0; i < avn.bus; ++i) {
      if (avn.nins[i] && !avn.pins[i]) {
        avn.outs[i] =  !avn.outs[i]
      }
    }
  })
  init_nat(cel_scope, '+', {'i':1, 'o':1}, vsn => {
    var tra = vsn.avns['+']
    var tin = vsn.avns['i']
    var tot = vsn.avns['o']
    for (var i = 0; i < vsn.bus; ++i) {
      tot.outs[i] = tot.nins[i] || (tin.nins[i] && !tra.nins[i])
      tin.outs[i] = tin.nins[i]
      tra.outs[i] = tra.nins[i]
    }
  })
  for (var bus = 1; bus < 0x400; bus <<= 1) {
    var name = `i${bus}`
    var buss = {}
    buss[name] = bus
    for (var b = 0; b < bus; ++b) {
      buss[b] = 1
    }
    init_nat(cel_scope, name, buss, vsn => {
      var nm = vsn.src.name
      var bs = vsn.src.src.args[nm].bus
      for (var b = 0; b < bs; ++b) {
        for (var i = 0; i < vsn.bus; ++i) {
          vsn.avns[nm].outs[b * vsn.bus + i] = vsn.avns[b].nins[i]
          vsn.avns[b].outs[i] = vsn.avns[b].nins[i]
        }
      }
    })
    delete buss[name]
    name = `o${bus}`
    buss[name] = bus
    init_nat(cel_scope, name, buss, vsn => {
      var nm = vsn.src.name
      var bs = vsn.src.src.args[nm].bus
      for (var b = 0; b < bs; ++b) {
        for (var i = 0; i < vsn.bus; ++i) {
          vsn.avns[b].outs[i] = vsn.avns[nm].nins[b * vsn.bus + i]
          vsn.avns[nm].outs[b * vsn.bus + i]
            = vsn.avns[nm].nins[b * vsn.bus + i]
        }
      }
    })

    name = `dn${bus}`
    var dn = {}
    dn[name] = bus
    dn.i = 1
    init_nat(cel_scope, name, dn, bsn => {

    })
  }
  init_nat(cel_scope, 1, {1:1}, vsn => {
    var avn = vsn.avns[1]
    for (var i = 0; i < vsn.bus; ++i) {
      avn.outs[i] = avn.nins[i]
    }
  })
  for (var gap = 2; gap < 0x400; gap <<= 1) {
    var buss = {}
    for (var g = 1; g <= gap; ++g) {
      buss[g] = 1
    }
    init_nat(cel_scope, gap, buss, vsn => {

      var top = vsn.src.name


      for (var i = 0; i < vsn.bus; ++i) {

        var top_nins = vsn.avns[top].nins[i]
        vsn.avns[top].nins[i] = false

        for (var g = top; g > 1; --g) {
          vsn.avns[g].outs[i] = vsn.avns[g].nins[i] || vsn.avns[g - 1].outs[i]
        }

        vsn.avns[1].outs[i] = vsn.avns[1].nins[i] || top_nins


      }


    })
  }
  var cell_size = 25
  var cell_width = 6
  var arrow_time = 20
  var arrow_size = 3
  var elapsed_time = 0

  var zero_string = point_to_string(pt.zero())

  var directions = lvl.directions = {
    up: {
      x: 0, y: -1, z: 0,
      op: 'dn', next: 'lf'
    },
    dn: {
      x: 0, y: 1, z: 0,
      op: 'up', next: 'rt'
    },
    rt: {
      x: 1, y: 0, z: 0,
      op: 'lf', next: 'up'
    },
    lf: {
      x: -1, y: 0, z: 0,
      op: 'rt', next: 'dn'
    }
  }

  // direction setup
  {
    for (var direction_name in directions) {
      var direction = directions[direction_name]
      direction.op = directions[direction.op]
      direction.next = directions[direction.next]
    }
  }

  // mws, string, point translations
  function mws_to_point(scp, mws) {
    var cp = scp.center_point = scp.center_point || pt.zero()
    return pt.math(Math.round, pt.factor(pt.sub(mws, cp), cell_size))
  }
  function point_to_mws(scp, point) {
    var cp = scp.center_point = scp.center_point || pt.zero()
    return pt.sum(pt.scale(point, cell_size), cp)
  }
  function string_to_point(string) {
    string = string.split(',')
    return {
      x: parseFloat(string[0]),
      y: parseFloat(string[1]),
      z: 0
    }
  }
  function point_to_string(point) {
    return `${point.x},${point.y}`
  }

  //----------------------------------------------------------------------------
  // project_redstone
  //----------------------------------------------------------------------------

  function rid() {
    return ++rid.index
  }
  rid.index = 0

  function init_nat(scp, name, buss, get_output) {
    if (name != scp.name && !scp.defs[name]) {
      var nat = {
        type: 'nat',
        scp: scp,
        name: name,
        get_output: get_output,

        args: {},
        ptrs: {},
        uses: {},
        vsns: {}
      }

      for (var arg_name in buss) {
        var bus = buss[arg_name]

        init_arg(nat, arg_name, bus)
      }

      init_arg(nat, name, 1)
      init_vsn(nat, init_ptr(nat, name, 1))

      scp.defs[name] = nat

  		return nat
    }
  }

  function init_def(scp, name, bus) {
    if (!scp || (scp.name != name && !scp.defs[name])) {
      var def = {
        type: 'def',
        scp: scp,
        name: name,

        args: {},
        ptrs: {},
        uses: {},
        lnks: {},
        vsns: {},

        defs: {},
        cels: {},
        dcls: {}
      }

      if (scp != null) {
        scp.defs[name] = def
      }

      init_arg(def, name, bus)
      init_vsn(def, init_ptr(def, name, 1))

  		return def
    }
  }

  function remove_def(def) {
    if (def.scp) {
      for (var ptr_id in def.uses) {
        remove_ptr(def.uses[ptr_id])
      }
      for (var ptr_id in def.ptrs) {
        remove_ptr(def.ptrs[ptr_id])
      }
      for (var def_id in def.defs) {
        remove_def(def.defs)
      }

      delete def.scp.defs[def.name]

      for (var arg_name in def.dcls) {
        remove_cel(def.dcls[arg_name])
      }
    }
  }

  function init_arg(scp, name, bus) {
    if (!scp.args[name]) {
      var arg = {
        scp: scp,
        name: name,
        bus: bus > 0 ? bus : 1,
        dfv: false
      }

      for (var vsn_id in scp.vsns) {
        var vsn = scp.vsns[vsn_id]
        init_avn(vsn, arg)
      }

      scp.args[name] = arg
  		return arg
    } else {
      return scp.args[name]
    }
  }

  function remove_arg(arg) {
    for (var vsn_id in arg.scp.vsns) {
      delete vsn.avns[arg.name]
    }

    if (arg.scp.dcls[arg.name]) {
      remove_cel(arg.scp.dcls[arg.name])
    }

    for (var ptr_id in arg.scp.uses) {
      var ptr = arg.scp.uses[ptr_id]
      remove_lnks(ptr, arg)
      if (ptr.dcls[arg.name]) {
        remove_cel(ptr.dcls[arg.name])
      }
    }

    delete arg.scp.args[arg.name]
  }

  function init_ptr(scp, src_name, bus) {
    var ptr = {
  		type: 'ptr',
      scp: scp,
      bus: bus,
      name: src_name,
      src: null
    }

  	if (src_name == scp.name) {
  		if (!ptr.scp.ptrs[null]) {
  			ptr.src = scp
  		}
  	} else {
  	  while (scp && scp.name != src_name) {
  	    if (scp.defs[src_name]) {
  	      ptr.src = scp.defs[src_name]
  				break
  	    }

  	    scp = scp.scp
  	  }
  	}

    if (ptr.src) {
      if (ptr.src == ptr.scp) {
        ptr.id = null
      } else {
        ptr.id = rid() + 'ptr' + src_name
      }

      for (var vsn_id in ptr.scp.vsns) {
        var vsn = ptr.scp.vsns[vsn_id]
        init_vsn(vsn, ptr)
      }

      ptr.dcls = {}
      ptr.scp.ptrs[ptr.id] = ptr
      ptr.src.uses[ptr.id] = ptr

  		return ptr
    }
  }

  function remove_ptr(ptr) {
    if (ptr.id) {

      for (var vsn_id in ptr.scp.vsns) {
        var vsn = ptr.scp.vsns[vsn_id]
        remove_vsn(vsn.vsns[ptr.id])
      }

      for (var arg_id in ptr.src.args) {
        var arg = ptr.src.args[arg_id]
        remove_lnks(ptr, arg)
      }

      delete ptr.scp.ptrs[ptr.id]
      delete ptr.src.uses[ptr.id]

      for (var arg_name in ptr.dcls) {
        remove_cel(ptr.dcls[arg_name])
      }
    }
  }

  function init_vsn(scp, src) {
    var vsn = {
      type: 'vsn',
      scp: scp,
      src: src,
      avns: {},
      vsns: {}
    }

    if (scp.type == 'vsn') {
      vsn.id = rid() + 'vsn' + src.name
      vsn.bus = scp.bus * src.bus
    } else {
      vsn.id = null
      vsn.bus = 1
    }

    for (var arg_name in src.src.args) {
      var arg = src.src.args[arg_name]
      init_avn(vsn, arg)
    }

    for (var ptr_id in src.src.ptrs) {
      var ptr = src.src.ptrs[ptr_id]

      if (ptr.id) {
        init_vsn(vsn, ptr)
      } else {
        vsn.vsns[null] = vsn
  		}
    }

    vsn.src.src.vsns[vsn.id] = vsn
    vsn.scp.vsns[vsn.src.id] = vsn

  	return vsn
  }

  function remove_vsn(vsn) {
    delete vsn.src.src.vsns[vsn.id]
    delete vsn.scp.vsns[vsn.src.id]

    for (var pvsn_id in vsn.vsns) {
      var pvsn = vsn.vsns[pvsn_id]

      if (pvsn_id != 'null') {
        remove_vsn(pvsn)
      }
    }
  }

  function init_avn(scp, arg) {
    var avn = {
      scp: scp,
      arg: arg,
      bus: scp.bus * arg.bus,
      pins: [],
      nins: [],
      outs: []
    }

    for (var i = 0; i < avn.bus; ++i) {
      avn.pins[i] = avn.nins[i] = avn.outs[i] = false
    }

    scp.avns[arg.name] = avn

  	return avn
  }

  function init_lnk(iptr, optr, iarg, oarg) {
    if ((iptr == optr && iarg == oarg) || iptr.scp != optr.scp) {
      return
    }

    var ibus = iptr.bus * iarg.bus
    var obus = optr.bus * oarg.bus

    if (ibus != obus) {
      return
    }

    var scp = iptr.scp

    for (var slk_id in scp.lnks) {
      var slk = scp.lnks[slk_id]
      if (
        (iptr == slk.iptr
          && optr == slk.optr
          && iarg == slk.iarg
          && oarg == slk.oarg)
        || (iptr == slk.optr
          && optr == slk.iptr
          && iarg == slk.oarg
          && oarg == slk.iarg)
      ) {
        return
      }
    }

    var lnk = {
      scp: scp,
      bus: ibus,
      iptr: iptr,
      optr: optr,
      iarg: iarg,
      oarg: oarg,
      id: rid()
    }

    scp.lnks[lnk.id] = lnk

  	return lnk
  }

  function remove_lnks(ptr, arg) {
    if (ptr.scp.type == 'def') {
      for (var lnk_id in ptr.scp.lnks) {
        var lnk = ptr.scp.lnks[lnk_id]

        if (
          (lnk.iptr == ptr && lnk.iarg == arg)
          || (lnk.optr == ptr && lnk.oarg == arg)
        ) {
          delete ptr.scp.lnks[lnk_id]
        }
      }
    }
  }

  function get_output(vsn) {

    if (vsn.src.src.type == 'nat') {
      vsn.src.src.get_output(vsn)
    } else if (vsn.src.src.type == 'def') {
      for (var ptr_id in vsn.vsns) {
        if (ptr_id != 'null') {
          get_output(vsn.vsns[ptr_id])
        }
      }

      for (var arg_name in vsn.avns) {
        var avn = vsn.avns[arg_name]

        for (var i = 0; i < avn.bus; ++i) {
          avn.outs[i] = avn.nins[i]
        }
      }
    }

    for (var arg_name in vsn.avns) {
      var avn = vsn.avns[arg_name]

      for (var i = 0; i < avn.bus; ++i) {
        avn.pins[i] = avn.nins[i]
        avn.nins[i] = avn.arg.dfv
      }
    }

  }

  function get_input(vsn) {
    if (vsn.src.src.type == 'def') {
      for (var ptr_id in vsn.vsns) {
        if (ptr_id != 'null') {
          get_input(vsn.vsns[ptr_id])
        }
      }

      var def = vsn.src.src
      for (var lnk_id in def.lnks) {
        var lnk = def.lnks[lnk_id]

        var ivsn = vsn.vsns[lnk.iptr.id]
        var ovsn = vsn.vsns[lnk.optr.id]
        var iavn = ivsn.avns[lnk.iarg.name]
        var oavn = ovsn.avns[lnk.oarg.name]

        for (var i = 0; i < iavn.bus; ++i) {
          oavn.nins[i] = iavn.outs[i] || oavn.nins[i]
        }
      }
    }
  }

  function init_cel(scp, scl, point) {
    var cel = scp.cels[point_to_string(point)]

    if (cel) {
      if (scl && scl.src.type == 'ptr' && cel.src.type == 'ptr') {
        init_lnk(scl.src, cel.src, scl.arg, cel.arg)
      }
      return cel
    } else {
      var cel = {
        name: prompt('arg name')
      }

      if (cel.name == "" || cel.name == null) {
        alert('no arg name')
        return
      }

      var bus = () => parseInt(prompt('bus size')) || 1
      cel.scp = scp
      cel.point = point
      cel.proj = point_to_mws(scp, point)
      cel.id = point_to_string(point)

      if (scl == null) {
        if (cel.name == scp.name) {
          if (scp.ptrs[null].dcls[cel.name] == null) {
            cel.src = scp.ptrs[null]
            cel.arg = scp.args[cel.name]

            cel.src.dcls[cel.arg.name] = cel
            scp.cels[cel.id] = cel
            return cel
          }
        } else {
          var gbus = bus()
          var ptr = init_ptr(scp, cel.name, gbus)

          if (ptr) {
            cel.src = ptr
            cel.arg = ptr.src.args[cel.name]

            cel.src.dcls[cel.arg.name] = cel
            scp.cels[cel.id] = cel
            return cel
          } else {
            var def = init_def(scp, cel.name, gbus)
            cel.src = def
            cel.arg = def.args[cel.name]

            cel.src.dcls[cel.arg.name] = cel
            scp.cels[cel.id] = cel
            return cel
          }
        }
      } else if (scl.src.type == 'def') {
        if (!scl.src.dcls[cel.name]) {
          var arg = init_arg(scl.src, cel.name, bus())

          cel.src = scl.src
          cel.arg = arg

          cel.src.dcls[cel.arg.name] = cel
          cel.scp.cels[cel.id] = cel
          return cel
        }
      } else if (scl.src.type == 'ptr') {
        if (!scl.src.dcls[cel.name])  {
          if (scl.src.src.type == 'def') {
            var arg = scl.src.src.args[cel.name] ||
              init_arg(scl.src.src, cel.name, bus())

            cel.src = scl.src
            cel.arg = arg

            cel.src.dcls[cel.arg.name] = cel
            cel.scp.cels[cel.id] = cel
            return cel
          } else if (scl.src.src.type == 'nat') {
            var arg = scl.src.src.args[cel.name]

            if (arg) {
              cel.src = scl.src
              cel.arg = arg

              cel.src.dcls[cel.arg.name] = cel
              cel.scp.cels[cel.id] = cel
              return cel
            } else {
              alert(`invalid arg name '${cel.name}'`)
            }
          }
        }
      }
    }
  }

  function remove_cel(cel) {
    if (cel.src.type == 'ptr') {
      remove_lnks(cel.src, cel.arg)
    }

    delete cel.src.dcls[cel.arg.name]
    delete cel.scp.cels[cel.id]
  }

  function drawArrowLine(g, pointB, pointA, elapsed_time) {
    if (pointA != pointB) {
      pt.drawLine(g, pointB, pointA)

      var vect = pt.sub(pointB, pointA)
      var arrow = arrow_time * pt.length(vect)
      pt.fillCircle(g, pt.sum(
        pt.scale(vect, (elapsed_time % arrow) / arrow), pointA), arrow_size)
    }
  }

  function save_def(def) {
    if (def.type == 'def') {
      var dmmy = {
        defs: {},
        args: {},
        ptrs: {},
        lnks: [],
        dcls: {}
      }

      fu.forEach(def.defs, fun => dmmy[fun.name] = save_def(def))
      fu.forEach(def.args, arg => dmmy.args[arg.name] = arg.bus)
      fu.forEach(def.ptrs, ptr => {
        var pdmy = {
          name: ptr.name,
          dcls: {}
        }
        fu.forEach(ptr.dcls, cel => pdmy.dcls[cel.arg.name] = cel.id)
        dmmy.ptrs[ptr.id] = pdmy
      })
      fu.forEach(def.lnks, lnk => {
        dmmy.lnks.push({
          iptr: lnk.iptr.id,
          optr: lnk.optr.id,
          iarg: lnk.iarg.name,
          oarg: lnk.oarg.name
        })
      })
      fu.forEach(ptr.dcls, cel => pdmy.dcls[cel.arg.name] = cel.id)

      return dmmy
    }
  }

  //----------------------------------------------------------------------------
  //
  //----------------------------------------------------------------------------

  function sndMsg(ky, sndr, rcvr, msg) {
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
      document.body.style.backgroundColor = backgroundColor

      sndMsg('rqst update',plrIf.usr.id,'srvr')
    }
  }

  var apIO_tick = usrIO => {
    var mws = usrIO.mws
    mws.r = 10
    var g = usrIO.dsply.g
    var dt = usrIO.evnts.dt
    elapsed_time = usrIO.evnts.nw

    // cel_scope
    // selected_cel

    var mws_cel_pt = mws_to_point(cel_scope, mws)
    var mws_cel_id = point_to_string(mws_cel_pt)
    var mws_cel = cel_scope.cels[mws_cel_id]

    // draw mws
    {
      g.fillStyle = 'grey'
      pt.fillRect(g, point_to_mws(cel_scope, mws_to_point(cel_scope, mws)), 10)
      g.fillStyle = 'white'
      pt.fillCircle(g, mws, 10)
    }

    g.font = 'Arial 12px'
    g.textAlign = 'center'

    // draw
    {
      fu.forEach(cel_scope.cels, cel =>
        cel.proj = point_to_mws(cel_scope, cel.point))

      g.fillStyle = g.strokeStyle = 'grey'
      fu.forEach(cel_scope.lnks, lnk => {
        var icel = lnk.iptr.dcls[lnk.iarg.name]
        var ocel = lnk.optr.dcls[lnk.oarg.name]
        if (icel && ocel) {
          drawArrowLine(g, ocel.proj, icel.proj, elapsed_time)
        }
      })

      g.fillStyle = g.strokeStyle = 'white'
      fu.forEach(cel_scope.ptrs, ptr => {
        var cntr = ptr.dcls[ptr.src.name]
        if (cntr) {
          fu.forEach(ptr.dcls, cel => pt.drawLine(g, cel.proj, cntr.proj))
        }
      })

      g.fillStyle = g.strokeStyle = 'white'
      fu.forEach(cel_scope.defs, def => {
        if (def.type == 'def') {
          var cntr = def.dcls[def.name]
          if (cntr) {
            fu.forEach(def.dcls, cel => pt.drawLine(g, cel.proj, cntr.proj))
          }
        }
      })

      g.fillStyle = g.strokeStyle = 'grey'
      if (selected_cel) {
        var cel = cel_scope.cels[mws_cel_id]
        if (cel) {
          drawArrowLine(g, cel.proj, selected_cel.proj, elapsed_time)
        } else {
          cel = selected_cel.src.dcls[selected_cel.src.name]
          if (cel) {
            pt.drawLine(g, point_to_mws(cel_scope, mws_cel_pt), cel.proj)
          }
        }
      }


      fu.forEach(cel_scope.ptrs, ptr => {
        fu.forEach(ptr.dcls, cel => {
          g.fillStyle = g.strokeStyle = 'white'

          var avn = cel_scope.vsns[null].vsns[ptr.id].avns[cel.arg.name]
          for (var i = 0; i < avn.bus; ++i) {
            if (avn.outs[i]) {
              g.fillStyle = g.strokeStyle = 'red'
              break
            }
          }

          g.fillText(`${cel.arg.name}:${cel.arg.bus * cel.src.bus}`,
            cel.proj.x, cel.proj.y)
        })
      })

      g.fillStyle = g.strokeStyle = 'white'
      fu.forEach(cel_scope.defs, def => {
        if (def.type == 'def') {
          fu.forEach(def.dcls, cel => {
            g.fillText(`${cel.arg.name}:${cel.arg.bus}`,
              cel.proj.x, cel.proj.y)
          })
        }
      })
    }

    // actions
    {

      if (usrIO.kys.hsDn['t']) {
        tick_speed = parseInt(prompt('speed'))
        tick_speed = tick_speed <= 128 && tick_speed > 0 ? tick_speed : 0

        selected_cel = null
        cel_moved = true
        prev_cel = null
      } else if (usrIO.kys.hsDn['s']) {
        sndMsg('save', plrIf.usr.id, 'srvr', save_def(main))
      } else if (usrIO.kys.hsDn['q']) {
        if (mws.isDn && mws_cel) {
          if (mws_cel.arg.name == mws_cel.src.name) {
            if (mws_cel.src.type == 'def') {
              remove_def(mws_cel.src)
            } else if (mws_cel.src.type == 'ptr') {
              remove_ptr(mws_cel.src)
            }
          } else {
            remove_cel(mws_cel)
          }
        }
        selected_cel = null
        cel_moved = true
        prev_cel = null

      } else if (usrIO.kys.hsDn['Shift'] && mws.isDn && mws_cel) {

        if (mws_cel.src.type == 'ptr') {
          if (mws_cel.src.name == mws_cel.scp.name) {
            cel_scope = mws_cel.scp.scp || cel_scope
          } else if (mws_cel.src.src.type == 'def') {
            cel_scope = mws_cel.src.src.scp || cel_scope
          }
        } else if (mws_cel.src.type == 'def') {
          cel_scope = mws_cel.src
        }

        selected_cel = null
        cel_moved = true
        prev_cel = null

      } else if (usrIO.kys.hsDn[' '] && mws.isDn && mws_cel) {

        if (mws_cel.src.type == 'ptr') {
          mws_cel.arg.dfv = !mws_cel.arg.dfv
          selected_cel = null
          cel_moved = true
          prev_cel = null
        }
      } else if (usrIO.kys.isDn['x'] && mws.isDn) {

        pt.sume(cel_scope.center_point, pt.sub(mws, mws.prv))
        selected_cel = null
        cel_moved = true
        prev_cel = null

      } else if (usrIO.kys.hsDn['l'] && mws.isDn && mws_cel) {

        if (mws_cel.src.type == 'ptr') {
          remove_lnks(mws_cel.src, mws_cel.arg)
          selected_cel = null
          cel_moved = true
          prev_cel = null
        }

      } else {

        if (mws.hsDn) {
          prev_cel_id = mws_cel_id
          prev_cel = mws_cel
          cel_moved = false
        }

        if (mws.isDn) {
          if (prev_cel && !mws_cel && mws_cel_id != prev_cel_id) {
            delete cel_scope.cels[prev_cel.id]

            prev_cel_id = prev_cel.id = mws_cel_id
            prev_cel.point = pt.copy(mws_cel_pt)

            cel_scope.cels[prev_cel.id] = prev_cel

            cel_moved = true
          }
        }

        if (mws.hsUp && !cel_moved) {
          selected_cel = init_cel(cel_scope, selected_cel, mws_cel_pt)
        }
      }


    }


    if (tick_speed > 0) {
      for (var i = 0; i < tick_speed; ++i) {
        get_output(cel_scope.vsns[null])
        get_input(cel_scope.vsns[null])
      }

    } else {
      if (usrIO.kys.hsDn['Enter']) {
        get_output(cel_scope.vsns[null])
        get_input(cel_scope.vsns[null])
      }
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
