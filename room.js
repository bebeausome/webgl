// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;        
  attribute vec2 vertTexCoord;   

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ProjMatrix;

  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec2 fragTexCoord; 
  varying vec3 v_Position;

  void main() {
    gl_Position = u_ProjMatrix * u_ModelMatrix * a_Position;
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Color = a_Color;
    fragTexCoord = vertTexCoord;
  }
  `;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D sampler;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec2 fragTexCoord;
  varying vec4 v_Color;

  uniform vec3 u_LightColor;
  uniform vec3 u_LightPosition;
  uniform vec3 u_AmbientLight;
  void main() {
    vec3 normal = normalize(v_Normal);
    vec3 u_LightDirection = normalize(u_LightPosition - v_Position);
    float nDotL = max(dot(u_LightDirection, normal), 0.0);
    vec4 TexColor = texture2D(sampler, fragTexCoord);
    vec3 diffuse;
    diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;

    vec3 ambient = u_AmbientLight * v_Color.rgb;
    gl_FragColor = vec4(diffuse + ambient, v_Color.a);
  }
  `;

var modelMatrix = new Matrix4(); // The model matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals
var normalMatrix = new Matrix4(); // Transformation matrix for normals

var g_xAngle = 0.0;    // The rotation x angle (degrees)

function main() {

  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  canvas.width=document.body.clientWidth;
  canvas.height=document.body.clientHeight;

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(1, 1, 1, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

  if (!u_ModelMatrix || !u_ProjMatrix|| !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
    console.log('Failed to get the storage location');
    return;
  }


  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);


  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);


  function render(now) {
    now *= 0.001;  // convert to seconds
    g_xAngle = (g_xAngle + 1) % 360
    draw();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function setTexture(gl, texturetype){
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
    gl.UNSIGNED_BYTE, document.getElementById(texturetype)
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function initVertexBuffers(gl) {

  var vertices = new Float32Array([   // Coordinates
    -0.5, 0.5, -0.5,   //top
    -0.5, 0.5, 0.5,  
    0.5, 0.5, 0.5,  
    0.5, 0.5, -0.5,
   
    -0.5, 0.5, 0.5,  //right
    -0.5,-0.5, 0.5,  
    -0.5,-0.5,-0.5,  
    -0.5, 0.5, -0.5,

    0.5, 0.5, 0.5,   //left
    0.5,-0.5, 0.5,   
    0.5,-0.5,-0.5,   
    0.5, 0.5,-0.5,
    
    0.5, 0.5, 0.5,  //front
    0.5, -0.5, 0.5,  
    -0.5,-0.5, 0.5,   
    -0.5, 0.5, 0.5,
    
    0.5, 0.5,-0.5,  //back
    0.5,-0.5,-0.5,  
    -0.5, -0.5,-0.5,   
    -0.5, 0.5,-0.5,
   
    -0.5,-0.5,-0.5,  //bottom
    -0.5,-0.5, 0.5,   
    0.5,-0.5, 0.5,  
    0.5,-0.5, -0.5,
    
 ]);

  var texcoords = new Float32Array([
    //u, v : u across, v down. 0,0 top left, 0,1 bottom left etc.
    // Blue
    0.0,  0.0,
    1/3,  0.0,
    1/3,  1/3,
    0,  1/3,
    
    // Green
    0.0,  1/3,
    1/3,  1/3,
    1/3,  2/3,
    0.0,  2/3,
    
    // Orange
    1/3,  1/3,
    2/3,  1/3,
    2/3,  2/3,
    1/3,  2/3,

    // Red
    0.0,  2/3,
    1/3,  2/3,
    1/3,  1.0,
    0.0,  1.0,

    // White
    1/3,  2/3,
    2/3,  2/3,
    2/3,  1.0,
    1/3,  1.0,

    // Yellow
    2/3,  2/3,
    1.0,  2/3,
    1.0,  1.0,
    2/3,  1.0,
    
  ])

  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'vertTexCoord', texcoords, 2, gl.FLOAT)) return -1; 
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {

  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(){

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  var boxTexture = setTexture(gl,'cube');

  modelMatrix.setTranslate(0, 0, -5);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_xAngle, 1, 1, 0); // Rotate along y axis
  
  // Model the cube
  pushMatrix(modelMatrix);
    modelMatrix.scale(1,1,1); // Scale
    drawCube(gl, u_ModelMatrix, u_NormalMatrix, n, boxTexture);
  modelMatrix = popMatrix();

}

function drawCube(gl, u_ModelMatrix, u_NormalMatrix, n, texture) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE0);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}
