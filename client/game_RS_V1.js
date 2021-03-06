// PROJECT REDSTONE
var log = console.log
log('game.js init')

module.exports = apInitA => {

  fu = apInitA.fu
  pt = apInitA.pt
  fs = apInitA.fs

  var plrIf = new Object

  var sndMsg = (ky,sndr,rcvr,msg) =>
    apIO.apSnd({ky:ky, sndr:sndr, rcvr:rcvr, msg:msg})
  clnt_snd = (ky,msg) => sndMsg(ky,plrIf.usr.id,'srvr',msg)

  var apIO_init = apInitB => {
    plrIf.usr = apInitB.usrInfo.usr

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true
    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'
      sndMsg('read',plrIf.usr.id,'srvr')
    }
  }

  var apIO_tick = usrIO => {
    elapsed_time = usrIO.evnts.nw
    tick(usrIO, (key, msg) => sndMsg(key, plrIf.usr.id, 'srvr', msg))
  }
  var apIO_apRcv = rcvMsg => {
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    switch (ky) {
      case 'W snd': // clnt snd -> srvr rcv


        break
      case 'R snd': // clnt snd -> srvr rcv
        sndMsg('R rcv', 'srvr', sndr, snd_R_rply(msg))
        break
      case 'R rcv': // srvr snd -> clnt rcv
        rcv_R_rply(msg)
        break
      case 'read':
        sndMsg('restart',
          'srvr',
          'all -srvr',
          JSON.parse(fs.readFileSync('rs/save.json')))
        break
      case 'save':
        fs.writeFile('rs/save.json',JSON.stringify(msg,null,2))
        sndMsg('saved', 'srvr', sndr)
        break
      case 'saved':
        alert('Game State Saved!')
        break
      case 'restart':
        read_def(msg)
        break
    }
  }
  var apIO = apInitA.caleInit.apIO = {
    init:apIO_init,
    tick:apIO_tick,
    apRcv:apIO_apRcv
  }
  apInitA.cale(apInitA.caleInit)
}

// -----------------------------------------------------------------------------
// POINT MANIP
// -----------------------------------------------------------------------------
{
  cel_size = 50
  arrow_time = 20
  arrow_size = 3
  elapsed_time = 0
}

// mws, string, point translations
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
    z: 0,
    s: string
  }
}
function point_to_string(point) {
  return `${point.x},${point.y}`
}
function drawArrowLine(g, pointA, pointB, radA, radB) {
  if (pointA != pointB) {
    pt.drawLine(g, pointB, pointA)

    var vect = pt.sub(pointB, pointA)
    var length = pt.length(vect)
    var arrow = arrow_time * length //Math.ceil(length / 20) * 20
    var scale = (elapsed_time % arrow) / arrow
    arrow = scale * length

    if (arrow > length - radB) pt.drawCircle(g, pointB, radB + 2)
    else if (radA > arrow) pt.drawCircle(g, pointA, radA + 2)

    pt.fillCircle(g, pt.sum(pt.scale(vect, scale), pointA), arrow_size)
  }
}

function valid_name(obj) {
  return !!obj || obj == '0' ? obj : null
}
function get_valid_name(obj, str) {
  var name = valid_name(obj)
  return name != null ? name : valid_name(prompt(`${str} name`))
}
function get_name(cfn_bus,name,far_bus) {
  return cfn_bus > 1 ?
    far_bus > 1 ?
      `${cfn_bus}:${name}:${far_bus}` :
      `${cfn_bus}:${name}` :
    far_bus > 1 ?
      `${name}:${far_bus}` :
      `${name}`
}
function valid_bus(obj) {
  obj = parseInt(obj)
  return obj > 0 && obj
}
function get_valid_bus(obj, str) {
  return valid_bus(obj || prompt(`${str} bus size`))
}
function valid_idx(obj) {
  obj = parseInt(obj)
  return (obj || obj == 0) && obj >= 0 ? obj : null
}
function get_valid_idx(obj, str) {
  obj = valid_idx(obj)
  return obj != null ? obj : valid_idx(prompt(`${str} idx`))
}
function mod_match(ibus, obus) {
  return !(ibus % obus) || !(obus % ibus)
}
function valid_lnk(is, ib, os, ob) {
  return mod_match(is * ib, os * ob)
}

var hex_alph = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
var alph_hex = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
}

// -----------------------------------------------------------------------------
// RIDX
// -----------------------------------------------------------------------------

function rid_add(obj, type) {
  rid_objs[rid_idx] = obj
  rid_obj_type[rid_idx] = type
  if (!rid_types[type]) rid_types[type] = {}
  rid_types[type][rid_idx] = obj
  return rid_idx++
}
function rid_rmv(idx) {
  var type = rid_obj_type[idx]
  type && delete rid_types[type][idx]
  delete rid_obj_type[idx]
  delete rid_objs[idx]
}

// -----------------------------------------------------------------------------
// PROJECT REDSTONE
// -----------------------------------------------------------------------------

class Fun {
  constructor(scp_fun, name) {
    this.id = rid_add(this,'Fun')
    this.scp_fun = scp_fun
    this.name = name
    this.native = null

    this.locked = false

    this.funs = {}
    this.fars = {}
    this.fals = {}

    this.cels = {}
    this.cfns = {}
    this.clks = {}

    this.pfns = {}
    this.pals = {}

    this.slf_far = null
    this.slf_cfn = null
    this.slf_pfn = null

    this.slf_cfns = {}
    this.slf_vfns = {}
  }

  get_fun(name) {
    return this.name != name && (this.funs[name]
      || (this.scp_fun && this.scp_fun.get_fun(name)))
  }
  add_fun(name) {
    var fun = this.get_fun(name)
    if (fun) return fun
    else if (name == this.name) return this
    else {
      var fun = new Fun(this, name)
      this.funs[name] = fun
      return fun
    }
  }
  rmv_fun(fun) {
    var fun = this.funs[fun.name]
    if (fun && !fun.locked) {
      delete this.funs[fun.name]
      rid_rmv(fun.id)

      fu.forEach(fun.cels, cel => fun.rmv_cel(cel))
    }
  }

  add_far(name, bus) {
    if (this.fars[name]) return this.fars[name]
    else if (this.locked) return

    var far = new Far(this, name, bus)
    this.fars[far.name] = far
    if (name == this.name) this.slf_far = far

    fu.forlen(far.bus, idx => far.add_fal(idx))

    return far
  }
  rmv_far(far) {
    if (!this.fars[far.name]) return
    else if (this.locked) return

    fu.forEach(far.fals, fal => far.rmv_fal(fal))

    if (far == this.slf_far) this.slf_far = null
    delete this.fars[far.name]
    rid_rmv(far.id)
    fu.forEach(this.slf_cfns, cfn => cfn.rmv_car(far))
  }

  add_cfn(name, bus) {
    if (this.locked) return

    name = get_valid_name(name, 'cfn')
    if (!name) return
    var fun = this.add_fun(name)
    if (!fun) return
    else if (this == fun && this.slf_cfn) return this.slf_cfn

    var cfn = new Cfn(this, fun, bus)
    if (this == fun) this.slf_cfn = cfn
    this.cfns[cfn.id] = cfn
    fun.slf_cfns[cfn.id] = cfn

    fu.forlen(cfn.bus, idx => cfn.add_pfn(idx))
    return cfn
  }
  rmv_cfn(cfn) {
    if (!this.cfns[cfn.id]) return
    else if (this.locked) return

    fu.forEach(cfn.src_fun.fars, far => cfn.rmv_car(far))
    fu.forEach(cfn.pfns, pfn => cfn.rmv_pfn(pfn))

    delete cfn.src_fun.slf_cfns[cfn.id]
    delete this.cfns[cfn.id]
    if (this == cfn.src_fun) this.slf_cfn = null
    rid_rmv(cfn.id)

    if (!fu.trueif(cfn.src_fun.slf_cfns, scfn => scfn != cfn.src_fun.slf_cfn)) {
      cfn.src_fun.scp_fun && cfn.src_fun.scp_fun.rmv_fun(cfn.src_fun)
    }
  }

  add_clk(icel, ocel) {
    if (icel == ocel) return
    else if (icel.clks[ocel.id]) return icel.clks[ocel.id]
    // else if (ocel.clks[icel.id]) return ocel.clks[icel.id]

    if (!valid_lnk(icel.cfn_bus, icel.fal_bus, ocel.cfn_bus, ocel.fal_bus))
      return

    var clk = new Clk(icel, ocel)
    this.clks[clk.id] = clk

    icel.clks[ocel.id] = clk
    ocel.clks[icel.id] = clk

    icel.ocels[ocel.id] = ocel
    ocel.icels[icel.id] = icel

    var ibus = icel.pals.length
    var obus = ocel.pals.length
    var iscl = obus > ibus ? ibus / obus : 1
    var oscl = ibus > obus ? obus / ibus : 1
    var bus = ibus > obus ? ibus : obus

    fu.forlen(bus, idx =>
      clk.add_plk(Math.floor(idx * iscl), Math.floor(idx * oscl)))

    return clk
  }
  rmv_clk(clk) {
    if (!this.clks[clk.id]) return
    var icel = clk.icel
    var ocel = clk.ocel

    delete this.clks[clk.id]

    delete icel.clks[ocel.id]
    delete ocel.clks[icel.id]

    delete icel.ocels[ocel.id]
    delete ocel.icels[icel.id]

    rid_rmv(clk.id)

    fu.forEach(clk.plks, plk => clk.rmv_plk(plk))
  }

  add_cel(sel_cels, point, name, cfn_bus, far_bus) {
    var cel = this.cels[point.s]
    if (cel) {
      fu.forEach(sel_cels, sel_cel => this.add_clk(sel_cel, cel))
      return [cel]
    }
    else if (fu.isEmpty(sel_cels)) {
      var cfn = this.add_cfn(name, cfn_bus)
      if (!cfn) return []

      name = cfn.src_fun.name
      if (cfn.cars[name]) return [cfn.cars[name].slf_cel]

      var car = cfn.add_car(name, far_bus)
      if (!car) {
        this.rmv_cfn(cfn)
        return []
      }

      var cel = new Cel(car, null, point)
      cel.color = '#404050'
      this.cels[point.s] = cel
      car.slf_cel = cel

      cel.far_bus = car.src_far.bus
      cel.cfn_bus = car.src_cfn.bus
      cel.idx = null
      cel.name = get_name(cel.cfn_bus, name, cel.far_bus)
      cel.radius = 5 + cel.name.length * 2

      cel.sel_cel = null
      cel.scl_name = name

      cel.draw = cfn.src_fun.draw

      fu.forEach(car.pars, par => par.add_cel(cel))

      return [cel]
    }
    else if (fu.count(sel_cels) == 1) {
      var sel_cel = fu.first(sel_cels)

      var name = get_valid_name(name, 'cel idx or far')
      var idx = valid_idx(name)
      if (idx == null) {
        var cfn = sel_cel.src_car.src_cfn
        if (cfn.cars[name]) return [cfn.cars[name].slf_cel]

        var car = cfn.add_car(name, far_bus)
        if (!car) return []
        name = car.src_far.name

        var cel = new Cel(car, null, point)
        cel.color = '#404040'
        this.cels[point.s] = cel
        car.slf_cel = cel

        cel.far_bus = car.src_far.bus
        cel.cfn_bus = car.src_cfn.bus
        cel.name = get_name(cel.cfn_bus, name, cel.far_bus)
        cel.radius = 5 + cel.name.length * 2
        cel.idx = null

        cel.sel_cel = sel_cel
        cel.scl_name = name

        fu.forEach(car.pars, par => par.add_cel(cel))

        return [cel]
      }
      else if (sel_cel.cfn_bus > 1) {
        if (idx >= sel_cel.cfn_bus) return []

        var cel = new Cel(null, sel_cel, point)
        cel.color = '#403030'
        cel.idx = idx
        this.cels[point.s] = cel
        sel_cel.idx_cels[cel.id] = cel

        var car = sel_cel.src_car
        var par = car.pars[idx]
        var far = car.src_far

        cel.far_bus = far.bus
        cfn_bus = get_valid_bus(cfn_bus, 'cel cfn') || 1

        cel.cfn_bus = cfn_bus + idx > sel_cel.cfn_bus ?
          sel_cel.cfn_bus - idx : cfn_bus
        cel.name = get_name(cel.cfn_bus, idx, cel.far_bus)
        cel.radius = 5 + cel.name.length * 2

        cel.sel_cel = sel_cel
        cel.scl_name = idx

        fu.forlen(cel.cfn_bus, cfn_idx =>
          fu.forEach(sel_cel.pars[idx + cfn_idx].add_cel(cel)))

        return [cel]
      }
      else {
        if (idx >= sel_cel.far_bus) return []

        var cel = new Cel(null, sel_cel, point)
        cel.color = '#403030'
        cel.idx = idx
        this.cels[point.s] = cel
        sel_cel.idx_cels[cel.id] = cel

        far_bus = get_valid_bus(far_bus, 'cel') || 1
        cel.far_bus = far_bus + idx > sel_cel.far_bus ?
          sel_cel.far_bus - idx : far_bus
        cel.cfn_bus = 1
        cel.name = get_name(cel.cfn_bus, idx, cel.far_bus)
        cel.radius = 5 + cel.name.length * 2

        cel.sel_cel = sel_cel
        cel.scl_name = idx

        fu.forlen(cel.far_bus,
          far_idx => sel_cel.pals[idx + far_idx].add_cel(cel))

        return [cel]
      }
    }
  }
  rmv_cel(cel) {
    if (!this.cels[cel.point.s]) return
    fu.forEach(cel.pals, pal => pal.rmv_cel(cel))
    fu.forEach(cel.idx_cels, idx_cel => this.rmv_cel(idx_cel))
    fu.forEach(cel.clks, clk => this.rmv_clk(clk))
    delete this.cels[cel.point.s]
    rid_rmv(cel.id)
    rid_rmv(cel.id + 1) // TODO rmv this

    if (cel.src_cel == null) {
      var car = cel.src_car
      var cfn = car.src_cfn
      cfn.rmv_car(car.src_far)

      if (cfn.slf_car == null) {
        fu.forEach(cfn.cars, car => this.rmv_cel(car.slf_cel))
        this.rmv_cfn(cfn)
      }
    }
    else {
      delete cel.src_cel.idx_cels[cel.id]
    }
  }

  add_sfn(sfn) {
    if (this.locked) return

    var cels = []
    fu.forEach(sfn.sfns, (sfn, name) => this.add_fun(name))

    var fun = this

    function add_scl(idx) {
      if (!sfn.scls[idx]) return []
      else if (cels[idx]) return [cels[idx]]

      var scl = sfn.scls[idx].split(':')
      var src_cel = scl[2]
      var point = scl[0]
      var name = scl[1]
      var cfn_bus = scl[3] || 1
      var far_bus = scl[4] || 1

      src_cel = add_scl(src_cel)
      point = string_to_point(point)

      var cel = fun.add_cel(src_cel, point, name, cfn_bus, far_bus)
      cels[idx] = cel[0]

      return cel
    }

    fu.forEach(sfn.scls, (scl,id) => add_scl(id))
    fu.forEach(sfn.slks, slk => {
      slk = slk.split(',')
      var icel = cels[slk[0]]
      var ocel = cels[slk[1]]
      this.add_clk(icel, ocel)
    })

    fu.forEach(sfn.sfns, (sfn, name) => this.funs[name].add_sfn(sfn))
  }
  get_sfn(scp_sfn) {
    var sfn = {
      sfns: {},
      scls: [],
      slks: []
    }

    var get_scl = cel => {
      var scl = {}
      var name = cel.scl_name
      var point = cel.point.s
      var src_cel = cel.sel_cel ? cel.sel_cel.scl_idx : ''
      var cfn_bus = cel.cfn_bus > 1 ? cel.cfn_bus : ''
      var far_bus = cel.far_bus > 1 ? cel.far_bus : ''
      return `${point}:${name}:${src_cel}:${cfn_bus}:${far_bus}`
    }

    fu.forEach(this.funs, fun => fun.locked || (sfn.sfns[fun.name] = fun.get_sfn()))
    var idx = 0
    fu.forEach(this.cels, cel => cel.scl_idx = idx++)
    fu.forEach(this.cels, cel => sfn.scls[cel.scl_idx] = get_scl(cel))
    fu.forEach(this.clks,
      clk => sfn.slks.push(`${clk.icel.scl_idx},${clk.ocel.scl_idx}`))

    return sfn
  }
}
class Far {
  constructor(src_fun, name, bus) {
    this.id = rid_add(this,'Far')
    this.src_fun = src_fun
    this.name = name
    this.bus = get_valid_bus(bus, 'far') || 1

    this.fals = []
    this.slf_cars = {}
  }
  add_fal(idx) {
    if (this.fals[idx]) return this.fals[idx]

    var fal = new Fal(this, idx)
    this.fals[idx] = fal
    this.src_fun.fals[fal.id] = fal
    return fal
  }
  rmv_fal(fal) {
    if (!this.fals[fal.idx]) return

    delete this.src_fun.fals[fal.id]
    delete this.fals[fal.idx]
    rid_rmv(fal.id)
  }
}
class Fal {
  constructor(src_far, idx) {
    this.id = rid_add(this,'Fal')
    this.src_far = src_far
    this.idx = idx

    this.scp_fals = []
  }
}

class Cel {
  constructor(src_car, src_cel, point) {
    this.id = rid_add(this,'Cel')
    rid_add('new Cel -----')
    this.scp_fun = scp_fun
    this.src_car = src_car || src_cel.src_car
    this.src_cel = src_cel
    this.point = point
    this.proj = null
    this.name = null

    this.src_cfn = this.src_car.src_cfn
    this.src_fun = this.src_cfn.src_fun

    this.draw = null

    this.idx_cels = {}
    this.pars = []
    this.pals = []

    this.icels = {}
    this.ocels = {}
    this.clks = {}

    this.active = false

    this.idx = null
    this.far_bus = null
    this.cfn_bus = null
  }
  set_active(active) {
    this.active = active
    fu.forEach(this.pals, pal => pal.set_active(active))
  }
  is_active(scp_vfn) {
    return fu.trueif(this.pals, pal => pal.is_active(scp_vfn))
  }

  draw_clk_lines(g) {
    g.fillStyle = g.strokeStyle = this.is_active() && '#FF2020' || 'grey'
    fu.forEach(this.ocels,
      ocel => drawArrowLine(g, this.proj, ocel.proj, this.radius, ocel.radius))
  }
  draw_lnks(g) {
    var cfn = this.src_car.src_cfn
    g.strokeStyle = this.is_active() && '#FF2020' || 'grey'
    if (this.src_cel) {
      pt.drawLine(g, this.proj, this.src_cel.proj)
    }
    else if (cfn.slf_car != this.src_car) {
      pt.drawLine(g, this.proj, cfn.slf_car.slf_cel.proj)
    }
  }
  fill_text(g) {
    if (this.draw) {
      this.draw(g, this)
      return
    }

    g.fillStyle = this.color
    var x = this.proj.x
    var y = this.proj.y

    var name = `${this.name}`
    var w = cel_size / 2
    pt.fillCircle(g, this.proj, this.radius)

    if (this.is_active()) {
      g.strokeStyle = '#FF2020'
      pt.drawCircle(g, this.proj, this.radius)
    }

    g.fillStyle = 'white'
    var far_bus = this.far_bus > 1 ? this.far_bus : ''
    var cfn_bus = this.cfn_bus > 1 ? this.cfn_bus : ''
    g.fillText(name, this.proj.x,this.proj.y + 4)
  }
}

class Cfn {
  constructor(scp_fun, src_fun, bus) {
    this.id = rid_add(this,'Cfn')
    this.scp_fun = scp_fun
    this.src_fun = src_fun
    this.is_slf = scp_fun == src_fun
    this.bus = this.is_slf || src_fun.draw ? 1 : get_valid_bus(bus, 'cfn') || 1

    this.pfns = []
    this.cars = {}
    this.slf_car = null
  }
  add_pfn(idx) {
    if (this.pfns[idx]) return this.pfns[idx]

    var pfn = new Pfn(this, idx)
    this.pfns[idx] = pfn
    this.scp_fun.pfns[pfn.id] = pfn
    if (this.is_slf) this.scp_fun.slf_pfn = pfn

    fu.forEach(scp_fun.slf_vfns, vfn => pfn.get_vfn(vfn))
    pfn.get_vfn()

    return pfn
  }
  rmv_pfn(pfn) {
    if (!this.pfns[pfn.idx]) return

    fu.forEach(scp_fun.slf_vfns, vfn => pfn.rmv_vfn(vfn))
    pfn.rmv_vfn()

    if (this.is_slf) this.scp_fun.slf_pfn = null
    delete this.scp_fun.pfns[pfn.id]
    delete this.pfns[pfn.idx]
    rid_rmv(pfn.id)
  }

  add_car(name, bus) {
    name = get_valid_name(name, 'car')
    if (!name) return
    else if (this.cars[name]) return this.cars[name]
    var far = this.src_fun.add_far(name, bus)
    if (!far) return

    var car = new Car(this, far)
    this.cars[name] = car
    far.slf_cars[car.id] = car
    if (far == this.src_fun.slf_far) this.slf_car = car

    fu.forEach(far.fals, fal => car.add_cal(fal))
    fu.forEach(this.pfns, pfn => pfn.add_par(car))

    var native = this.src_fun.native
    native && fu.forEach(this.pfns, pfn => native(pfn, name))

    return car
  }
  rmv_car(far) {
    var car = this.cars[far.name]
    if (!car) return

    fu.forEach(this.pfns, pfn => pfn.rmv_par(car))
    fu.forEach(far.fals, fal => car.rmv_cal(fal))

    if (far == this.src_fun.slf_far) this.slf_car = null
    delete far.slf_cars[car.id]
    delete this.cars[far.name]
    rid_rmv(car.id)

    if (fu.isEmpty(far.slf_cars)) this.src_fun.rmv_far(far)
  }
}
class Car {
  constructor(src_cfn, src_far) {
    this.id = rid_add(this,'Car')
    this.src_cfn = src_cfn
    this.src_far = src_far

    this.cals = []
    this.pars = []
    this.pals = {}

    this.slf_cel = null
  }
  add_cal(fal) {
    if (this.cals[fal.idx]) return this.cals[fal.idx]

    var cal = new Cal(this, fal)
    this.cals[fal.idx] = cal
    return cal
  }
  rmv_cal(fal) {
    var cal = this.cals[fal.idx]
    if (!cal) return

    delete this.cals[fal.idx]
    rid_rmv(cal.id)
  }
}
class Cal {
  constructor(src_car, src_fal) {
    this.id = rid_add(this,'Cal')
    this.src_car = src_car
    this.src_fal = src_fal

    this.pals = []
  }
}
class Clk {
  constructor(icel, ocel) {
    this.id = rid_add(this,'Clk')
    this.icel = icel
    this.ocel = ocel

    this.plks = {}
  }

  add_plk(iidx, oidx) {
    var ipal = this.icel.pals[iidx]
    var opal = this.ocel.pals[oidx]
    var plk = new Plk(ipal, opal)
    this.plks[plk.id] = plk
    if (!ipal.plks[opal.id]) ipal.plks[opal.id] = {}
    if (!opal.plks[ipal.id]) opal.plks[ipal.id] = {}
    ipal.plks[opal.id][plk.id] = plk
    opal.plks[ipal.id][plk.id] = plk

    ipal.opals[opal.id] = opal
    opal.ipals[ipal.id] = ipal

    return plk
  }
  rmv_plk(plk) {
    if (!this.plks[plk.id]) return

    var ipal = plk.ipal
    var opal = plk.opal

    delete this.plks[plk.id]
    delete ipal.plks[opal.id][plk.id]
    delete opal.plks[ipal.id][plk.id]
    rid_rmv(plk.id)

    if (fu.isEmpty(ipal.plks[opal.id])) {
      delete ipal.plks[opal.id]
      delete opal.plks[ipal.id]
      delete ipal.opals[opal.id]
      delete opal.ipals[ipal.id]
    }
  }
}

class Pfn {
  constructor(src_cfn, idx) {
    this.id = rid_add(this,'Pfn')
    this.src_cfn = src_cfn
    this.idx = idx

    this.scp_fun = src_cfn.scp_fun
    this.src_fun = src_cfn.src_fun
    this.is_slf = src_cfn.is_slf

    this.pars = {}
    this.pals = {}

    this.slf_vfn = null
  }
  add_par(car) {
    var far = car.src_far
    if (this.pars[far.name]) return this.pars[far.name]

    var par = new Par(this, car)
    this.pars[far.name] = par
    car.pars[this.idx] = par

    fu.forEach(car.cals, cal => par.add_pal(cal))

    if (far.bus > 1) par.pal = null

    return par
  }
  rmv_par(car) {
    var far = car.src_far
    var par = this.pars[far.name]
    if (!par) return

    fu.forEach(car.cals, cal => par.rmv_pal(cal))

    delete car.pars[this.idx]
    delete this.pars[far.name]
    rid_rmv(par.id)
  }

  get_vfn(scp_vfn) {
    var src_vfn = scp_vfn ? scp_vfn.vfns[this.id] : this.slf_vfn
    if (!src_vfn)
      if (this.is_slf && scp_vfn) {
        src_vfn = scp_vfn
        scp_vfn.vfns[this.id] = src_vfn
      }
      else return null

    if (this.is_slf) src_vfn.src_pfn = this
    else src_vfn.scp_pfn = this

    return src_vfn
  }
  add_vfn(scp_vfn) {
    var src_vfn = this.get_vfn(scp_vfn)
    if (src_vfn) return src_vfn

    src_vfn = this.is_slf ?
      new Vfn(scp_vfn, this.src_fun, null, this) :
      new Vfn(scp_vfn, this.src_fun, this, this.src_fun.slf_pfn)

      // log('add_vfn', this.id, src_vfn.id)

    if (scp_vfn) scp_vfn.vfns[this.id] = src_vfn
    else this.slf_vfn = src_vfn

    this.src_fun.slf_vfns[src_vfn.id] = src_vfn
    return src_vfn
  }
  rmv_vfn(scp_vfn) {
    var src_vfn = scp_vfn ? scp_vfn.vfns[this.id] : this.slf_vfn
    if (!src_vfn) return

    if (!this.is_slf || !scp_vfn){
      fu.forEach(this.pals, pal => pal.rmv_val(scp_vfn))
      if (!this.is_slf || !scp_vfn) rid_rmv(src_vfn.id)

      // log('rmv_vfn', this.id, src_vfn.id)
    }

    if (scp_vfn) delete scp_vfn.vfns[this.id]
    else this.slf_vfn = null

    if (!this.is_slf || scp_vfn)
      fu.forEach(this.src_fun.pfns, pfn => pfn.rmv_vfn(src_vfn))
  }
}
class Par {
  constructor(src_pfn, src_car) {
    this.id = rid_add(this,'Par')
    this.src_pfn = src_pfn
    this.src_car = src_car

    this.scp_fun = src_pfn.scp_fun
    this.src_fun = src_pfn.src_fun

    this.pals = []
    this.pal = null // only used for single bus fars
  }
  add_pal(cal) {
    var fal = cal.src_fal
    if (this.pals[fal.idx]) return this.pals[fal.idx]

    var pal = new Pal(this, cal)
    this.pals[fal.idx] = pal
    cal.pals[this.src_pfn.idx] = pal
    cal.src_car.pals[pal.id] = pal
    this.src_pfn.pals[fal.id] = pal
    this.src_car.src_cfn.scp_fun.pals[pal.id] = pal
    this.pal = pal

    fu.forEach(this.scp_fun.slf_vfns, vfn => pal.get_val(vfn))
    pal.get_val()

    return pal
  }
  rmv_pal(cal) {
    var fal = cal.src_fal
    var pal = this.pals[fal.idx]
    if (!pal) return

    fu.forEach(this.src_fun.slf_vfns, vfn => pal.rmv_val(vfn))
    pal.rmv_val()

    this.pal = null
    delete this.src_car.src_cfn.scp_fun.pals[pal.id]
    delete this.src_pfn.pals[fal.id]
    delete cal.src_car.pals[pal.id]
    delete cal.pals[this.src_pfn.idx]
    delete this.pals[fal.idx]
    rid_rmv(pal.id)
  }

  add_cel(cel) {
    cel.pars.push(this)
    fu.forEach(this.pals, pal => pal.add_cel(cel))
    // TODO
  }
  rmv_cel(cel) {
    // TODO
  }
}
class Pal {
  constructor(src_par, src_cal) {
    this.id = rid_add(this,'Pal')
    this.src_par = src_par
    this.src_cal = src_cal

    this.src_fal = src_cal.src_fal
    this.src_pfn = src_par.src_pfn
    this.is_slf = this.src_pfn.is_slf

    this.active = false
    this.cels = {}

    this.ipals = {}
    this.opals = {}

    this.plks = {}

    this.slf_val = null

    this.native = null
    this.src_pal = null
  }
  set_active(active) {
    active = active || fu.trueif(this.cels, cel => cel.active)
    if (this.active != active) {
      this.active = active
      var val = this.add_val()
      scp_vals[val.id] = val
    }
  }
  is_active(scp_vfn) {
    var val = this.get_val(scp_vfn)
    return val && val.o
  }

  add_cel(cel) {
    cel.pals.push(this)
    this.cels[cel.id] = cel
  }
  rmv_cel(cel) {
    delete this.cels[cel.id]
  }

  get_val(scp_vfn) {
    var src_vfn = this.src_pfn.get_vfn(scp_vfn)
    if (!src_vfn) return null

    var val = src_vfn.vals[this.src_fal.id]
    if (!val) return null

    if (this.is_slf) val.src_pal = this
    else val.scp_pal = this

    return val
  }
  add_val(scp_vfn) {
    var src_vfn = this.src_pfn.add_vfn(scp_vfn)
    var fal = this.src_fal
    var val = src_vfn.vals[fal.id]

    if (val) {
      if (this.is_slf) val.src_pal = this
      else val.scp_pal = this
    }
    else {

      var scp_pfn = src_vfn.scp_pfn
      var src_pfn = src_vfn.src_pfn

      var scp_pal = scp_pfn && scp_pfn.pals[fal.id]
      var src_pal = src_pfn && src_pfn.pals[fal.id]

      val = this.is_slf ?
        new Val(fal, scp_vfn && scp_vfn.scp_vfn, scp_vfn, scp_pal, src_pal) :
        new Val(fal, scp_vfn, src_vfn, scp_pal, src_pal)

      src_vfn.vals[fal.id] = val
    }

    return val
  }
  rmv_val(scp_vfn) {
    var src_vfn = this.src_pfn.get_vfn(scp_vfn)
    if (!src_vfn) return null

    var fal = this.src_fal
    var val = src_vfn.vals[fal.id]
    if (!val) return null

    if (this.is_slf) val.src_pal = null
    else val.scp_pal = null

    if (this.scp_pal || val.src_pal) return

    delete src_vfn.vals[fal.id]
    rid_rmv(val.id)
  }
}
class Plk {
  constructor(ipal, opal) {
    this.id = rid_add(this,'Plk')
    this.ipal = ipal
    this.opal = opal
  }
}

class Vfn {
  constructor(scp_vfn, src_fun, scp_pfn, src_pfn) {
    this.id = rid_add(this, 'Vfn')
    this.scp_vfn = scp_vfn
    this.src_fun = src_fun
    this.scp_pfn = scp_pfn
    this.src_pfn = src_pfn

    this.vfns = {}
    this.vals = {}
  }
  get_vals(vals) {
    fu.forEach(this.vals, val => vals[val.id] = val)
    fu.forEach(this.vfns, vfn => vfn != this && vfn.get_vals(vals))
  }
}
class Val {
  constructor(src_fal, scp_vfn, src_vfn, scp_pal, src_pal) {
    this.id = rid_add(this, 'Val')

    this.src_fal = src_fal
    this.scp_vfn = scp_vfn
    this.src_vfn = src_vfn

    this.scp_pal = scp_pal
    this.src_pal = src_pal

    this.i = false
    this.o = false
    this.f = false
  }
}

// -----------------------------------------------------------------------------
// VARS
// -----------------------------------------------------------------------------
{
  cntr_pt = {x:0, y:0, z:0}

  scp_fun = null
  sel_cels = {}
  fcs_cels = {}

  scp_vals = {}

  svd_cfn_bus = null
  svd_far_bus = null
  svd_name = null

  enter_count = 1
  tick_count = 0
  tick_tally = 0

  mws_cel = mws_pt = mws_proj = null
  prv_cel = prv_pt = prv_proj = null
  fcs_cel = fcs_pt = fcs_proj = null

  mws_moved = false
}
// -----------------------------------------------------------------------------
// TICK
// -----------------------------------------------------------------------------

function update_next(scp_fun, vals) {
  // check_vals()
  var new_vals = {}
  fu.forEach(vals, val => {
    var pfn = val.scp_pal && val.scp_pal.src_pfn
    var fals = val.src_fal.scp_fals
    pfn && fals.length && fu.forEach(fals, fal => {
      var pal = pfn.pals[fal.id]
      var src_val = pal && pal.add_val(val.scp_vfn)
      if (src_val) new_vals[src_val.id] = src_val
    })
  })
  fu.forEach(new_vals, val => vals[val.id] = val)
  new_vals = {}

  // clear
  fu.forEach(vals, val => val.i = false)

  // get active cel
  fu.forEach(scp_fun.pals, pal => {
    var val = pal.get_val()
    if (val) val.i = val.i || pal.active
  })

  // get i
  fu.forEach(vals, oval => oval.i = oval.i ||
    (oval.scp_pal && fu.trueif(oval.scp_pal.ipals, ipal => {
      var ival = ipal.get_val(oval.scp_vfn)
      return ival && ival.o
    })) ||
    (oval.src_pal && fu.trueif(oval.src_pal.ipals, ipal => {
      var ival = ipal.get_val(oval.src_vfn)
      return ival && ival.o
    })))

  // don't do anything with o
  fu.forEach(vals,
    val => val.scp_pal && val.scp_pal.native && val.scp_pal.native(val))

  // set o
  fu.forEach(vals, val => {
    if (val.f) new_vals[val.id] = val
    if (val.i == val.o) return

    val.o = val.i
    val.scp_pal && fu.forEach(val.scp_pal.opals, opal => {
      var oval = opal.add_val(val.scp_vfn)
      new_vals[oval.id] = oval
    })
    val.src_pal && fu.forEach(val.src_pal.opals, opal => {
      var oval = opal.add_val(val.src_vfn)
      new_vals[oval.id] = oval
    })
  })

  return new_vals
}
function update_all(scp_fun) {
  var vals = {}

  fu.forEach(scp_fun.pfns, pfn => {
    var vfn = pfn.get_vfn()
    vfn && vfn.get_vals(vals)
  })
  return update_next(scp_fun, vals)
}
function tick(usrIO, sndMsg) {
  if (!scp_fun) return

  // USER INTERFACE
  {
    var mws = usrIO.mws
    mws_pt = mws_to_point(cntr_pt, mws)
    mws_proj = point_to_mws(cntr_pt, mws_pt)
    mws_pt.s = point_to_string(mws_pt)
    mws_cel = scp_fun.cels[mws_pt.s]

    // scp trace setup
    {
      scp_trc = []

      var p = pt.point(1,1)
      var fun = scp_fun

      while (fun) {
        scp_trc.push({point:pt.copy(p), string:point_to_string(p), fun:fun})
        fun = fun.scp_fun
        ++p.y
      }

      // p.y = 1
      // for (var fun_name in scp_fun.funs) {
      //   fun = scp_fun.funs[fun_name]
      //   if (fun.locked) continue
      //   ++p.x
      //   scp_trc.push({point:pt.copy(p), string:point_to_string(p), fun:fun})
      // }
    }

    if (mws.hsDn) {
      mws_moved = false

      fcs_pt = mws_pt
      fcs_proj = mws_proj
      fcs_cel = mws_cel

      fcs_cels = mws_cel && [mws_cel] || []

      if (fcs_cel) {
        if (!fu.contains(sel_cels, fcs_cel)) {
          fcs_cel = null
          // sel_cels = []
        }
      }
    }

    var kydn = usrIO.kys.hsDn

    if (kydn['q']) {

      if (mws.isDn) {
        if (mws_cel)
          scp_fun.rmv_cel(mws_cel)
        fu.forEach(fcs_cels, cel => scp_fun.rmv_cel(cel))
      }

      fcs_cels = []
      sel_cels = []
      mws_moved = true

      scp_vals = update_all(scp_fun)
    }
    else if (kydn['l']) {

      fu.forEach(sel_cels,
        cel => fu.forEach(cel.clks,
          clk => scp_fun.rmv_clk(clk)))

      fcs_cels = []
      sel_cels = []
      mws_moved = true

      scp_vals = update_all(scp_fun)
    }
    else if (kydn[' ']) {
      var active = fu.countif(sel_cels, sel_cel => sel_cel.active)
      var count = fu.count(sel_cels)

      active += !!mws_cel && !!mws_cel.active
      count += !!mws_cel

      active = active != count
      fu.forEach(sel_cels, sel_cel => sel_cel.set_active(active))
      mws_cel && (mws_cel.set_active(active))

      fcs_cels = []
      sel_cels = []
      mws_moved = true
      scp_vals = update_next(scp_fun, scp_vals)
      // scp_vals = update_all(scp_fun)
    }
    else if (kydn['s']) {
      sndMsg('save', save_def(main))
    }
    else if (kydn['r']) {
      sndMsg('read')
    }
    else if (kydn['c']) {
      svd_cfn_bus = get_valid_bus(null, 'cfn')
    }
    else if (kydn['f']) {
      svd_far_bus = get_valid_bus(null, 'far')
    }
    else if (kydn['n']) {
      svd_name = get_valid_name(null, 'cel')
    }
    else if (kydn['e']) {
      enter_count = get_valid_bus(null, 'Enter tick') || 1
    }
    else if (kydn['t']) {
      tick_count = parseFloat(prompt('tick count'))
      tick_count = tick_count || 0
      tick_tally = 0
    }
    else if (kydn['Shift']) {
      var scp_trc_tpl = fu.findif(scp_trc, tpl => mws_pt.s == tpl.string)
      if (scp_trc_tpl && !scp_trc_tpl.fun.locked) {
        mws_moved = true
        fcs_cel = null

        scp_fun = scp_trc_tpl.fun
        sel_cels = []
        fcs_cels = []

        scp_vals = update_all(scp_fun)
      }
      else if (mws_cel && !mws_cel.src_fun.locked) {
        mws_moved = true
        fcs_cel = null

        scp_fun = mws_cel.src_fun
        sel_cels = []
        fcs_cels = []

        scp_vals = update_all(scp_fun)
      }
    }

    if (mws.isDn && mws_pt.s != prv_pt.s) {
      if (fcs_cel) {
        var valid = true
        var temp_pts = []
        for (var idx in sel_cels) {
          var point = pt.sum(mws_pt, pt.sub(sel_cels[idx].point, fcs_pt))
          temp_pts[idx] = point
          point.s = point_to_string(point)
          var cel = scp_fun.cels[point.s]
          valid = valid && (!cel || fu.contains(sel_cels, cel))
        }
        if (valid) {
          fu.forEach(sel_cels, cel => delete scp_fun.cels[cel.point.s])
          fu.forEach(sel_cels, (cel,idx) => {
            cel.point = temp_pts[idx]
            scp_fun.cels[cel.point.s] = cel
          })
          fcs_pt = mws_pt
        }
      }
      else {
        fcs_cels = []
        var ax = fcs_pt.x > mws_pt.x ? mws_pt.x : fcs_pt.x
        var ay = fcs_pt.y > mws_pt.y ? mws_pt.y : fcs_pt.y
        var bx = fcs_pt.x < mws_pt.x ? mws_pt.x : fcs_pt.x
        var by = fcs_pt.y < mws_pt.y ? mws_pt.y : fcs_pt.y
        var p = pt.point()

        for (p.x = ax; p.x <= bx; ++p.x)
          for (p.y = ay; p.y <= by; ++p.y) {
            var str = point_to_string(p)
            var cel = scp_fun.cels[str]
            cel && fcs_cels.push(cel)
          }
      }

      mws_moved = true
    }

    if (mws.hsUp) {
      var p = pt.point(1,1)
      var fun = scp_fun

      if (mws_moved) {
        if (fu.count(sel_cels) == 1) {
          var sel_cel = fu.first(sel_cels)
          fu.forEach(fcs_cels, fcs_cel => scp_fun.add_clk(sel_cel, fcs_cel))
        }

        sel_cels = fcs_cels
        fcs_cels = []
      }
      else {
        sel_cels = scp_fun.add_cel(sel_cels, mws_pt, svd_name,
          svd_cfn_bus, svd_far_bus)
        scp_vals = update_all(scp_fun)
      }
    }

    if (kydn['Enter']) {
      fu.forlen(enter_count, i => scp_vals = update_next(scp_fun, scp_vals))
    }

    if (tick_count > 1) {
      fu.forlen(tick_count, i => scp_vals = update_next(scp_fun, scp_vals))
    }
    else if (tick_count > 0) {
      tick_tally += tick_count
      if (tick_tally > 1) scp_vals = update_next(scp_fun, scp_vals)
      tick_tally %= 1
    }

    // set prv
    {
      prv_pt = mws_pt
      prv_proj = mws_proj
      prv_cel = mws_cel
    }
  }

  // DRAW
  try {
    var g = usrIO.dsply.g
    var mws = usrIO.mws

    g.font = "12px Lucida Console"

    g.textAlign = 'center'

    // draw mws
    {
      g.lineWidth = 3
      if (mws_cel) {
        g.strokeStyle = 'grey'
        pt.drawCircle(g, mws_cel.proj, mws_cel.radius + 2)
      }
      else {
        g.fillStyle = 'grey'
        pt.fillRect(g, mws_proj, 10)
      }

      g.fillStyle = 'white'
      pt.fillCircle(g, mws, 10)

    }

    // proj points onto screen
    {
      fu.forEach(scp_fun.cels,
        cel => cel.proj = point_to_mws(cntr_pt, cel.point))

      fu.forEach(scp_trc, tpl => tpl.proj = point_to_mws(cntr_pt, tpl.point))
    }

    // draw cel lnks
    {
      g.lineWidth = 3
      fu.forEach(scp_fun.cels, cel => cel.draw_lnks(g))
    }

    // draw ptr lnks
    {
      g.lineWidth = 2
      g.setLineDash([2,4])

      fu.forEach(scp_fun.cels, cel => cel.draw_clk_lines(g))
      g.setLineDash([])
    }

    // draw mws lines
    {
      g.fillStyle = g.strokeStyle = 'grey'
      fu.forEach(sel_cels, cel => {
        drawArrowLine(g, cel.proj, mws_proj, cel.radius, 0)
        pt.drawCircle(g, cel.proj, cel.radius + 2)
      })
      fu.forEach(fcs_cels, cel => pt.drawCircle(g, cel.proj, cel.radius + 2))
    }

    // fill cel txt
    {
      g.lineWidth = 2
      g.setLineDash([])
      fu.forEach(scp_fun.cels, cel => cel.fill_text(g))

      g.fillStyle = 'white'
      fu.forEach(scp_trc, tpl =>
        g.fillText(tpl.fun.name, tpl.proj.x, tpl.proj.y))
    }
  }
  catch (e) {}
}

// -----------------------------------------------------------------------------
// FILE I/O
// -----------------------------------------------------------------------------

function get_hex(f) {
  var word = ''
  var num = 0
  fu.forlen(16, idx => {
    num += f(idx) ? 1 << (idx & 3) : 0
    if ( (idx & 3) ^ 3 ) return
    word += hex_alph[num]
    num = 0
  })
  return word
}
function snd_R_rqst(i_far, pfn, t_val) {
  clnt_snd('R snd', [t_val.id, get_hex(idx => {
    var i_fal = i_far.fals[idx]
    var i_pal = pfn.pals[i_fal.id]
    var i_val = i_pal && i_pal.get_val(t_val.scp_vfn)
    return i_val && i_val.i
  })])
}
function snd_R_rply(msg) {
  var val_id = msg[0]
  var file = msg[1]
  try {
    file += ` ${fs.readFileSync(`rs/${file}.txt`)}`
    // log(file)
  }
  catch (e) {
    log(`could not find rs/${file}.txt`, e)
  }
  return [val_id, file]
}
function rcv_R_rply(msg) {
  var val_id = msg[0]
  var val = rid_objs[val_id]
  if (!val) return

  var text = ''
  var msg = msg[1]
  {
    var flag = true
    fu.forEach(msg, c => {
      var p_flag = flag
      flag = c == '#' ? false : c == '\n' ? true : flag
      if (flag) text += c
      flag = (!p_flag && c == '#') || flag
    })
    text = text.split(/[:;.,!?\s\n\t]+/)
  }

  var vars = {}
  {
    var lexs = []
    var idx = 0
    fu.forEach(text, word => {
      if (word[0] == '$') {
        var word = word.substr(1)
        vars[word] = vars[word] || get_hex(i => idx & (1 << i))
      }
      else {
        lexs.push(word)
        ++idx
      }
    })
    fu.forEach(lexs, (word, idx) => lexs[idx] = vars[word] || word)
  }

  var out = []
  {
    fu.forEach(lexs, word => {
      var n = []

      fu.forlen(4, idx => {
        var nib = alph_hex[word[idx]] || 0
        n.push(nib & 1 ? 1 : 0)
        n.push(nib & 2 ? 1 : 0)
        n.push(nib & 4 ? 1 : 0)
        n.push(nib & 8 ? 1 : 0)
      })
      out.push(n)
    })
    rid_val_files[val_id] = [0,out]
  }
  // log(msg, lexs, out)

  scp_vals = update_all(scp_fun)
}
function prc_R_rply(hex, n_par, vfn_scp) {
  fu.forEach(n_par.pals, pal => {
    var val = pal.add_val(vfn_scp)
    val.i = hex[pal.src_fal.idx]
  })
}

function check_vals() {
  fu.forEach(rid_types.Val, val => {
    log('scp',
      'vfn', val.scp_vfn && val.scp_vfn.id || 0,
      'pal', val.scp_pal && val.scp_pal.id || 0,
      'src',
      'vfn', val.src_vfn && val.src_vfn.id || 0,
      'pal', val.src_pal && val.src_pal.id || 0)
  })
}
function read_def(msg) {
  log('read_def')

  rid_idx = msg.ridx || 0
  rid_objs = {}
  rid_obj_type = {}
  rid_types = {}

  rid_val_files = {}

  scp_fun = main = new Fun(null, 'main')

  // Transistor
  var m_Transistor = () => {
    var f = main.add_fun('+')
    var n_far = f.add_far('+', 1)
    var i_far = f.add_far('i', 1)
    var s_far = f.add_far('s', 1)

    var n_fal = n_far.fals[0]
    var i_fal = i_far.fals[0]
    var s_fal = s_far.fals[0]

    i_fal.scp_fals = [n_fal]
    s_fal.scp_fals = [n_fal]

    f.native = (pfn, name) => {

      if (name != '+') return

      pfn.pals[n_fal.id].native = val => {
        if (val.i) return

        var pfn = val.scp_pal.src_pfn
        var i = pfn.pals[i_fal.id]
        var s = pfn.pals[s_fal.id]

        i = i && i.get_val(val.scp_vfn)
        s = s && s.get_val(val.scp_vfn)

        val.i = (i && i.i) && !(s && s.i)
      }
    }

    f.locked = true
  }
  m_Transistor()

  // Display

  var m_Display = () => {
    var f = main.add_fun('=')
    var n_far = f.add_far('=', 64)

    var ary = [
      0x00, 0x01, 0x04, 0x05,   0x10, 0x11, 0x14, 0x15,
      0x02, 0x03, 0x06, 0x07,   0x12, 0x13, 0x16, 0x17,
      0x08, 0x09, 0x0C, 0x0D,   0x18, 0x19, 0x1C, 0x1D,
      0x0A, 0x0B, 0x0E, 0x0F,   0x1A, 0x1B, 0x1E, 0x1F,

      0x20, 0x21, 0x24, 0x25,   0x30, 0x31, 0x34, 0x35,
      0x22, 0x23, 0x26, 0x27,   0x32, 0x33, 0x36, 0x37,
      0x28, 0x29, 0x2C, 0x2D,   0x38, 0x39, 0x3C, 0x3D,
      0x2A, 0x2B, 0x2E, 0x2F,   0x3A, 0x3B, 0x3E, 0x3F
    ]
    var flag = true

    f.draw = (g, cel) => {
      g.fillStyle = '#000000'
      pt.fillRect(g, cel.proj, 16)

      var n_par = cel.src_car.pars[0]

      var idx = 0
      var n_pals = n_par.pals

      var x = cel.proj.x - 0x10
      var y = cel.proj.y - 0x10

      g.fillStyle = '#404040'
      var p = pt.zero()
      for (p.y = 0; p.y < 0x20; p.y += 4)
        for (p.x = 0; p.x < 0x20; p.x += 4, ++idx) {
          g.fillStyle = n_pals[ary[idx]].is_active() ? '#404040' : '#202040'
          // if (n_pals[ary[idx]].is_active()) {
            g.beginPath()
            g.rect(p.x + x, p.y + y, 3, 3)
            g.fill()
          // }
        }

      flag = false

    }

    f.locked = true
  }
  m_Display()

  // Read
  var m_Read = () => {
    var f = main.add_fun('R')

    // out fars
    var n_far = f.add_far('R', 16) // word output
    var s_far = f.add_far('s', 1) // out trigger

    // in fars
    var i_far = f.add_far('i', 16) // file address
    var t_far = f.add_far('t', 1) // request trigger

    var s_fal = s_far.fals[0]
    var t_fal = t_far.fals[0]

    t_fal.scp_fals = [s_fal]
    fu.forEach(n_far.fals, n_fal => t_fal.scp_fals.push(n_fal))

    f.native = (pfn, name) => {
      if (name != 't') return

      var t_pal = pfn.pals[t_fal.id]
      t_pal.native = t_val => {

        if (t_val.f) {
          var msg = rid_val_files[t_val.id]
          t_val.i = !msg

          if (msg) {
            var s_pal = pfn.pals[s_fal.id]
            var s_val = s_pal && s_pal.add_val(t_val.scp_vfn)

            var idx = msg[0]
            var file = msg[1]

            var n_par = pfn.pars[n_far.name]
            if (idx < file.length && s_val && n_par) {
              s_val.i = true
              prc_R_rply(file[idx], n_par, t_val.scp_vfn)
              ++msg[0]
            }
            else {
              delete rid_val_files[t_val.id]
              t_val.f = false
              s_val && (s_val.i = false)
            }
          }
        } else
        if (t_val.i && !t_val.o) {
          t_val.f = true
          snd_R_rqst(i_far, pfn, t_val)
        }
      }
    }
    f.locked = true
  }
  m_Read()

  // Write
  var m_Write = () => {
    var f = main.add_fun('W')
    var n_far = f.add_far('W', 16)
    var i_far = f.add_far('i', 1)

    f.native = (pfn, name) => {



    }

    f.locked = true
  }
  m_Write()

  rid_add('setup -----')

  main.add_sfn(msg)

  scp_vals = update_all(scp_fun)

  alert('Successfully reloaded save file!')
}
function save_def(scp_fun) {
  log('save_def')

  var sfn = scp_fun.get_sfn()
  sfn.rid_idx = rid_idx
  return sfn
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
