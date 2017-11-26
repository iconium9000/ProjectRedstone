// PROJECT REDSTONE
var log = console.log
log('game.js init')

module.exports = apInitA => {

  fu = apInitA.fu
  pt = apInitA.pt
  fs = apInitA.fs

  var plrIf = new Object

  function sndMsg(ky,sndr,rcvr,msg) {
    apIO.apSnd({ky:ky, sndr:sndr, rcvr:rcvr, msg:msg})
  }
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
      case 'read':
        sndMsg('restart',
          'srvr',
          'all -srvr',
          JSON.parse(fs.readFileSync('redstone.json')))
        break
      case 'save':
        fs.writeFile('redstone.json',JSON.stringify(msg,null,2))
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
  cel_size = 32
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
    var arrow = arrow_time * length
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
    return this.name != name && (this.funs[name] ||
      (this.scp_fun && this.scp_fun.get_fun(name)))
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
    var iscl = obus > ibus ? Math.floor(ibus / obus) : 1
    var oscl = ibus > obus ? Math.floor(obus / ibus) : 1
    var bus = ibus > obus ? ibus : obus

    fu.forlen(bus, idx => clk.add_plk(idx * iscl, idx * oscl))

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

      fu.forEach(car.pals, pal => pal.add_cel(cel))

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

        fu.forEach(car.pals, pal => pal.add_cel(cel))

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
        cel.cfn_bus = 1
        cel.name = get_name(cel.cfn_bus, idx, cel.far_bus)
        cel.radius = 5 + cel.name.length * 2

        cel.sel_cel = sel_cel
        cel.scl_name = idx

        fu.forlen(cel.cfn_bus,
          cfn_idx => fu.forEach(car.pars[idx + cfn_idx].pals,
            pal => pal.add_cel(cel)))

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
      this.add_val()
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
    var src_pal = val.scp_pal && val.scp_pal.src_pal
    if (src_pal) {
      var src_val = src_pal.add_val(val.scp_vfn)
      vals[src_val.id] = src_val
    }
  })

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
      // log('rcv', ipal.id, oval.id, ival && ival.id)
      return ival && ival.o
    })) ||
    (oval.src_pal && fu.trueif(oval.src_pal.ipals, ipal => {
      var ival = ipal.get_val(oval.src_vfn)
      // log('rcv', oval.id, ival && ival.id)
      return ival && ival.o
    })))

  // set o
  fu.forEach(vals, val => {
    // log(val.i)

    var change = false

    if (val.scp_pal && val.scp_pal.native) {
      change = val.scp_pal.native(val)
    }
    else {
      change = val.i != val.o
      val.o = val.i
    }

    if (change) {
      val.scp_pal && fu.forEach(val.scp_pal.opals, opal => {
        var oval = opal.add_val(val.scp_vfn)
        new_vals[oval.id] = oval

      })
      val.src_pal && fu.forEach(val.src_pal.opals, opal => {
        var oval = opal.add_val(val.src_vfn)
        new_vals[oval.id] = oval

      })
    }
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
      scp_vals = update_all(scp_fun)
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
      if (scp_trc_tpl) {
        mws_moved = true
        fcs_cel = null

        scp_fun = scp_trc_tpl.fun
        sel_cels = []
        fcs_cels = []
      }
      else if (mws_cel) {
        mws_moved = true
        fcs_cel = null

        scp_fun = mws_cel.src_fun
        sel_cels = []
        fcs_cels = []
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

  // ---------------------------------------------------------------------------
  // DRAW
  // ---------------------------------------------------------------------------
  {
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
}

// -----------------------------------------------------------------------------
// FILE I/O
// -----------------------------------------------------------------------------

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

  scp_fun = main = new Fun(null, 'main')

  // Transistor
  {
    var f = main.add_fun('+')
    var n_far = f.add_far('+', 1)
    var i_far = f.add_far('i', 1)
    var s_far = f.add_far('s', 1)

    var n_id = n_far.fals[0].id
    var i_id = i_far.fals[0].id
    var s_id = s_far.fals[0].id

    f.native = (pfn, name) => {
      if (name == 'i' || name == 's') {
        var n = pfn.pals[n_id]
        var i = pfn.pars[name].pal
        if (i) {
          n[name] = i
          i.src_pal = n
        }
      }
      else pfn.pals[n_id].native = val => {
        if (val.i) {
          var prev = val.o
          val.o = true
          return !prev
        }

        var pfn = val.scp_pal.src_pfn
        var i = pfn.pals[i_id]
        var s = pfn.pals[s_id]

        i = i && i.get_val(val.scp_vfn)
        s = s && s.get_val(val.scp_vfn)

        var prev = val.o
        val.o = (i && i.i) && !(s && s.i)
        return prev != val.o
      }
    }

    f.locked = true
  }

  // Display
  {
    var f = main.add_fun('=')
    var n_far = f.add_far('=', 25)
    var i_far = f.add_far('i', 25)

    f.draw = (g, cel) => {
      g.fillStyle = '#202040'
      pt.fillRect(g, cel.proj, 15)

      var n_par = cel.src_car.pars[0]
      var i_par = n_par.src_pfn.pars.i
      if (!i_par) return

      var idx = 0
      var i_pals = i_par.pals
      var n_pals = n_par.pals
      var p = pt.zero()

      g.fillStyle = cel.is_active() && '#FF2020' || '#404040'

      for (p.y = -12; p.y <= 12; p.y += 6)
        for (p.x = -12; p.x <= 12; p.x += 6, ++idx) {
          if (i_pals[idx].is_active())
            pt.fillRect(g, pt.sum(cel.proj, p), 3)
        }

    }
    f.native = (pfn, name) => {
      var n_par = pfn.pars['=']

      if (name == 'i') {
        var i_par = pfn.pars.i
        if (!i_par) return

        fu.forEach(i_par.pals, (i_pal, idx) => {
          var n_pal = n_par.pals[idx]
          i_pal.src_pal = n_pal
        })

        return
      }

      fu.forEach(n_par.pals, (n_pal, idx) => n_pal.native = n_val => {
        var i_par = pfn.pars.i
        if (!i_par) return false
        var i_pal = i_par.pals[idx]
        var i_val = i_pal.get_val(n_val.scp_vfn)
        if (!i_val) return false

        var prev = n_val.o
        n_val.o = n_val.i && i_val.i
        return prev != n_val.o
      })
    }

    f.locked = true
  }

  // Read
  {
    var f = main.add_fun('R')
    var n_far = f.add_far('R', 16)

  }

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
