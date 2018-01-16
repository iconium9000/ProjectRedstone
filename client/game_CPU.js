// CPU
var log = console.log
log('game.js init CPU')

hex_alph = ['0','1','2','3','4','5','6','7',
  '8','9','A','B','C','D','E','F']
alph_hex = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
}
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
int_to_hex = int => get_hex(i => int & (1 << i))
hex_to_int = h => {
  var n = 0
  fu.forlen(4, idx => n |= (alph_hex[h[idx]] || 0) << (idx << 2))
  return n
}
hex_to_ary = h => {
  var ary = []
  fu.forlen(4, idx => ary.push(alph_hex[h[idx]] || 0))
  return ary
}
ary_to_hex = ary => {
  var h = ''
  fu.forlen(4, i => h += hex_alph[ary[i]] || '0')
  return h
}

get_file = msg => {
  var delims = ':;.,!? \n\t'
  var is_delim = c => fu.trueif(delims, d => d == c)

  var no_com = ''
  var com_flag = true
  fu.forEach(msg, c => {
    if (c == '#') com_flag = !com_flag
    else if (com_flag || c == '\n') (no_com += c) && (com_flag = true)
  })

  var words = []
  var word = ''
  var m_flag = true
  fu.forEach(no_com, c => {
    if (c == '$') m_flag = false
    if (is_delim(c)) {
      word && words.push(word)
      if (!m_flag && c == '\n') {
        words.push('$')
        m_flag = true
      }
      word = ''
    }
    else word += c
  })
  word && words.push(word)

  return words
}

start = () => {
  disc = null
  regs = []
  mem = {}
  fu.forlen(16, idx => regs[idx] = '0000')
  regs[1] = '1'
  mem[1] = 'AD1'
  mem[2] = 'DA'
  mem[3] = '62A1'
  flag = true
}

set_reg = (r, t) => {
  // log(r, t)
  t = int_to_hex(t)
  log(regs[3], r, t)

  regs[3] = r == 2 ? 'B32os' : '6221os'
  regs[r] = r < 2 ? `${r}` : t
}

ints = [
  // 0cab OR         rc = ra | rb
  (c, rc, a, ra, b, rb) => set_reg(c, ra | rb),
  // 1cab AND        rc = ra & rb
  (c, rc, a, ra, b, rb) => set_reg(c, ra & rb),
  // 2cab XOR        rc = ra ^ rb
  (c, rc, a, ra, b, rb) => set_reg(c, ra ^ rb),
  // 3cab SLL        rc = ra << b
  (c, rc, a, ra, b, rb) => set_reg(c, ra << b),
  // 4cab SRL        rc = ra >>> b
  (c, rc, a, ra, b, rb) => set_reg(c, ra >>> b),
  // 5cab SRA        rc = ra >> b
  (c, rc, a, ra, b, rb) => set_reg(c, ra >> b),
  // 6cab ADD        rc = ra + rb
  (c, rc, a, ra, b, rb) => set_reg(c, ra + rb),
  // 7cab SUB        rc = ra - rb
  (c, rc, a, ra, b, rb) => set_reg(c, ra - rb),
  // 8cab IF         ra != 0 ? rc = rb
  (c, rc, a, ra, b, rb) => set_reg(ra == 0 ? 0 : c, rb),
  // 9abc LOW        ra[LOW] = bc
  (a, ra, b, rb, c, rc) => set_reg(a, (ra & 0xFF00) | (c << 4) | b),
  // Aabc HIGH       ra[HIGH] = bc
  (a, ra, b, rb, c, rc) => set_reg(a, (ra & 0x00FF) | (c << 12) | (b << 8)),
  // Bba  READ       rb = mem[ra]
  (b, rb, a, ra) => set_reg(b, hex_to_int(mem[ra] || '0')),
  // Cba  WRITE      mem[rb] = ra,
  (b, rb, a, ra) => set_reg(0, hex_to_int(mem[rb] = int_to_hex(ra))),
  // Dba  DISC_READ  for i = 0, disc[ra], mem[rb + i] = disc[ra], ++i
  (b, rb, a, ra) => {
    if (disc) {
      fu.forlen(disc.length, idx => mem[rb + idx] = disc[idx])
      disc = null
      set_reg(0, ra)
    }
    else if (disc != false){
      disc = false
      sndMsg('file_rqst', plrIf.usr.id, 'srvr', int_to_hex(ra))
    }
  },
  // Ecab DISC_WRITE for i = 0, i < rb, disc[rc] = mem[ra + i], ++i
  (c, rc, a, ra, b, rb) => set_reg(0),
  // F    END
  () => flag = false
]

tick = usrIO => {
  if (!usrIO.kys.hsDn['Enter'] ) return

  var f_int = regs[3]
  var ary = hex_to_ary(f_int)
  var int_id = ary[0]

  var a = ary[1]
  var b = ary[2]
  var c = ary[3]

  var ra = hex_to_int(regs[a])
  var rb = hex_to_int(regs[b])
  var rc = hex_to_int(regs[c])

  flag && ints[int_id](a,ra, b,rb, c,rc)
}

module.exports = apInitA => {

  fu = apInitA.fu
  pt = apInitA.pt
  fs = apInitA.fs

  plrIf = new Object

  sndMsg = (ky,sndr,rcvr,msg) =>
    apIO.apSnd({ky:ky, sndr:sndr, rcvr:rcvr, msg:msg})
  var apIO_init = apInitB => {
    plrIf.usr = apInitB.usrInfo.usr

    if (apInitB.calr == 'srvr') {
      plrIf.srvr = true

    } else {
      plrIf.clnt = true
      document.body.style.backgroundColor = 'black'
      start()
    }
  }
  var apIO_tick = tick

  var apIO_apRcv = rcvMsg => {
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    switch (ky) {
      case 'file_rqst':
        try {
          msg += ` ${fs.readFileSync(`rs/${msg}.txt`)}`
        }
        catch(e) {
          log('file_rqst', 'failed', e)
        }
        log('file_rqst', msg)
        sndMsg('file_rply', 'srvr', 'all -srvr', msg)
        break
      case 'file_rply':
        disc = get_file(msg)
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
