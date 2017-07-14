var fs = require('fs')
var fu = require('./client/functions.js')
var pt = require('point.js')

var dic = JSON.parse(fs.readFileSync('dic.json').toString())
var mod, wrd

var wrt = msg => process.stdout.write(msg)
var log = console.log

function lstn(msg) {
  if (msg) {
    wrt(`${msg}\n\n`)
  }
  log('enter: ad <wrd>, lkp <srt wrd>, lkp <lng wrd>')
  wrt('ad/lkp nam: ')
  mod = 'lstn'
  wrd = {}
}

function pos() {
  wrt('pos: ')
  mod = 'pos'
}

function def() {
  wrt('def: ')
  mod = 'def'
}

function usg() {
  wrt('usg: ')
  mod = 'usg'
}

function acpt() {
  log(wrd)
  wrt(`add ${wrd.nam} to dic? (entr fr yes, any ky fr no): `)
  mod = 'acpt'
}

function save() {
  var ord = Object.keys(dic).sort()
  var wrds = {}

  for (var i in ord) {
    var nam = ord[i]
    var wrd = dic[nam]
    wrds[nam] = wrd
  }

  fs.writeFile('dic.json', JSON.stringify(wrds, null, '\t'))
  fs.writeFile('language.json', JSON.stringify({
    knownWords: ord
  }, null, '\t'))
}

lstn()


process.openStdin().addListener('data', d => {
  var msg = d.toString().trim()
  var splt = msg.split(' ')

  switch (mod) {
    case 'lstn':
      switch (splt[0]) {
        case 'ad':
          if (splt.length > 2) {
            return lstn('ERR too mny spcs')
          } else if (dic[splt[1]]) {
            log(`ERR ${splt[1]} is taken`)
            return lstn(JSON.stringify(dic[splt[1]]), null, ' ')
          }
          wrd.nam = splt[1]
          pos()

          return
        case 'lkp':

          return
        case 'tst':

          var ordr = Object.keys(dic).sort()

          var nuns = {}
          var vrbs = {}
          var adjs = {}
          var advs = {}


          for (var i in ordr) {
            var nam = ordr[i]
          }



          return

        default:
          return lstn('ERR invalid token')
      }
    case 'pos':
      wrd.pos = msg
      return def()
    case 'def':
      wrd.def = msg
      return usg()
    case 'usg':
      if (msg == '') {
        return acpt()
      } else if (wrd.usg) {
        return wrd.usg.push(msg)
      } else {
        return wrd.usg = [msg]
      }
    case 'acpt':
      if (msg == '') {
        wrt(`added ${wrd.nam} to dic\n\n`)
        dic[wrd.nam] = wrd
        save()
        lstn()
      } else {
        lstn(`Didn't write ${wrd.nam}`)
      }
      break
  }
})
