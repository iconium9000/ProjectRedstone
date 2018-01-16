// clang++ -std=c++11 -stdlib=libc++ -Weverything mazeGameSolver.cpp
// ./a.out maze_game_levels/level17.txt
// JSON.stringify(level.locs, null, 2)

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <cmath>
#include <string>
using namespace std;

#define null NULL
#define factor(V) (V ? V : 1)
#define loop(N,I,F) for (int I = 0; I < N; ++I) F;
#define start_loop(S,E,I,F) for (int I = S, _n = E; I < _n; ++I) F;
#define copy_array(N, A, B) {auto _a=A; auto _b=B; loop(N, _i, _a[_i]=_b[_i])}

#define l(A,B) A << ' ' << B
#define cap cout << endl;
#define flog(A) cout << A << endl;
#define log(A,B) flog(l(A,B))
#define plog(A) cout << A << ' ';
#define alog(N,A,L) plog(N) loop(L,i, plog(A[i])) cap

template <class T>
T* new_array(int size, T fill) {
  T * array = new T[size];
  loop(size, index, array[index] = fill)
  return array;
}

struct Room {
  int num_players;
  int num_square_keys;
  int num_circle_keys;

  int num_pads;
  int num_square_pads;
  int num_circle_pads;

  int num_doors;
  int num_pad_rooms;
  int num_portal_wires;

  int wire_index;

  int * door_indecies;
  int * pad_room_indecies;
  int * portal_wire_indecies;
};
struct Wire {
  int num_pads;
  int num_doors;
  int num_pad_rooms;
  int num_portal_rooms;

  int * door_indecies;
  int * pad_room_indecies;
  int * portal_room_indecies;
};
struct Door {
  int wire_index;
  int num_rooms;

  int* room_indecies;
};
struct Loc {
  int* piece_room_indecies;
  int* player_room_indecies;
  int* square_key_room_indecies;
  int* circle_key_room_indecies;

  int player_room_indecies_start_index;
  int square_key_room_indecies_start_index;
  int circle_key_room_indecies_start_index;

  int* room_piece_count;
  int* room_player_count;
  int* room_square_key_count;
  int* room_circle_key_count;

  int* wire_active_room_count;
  int num_active_portals;
  int portal_room_index_a;
  int portal_room_index_b;
};
struct Combo {
  int depth = -1;
  int count;
  int* piece_room_indecies;
  vector<Combo*> linked_combos;
};
struct Combo_link {
  Combo_link ** combo_links;
  Combo * combo;

  Combo_link(Combo * c) : combo_links(null), combo(c) {}
  Combo_link(int l) : combo_links(new Combo_link*[l]),
    combo(null) {
      loop(l,i,combo_links[i]=null)
    }
};
struct Loz {

  int num_pieces;
  int num_players;
  int num_square_keys;
  int num_circle_keys;

  int num_rooms;
  int num_wires;
  int num_doors;
  int num_square_key_rooms;
  int num_circle_key_rooms;

  int final_door_index;
  int final_wire_index;
  vector<Combo*> final_combos;

  Loc loc;
  Combo ** combo_hash_table = {};

  int player_hash_size;
  int square_key_hash_size;
  int circle_key_hash_size;

  Combo_link * combo_link_head;

  Room * rooms;
  Wire * wires;
  Door * doors;

  int count = 0;

  int * square_key_room_indecies;
  int * circle_key_room_indecies;
};

void push_combo(Loz &);
void get_square_key_combos(Loz&,Combo_link**,int=0,int=0);
void get_circle_key_combos(Loz&,Combo_link**,int=0,int=0);
void get_player_combos(Loz&,Combo_link**,int=0,int=0);

void print_combo(Loz& loz, Combo& combo) {
  loop(loz.num_players, player_room_indecies_index,
    plog('p' << combo.piece_room_indecies[player_room_indecies_index
      + loz.num_square_keys + loz.num_circle_keys]))
  loop(loz.num_square_keys, square_key_room_indecies_index,
    plog('s' << combo.piece_room_indecies[square_key_room_indecies_index]))
  loop(loz.num_circle_keys, circle_key_room_indecies_index,
    plog('c' << combo.piece_room_indecies[circle_key_room_indecies_index
      + loz.num_square_keys]))
  flog(combo.linked_combos.size())
}

bool is_wire_active(Loz& loz, Wire& wire) {
  if (wire.num_portal_rooms > 0 && loz.loc.num_active_portals > 2) {
    return false;
  }

  loop(wire.num_pad_rooms, pad_room_indecies_index, {
    int room_index = wire.pad_room_indecies[pad_room_indecies_index];
    if (
      loz.loc.room_player_count[room_index]
      + loz.loc.room_square_key_count[room_index]
      + loz.loc.room_circle_key_count[room_index]
      != loz.rooms[room_index].num_pads
    ) {
      return false;
    }
  })

  return true;
}

void link_to(Loz& loz, Combo& combo, int* room_count,
  int room_from_index, int room_to_index
) {
  if (room_count[room_from_index] > 0) {
    --room_count[room_from_index];
    ++room_count[room_to_index];

    Combo_link* combo_link = loz.combo_link_head;
    int room_index_base = 0;
    loop(3, piece_type_index, {
      loop(loz.num_rooms, room_index, {
        loop(loz.loc.room_piece_count[room_index_base + room_index],
          piece_index, {
            plog(room_index)
          }
        )
      })
      room_index_base += loz.num_rooms;
    })
    cap

    // if (combo_link != null) {
    //   combo.linked_combos.push_back(combo_link->combo);
    // }

    ++room_count[room_from_index];
    --room_count[room_to_index];
  }
}
void move_to(Loz& loz, Combo& combo, int room_from_index, int room_to_index) {
  if (room_from_index != room_to_index) {
    link_to(loz, combo, loz.loc.room_player_count, room_from_index, room_to_index);
    link_to(loz, combo, loz.loc.room_square_key_count, room_from_index, room_to_index);
    link_to(loz, combo, loz.loc.room_square_key_count, room_to_index, room_from_index);
    link_to(loz, combo, loz.loc.room_circle_key_count, room_from_index, room_to_index);
    link_to(loz, combo, loz.loc.room_circle_key_count, room_to_index, room_from_index);
  }
}

void link_combo(Loz & loz, Combo_link * combo_link, int depth = 0) {
  if (combo_link == null) {
    return;
  } else if (combo_link->combo_links != null) {
    Loc& loc = loz.loc;
    int* room_piece_count;
    if (depth >= loc.player_room_indecies_start_index) {
      room_piece_count = loc.room_player_count;
    } else if (depth >= loc.circle_key_room_indecies_start_index) {
      room_piece_count = loc.room_circle_key_count;
    } else {
      room_piece_count = loc.room_square_key_count;
    }
    loop(loz.num_rooms, room_index, {
      ++room_piece_count[room_index];

      Room& room = loz.rooms[room_index];
      bool room_is_active = room.wire_index >= 0
        && loc.room_player_count[room_index]
        + loc.room_square_key_count[room_index]
        + loc.room_circle_key_count[room_index]
        == room.num_pads;
      bool add_active_portal = false;

      if (room_is_active) {
        int count = ++loc.wire_active_room_count[room.wire_index];

        Wire& wire = loz.wires[room.wire_index];
        add_active_portal = count == wire.num_pads && wire.num_portal_rooms > 0;
        
        if (add_active_portal) {
          int num_active_portals = ++loc.num_active_portals;
          if (num_active_portals == 1) {
            loc.portal_room_index_a = room_index;
          } else if (num_active_portals == 2) {
            loc.portal_room_index_b = room_index;
          }
        }
      }

      link_combo(loz, combo_link->combo_links[room_index], depth + 1);

      if (room_is_active) {
        --loc.wire_active_room_count[room.wire_index];
        if (add_active_portal) {
          --loc.num_active_portals;
        }
      }
      --room_piece_count[room_index];
    })
  } else if (combo_link->combo != null) {
    cap
    Combo& combo = *combo_link->combo;
    Loc& loc = loz.loc;
    int* player_room_indecies = combo.piece_room_indecies +
      loc.player_room_indecies_start_index;

    loop(loz.num_pieces, piece_index,
      plog(combo.piece_room_indecies[piece_index]))
    flog(':')

    int prev_room = -1;
    loop(loz.num_players, player_index, {
      int room_index = player_room_indecies[player_index];

      if (room_index != prev_room) {
        prev_room = room_index;

        Room& room = loz.rooms[room_index];

        // link to pad_rooms
        {
          loop(room.num_pad_rooms, pad_room_indecies_index,
            move_to(loz, combo, room_index,
              room.pad_room_indecies[pad_room_indecies_index]))
        }

        // move through doors
        {
          loop(room.num_doors, door_indecies_index, {
            Door& door = loz.doors[room.door_indecies[door_indecies_index]];
            Wire& wire = loz.wires[door.wire_index];

            if (loc.wire_active_room_count[door.wire_index] == wire.num_pad_rooms
              && (!wire.num_portal_rooms || loc.num_active_portals == 2)
            ) {
              loop(door.num_rooms, room_indecies_index,
                move_to(loz, combo, room_index,
                  door.room_indecies[room_indecies_index]))
            }
          })
        }

        // move through portals
        {
          if (loc.num_active_portals == 2) {
            if (loc.portal_room_index_a == room_index) {
              move_to(loz, combo, room_index, loc.portal_room_index_b);
            } else if (loc.portal_room_index_b == room_index) {
              move_to(loz, combo, room_index, loc.portal_room_index_a);
            }
          }
        }

      }

    })

  }

}

void push_combo(Loz & loz, Combo_link ** combo_link) {
  // setup variables
  Combo* combo_ptr = new Combo;
  (*combo_link) = new Combo_link(combo_ptr);
  Combo& combo = *combo_ptr;
  copy_array(loz.num_pieces,
    combo.piece_room_indecies = new int[loz.num_pieces],
    loz.loc.piece_room_indecies)
  // print_combo(loz, combo);

  combo.count = loz.count++;
}

void get_square_key_combos(Loz& loz, Combo_link** combo_link,
  int square_key_index, int room_index
) {
  if (square_key_index < loz.num_square_keys) {
    Combo_link* loop_combo_link = (*combo_link) = new Combo_link(loz.num_rooms);

    start_loop(room_index, loz.num_rooms, loop_room_index, {
      if (
        loz.loc.room_square_key_count[loop_room_index]
        < loz.rooms[loop_room_index].num_square_pads
      ) {
        loz.loc.square_key_room_indecies[square_key_index]
          = loop_room_index;

        ++loz.loc.room_square_key_count[loop_room_index];
        get_square_key_combos(loz,
          loop_combo_link->combo_links + loop_room_index,
          square_key_index + 1, loop_room_index);
        --loz.loc.room_square_key_count[loop_room_index];
      }
    })

  } else if (loz.num_circle_keys > 0) {
    get_circle_key_combos(loz, combo_link);
  } else if (loz.num_players > 0) {
    get_player_combos(loz, combo_link);
  } else {
    push_combo(loz, combo_link);
  }
}
void get_circle_key_combos(Loz& loz, Combo_link** combo_link,
  int circle_key_index, int room_index
) {
  if (circle_key_index < loz.num_circle_keys) {

    Combo_link* loop_combo_link = (*combo_link) = new Combo_link(loz.num_rooms);

    start_loop(room_index, loz.num_rooms, loop_room_index, {
      if (
        loz.loc.room_circle_key_count[loop_room_index]
        < loz.rooms[loop_room_index].num_circle_pads
      ) {
        loz.loc.circle_key_room_indecies[circle_key_index]
          = loop_room_index;

        ++loz.loc.room_circle_key_count[loop_room_index];
        get_circle_key_combos(loz,
          loop_combo_link->combo_links + loop_room_index,
          circle_key_index + 1, loop_room_index);
        --loz.loc.room_circle_key_count[loop_room_index];
      }
    })

  } else if (loz.num_players > 0) {
    get_player_combos(loz, combo_link);
  } else {
    push_combo(loz, combo_link);
  }
}
void get_player_combos(Loz& loz, Combo_link** combo_link,
  int player_index, int room_index
 ) {
  if (player_index < loz.num_players) {

    Combo_link* loop_combo_link = (*combo_link) = new Combo_link(loz.num_rooms);

    start_loop(room_index, loz.num_rooms, loop_room_index, {
      if (
        loz.loc.room_player_count[loop_room_index]
        + loz.loc.room_square_key_count[loop_room_index]
        + loz.loc.room_circle_key_count[loop_room_index]
        < loz.rooms[loop_room_index].num_pads
      ) {
        loz.loc.player_room_indecies[player_index]
          = loop_room_index;

        ++loz.loc.room_player_count[loop_room_index];
        get_player_combos(loz,
          loop_combo_link->combo_links + loop_room_index,
          player_index + 1, loop_room_index);
        --loz.loc.room_player_count[loop_room_index];
      }
    })

  } else {
    push_combo(loz, combo_link);
  }
}

int print_links(Loz& loz, Combo_link* combo_link, string depth = "") {
  if (combo_link == null) {
    return 0;
  } else if (combo_link->combo_links != null) {
    int sum = 0;
    loop(loz.num_rooms, room_index, {
      int count = print_links(loz,
        combo_link->combo_links[room_index], depth + "\t");
      if (count > 0) {
        log(l(depth, room_index), l(":",count))
      }
      sum += count;
    })
    return sum;
  } else {
    Combo& combo = *combo_link->combo;

    plog(depth)
    print_combo(loz, combo);

    for (Combo* loop_combo : combo.linked_combos) {
      log(depth, "linked_combo")
    }
    return 1;
  }
}

int main(int argc, char ** argv) {

  Loz loz;
  // get_loz
  {
    ifstream fin;
    fin.open(argv[1]);

    fin >> loz.num_players;
    fin >> loz.num_square_keys;
    fin >> loz.num_circle_keys;

    fin >> loz.num_rooms;
    fin >> loz.num_wires;
    fin >> loz.num_doors;
    fin >> loz.num_square_key_rooms;
    fin >> loz.num_circle_key_rooms;

    fin >> loz.final_door_index;
    fin >> loz.final_wire_index;

    loz.rooms = new Room[loz.num_rooms];
    loz.wires = new Wire[loz.num_wires];
    loz.doors = new Door[loz.num_doors];

    loz.square_key_room_indecies = new int[loz.num_square_key_rooms];
    loz.circle_key_room_indecies = new int[loz.num_circle_key_rooms];

    // room loop
    {
      int square_key_room_indecies_index = 0;
      int circle_key_room_indecies_index = 0;

      loop(loz.num_rooms, room_index, {
        Room & room = loz.rooms[room_index];

        fin >> room.num_players;
        fin >> room.num_square_keys;
        fin >> room.num_circle_keys;

        fin >> room.num_pads;
        fin >> room.num_square_pads;
        fin >> room.num_circle_pads;

        fin >> room.num_doors;
        fin >> room.num_pad_rooms;
        fin >> room.num_portal_wires;

        fin >> room.wire_index;

        room.door_indecies = new int[room.num_doors];
        room.pad_room_indecies = new int[room.num_pad_rooms];
        room.portal_wire_indecies = new int[room.num_portal_wires];

        if (room.num_square_pads > 0) {
          loz.square_key_room_indecies[square_key_room_indecies_index++]
            = room_index;
        }
        if (room.num_circle_pads > 0) {
          loz.circle_key_room_indecies[circle_key_room_indecies_index++]
            = room_index;
        }

        loop(
          room.num_doors, door_index,
          fin >> room.door_indecies[door_index]
        )
        loop(
          room.num_pad_rooms, pad_room_index,
          fin >> room.pad_room_indecies[pad_room_index]
        )
        loop(
          room.num_portal_wires, portal_wire_index,
          fin >> room.portal_wire_indecies[portal_wire_index]
        )
      })
    }

    // log("num_square_key_rooms", loz.num_square_key_rooms);
    // loop(
    //   loz.num_square_key_rooms, square_key_room_indecies_index,
    //   log('s',loz.square_key_room_indecies[square_key_room_indecies_index])
    // )
    // log("num_circle_key_rooms", loz.num_circle_key_rooms);
    // loop(
    //   loz.num_circle_key_rooms, circle_key_room_indecies_index,
    //   log('c',loz.circle_key_room_indecies[circle_key_room_indecies_index])
    // )

    loop(loz.num_wires, wire_index, {
      Wire & wire = loz.wires[wire_index];

      fin >> wire.num_pads;
      fin >> wire.num_doors;
      fin >> wire.num_pad_rooms;
      fin >> wire.num_portal_rooms;

      wire.door_indecies = new int[wire.num_doors];
      wire.pad_room_indecies = new int[wire.num_pad_rooms];
      wire.portal_room_indecies = new int[wire.num_portal_rooms];

      loop(
        wire.num_doors, door_index,
        fin >> wire.door_indecies[door_index]
      )
      loop(
        wire.num_pad_rooms, pad_room_index,
        fin >> wire.pad_room_indecies[pad_room_index]
      )
      loop(
        wire.num_portal_rooms, portal_room_index,
        fin >> wire.portal_room_indecies[portal_room_index]
      )
    })

    loop(loz.num_doors, door_index, {
      Door & door = loz.doors[door_index];

      fin >> door.wire_index;
      fin >> door.num_rooms;

      door.room_indecies = new int[door.num_rooms];

      loop(
        door.num_rooms, room_index,
        fin >> door.room_indecies[room_index]
      )
    })

    fin.close();
  }

  // setup_combos
  {
    loz.player_hash_size = 0;
    loz.square_key_hash_size = 0;
    loz.circle_key_hash_size = 0;

    int base = loz.player_hash_size * loz.square_key_hash_size * loz.circle_key_hash_size;

    log("base", base);
    log("player_base", loz.player_hash_size);
    log("square_key_base", loz.square_key_hash_size);
    log("circle_key_base", loz.circle_key_hash_size);

    log("num_players", loz.num_players);
    log("num_square_keys", loz.num_square_keys);
    log("num_circle_keys", loz.num_circle_keys);

    log("num_rooms", loz.num_rooms);
    log("num_square_key_rooms", loz.num_square_key_rooms);
    log("num_circle_key_rooms", loz.num_circle_key_rooms);

    Loc & loc = loz.loc;

    loz.num_pieces = loz.num_players + loz.num_square_keys + loz.num_circle_keys;
    loc.piece_room_indecies = new int[loz.num_pieces];

    loc.player_room_indecies_start_index =  + loz.num_square_keys
      + loz.num_circle_keys;
    loc.player_room_indecies = loc.piece_room_indecies
      + loc.player_room_indecies_start_index;

    loc.square_key_room_indecies_start_index = 0;
    loc.square_key_room_indecies = loc.piece_room_indecies
      + loc.square_key_room_indecies_start_index;

    loc.circle_key_room_indecies_start_index = loz.num_square_keys;
    loc.circle_key_room_indecies = loc.piece_room_indecies
      + loc.circle_key_room_indecies_start_index;

    loc.room_piece_count = new_array(loz.num_rooms * 3, int(0));
    loc.room_square_key_count = loc.room_piece_count;
    loc.room_circle_key_count = loc.room_piece_count + loz.num_rooms;
    loc.room_player_count = loc.room_circle_key_count + loz.num_rooms;

    loc.wire_active_room_count = new_array(loz.num_wires, int(0));
    loc.num_active_portals = 0;

    log("num_rooms", loz.num_rooms)

    plog("player_room sizes")
    loop(loz.num_rooms, room_index, plog(loz.rooms[room_index].num_pads))
    cap

    plog("square_key_room sizes")
    loop(loz.num_rooms, room_index, plog(loz.rooms[room_index].num_square_pads))
    cap

    plog("circle_key_room sizes")
    loop(loz.num_rooms, room_index, plog(loz.rooms[room_index].num_circle_pads))
    cap

    if (loz.num_square_keys > 0) {
      get_square_key_combos(loz, &loz.combo_link_head);
    } else if (loz.num_circle_keys > 0) {
      get_circle_key_combos(loz, &loz.combo_link_head);
    } else if (loz.num_players > 0) {
      get_player_combos(loz, &loz.combo_link_head);
    }

    log("count", loz.count)
    log("hex  ", 0x10000000)

    loop(3 * loz.num_rooms, room_count_index,
      loz.loc.room_piece_count[room_count_index] = 0)

    flog("link_combos")
    link_combo(loz, loz.combo_link_head);

    flog("print combo_links")
    flog(print_links(loz, loz.combo_link_head))
  }
}
