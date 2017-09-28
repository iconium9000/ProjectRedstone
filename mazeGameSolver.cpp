// clang++ -std=c++11 -stdlib=libc++ -Weverything mazeGameSolver.cpp
// ./a.out maze_game_levels/level17.txt
// JSON.stringify(level.locs, null, 2)

#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

#define loop(N,I,F) for (int I = 0; I < N; ++I) F;

template <class A>
void log(A a) {
  cout << a << endl;
}

template <class A, class B>
void log(A a, B b) {
  cout << a << ' ' << b << endl;
}

template <class A, class B, class C>
void log(A a, B b, C c) {
  cout << a << ' ' << b << ' ' << c << endl;
}

template <class A, class B, class C, class D>
void log(A a, B b, C c, D d) {
  cout << a << ' ' << b << ' ' << c << ' ' << d << endl;
}

int depth_test(int d, int v) {
  if (v <= 1) {
    return 1;
  } else if (d <= 1) {
    return v;
  } else {
    return depth_test(d, v - 1) + depth_test(d - 1, v);
  }
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

  int * room_indecies;
};
struct Temp_combo {
  int * player_room_indecies;
  int * square_key_room_indecies;
  int * circle_key_room_indecies;

  int * room_player_count;
  int * room_square_key_count;
  int * room_circle_key_count;
};
struct Combo {
  int hash;
  int depth = -1;

  int * player_room_indecies;
  int * square_key_room_indecies;
  int * circle_key_room_indecies;

  vector<int> linked_combos;

  // int * room_player_count;
  // int * room_square_key_count;
  // int * room_circle_key_count;

  // bool room_full;
  // bool wire_active;
  // int num_active_portals = 0;
};
struct Loz {

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

  Temp_combo temp_combo;
  Combo ** combo_hash_table;

  Room * rooms;
  Wire * wires;
  Door * doors;

  int count = 0;

  int * square_key_room_indecies;
  int * circle_key_room_indecies;
};

int get_hash_from_room_counts(
  Loz & loz,
  int * room_player_count,
  int * room_square_key_count,
  int * room_circle_key_count
) {
  int hash = 0;
  int base = 1;

  loop(loz.num_rooms, room_index, {
    int num_players = room_player_count[room_index];

    loop(num_players, player_index, {
      hash += base * room_index;
      base *= loz.num_rooms;
    })
  })
  loop(loz.num_square_key_rooms, square_key_room_indecies_index, {
    int room_index = loz.square_key_room_indecies[
      square_key_room_indecies_index
    ];
    int num_square_keys = room_square_key_count[room_index];

    loop(num_square_keys, square_key_index, {
      hash += base * room_index;
      base *= loz.num_square_key_rooms;
    })
  })
  loop(loz.num_circle_key_rooms, circle_key_room_indecies_index,{
    int room_index = loz.circle_key_room_indecies[
      circle_key_room_indecies_index
    ];

    int num_circle_keys = room_circle_key_count[room_index];

    loop(num_circle_keys, circle_key_index, {
      hash += base * room_index;
      base *= loz.num_circle_key_rooms;
    })
  })

  return hash;
}

void push_combo(Loz &);
void get_square_key_combos(Loz&,int,int);
void get_circle_key_combos(Loz&,int,int);
void get_player_combos(Loz&,int,int);

void push_combo(Loz & loz) {
  Temp_combo & temp_combo = loz.temp_combo;
  // Combo * combo = new Combo;

  int hash = get_hash_from_room_counts(
    loz,
    temp_combo.room_player_count,
    temp_combo.room_square_key_count,
    temp_combo.room_circle_key_count
  );

  if (!temp_combo.room_player_count[0]) {
    cout << loz.count++ << ' ' << hash << endl;
  } else {
    ++loz.count;
  }


  // combo->player_room_indecies = new int[loz.num_players];
  // combo->square_key_room_indecies = new int[loz.num_square_keys];
  // combo->circle_key_room_indecies = new int[loz.num_circle_keys];

  // loop(loz.num_rooms, room_index, {
  //   combo->player_room_indecies[room_index]
  //     = temp_combo.player_room_indecies[room_index];
  //   combo->square_key_room_indecies[room_index]
  //     = temp_combo.square_key_room_indecies[room_index];
  //   combo->circle_key_room_indecies[room_index]
  //     = temp_combo.circle_key_room_indecies[room_index];
  // })

  //
  // if (!combo->player_room_indecies[0]) {
  //   cout << loz.count++ << ' ' << combo->hash;
  //   loop(loz.num_players, player_index,
  //     cout << " p" << combo->player_room_indecies[player_index])
  //   loop(loz.num_square_keys, square_key_index,
  //     cout << " s" << combo->square_key_room_indecies[square_key_index])
  //   loop(loz.num_circle_keys, circle_key_index,
  //     cout << " c" << combo->circle_key_room_indecies[circle_key_index])
  //   cout << endl;
  // }


}

void get_square_key_combos(
 Loz & loz, int inverse_square_key_index, int num_rooms
) {
  if (inverse_square_key_index > 0) {
    int square_key_index = loz.num_square_keys - inverse_square_key_index;

    loop(num_rooms, room_index, {
      loz.temp_combo.square_key_room_indecies[square_key_index]
        = room_index;

      if (
        loz.temp_combo.room_square_key_count[room_index] <
        loz.rooms[room_index].num_square_pads
      ) {
        ++loz.temp_combo.room_square_key_count[room_index];
        get_square_key_combos(
          loz, inverse_square_key_index - 1, room_index + 1
        );
        --loz.temp_combo.room_square_key_count[room_index];
      }
    })
  } else if (loz.num_circle_keys > 0) {
    get_circle_key_combos(loz, loz.num_circle_keys, loz.num_rooms);
  } else if (loz.num_players > 0) {
    get_player_combos(loz, loz.num_circle_keys, loz.num_rooms);
  } else {
    push_combo(loz);
  }
}

void get_circle_key_combos(
  Loz & loz, int inverse_circle_key_index, int num_rooms
) {
  if (inverse_circle_key_index > 0) {
    int circle_key_index = loz.num_circle_keys - inverse_circle_key_index;

    loop(num_rooms, room_index, {
      loz.temp_combo.circle_key_room_indecies[circle_key_index]
        = room_index;
      if (
        loz.temp_combo.room_circle_key_count[room_index] <
        loz.rooms[room_index].num_circle_pads
      ) {
        ++loz.temp_combo.room_circle_key_count[room_index];
        get_circle_key_combos(
          loz, inverse_circle_key_index - 1, room_index + 1
        );
        --loz.temp_combo.room_circle_key_count[room_index];
      }
    })
  } else if (loz.num_players > 0) {
    get_player_combos(loz, loz.num_circle_keys, loz.num_rooms);
  } else {
    push_combo(loz);
  }
}

void get_player_combos(
  Loz & loz, int inverse_player_index, int num_rooms
) {
  if (inverse_player_index > 0) {
    int player_index = loz.num_players - inverse_player_index;

    loop(num_rooms, room_index, {
      loz.temp_combo.player_room_indecies[player_index] =
        room_index;
      if (
        loz.temp_combo.room_player_count[room_index] +
        loz.temp_combo.room_square_key_count[room_index] +
        loz.temp_combo.room_circle_key_count[room_index] <
        loz.rooms[room_index].num_pads
      ) {
        ++loz.temp_combo.room_player_count[room_index];
        get_player_combos(
          loz, inverse_player_index - 1, room_index + 1
        );
        --loz.temp_combo.room_player_count[room_index];
      }
    })
  } else {
    push_combo(loz);
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

    log("num_square_key_rooms", loz.num_square_key_rooms);
    loop(
      loz.num_square_key_rooms, square_key_room_indecies_index,
      log('s',loz.square_key_room_indecies[square_key_room_indecies_index])
    )
    log("num_circle_key_rooms", loz.num_circle_key_rooms);
    loop(
      loz.num_circle_key_rooms, circle_key_room_indecies_index,
      log('c',loz.circle_key_room_indecies[circle_key_room_indecies_index])
    )

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
    int base = depth_test(loz.num_players, loz.num_rooms) *
      depth_test(loz.num_square_keys, loz.num_square_key_rooms) *
      depth_test(loz.num_circle_keys, loz.num_circle_key_rooms);

    loz.combo_hash_table = new Combo*[base];
    loop(base, combo_hash, loz.combo_hash_table[combo_hash] = nullptr)

    Temp_combo & temp_combo = loz.temp_combo;
    temp_combo.player_room_indecies = new int[loz.num_players];
    temp_combo.square_key_room_indecies = new int[loz.num_square_keys];
    temp_combo.circle_key_room_indecies = new int[loz.num_circle_keys];

    temp_combo.room_player_count = new int[loz.num_rooms];
    temp_combo.room_square_key_count = new int[loz.num_rooms];
    temp_combo.room_circle_key_count = new int[loz.num_rooms];

    loop(loz.num_rooms, room_index, {
      temp_combo.room_player_count[room_index] = 0;
      temp_combo.room_square_key_count[room_index] = 0;
      temp_combo.room_circle_key_count[room_index] = 0;
    })

    log("num_rooms", loz.num_rooms);
    log("num_square_key_rooms", loz.num_square_key_rooms);
    log("num_circle_key_rooms", loz.num_circle_key_rooms);
    log("base", base);

    if (loz.num_square_keys > 0) {
      get_square_key_combos(loz, loz.num_square_keys, loz.num_rooms);
    } else if (loz.num_circle_keys > 0) {
      get_circle_key_combos(loz, loz.num_circle_keys, loz.num_rooms);
    } else if (loz.num_players > 0) {
      get_player_combos(loz, loz.num_players, loz.num_rooms);
    }
  }
}
