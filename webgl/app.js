var log = console.log
var error = console.error

var vertexShaderText = `
  precision mediump float;
  attribute vec2 vertPosition;
  attribute vec3 vertColor;
  varying vec3 fragColor;

  void main() {
    fragColor = vertColor;
    gl_Position = vec4(vertPosition, 0.0, 1.0);
  }
`

var fragmentShaderText = `
  precision mediump float;

  varying vec3 fragColor;
  void main()
  {
    gl_FragColor = vec4(fragColor, 1.0);
  }
`

var InitDemo = () => {
  var canvas = document.getElementById('game-surface')
  var gl = canvas.getContext('webgl')

  gl || error('webgl not supported, falling back on experimental-webgl')
  gl = gl || canvas.getContext('experimental-webgl')
  if (!gl) throw `your Browser does not support WebGL`

  // canvas.width = window.innerWidth
  // canvas.height = window.innerHeight
  // gl.viewport(0,0,window.innerWidth,window.innerHeight)

  gl.clearColor(0.75, 0.85, 0.8, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  var vertexShader = gl.createShader(gl.VERTEX_SHADER)
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  {
    gl.shaderSource(vertexShader, vertexShaderText)
    gl.shaderSource(fragmentShader, fragmentShaderText)

    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      error('ERROR compiling vertex shader!',
        gl.getShaderInfoLog(vertexShader))
      return
    }
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      error('ERROR compiling fragment shader!',
        gl.getShaderInfoLog(fragmentShader))
      return
    }
  }

  var program = gl.createProgram()
  {
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      error('Error linking program!', gl.getProgramInfoLog(program))
      return
    }

    // DEBUG
    gl.validateProgram(program)
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      error('Error validating program!', gl.getProgramInfoLog(program))
    }
  }

  var triangleVertices = [
    // X, Y     R, G, B
    0.0, 0.5,   1.0, 1.0, 0.0,
    -0.5, -0.5, 0.7, 0.0, 1.0,
    0.5, -0.5,   0.1, 1.0, 0.6
  ]

  var triangleVertexBufferObject = gl.createBuffer()
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject)
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array(triangleVertices), gl.STATIC_DRAW)
  }


  var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition')
  var colorAttribLocation = gl.getAttribLocation(program, 'vertColor')
  {
    gl.vertexAttribPointer(
      positionAttribLocation,
      2, // Number of elements per attribute,
      gl.FLOAT, // Type of elements
      gl.FALSE, // data normalized
      5 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
      0 // offset from the beginnging of a singl vertex to this attribute
    )
    gl.vertexAttribPointer(
      colorAttribLocation,
      3, // Number of elements per attribute,
      gl.FLOAT, // Type of elements
      gl.FALSE, // data normalized
      5 * Float32Array.BYTES_PER_ELEMENT, // size of an individual vertex
      2 * Float32Array.BYTES_PER_ELEMENT // offset from the beginnging of a singl vertex to this attribute
    )

    gl.enableVertexAttribArray(positionAttribLocation)
    gl.enableVertexAttribArray(colorAttribLocation)
  }

  gl.useProgram(program)
  gl.drawArrays(
    gl.TRIANGLES,
    0, // how many to skip
    3 // how many to draw
  ) // use active buffer


}

// function InitDemo() {
//   var m = 10000
//   var r = n => Math.floor(Math.random() * n)
//   var s = ''
//   for (var n = 1; n <= 200; ++n) {
//     var c = 0
//     var b = (1 + Math.sqrt(1 + 4 * (n-1))) / 2
//     for (var i = 0; i < m; ++i) {
//       var a = []
//       for (var j = 0; j < (n << 3); ++j) {
//         var rj = r(n)
//         if (a[rj]) {
//           c += j
//           break
//         }
//         a[rj] = true
//       }
//     }
//
//     log(`${n}\t${c / m}\t${b}`)
//     s += `${n}\t${c / m}\t${b}\n`
//
//   }
//   // return s
//   log(s)
// }
