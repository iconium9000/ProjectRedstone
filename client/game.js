// FlowGame

console.log('game.js init (FlowGame)')

var colors = {
  blue: '#0080F0',
  red: 'red',
  pink: '#C07070',
  green: 'green',
  purple: 'purple',
  grey: 'grey',
  orange: 'orange',
  cyan: '#008888',
  darkBlue: '#0000A0',
  brown: '#602000'
}
var colorNames = Object.keys(colors)

var tau = 2 * Math.PI

var log = console.log
var sndr = false

var selectedNode = null
var stretchedCnode = null
var selectedCnode = null
var draggedNode = null
var draggedCnode = null
var draggedPallet = -1

var fillRate = 1e-2

var tickNum = 0 // alternates

var ids = {}
var nodes = {}
var cnodes = {}
var links = {}
var nets = {}

module.exports = apInitA => {

  var fu = apInitA.fu
  var pt = apInitA.pt

  var plrIf = new Object

  var pr = () => pt.point(400 * Math.random(), 400 * Math.random())

  fu.forEach(colorNames, colorName => cnodes[colorName] = {})

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
      document.body.style.backgroundColor = 'black'
      sndMsg('rqst update', plrIf.usr.id, 'srvr')
    }
  }

  var apIO_tick = usrIO => {
    var g = usrIO.dsply.g
    var w = usrIO.dsply.w
    var h = usrIO.dsply.h

    var tau = 2 * Math.PI

    var cntr = pt.factor(pt.point(w, h), 2)

    var mws = usrIO.mws
    var prv = usrIO.mws.prv

    // consts ----------------------------------------
    // -----------------------------------------------
    var mwsRds = 5

    var perimeterScale = 300

    var selectedColor = 'white'
    var fillColor = 'white'

    var selectedOfst = 10

    var cnodeRadius = 8

    var arrowH = 3
    var arrowW = 3

    var linkWidth = 10
    var nodeLineWidth = 2

    var rankColor = 'white'
    var rankBkgrndColor = 'black'
    var rankRadius = 15
    var rankDotRadius = 2
    var rankRingRadius = 7
    var rankDotColor = 'white'

    // sidebar consts
    var sdbr = {
      // width of the sidebar
      w: 260,
      // the bkgrnd color of the sidebar
      bkgrnd: '#202020',
      // distance from the wall to rate marker text
      ofst: 10,
      // info regarding pallets
      pallet: {
        nodeScale: 10,
        // pallet width
        w: 200,
        // how far from the right wall do pallets start
        wallOfst: 40,
        // how tall is each row
        drawH: 40,
        // how far from the top and bottom of the row do you fill pallets
        fillOfst: 10,
        // how thick is each pallet (drawH - 2 * fillOfst)
        fillH: 20,
        // dist from top of row
        lineStart: 5,
        // marker length
        lineH: 35,
        // the color of the fill marker lines
        lineColor: 'white',

        textStart: 25,

        font: '13px Arial',

        textColor: 'white'
      }
    }

    // constructors and destructors
    // -----------------------------------------------

    function newNet(cnode, net) {
      net = net || {
        cnodes: {},
        ncnodes: 0,
        links: {},
        fill: 0,
        capacity: 0
      }
      if (cnode.net != net) {
        cnode.net = net
        ++net.ncnodes
        net.cnodes[cnode.id] = cnode
        net.capacity += cnode.capacity
        fu.forEach(cnode.links, link => {
          link.net = net
          net.links[link.id] = link
          newNet(link.cnodeA, net)
          newNet(link.cnodeB, net)
        })
      }
    }

    var deleteLink = (link) => {
      if (links[link.id]) {
        link.cnodeA.link = link.cnodeB.link = null
        delete link.cnodeA.links[link.id]
        delete link.cnodeB.links[link.id]
        delete links[link.id]

        newNet(link.cnodeA)
        newNet(link.cnodeB)
      }
      return link
    }

    var newLink = (cnodeA, cnodeB) => {
      var id = cnodeA.id > cnodeB.id ?
        `${cnodeA.id},${cnodeB.id}` :
        `${cnodeB.id},${cnodeA.id}`
      if (links[id]) {
        return links[id]
      }
      var link = {
        id: id,
        cnodeA: cnodeA,
        cnodeB: cnodeB,
        net: null,
        colorName: cnodeA.colorName
      }
      if (cnodeA.link && cnodeA.node) {
        deleteLink(cnodeA.link)
      }
      if (cnodeB.link && cnodeB.node) {
        deleteLink(cnodeB.link)
      }

      cnodeA.link = cnodeB.link = link
      links[id] = cnodeA.links[id] = cnodeB.links[id] = link

      newNet(cnodeA)

      return link
    }

    var deleteCnode = (cnode) => {
      if (cnode.node) {
        delete cnode.node.cnodes[cnode.colorName]
      }

      // deleteLinks
      fu.forEach(cnode.links, link => deleteLink(link))

      delete cnodes[cnode.colorName][cnode.id]
    }

    // net
    // -----------------------------------------------

    ++tickNum

    // convert
    fu.forEach(nodes, node => {

      var nOutputs = 0
      var nInputs = 0

      fu.forEach(node.cnodes, cnode => {
        if (cnode.rate > 0) {
          ++nOutputs
        }
        else if (cnode.rate < 0) {
          ++nInputs
        }
      })

      if (nOutputs && !nInputs) {

        fu.forEach(node.cnodes, cnode => {
          cnode.fill = fu.gttt(cnode.fill + fillRate * cnode.capacity,
            cnode.capacity, 0)

          log(cnode.fill, cnode.capacity)
        })


      } else if (nInputs && !nOutputs) {

        fu.forEach(node.cnodes, cnode => {
          cnode.fill = fu.gttt(cnode.fill - fillRate * cnode.capacity,
            cnode.capacity, 0)
        })



      }

      else {
        node.productionRate = 1

        fu.forEach(node.cnodes, cnode => {
          cnode.fillRatio = cnode.fill / cnode.capacity

          // (+) output
          if (cnode.rate > 0 && node.productionRate > 1 - cnode.fillRatio) {
            node.productionRate = 1 - cnode.fillRatio
          }

          // (-) input
          if (cnode.rate < 0 && node.productionRate > cnode.fillRatio) {
            node.productionRate = cnode.fillRatio
          }
        })


        fu.forEach(node.cnodes, cnode => {

          // (+) output
          if (cnode.rate > 0) {
            cnode.fill = fu.gttt(
              cnode.fill + cnode.capacity * node.productionRate,
              cnode.capacity, 0
            )
          }
          // (-) input
          else if (cnode.rate < 0) {
            cnode.fill = fu.gttt(
              cnode.fill - cnode.capacity * node.productionRate,
              cnode.capacity, 0
            )
          }
        })

      }

    })

    fu.forEach(links, link => {
      var net = link.net

      if (net.tickNum == tickNum) {
        return
      }
      net.tickNum = tickNum

      net.capacity = 0
      fu.forEach(net.cnodes, cnode => net.capacity += cnode.capacity)
      net.capacity *= fillRate
      net.fill = fu.gttt(net.fill, net.capacity, 0)



      // empty outputs into net

      var ranks = []
      fu.forEach(net.cnodes, cnode => {
        if (cnode.rate > 0) {
          (ranks[cnode.rank] = ranks[cnode.rank] || []).push(cnode)
        }
      })
      delete ranks[0]


      fu.forEach(ranks, rankAry => {

        // var totalOutput = 0
        // fu.forEach(rankAry, cnode => totalOutput += cnode.fill)

        fu.forEach(rankAry, cnode => {
          var prvnetfill = net.fill
          net.fill = fu.gttt(net.fill + cnode.fill, net.capacity, 0)
          cnode.fill = fu.gttt(cnode.fill - (net.fill - prvnetfill), cnode.capacity, 0)
        })

      })


      // fill from net into inputs

      ranks = {}
      fu.forEach(net.cnodes, cnode => {
        if (cnode.rate < 0) {
          (ranks[cnode.rank] = ranks[cnode.rank] || []).push(cnode)
        }
      })
      delete ranks[0]

      fu.forEach(ranks, rankAry => {

        // var totalInput = 0
        // fu.forEach(rankAry, cnode => totalInput += cnode.fill)

        fu.forEach(rankAry, cnode => {
          var prvcnodefill = cnode.fill
          cnode.fill = fu.gttt(cnode.fill + net.fill, cnode.capacity, 0)
          net.fill = fu.gttt(net.fill - (cnode.fill - prvcnodefill), net.capacity, 0)
        })

      })

    })


    // links
    // -----------------------------------------------

    for (var id in links) {
      var link = links[id]

      g.lineWidth = linkWidth
      g.strokeStyle = colors[link.colorName]
      pt.drawLine(g, link.cnodeA.p, link.cnodeB.p)

      var cnode
      if (link.cnodeA.rank) {
        cnode = link.cnodeA
      }
      if (link.cnodeB.rank) {
        cnode = cnode ? null : link.cnodeB
      }
      if (cnode) {
        var nInputs = 0
        var nOutputs = 0
        fu.forEach(link.net.cnodes, cnode => {
          if (cnode.rate > 0) {
            ++nOutputs
          }
          else if (cnode.rate < 0) {
            ++nInputs
          }
        })

        if (cnode.rate > 0 ? nOutputs > 1 : nInputs > 1) {
          var rank = cnode.rank

          g.fillStyle = rankBkgrndColor
          var p = pt.factor(pt.sum(link.cnodeA.p, link.cnodeB.p), 2)
          pt.fillCircle(g, p, rankRadius)
          g.lineWidth = nodeLineWidth
          g.strokeStyle = rankColor
          pt.drawCircle(g, p, rankRadius)

          if (mws.hsDn && pt.dist(p, mws) < rankRadius + mwsRds) {
            rank = rank >= (cnode.rate > 0 ? nOutputs : nInputs) ? 1 : rank + 1
            link[link.cnodeA.rank ? 'cnodeA' : 'cnodeB'].rank = rank
          }

          g.fillStyle = rankDotColor
          if (rank == 1) {
            pt.fillCircle(g, p, rankDotRadius)
          } else {
            for (var i = 0; i < rank; ++i) {
              pt.fillCircle(g,
                pt.sum(p,
                  pt.scale(
                    pt.angle(i / rank * tau), rankRingRadius
                  )
                ),
                rankDotRadius
              )
            }
          }
        }
      }
    }

    if (stretchedCnode) {
      g.lineWidth = linkWidth
      g.strokeStyle = colors[stretchedCnode.colorName]
      pt.drawLine(g, stretchedCnode.p, mws)
    }

    // cnodes
    // -----------------------------------------------

    g.lineWidth = nodeLineWidth

    if (selectedCnode && usrIO.kys.hsDn['Backspace']) {
      deleteCnode(selectedCnode)
      selectedCnode = null
    }

    for (var colorName in colors) {
      for (var id in cnodes[colorName]) {
        var cnode = cnodes[colorName][id]

        if (pt.dist(mws, cnode.p) < cnodeRadius + mwsRds) {

          // is being clicked
          if (mws.hsDn) {
            if (mws.shftDn) {
              stretchedCnode = cnode
            } else {
              selectedCnode = selectedCnode == cnode ? null : cnode
              draggedCnode = cnode
            }

            selectedNode = null
          } else if (
              stretchedCnode && stretchedCnode != cnode && mws.hsUp
              && stretchedCnode.colorName == cnode.colorName
            ) {

            newLink(stretchedCnode, cnode)
            stretchedCnode = null
          }
        }


        // will be drawn in node
        if (cnode.node) {
          continue
        }

        // draw cnode
        g.fillStyle = colors[colorName]
        pt.fillCircle(g, cnode.p, cnodeRadius)
        if (selectedCnode == cnode) {
          g.strokeStyle = selectedColor
          pt.drawCircle(g, cnode.p, cnodeRadius + selectedOfst)
        }
      }
    }

    if (stretchedCnode) {
      // if you have cnode selected and you release the mws
      if (mws.hsUp) {
        // newCnode
        var cnode = {
          id: fu.randKey(nodes),
          isCnode: true,
          node: null,
          net: null,
          links: {},
          link: null,
          rank: 0,
          colorName: stretchedCnode.colorName,
          p: pt.copy(mws),
          rate: 0,
          capacity: 0,
          fill: 0
        }
        ids[cnode.id] = true
        cnodes[cnode.colorName][cnode.id] = cnode
        // nodes[cnode.id] = cnode

        // newLink
        newLink(stretchedCnode, cnode)
        stretchedCnode = null
      }
    } else if (draggedCnode) {
      if (mws.isDn) {
        pt.sume(draggedCnode.p, pt.sub(mws, prv))
      } else {
        draggedCnode = null
      }
    }

    // nodes -----------------------------------------
    // -----------------------------------------------

    if (!mws.isDn) {
      draggedNode = null
    }

    for (var id in nodes) {
      var n = nodes[id]

      // perimeter = sum of slices
      var perimeter = 0
      for (var colorName in colors) {
        if (n.cnodes[colorName]) {
          perimeter += n.cnodes[colorName].capacity
        }
      }

      perimeter *= perimeterScale

      var radius = perimeter / tau

      // select node w/ mws
      if (pt.dist(mws, n.p) < radius) {
        if (mws.hsDn) {
          selectedNode = selectedNode == n ? null : n
          draggedNode = n
        }
      }

      // drag node
      if (draggedNode == n) {
        pt.sume(draggedNode.p, pt.sub(mws, prv))
      }

      // if selected, draw circle
      if (selectedNode == n) {
        g.strokeStyle = selectedColor
        pt.drawCircle(g, n.p, radius + selectedOfst)
      }

      // draw colors
      var startAngle = n.startAngle

      for (var colorName in colors) {
        var cnode = n.cnodes[colorName]

        if (!cnode) {
          continue
        }

        var angle = tau * perimeterScale / perimeter * cnode.capacity

        // draw wedge
        g.beginPath()
        g.moveTo(n.p.x, n.p.y)
        g.arc(n.p.x, n.p.y, radius, startAngle, startAngle + angle)
        g.lineTo(n.p.x, n.p.y)
        g.fillStyle = colors[colorName]
        g.fill()

        if (cnode.capacity) {
          // draw fill
          g.beginPath()
          g.arc(n.p.x, n.p.y,
            Math.abs(cnode.fill / cnode.capacity) * radius,
            startAngle, startAngle + angle)
          g.strokeStyle = fillColor
          g.stroke()
        }

        // drawFill

        // draw cnode
        var sa = startAngle + angle / 2
        startAngle += angle

        cnode.p = pt.sum(n.p, pt.scale(pt.angle(sa), radius + selectedOfst))
        pt.fillCircle(g, cnode.p, cnodeRadius)
        g.strokeStyle = selectedColor
        pt.drawCircle(g, cnode.p, cnodeRadius)

        // draw cnode arrow
        var cnodeV = pt.scale(pt.angle(sa), arrowH)
        var cnodeI = pt.scale(pt.inverse(pt.angle(sa)), arrowW)
        var cnodeTop = pt[cnode.rate > 0 ? 'sum' : 'sub'](cnode.p, cnodeV)
        g.strokeStyle = selectedColor
        pt.drawLine(g, cnodeTop, pt.sum(cnode.p, cnodeI))
        pt.drawLine(g, cnodeTop, pt.sub(cnode.p, cnodeI))
      }
    }

    // DRAW & INTERACT WITH SIDEBAR ------------------
    // -----------------------------------------------

    // draw bkgrnd
    g.beginPath()
    g.rect(w, 0, -sdbr.w, h)
    g.fillStyle = sdbr.bkgrnd
    g.fill()

    // mouse in sidebar?
    var sdbrMws = mws.x > w - sdbr.w

    if (sdbrMws) {
      if (mws.hsDn || !mws.isDn) {
        draggedPallet = Math.floor(mws.y / sdbr.pallet.drawH)
      }
    } else if (!selectedNode && colorNames[draggedPallet] && mws.hsUp) {

      var colorName = colorNames[draggedPallet]

      // newNode
      var n = {
        id: fu.randKey(nodes),
        p: pt.copy(mws),
        startAngle: 0,
        cnodes: {}
      }
      // newCnode
      var cnode = n.cnodes[colorName] = {
        id: n.id,
        isCnode: true,
        net: null,
        links: {},
        link: null,
        rank: 1,
        colorName: colorName,
        p: pt.zero(),
        rate: 0.5,
        capacity: 0.5,
        fill: 0
      }
      ids[n.id] = true
      cnodes[colorName][n.id] = cnode
      cnode.node = nodes[n.id] = n
      newNet(cnode)
    } else if (!mws.isDn) {
      draggedPallet = -1
    }

    // draw pallets
    for (var colorIndex in colorNames) {

      var colorName = colorNames[colorIndex]
      var lh = sdbr.pallet.drawH * colorIndex

      // fill pallet
      g.beginPath()
      g.rect(
        w - sdbr.pallet.wallOfst - sdbr.pallet.fillOfst,
        sdbr.pallet.fillOfst + lh,
        -sdbr.pallet.w, sdbr.pallet.fillH
      )
      g.fillStyle = colors[colorName]
      g.fill()

      var thisPallet = draggedPallet == colorIndex

      // if mouse in area, draw pallet boarders
      if (thisPallet) {
        g.beginPath()
        g.rect(
          w - sdbr.pallet.wallOfst, lh,
          -sdbr.pallet.w - 2 * sdbr.pallet.fillOfst, sdbr.pallet.drawH
        )
        g.strokeStyle = sdbr.pallet.lineColor
        g.stroke()
      }

      // if there is a selected node
      if (selectedNode) {
        var n = selectedNode
        var nodeRate = n.cnodes[colorName] ? n.cnodes[colorName].rate : 0
        var colorValue = nodeRate * sdbr.pallet.nodeScale

        var nx = w - sdbr.pallet.wallOfst - sdbr.pallet.fillOfst
          - sdbr.pallet.w / 2 + sdbr.pallet.w / 2 * nodeRate

        g.beginPath()
        g.moveTo(nx, lh + sdbr.pallet.lineStart)
        g.lineTo(nx, lh + sdbr.pallet.lineH)
        g.strokeStyle = sdbr.pallet.lineColor
        g.stroke()

        g.fillStyle = sdbr.pallet.textColor
        g.textAlign = 'right'
        g.font = sdbr.pallet.font
        g.fillText(colorValue, w - sdbr.ofst, lh + sdbr.pallet.textStart)

        if (thisPallet) {
          // zero out the pie quantity
          if (mws.x > w - sdbr.pallet.wallOfst) {
            if (mws.hsDn) {
              // deleteCnode
              deleteCnode(cnodes[colorName][n.id])
            }
          } else if (mws.isDn && mws.x > w - sdbr.w) {
            var r = (mws.x - w + sdbr.pallet.w / 2
              + sdbr.pallet.wallOfst + sdbr.pallet.fillOfst) / sdbr.pallet.w * 2

            r = Math.round(10 * fu.gttt(r, 1, -1)) / 10
            var cnode = n.cnodes[colorName]
            if (!cnode) {
              // newCnode
              cnode = cnodes[colorName][n.id] = n.cnodes[colorName] = {
                id: n.id,
                isCnode: true,
                net: null,
                links: {},
                link: null,
                rank: 1,
                colorName: colorName,
                p: pt.zero(),
                rate: r,
                capacity: Math.abs(r),
                fill: 0
              }
              cnode.node = n
              newNet(cnode)
            }
            cnode.rate = r
            cnode.capacity = Math.abs(r)
            cnode.fill = fu.gttt(cnode.fill, cnode.capacity, 0)
          }
        }

      }
    }

    if (selectedNode && !mws.isDn) {
      var n = selectedNode
      var dead = true

      // to refresh obj
      Object.keys(n.cnodes)

      for (var colorName in colors) {
        if (n.cnodes[colorName]) {
          if (n.cnodes[colorName].capacity) {
            dead = false
            break
          } else {
            // deleteCnode
            deleteCnode(cnodes[colorName][n.id])
          }
        }
      }

      if (dead) {
        // deleteNode
        delete nodes[selectedNode.id]

        for (var colorName in selectedNode.cnodes) {
          // deleteCnode
          deleteCnode(cnodes[colorName][selectedNode.id])
        }
        draggedNode = selectedNode = null
      }
    }

    // mouse -----------------------------------------
    // -----------------------------------------------
    g.fillStyle = colorNames[draggedPallet] ?
      colors[colorNames[draggedPallet]] : 'black'
    pt.fillCircle(g, mws, mwsRds)

    g.strokeStyle = 'white'
    pt.drawCircle(g, mws, mwsRds)

    if (sndr) {
      sndMsg('map',plrIf.usr.id,'all -sndr',{
        ids: ids,
        nodes: nodes,
        cnodes: cnodes,
        links: links,
        nets: nets
      })
    }

  }

  var apIO_apRcv = rcvMsg => {
    var ky = rcvMsg.ky
    var sndr = rcvMsg.sndr
    var rcvr = rcvMsg.rcvr
    var msg = rcvMsg.msg

    switch (ky) {
      case 'map':

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
