// mazeGame solver
var log = console.log

console.log('game.js mazeGame solver init')

var plrIf = new Object
var cntrpt

module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt
  var fs = apInitA.fs

  function sndMsg(ky,sndr,rcvr,msg) {
    apIO.apSnd({
      ky: ky,
      sndr: sndr,
      rcvr: rcvr,
      msg: msg
    })
  }

  var cellSize = 16

  var wallRad = 1
  var wireRad = 2
  var spaceRad = 6
  var doorRad = 6

  var playerRad = 5
  var keyRad = 4

  var solver_pad_color = 'grey'
  var solver_pad_bkgrnd_color = 'white'
  var solver_pad_radius = 20

  var solver_room_color = 'green'
  var solver_room_bkgrnd_color = 'white'
  var solver_room_radius = 30

  var solver_portal_color = 'purple'
  var solver_portal_radius = 10

  var solver_wire_color = 'green'
  var solver_wire_radius = 10

  var selectedRoom

  var directions = {
    up: {x: 0, y: -1, z: 0, op: 'dn'},
    dn: {x: 0, y:  1, z: 0, op: 'up'},
    lf: {x: -1, y: 0, z: 0, op: 'rt'},
    rt: {x:  1, y: 0, z: 0, op: 'lf'}
  }

  var atribs = {
    wall: true,
    space: true,
    player: true,
    wire: true,
    pad: true,
    square: true,
    door: true,
    key: true,
    portal: true
  }

  function spread_wire(cell, wire) {
    if (
      cell &&
      cell.atribs.wire &&
      (!wire || cell.wire != wire)
    ) {
      cell.wire = wire = wire || {}
      for (var direction_name in directions) {
        spread_wire(cell[direction_name], wire)
      }
    }
  }

  function spread_room(cell, room) {
    if (
      cell &&
      cell.atribs.space && !cell.atribs.door &&
      (!room || cell.room != room)
    ) {
      cell.room = room = room || {}
      for (var direction_name in directions) {
        spread_room(cell[direction_name], room)
      }
    }
  }

  function setup_locs(level) {

    log(level)

  }

  function getCells(data) {
    var levels = plrIf.levels = {}
    plrIf.cells = {}
    plrIf.rooms = {}
    plrIf.wires = {}

    for (var level_index in data) {
      var level_data = data[level_index]

      var level_id = `Level${fu.randKey()}`
      var level = {
        id: level_id,
        cells: {},
        rooms: {},
        wires: {}
      }
      for (var atrib_name in atribs) {
        level[atrib_name] = {}
      }

      levels[level_id] = level

      var cells = level.cells

      for (var cell_id in level_data) {
        var cell_loc_array = cell_id.split(',')

        var cell = cells[cell_id] = plrIf.cells[cell_id] = {
          id: cell_id,
          level: level,
          x: parseFloat(cell_loc_array[0]),
          y: parseFloat(cell_loc_array[1]),
          z: 0,
          atribs: level_data[cell_id]
        }

        if (cell.atribs.portal) {
          cell.atribs.space = true
        }

        for (var atrib_name in cell.atribs) {
          level[atrib_name][cell_id] = cell
        }

        for (var direction_name in directions) {
          var direction = directions[direction_name]
          var neighbor = cells[`${direction.x+cell.x},${direction.y+cell.y}`]
          cell[direction_name] = neighbor
          if (neighbor) {
            neighbor[direction.op] = cell
          }
        }

        spread_room(cell)
        spread_wire(cell)
      }


      // first go over of rooms & wires
      var num_cells = 0
      level.centerPoint = pt.zero()
      for (var cell_id in level.cells) {

        var cell = level.cells[cell_id]
        pt.sume(level.centerPoint, cell)
        ++num_cells

        var room = cell.room
        if (room && !room.id) {
          room.links = {}
          room.cells = {}
          room.id = `Room${fu.randKey()}`
        }

        var wire = cell.wire
        if (wire && !wire.id) {
          wire.id = `Wire${fu.randKey()}`
          wire.cells = {}
        }
      }

      // define level's centerPoint
      pt.scalee(level.centerPoint, cellSize / num_cells)

      // separate pads
      for (var cell_id in level.pad) {
        var cell = level.pad[cell_id]

        var room = cell.parent_room = cell.room
        cell.room = {
          id: `Room${fu.randKey()}`,
          links: {},
          cells: {},
          pad: cell.wire,
          circle: !cell.atribs.square,
          square: cell.atribs.square
        }

        var link_id = `Link${fu.randKey()}`
        room.links[link_id] = {
          id: link_id,
          room: cell.room,
          wires: {}
        }
        cell.room.links[link_id] = {
          id: link_id,
          room: room,
          wires: {}
        }
      }

      // assign rooms & wires
      for (var cell_id in level.cells) {
        var cell = level.cells[cell_id]
        if (cell.room) {
          var room = cell.room
          level.rooms[room.id] = room
          room.cells[cell_id] = cell
        }
        if (cell.wire) {
          var wire = cell.wire
          level.wires[room.id] = wire
          wire.cells[cell_id] = cell
        }
      }

      // define rooms
      for (var room_id in level.rooms) {
        var room = level.rooms[room_id]
        plrIf.rooms[room_id] = room
        room.point = pt.copy(level.centerPoint)
        room.doors = {}
        room.players = {}
        room.portals = {}
        room.square_keys = {}
        room.circle_keys = {}

        for (var cell_id in room.cells) {
          var cell = room.cells[cell_id]

          var cell_atribs = cell.atribs
          if (cell_atribs.player) room.players[cell_id] = cell
          if (cell_atribs.portal) room.portals[cell_id] = cell
          if (cell_atribs.key) room[cell_atribs.square ? 'square_keys' : 'circle_keys'][cell_id] = cell
        }
      }

      // define wires
      for (var wire_id in level.wires) {
        var wire = level.wires[wire_id]
        plrIf.wires[wire_id] = wire
        wire.point = pt.copy(level.centerPoint)
        wire.doors = {}
        wire.portals = {}
        wire.square_pads = {}
        wire.circle_pads = {}

        for (var cell_id in wire.cells) {
          var cell = wire.cells[cell_id]
          var cell_atribs = cell.atribs

          if (cell_atribs.door) wire.doors[cell_id] = cell
          if (cell_atribs.portal) {
            wire.portals[cell_id] = cell
            wire.portal = cell
          }
          if (cell_atribs.pad) wire[cell_atribs.square ? 'square_pads' : 'circle_pads'][cell_id] = cell
        }
      }

      // link doors
      for (var cell_id in level.door) {
        var cell = level.cells[cell_id]

        cell.rooms = {}
        for (var direction_name in directions) {
          var neighbor = cell[direction_name]
          if (neighbor && neighbor.room) {
            var room = neighbor.room
            cell.rooms[room.id] = room
            room.doors[cell_id] = cell
          }
        }
        var room_id_array = Object.keys(cell.rooms)

        for (
          var room_index_a = 0;
          room_index_a < room_id_array.length - 1;
          ++room_index_a
        ) {
          var room_a = cell.rooms[room_id_array[room_index_a]]
          for (
            var room_index_b = room_index_a + 1;
            room_index_b < room_id_array.length;
            ++room_index_b) {
            var room_b = cell.rooms[room_id_array[room_index_b]]

            var link_id = `Link${fu.randKey()}`
            var link_a = room_a.links[link_id] = {
              id: link_id,
              room: room_b,
              wires: {}
            }
            var link_b = room_b.links[link_id] = {
              id: link_id,
              room: room_a,
              wires: {}
            }

            link_a.wires[cell.wire.id] = link_b.wires[cell.wire.id] = cell.wire
          }
        }
      }

      // link portals
      var portal_id_array = Object.keys(level.portal)
      for (
        var portal_index_a = 0;
        portal_index_a < portal_id_array.length - 1;
        ++portal_index_a
      ) {
        var portal_a = level.portal[portal_id_array[portal_index_a]]
        var room_a = portal_a.room
        var wire_a = portal_a.wire

        for (
          var portal_index_b = portal_index_a + 1;
          portal_index_b < portal_id_array.length;
          ++portal_index_b
        ) {
          var portal_b = level.portal[portal_id_array[portal_index_b]]
          var room_b = portal_b.room
          var wire_b = portal_b.wire

          var link_id = `Link${fu.randKey()}`
          var link_a = room_a.links[link_id] = {
            id: link_id,
            room: room_b,
            wires: {}
          }
          var link_b = room_b.links[link_id] = {
            id: link_id,
            room: room_a,
            wires: {}
          }

          link_a.wires[wire_a.id] = link_b.wires[wire_a.id] = wire_a
          link_a.wires[wire_b.id] = link_b.wires[wire_b.id] = wire_b
        }
      }

      // print level atrib counts
      var level_atrib_counts = {
        id: level_id,
        rooms: Object.keys(level.rooms).length
      }
      for (var atrib_name in atribs) {
        if (level[atrib_name])
          level_atrib_counts[atrib_name] = Object.keys(level[atrib_name]).length
      }

      log(
        'players', level_atrib_counts.player,
        'keys', level_atrib_counts.key,
        'rooms', level_atrib_counts.rooms
      )

      setup_locs(level)
    }

  }

  var apIO_init = apInitB => {
    plrIf.usr = apInitB.usrInfo.usr

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

      var data = plrIf.data = JSON.parse(
        fs.readFileSync('mazeGameSolverLevels.txt')
      )
      getCells(data)

    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'
      plrIf.cntrpt = pt.zero()
      sndMsg('rqst update',plrIf.usr.id,'srvr')
    }
  }

  var apIO_tick = usrIO => {

    if (!plrIf.cells) {
      return
    }

    var cntrpt = plrIf.cntrpt

    var g = usrIO.dsply.g
    var mws = usrIO.mws
    var mws_loc = pt.math(
      Math.round,
      pt.factor(
        pt.sub(mws, cntrpt),
        cellSize
      )
    )
    var mws_proj = pt.sum(
      pt.scale(
        mws_loc,
        cellSize
      ),
      cntrpt
    )
    var mws_loc_id = `${mws_loc.x},${mws_loc.y}`
    var mws_cell = plrIf.cells[mws_loc_id]
    var mws_cell_room = mws_cell ? mws_cell.room : null
    var mws_cell_wire = mws_cell ? mws_cell.wire : null
    var mws_cell_door_rooms = mws_cell ? mws_cell.rooms : null

    g.lineWidth = 3

    for (var cell_id in plrIf.cells) {
      var cell = plrIf.cells[cell_id]
      cell.proj = pt.sum(pt.scale(cell, cellSize), cntrpt)
    }

    if (mws_cell_room) {
      for (var cell_id in mws_cell_room.cells) {
        var cell = mws_cell_room.cells[cell_id]

        g.fillStyle = 'white'
        pt.fillRect(g, cell.proj, cellSize / 2)
      }
    }

    if (mws_cell_door_rooms) {
      for (var room_id in mws_cell_door_rooms) {
        var room = mws_cell_door_rooms[room_id]
        for (var cell_id in room.cells) {
          var cell = room.cells[cell_id]

          g.fillStyle = 'white'
          pt.fillRect(g, cell.proj, cellSize / 2)
        }
      }
    }

    if (mws_cell_wire) {
      for (var cell_id in mws_cell_wire.cells) {
        var cell = mws_cell_wire.cells[cell_id]

        g.fillStyle = 'green'
        pt.fillRect(g, cell.proj, cellSize / 2)
      }
    }

    for (var level_id in plrIf.levels) {
      var level = plrIf.levels[level_id]

      g.strokeStyle = 'white'
      pt.drawCircle(g, pt.sum(level.centerPoint, cntrpt), 100)


      for (var cell_id in level.wall) {
        var cell = level.cells[cell_id]

        g.fillStyle = 'white'
        pt.fillRect(g, cell.proj, wallRad)
      }

      for (var cell_id in level.space) {
        var cell = level.cells[cell_id]

        g.fillStyle = 'grey'
        pt.fillRect(g, cell.proj, spaceRad)
      }

      for (var cell_id in level.wire) {
        var cell = level.cells[cell_id]

        g.strokeStyle = 'green'
        if (cell.dn && cell.dn.wire) {
          pt.drawLine(g, cell.proj, cell.dn.proj)
        }
        if (cell.rt && cell.rt.wire) {
          pt.drawLine(g, cell.proj, cell.rt.proj)
        }

        g.fillStyle = cell.atribs.portal ? 'purple' : 'green'
        pt.fillRect(g, cell.proj, wireRad)
      }
      for (var cell_id in level.door) {
        var cell = level.cells[cell_id]

        g.fillStyle = 'green'
        pt.fillRect(g, cell.proj, doorRad)
      }
      for (var cell_id in level.player) {
        var cell = level.cells[cell_id]

        g.strokeStyle = 'black'
        pt.drawCircle(g, cell.proj, playerRad)
      }
      for (var cell_id in level.key) {
        var cell = level.cells[cell_id]

        g.strokeStyle = 'black'
        pt.drawRect(g, cell.proj, keyRad)
      }

      for (var room_id in level.rooms) {
        var room = level.rooms[room_id]
        room.point_proj = pt.sum(room.point, cntrpt)

        if (room.pad) {
          if (room.square) {
            room.solver_radius = solver_pad_radius
            g.fillStyle = solver_pad_bkgrnd_color
            pt.fillRect(g, room.point_proj, solver_pad_radius)
            g.strokeStyle = solver_pad_color
            pt.drawRect(g, room.point_proj, solver_pad_radius)
          } else {
            room.solver_radius = solver_pad_radius
            g.fillStyle = solver_pad_bkgrnd_color
            pt.fillCircle(g, room.point_proj, solver_pad_radius)
            g.strokeStyle = solver_pad_color
            pt.drawCircle(g, room.point_proj, solver_pad_radius)
          }
        } else {
          room.solver_radius = solver_room_radius
          g.fillStyle = solver_room_bkgrnd_color
          pt.fillCircle(g, room.point_proj, solver_room_radius)
          g.strokeStyle = solver_room_color
          pt.drawCircle(g, room.point_proj, solver_room_radius)
        }
      }

      for (var wire_id in level.wires) {
        var wire = level.wires[wire_id]
        wire.point_proj = pt.sum(wire.point, cntrpt)

        for (var cell_id in wire.doors) {
          var door = wire.doors[cell_id]

          g.strokeStyle = 'white' // solver_door_color
          for (var room_id in door.rooms) {
            var room = door.rooms[room_id]

            pt.drawLine(g, room.point_proj, wire.point_proj)
          }
        }

        for (var cell_id in wire.square_pads) {
          var pad = wire.square_pads[cell_id]

          g.strokeStyle = 'white' // solver door_color
          pt.drawLine(g, pad.room.point_proj, pad.parent_room.point_proj)
          g.strokeStyle = pad.wire.portal ? 'purple' : 'green' // solver wire color
          pt.drawLine(g, pad.room.point_proj, wire.point_proj)
        }

        for (var cell_id in wire.circle_pads) {
          var pad = wire.circle_pads[cell_id]

          g.strokeStyle = 'white' // solver door_color
          pt.drawLine(g, pad.room.point_proj, pad.parent_room.point_proj)
          g.strokeStyle = pad.wire.portal ? 'purple' : 'green' // solver wire color
          pt.drawLine(g, pad.room.point_proj, wire.point_proj)
        }

        for (var cell_id in wire.portals) {
          var portal = wire.portals[cell_id]

          g.strokeStyle = 'white' // solver portal color
          pt.drawLine(g, portal.room.point_proj, wire.point_proj)
        }



        if (wire.portal) {
          wire.solver_radius = solver_portal_radius
          g.fillStyle = solver_portal_color
          pt.fillCircle(g, wire.point_proj, solver_portal_radius)
        } else {
          wire.solver_radius = solver_wire_radius
          g.fillStyle = solver_wire_color
          pt.fillCircle(g, wire.point_proj, solver_wire_radius)
        }
      }
    }


    if (mws.shftDn) {
      if (mws.isDn) {
        pt.sume(cntrpt, pt.sub(mws, mws.prv))
      }
      if (mws.hsDn) {
        log(mws_cell)
      }
    } else {
      if (mws.hsDn) {
        for (var room_id in plrIf.rooms) {
          var room = plrIf.rooms[room_id]

          if (pt.dist(room.point_proj, mws) < room.solver_radius) {
            selectedRoom = room
          }
        }
        for (var wire_id in plrIf.wires) {
          var wire = plrIf.wires[wire_id]

          if (pt.dist(wire.point_proj, mws) < wire.solver_radius) {
            selectedRoom = wire
          }
        }
      }
      if (mws.hsUp) {
        selectedRoom = null
      }
      if (mws.isDn && selectedRoom) {
        pt.sume(selectedRoom.point, pt.sub(mws, mws.prv))
      }
    }

    // g.fillStyle = 'white'
    // pt.fillCircle(g, mws, 10)

    g.fillStyle = 'white'
    pt.fillRect(g, mws_proj, spaceRad)
    g.fillStyle = 'black'
    pt.fillCircle(g, mws, spaceRad)

  }

  var apIO_apRcv = rcvMsg => {
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    switch (ky) {
      case 'rqst update':
        sndMsg('data', 'srvr', sndr, plrIf.data)
        break

      case 'data':
        getCells(plrIf.data = msg)
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
