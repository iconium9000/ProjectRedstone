// mazeGame solver
var log = console.log

console.log('game.js mazeGame solver init')

var plrIf = new Object
var cntrpt

var hideSolvers = true

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

  var combos = []
  var combo_array = []
  function depth(diget, values) {
    if (diget > 0) {
      --diget
      for (var i = 0; i < values; ++i) {
        combos[diget] = i
        depth(diget, i + 1)
      }
    } else {
      combo_array.push(Object.assign([], combos))
    }
  }

  depth_test.array = []
  function depth_test(d,v) {
    depth_test.calls = 0
    var array = depth_test.array
    function f(d,v) {
      ++depth_test.calls
      if (v <= 1) {
        return 1
      } else if (d <= 1) {
        return v
      } else {
        var sub = array[d] = array[d] || []
        if (sub[v]) {
          return sub[v]
        } else {
          return sub[v] = f(d, v - 1) + f(d - 1, v)
        }
      }
    }
    return f(d, v)
  }
  // var p = 10
  // for (var v = 1; v < p; ++v) {
  //   for (var d = 1; d < p; ++d) {
  //     combos = []
  //     combo_array = []
  //     depth(d,v)
  //     log(
  //       'digets', d,
  //       'values', v,
  //       'length', combo_array.length,
  //       'f', depth_test(d, v),
  //       'calls', depth_test.calls
  //     )
  //   }
  // }
  // log(depth_test.array)
  // log(depth_test.calls)


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

  function import_levels(data) {
    var levels = plrIf.levels = {}
    plrIf.cells = {}
    plrIf.rooms = {}
    plrIf.wires = {}

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

    for (var level_index in data) {
      var level_data = data[level_index]

      var level_id = `Level${fu.randKey()}`
      var level = {
        index: level_index,
        id: level_id,
        cells: {},
        atribs: {},
        rooms: {},
        wires: {}
      }
      for (var atrib_name in atribs) {
        level.atribs[atrib_name] = {}
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
          level.atribs[atrib_name] = level.atribs[atrib_name] || {}
          level.atribs[atrib_name][cell_id] = cell
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

      setup_rooms(level)
      // setup_loz(level)
    }
  }

  function setup_rooms(level) {

    // set level centerPoint
    {
      var num_cells = 0
      level.centerPoint = pt.zero()
      for (var cell_id in level.cells) {
        var cell = level.cells[cell_id]

        pt.sume(level.centerPoint, cell)
        ++num_cells
      }
      pt.scalee(level.centerPoint, cellSize / num_cells)
    }

    // define wires
    {
      for (var cell_id in level.atribs.wire) {
        var cell = level.cells[cell_id]
        var wire = cell.wire
        if (wire && !wire.id) {
          wire.id = `Wire${fu.randKey()}`
          wire.point = pt.copy(level.centerPoint)
          level.wires[wire.id] = wire
          plrIf.wires[wire.id] = wire
          wire.cells = {}
          wire.pad_rooms = {}
        }
        wire.cells[cell_id] = cell
        for (var atrib_name in cell.atribs) {
          wire[atrib_name] = wire[atrib_name] || {}
          wire[atrib_name][cell_id] = cell
        }
      }
    }

    // define rooms
    {
      for (var cell_id in level.atribs.space) {
        var cell = level.cells[cell_id]
        var room = cell.room
        if (room && !room.id) {
          room.id = `Room${fu.randKey()}`
          room.point = pt.copy(level.centerPoint)
          room.doors = {}
          room.cells = {}
          room.atribs = {}
          room.pad_rooms = {}
          level.rooms[room.id] = room
          plrIf.rooms[room.id] = room
        }
      }
    }

    // separate pad rooms
    {
      for (var cell_id in level.atribs.pad) {
        var cell = level.cells[cell_id]
        var wire = cell.wire
        var room = cell.room

        var pad_room = wire.pad_rooms[room.id]
        if (!pad_room) {
          pad_room = wire.pad_rooms[room.id] = {
            id: `Room${fu.randKey()}`,
            num_square_pads: 0,
            num_circle_pads: 0,
            num_pads: 0,
            square_pads: {},
            circle_pads: {},
            parent_room: room,
            atribs: {},
            wire: wire,
            doors: {},
            cells: {},
            is_pad: true,
            pad_rooms: {},
            point: pt.copy(level.centerPoint)
          }
          room.pad_rooms[pad_room.id] = pad_room
          level.rooms[pad_room.id] = pad_room
          plrIf.rooms[pad_room.id] = pad_room
        }
        cell.room = pad_room
        ++pad_room.num_pads
        if (cell.atribs.square) {
          ++pad_room.num_square_pads
          pad_room.square_pads[cell_id] = cell
        } else {
          ++pad_room.num_circle_pads
          pad_room.circle_pads[cell_id] = cell
        }
      }
    }

    // define rooms
    {
      for (var cell_id in level.atribs.space) {
        var cell = level.cells[cell_id]
        var room = cell.room

        if (room) {
          room.cells[cell_id] = cell

          if (cell.pad) {
            // if (cell.square)
          }

          for (var atrib_name in cell.atribs) {
            var atrib = room.atribs[atrib_name] = room.atribs[atrib_name] || {}
            atrib[cell_id] = cell
          }
        }
      }
    }

    // define doors
    {
      for (var cell_id in level.atribs.door) {
        var cell = level.cells[cell_id]
        var wire = cell.wire
        cell.rooms = {}

        for (var direction_name in directions) {
          var neighbor = cell[direction_name]

          if (neighbor && neighbor.room) {
            var room = neighbor.room

            cell.rooms[room.id] = room
            room.doors[cell_id] = cell
          }
        }
      }
    }

    setup_loz(level)

    var loz = level.loz
    log(
      'rooms', loz.counts.rooms,
      'num_players', loz.counts.players,
      'num_square_keys', loz.counts.square_keys,
      'num_circle_keys', loz.counts.circle_keys
    )
  }

  function setup_loz(level) {

    var loz = level.loz = {
      combo_hash: 0,
      combos: [],
      final_combos: [],
      depth_combos: [],
      rooms: [],
      wires: [],
      doors: [],
      final_door_index: null,
      final_wire_index: null,
      counts: {
        players: 0,
        square_keys: 0,
        circle_keys: 0,
        rooms: fu.count(level.rooms),
        square_key_rooms: 0,
        circle_key_rooms: 0
      }
    }
    var num = loz.counts

    level.next_combo = () => {
      var combo = loz.combos[loz.combo_hash]
      var min_depth = loz.depth_combos.length
      fu.forEach(combo.linked_combos, linked_combo => {
        if (linked_combo.depth < min_depth) {
          min_depth = linked_combo.depth
          loz.combo_hash = linked_combo.hash
        }
      })
      if (combo.depth < min_depth) {
        loz.combo_hash = loz.start_hash
      }
    }

    // setup rooms, wires, & doors
    {
      var wire_index = 0
      for (var wire_id in level.wires) {
        var wire = level.wires[wire_id]

        wire.index = wire_index++
        var shell = wire.shell = {
          index: wire.index,
          num_pads: 0,

          door_indecies: [],
          pad_room_indecies: [],
          portal_room_indecies: []
        }
        loz.wires.push(shell)
      }

      var room_index = 0
      for (var room_id in level.rooms) {
        var room = level.rooms[room_id]

        room.index = room_index
        var room_shell = room.shell = {
          index: room.index,

          num_players: fu.count(room.atribs.player),
          num_square_keys: fu.countif(room.atribs.key, k => !!k.atribs.square),
          num_circle_keys: fu.countif(room.atribs.key, k => !k.atribs.square),

          num_pads: room.num_pads,
          num_square_pads: room.num_square_pads,
          num_circle_pads: room.num_circle_pads,

          door_indecies: [],
          pad_room_indecies: [],
          portal_wire_indecies: [],

          wire_index: -1
        }
        loz.rooms.push(room_shell)

        for (var cell_id in room.atribs.portal) {
          var cell = level.cells[cell_id]

          room_shell.portal_wire_indecies.push(cell.wire.index)
          cell.wire.shell.portal_room_indecies.push(room.index)
        }

        num.players += room_shell.num_players
        num.square_keys += room_shell.num_square_keys
        num.circle_keys += room_shell.num_circle_keys



        if (room.wire) {
          room_shell.wire_index = room.wire.index

          room.wire.shell.num_pads += room_shell.num_pads
          room.wire.shell.pad_room_indecies.push(room.index)

          num.square_key_rooms += !!room_shell.num_square_pads
          num.circle_key_rooms += !!room_shell.num_circle_pads
        } else {
          ++num.square_key_rooms
          ++num.circle_key_rooms
        }

        ++room_index
      }

      for (var room_id in level.rooms) {
        var room = level.rooms[room_id]
        var room_shell = room.shell

        if (room.is_pad) {
          var parent_room_index = room.parent_room.index
          var parent_room_shell = room.parent_room.shell

          room_shell.pad_room_indecies.push(parent_room_index)
          parent_room_shell.pad_room_indecies.push(room.index)

        } else {
          room_shell.num_pads = num.players + num.square_keys + num.circle_keys
          room_shell.num_square_pads = num.players + num.square_keys
          room_shell.num_circle_pads = num.players + num.circle_keys
        }
      }

      var door_index = 0
      for (var cell_id in level.atribs.door) {
        var cell = level.cells[cell_id]

        cell.door_index = door_index
        var shell = cell.shell = {
          index: cell.door_index,

          wire_index: cell.wire.index,
          room_indecies: []
        }
        loz.doors.push(shell)

        for (var room_id in cell.rooms) {
          var room = cell.rooms[room_id]
          shell.room_indecies.push(room.index)
          room.shell.door_indecies.push(cell.door_index)
        }

        if (!shell.room_indecies.length) {
          loz.final_door_index = door_index
          loz.final_wire_index = shell.wire_index
        }

        ++door_index
      }
    }
  }

  function solve_level(level) {
    var loz = level.loz
    var num = loz.counts

    // set combos
    {
      var combos = loz.combos

      var temp_combo = []

      for (var room_index = 0; room_index < num.rooms; ++room_index) {
        temp_combo[`pr${room_index}`] = 0
        temp_combo[`sr${room_index}`] = 0
        temp_combo[`cr${room_index}`] = 0
      }

      if (num.square_keys > 0) {
        get_square_key_combos(num.square_keys, num.rooms)
      } else if (num.circle_keys > 0) {
        get_circle_key_combos(num.circle_keys, num.rooms)
      } else if (num.players > 0) {
        get_player_combos(num.players, num.rooms)
      }

      function get_hash_from_room_counts(
        room_player_count,
        room_square_key_count,
        room_circle_key_count
      ) {

        var hash = 0
        var base = 1
        for (var room_index in room_player_count) {
          fu.loop(
            room_player_count[room_index],
            player_index => {
              hash += base * room_index
              base *= num.rooms
            }
          )
        }
        for (var room_index in room_square_key_count) {
          fu.loop(
            room_square_key_count[room_index],
            square_key_index => {
              hash += base * room_index
              base *= num.rooms
            }
          )
        }
        for (var room_index in room_circle_key_count) {
          fu.loop(
            room_circle_key_count[room_index],
            circle_key_index => {
              hash += base * room_index
              base *= num.rooms
            }
          )
        }

        return hash
      }

      function push_combo() {
        var combo = {
          player_room_indecies: [],
          square_key_room_indecies: [],
          circle_key_room_indecies: [],

          room_player_count: {},
          room_square_key_count: {},
          room_circle_key_count: {},

          room_full: {},
          wire_active: {},
          num_active_portals: 0,

          linked_combos: {},

          depth: null
        }
        // tally combos
        {

          fu.loop(num.players, player_index => {
            combo.player_room_indecies[player_index]
              = temp_combo[`p${player_index}`]
          })
          fu.loop(num.square_keys, square_key_index => {
            combo.square_key_room_indecies[square_key_index]
              = temp_combo[`s${square_key_index}`]
          })
          fu.loop(num.circle_keys, circle_key_index => {
            combo.circle_key_room_indecies[circle_key_index]
              = temp_combo[`c${circle_key_index}`]
          })
          fu.loop(num.rooms, room_index => {
            combo.room_player_count[room_index]
              = temp_combo[`pr${room_index}`]
            combo.room_square_key_count[room_index]
              = temp_combo[`sr${room_index}`]
            combo.room_circle_key_count[room_index]
              = temp_combo[`cr${room_index}`]
          })

          combo.hash = get_hash_from_room_counts(
            combo.room_player_count,
            combo.room_square_key_count,
            combo.room_circle_key_count
          )
        }

        combos[combo.hash] = combo

        // determine open wires
        {
          for (var room_index in loz.rooms) {
            var room = loz.rooms[room_index]
            combo.room_full[room_index] = (
              combo.room_player_count[room_index] +
              combo.room_square_key_count[room_index] +
              combo.room_circle_key_count[room_index] ==
              room.num_pads
            )
          }

          for (var wire_index in loz.wires) {
            var wire = loz.wires[wire_index]
            var wire_active = true

            for (var pad_room_indecies_index in wire.pad_room_indecies) {
              var room_index = wire.pad_room_indecies[pad_room_indecies_index]
              wire_active = combo.room_full[room_index] && wire_active
            }

            combo.wire_active[wire_index] = wire_active
            combo.num_active_portals += wire_active
              && !!wire.portal_room_indecies.length
          }

          if (combo.num_active_portals > 2) {
            for (var wire_index in loz.wires) {
              if (wire.portal_room_indecies.length) {
                combo.wire_active[wire_index] = false
              }
            }
            combo.num_active_portals = 0
          }

          if (combo.wire_active[loz.final_wire_index]) {
            loz.final_combos.push(combo)
          }
        }
      }

      function get_square_key_combos(inverse_square_key_index, num_rooms) {
        if (inverse_square_key_index > 0) {
          var square_key_index
            = `s${num.square_keys - inverse_square_key_index}`
          for (var room_index = 0; room_index < num_rooms; ++room_index) {
            var sr_room_index = `sr${room_index}`
            temp_combo[square_key_index] = room_index
            if (
              temp_combo[sr_room_index] <
              loz.rooms[room_index].num_square_pads
            ) {
              ++temp_combo[sr_room_index]
              get_square_key_combos(
                inverse_square_key_index - 1, room_index + 1
              )
              --temp_combo[sr_room_index]
            }
          }
        } else if (num.circle_keys > 0) {
          get_circle_key_combos(num.circle_keys, num.rooms)
        } else if (num.players > 0) {
          get_player_combos(num.players, num.rooms)
        } else {
          push_combo()
        }
      }
      function get_circle_key_combos(inverse_circle_key_index, num_rooms) {
        if (inverse_circle_key_index > 0) {
          var circle_key_index
            = `c${num.circle_keys - inverse_circle_key_index}`
          for (var room_index = 0; room_index < num_rooms; ++room_index) {
            var cr_room_index = `cr${room_index}`
            temp_combo[circle_key_index] = room_index
            if (
              temp_combo[cr_room_index] <
              loz.rooms[room_index].num_circle_pads
            ) {
              ++temp_combo[cr_room_index]
              get_circle_key_combos(
                inverse_circle_key_index - 1, room_index + 1)
              --temp_combo[cr_room_index]
            }
          }
        } else if (num.players > 0) {
          get_player_combos(num.players, num.rooms)
        } else {
          push_combo()
        }
      }
      function get_player_combos(inverse_player_index, num_rooms) {
        if (inverse_player_index > 0) {
          var player_index = `p${num.players - inverse_player_index}`
          for (var room_index = 0; room_index < num_rooms; ++room_index) {
            var pr_room_index = `pr${room_index}`
            temp_combo[player_index] = room_index
            if (
              temp_combo[pr_room_index] +
              temp_combo[`sr${room_index}`] +
              temp_combo[`cr${room_index}`] <
              loz.rooms[room_index].num_pads
            ) {
              ++temp_combo[pr_room_index]
              get_player_combos(inverse_player_index - 1, room_index + 1)
              --temp_combo[pr_room_index]
            }
          }
        } else {
          push_combo()
        }
      }
    }

    // setup lined_combos
    {
      function move_to_indecies(room_counts, room_from_index, room_to_index) {
        room_counts = Object.assign({}, room_counts)
        --room_counts[room_from_index]
        ++room_counts[room_to_index]
        return room_counts
      }

      function move_to(combo, room_from_index, room_to_index) {
        if (room_from_index == room_to_index) {
          return
        }
        if (combo.room_player_count[room_from_index]) {
          var hash = get_hash_from_room_counts(
            move_to_indecies(
              combo.room_player_count, room_from_index, room_to_index
            ),
            combo.room_square_key_count,
            combo.room_circle_key_count
          )
          if (loz.combos[hash]) {
            combo.linked_combos[hash] = loz.combos[hash]
          }
        }

        if (combo.room_square_key_count[room_from_index]) {
          var hash = get_hash_from_room_counts(
            combo.room_player_count,
            move_to_indecies(
              combo.room_square_key_count, room_from_index, room_to_index
            ),
            combo.room_circle_key_count
          )
          if (loz.combos[hash]) {
            combo.linked_combos[hash] = loz.combos[hash]
          }
        }
        if (combo.room_circle_key_count[room_from_index]) {
          var hash = get_hash_from_room_counts(
            combo.room_player_count,
            combo.room_square_key_count,
            move_to_indecies(
              combo.room_circle_key_count, room_from_index, room_to_index
            )
          )
          if (loz.combos[hash]) {
            combo.linked_combos[hash] = loz.combos[hash]
          }
        }

        if (combo.room_square_key_count[room_to_index]) {
          var hash = get_hash_from_room_counts(
            combo.room_player_count,
            move_to_indecies(
              combo.room_square_key_count, room_to_index, room_from_index
            ),
            combo.room_circle_key_count
          )
          if (loz.combos[hash]) {
            combo.linked_combos[hash] = loz.combos[hash]
          }
        }
        if (combo.room_circle_key_count[room_to_index]) {
          var hash = get_hash_from_room_counts(
            combo.room_player_count,
            combo.room_square_key_count,
            move_to_indecies(
              combo.room_circle_key_count, room_to_index, room_from_index
            )
          )
          if (loz.combos[hash]) {
            combo.linked_combos[hash] = loz.combos[hash]
          }
        }
      }

      for (var combo_hash in loz.combos) {
        var combo = loz.combos[combo_hash]
        if (!combo) {
          continue
        }

        // calculate linked combos
        {
          var used_rooms = {}
          fu.loop(num.players, player_index => {
            var room_index = combo.player_room_indecies[player_index]
            var room = loz.rooms[room_index]

            if (used_rooms[room_index]) {
              return
            }
            used_rooms[room_index] = true


            fu.forEach(room.door_indecies, door_index => {
              var door = loz.doors[door_index]

              if (!combo.wire_active[door.wire_index]) {
                return
              }
              fu.forEach(door.room_indecies, door_room_index => {
                move_to(combo, room_index, door_room_index)
              })
            })

            fu.forEach(
              room.pad_room_indecies,
              pad_room_index => move_to(combo, room_index, pad_room_index)
            )

            fu.forEach(room.portal_wire_indecies, portal_wire_index => {

              if (!combo.wire_active[portal_wire_index]) {
                return
              }

              for (var wire_index in loz.wires) {

                if (!combo.wire_active[wire_index]) {
                  continue
                }

                fu.forEach(
                  loz.wires[wire_index].portal_room_indecies,
                  portal_room_index => move_to(
                    combo, room_index, portal_room_index)
                )
              }

            })

          })

        }
      }
    }

    // assign_combo_depth
    {
      function assign_combo_depth(depth, combo) {
        if (combo.depth == null || depth < combo.depth) {
          combo.depth = depth
          fu.forEach(combo.linked_combos,
            linked_combo => assign_combo_depth(depth + 1, linked_combo)
          )
        }
      }

      fu.forEach(loz.final_combos, combo => assign_combo_depth(0, combo))

      fu.forEach(loz.combos, combo => loz.depth_combos[combo.depth] = [])
      fu.forEach(loz.combos, combo => loz.depth_combos[combo.depth].push(combo))
    }

    // get level start and maximum hash
    {
      var room_player_count = []
      var room_square_key_count = []
      var room_circle_key_count = []

      fu.forEach(loz.rooms, room => {
        room_player_count.push(room.num_players)
        room_square_key_count.push(room.num_square_keys)
        room_circle_key_count.push(room.num_circle_keys)
      })

      loz.start_hash = loz.combo_hash = get_hash_from_room_counts(
        room_player_count,
        room_square_key_count,
        room_circle_key_count
      )

      // log(
      //   room_player_count,
      //   room_square_key_count,
      //   room_circle_key_count
      // )

      loz.max_hash = loz.depth_combos[loz.depth_combos.length - 1][0].hash
    }

    plrIf.solved_level = level
    // log(loz)
    // log(
    //   'base',
    //   Math.pow(num.rooms, num.players) *
    //   Math.pow(num.rooms, num.square_keys) *
    //   Math.pow(num.rooms, num.circle_keys),
    //   'depth_test',
    //   depth_test(num.players, num.rooms) *
    //   depth_test(num.square_keys, num.rooms) *
    //   depth_test(num.circle_keys, num.rooms),
    //   'combos', Object.keys(loz.combos).length
    // )

    level.loz.solved = true
  }

  function stringify_loz(level) {
    var loz = level.loz
    var num = loz.counts

    var string = ''
    var push = a => string += `${a} `

    // log(loz)

    push(num.players)
    push(num.square_keys)
    push(num.circle_keys)
    push(loz.rooms.length)
    push(loz.wires.length)
    push(loz.doors.length)
    push(num.square_key_rooms)
    push(num.circle_key_rooms)
    push(loz.final_door_index)
    push(loz.final_wire_index)

    fu.forEach(loz.rooms, room => {
      push(room.num_players)
      push(room.num_square_keys)
      push(room.num_circle_keys)
      push(room.num_pads)
      push(room.num_square_pads)
      push(room.num_circle_pads)
      push(room.door_indecies.length)
      push(room.pad_room_indecies.length)
      push(room.portal_wire_indecies.length)
      push(room.wire_index)

      fu.forEach(room.door_indecies, door_index => push(door_index))
      fu.forEach(room.pad_room_indecies, pad_room_index => push(pad_room_index))
      fu.forEach(room.portal_wire_indecies, portal_wire_index => push(portal_wire_index))
    })

    fu.forEach(loz.wires, wire => {
      push(wire.num_pads)
      push(wire.door_indecies.length)
      push(wire.pad_room_indecies.length)
      push(wire.portal_room_indecies.length)

      fu.forEach(wire.door_indecies, door_index => push(door_index))
      fu.forEach(wire.pad_room_indecies, pad_room_index => push(pad_room_index))
      fu.forEach(wire.portal_room_indecies, portal_room_index => push(portal_room_index))
    })

    fu.forEach(loz.doors, door => {
      push(door.wire_index)
      push(door.room_indecies.length)

      fu.forEach(door.room_indecies, room_index => push(room_index))
    })

    return string
  }

  var apIO_init = apInitB => {
    plrIf.usr = apInitB.usrInfo.usr

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

      var data = plrIf.data = JSON.parse(
        fs.readFileSync('mazeGameSolverLevels.txt')
      )
      import_levels(data)

      fu.forEach(plrIf.levels, level => {
        setup_loz(level)
        fs.writeFile(
          `maze_game_levels/level${level.index}.txt`,
          stringify_loz(level)
        )
      })

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


      for (var cell_id in level.atribs.wall) {
        var cell = level.cells[cell_id]

        g.fillStyle = 'white'
        pt.fillRect(g, cell.proj, wallRad)
      }

      for (var cell_id in level.atribs.space) {
        var cell = level.cells[cell_id]

        g.fillStyle = 'grey'
        pt.fillRect(g, cell.proj, spaceRad)
      }

      for (var cell_id in level.atribs.wire) {
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
      for (var cell_id in level.atribs.door) {
        var cell = level.cells[cell_id]

        g.fillStyle = 'green'
        pt.fillRect(g, cell.proj, doorRad)
      }
      for (var cell_id in level.atribs.player) {
        var cell = level.cells[cell_id]

        g.strokeStyle = 'black'
        pt.drawCircle(g, cell.proj, playerRad)
      }
      for (var cell_id in level.atribs.key) {
        var cell = level.cells[cell_id]

        g.strokeStyle = 'black'
        pt.drawRect(g, cell.proj, keyRad)
      }

      for (var room_id in plrIf.rooms) {
        var room = plrIf.rooms[room_id]
        room.point_proj = pt.sum(room.point, cntrpt)
      }

      for (var wire_id in plrIf.wires) {
        var wire = plrIf.wires[wire_id]
        wire.point_proj = pt.sum(wire.point, cntrpt)
      }

      if (level.loz && level.loz.solved) {

        g.textAlign = 'center'
        g.font = '14pt Bold Arial'

        var combo = level.loz.combos[level.loz.combo_hash]

        for (var wire_id in level.wires) {
          var wire = level.wires[wire_id]
          wire.point_proj = pt.sum(wire.point, cntrpt)

          for (var cell_id in wire.door) {
            var door = wire.door[cell_id]

            g.strokeStyle = 'white' // solver_door_color
            for (var room_id in door.rooms) {
              var room = door.rooms[room_id]

              pt.drawLine(g, room.point_proj, wire.point_proj)
            }
          }

          for (var room_id in wire.pad_rooms) {
            var pad = wire.pad_rooms[room_id]

            g.strokeStyle = 'white' // solver door_color
            pt.drawLine(g, pad.point_proj, pad.parent_room.point_proj)
            g.strokeStyle = combo.room_full[pad.index] ? 'green' : 'red' // solver wire color
            pt.drawLine(g, pad.point_proj, wire.point_proj)
          }

          for (var cell_id in wire.portal) {
            var portal = wire.portal[cell_id]

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

        for (var room_id in level.rooms) {
          var room = level.rooms[room_id]

          if (room.is_pad) {
            room.solver_radius = solver_pad_radius
            g.fillStyle = solver_pad_bkgrnd_color
            pt.fillCircle(g, room.point_proj, solver_pad_radius)
            g.strokeStyle = solver_pad_color
            pt.drawCircle(g, room.point_proj, solver_pad_radius)
          } else {
            room.solver_radius = solver_room_radius
            g.fillStyle = solver_room_bkgrnd_color
            pt.fillCircle(g, room.point_proj, solver_room_radius)
            g.strokeStyle = solver_room_color
            pt.drawCircle(g, room.point_proj, solver_room_radius)
          }

          // record room string
          {
            var string = ''

            for (
              var player_index = 0;
              player_index < combo.room_player_count[room.index];
              ++player_index
            ) {
              string += '+'
            }
            for (
              var square_key_index = 0;
              square_key_index < combo.room_square_key_count[room.index];
              ++square_key_index
            ) {
              string += '□'
            }
            for (
              var circle_key_index = 0;
              circle_key_index < combo.room_circle_key_count[room.index];
              ++circle_key_index
            ) {
              string += '○'
            }

            g.fillStyle = 'black' // char_color
            g.fillText(string, room.point_proj.x, room.point_proj.y)
          }
        }
      }
    }
    if (plrIf.solved_level && usrIO.kys.hsDn[' ']) {
      plrIf.solved_level.next_combo()
    }


    if (!mws.shftDn) {
      if (mws.isDn) {
        pt.sume(cntrpt, pt.sub(mws, mws.prv))
      }
      if (mws.hsDn) {
        if (mws_cell) {
          setup_loz(mws_cell.level)
          // solve_level(mws_cell.level)
          log(mws_cell)
          log(mws_cell.level.index)
        }
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
        import_levels(plrIf.data = msg)
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
