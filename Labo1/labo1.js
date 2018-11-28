var vertexBuffer = null;
var indexBuffer = null;
var colorBuffer = null;
var indices = [];
var vertices = [];
var colors = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var mvRotateZMatrix = mat4.create();
var mvRotateXMatrix = mat4.create();
var mvRotateYMatrix = mat4.create();

var mvTranslateZMatrix = mat4.create();
var mvTranslateXMatrix = mat4.create();
var mvTranslateYMatrix = mat4.create();

var pointSize = 1.0;

function initShaderParameters(prg)
{
  // Récupération d'attributs depuis le context OpenGL
  prg.vertexPositionAttribute = glContext.getAttribLocation(prg, "aVertexPosition");
  prg.colorAttribute = glContext.getAttribLocation(prg, "aColor");
  prg.pMatrixUniform = glContext.getUniformLocation(prg, 'uPMatrix');
  prg.mvMatrixUniform = glContext.getUniformLocation(prg, 'uMVMatrix');
  prg.pointSize = glContext.getUniformLocation(prg, 'uPointSize');

  // Activation des tabeaux de données des sommets comme "attribut" OpenGL
  glContext.enableVertexAttribArray(prg.vertexPositionAttribute);
  glContext.enableVertexAttribArray(prg.colorAttribute);
}

function initBuffers()
{
  // Récupération/mise à jour des tableaux de données et index
  vertexBuffer = getVertexBufferWithVertices(vertices);
  colorBuffer = getVertexBufferWithVertices(colors);
  indexBuffer = getIndexBufferWithIndices(indices);
}

function drawScene()
{
  glContext.clearColor(0.9, 0.9, 0.9, 1.0);
  glContext.enable(glContext.DEPTH_TEST);
  glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
  glContext.viewport(0, 0, c_width, c_height);

  mat4.perspective(pMatrix, degToRad(53.0), c_width / c_height, 0.1, 1000.0);

  mat4.fromTranslation(mvMatrix, [xPos, yPos, zPos]);

  rotateModelViewMatrixUsingQuaternion(); //fonction issue de js/mouseMotionHandling.js (notre version du fichier est un peu modifiée)

  glContext.uniformMatrix4fv(prg.pMatrixUniform, false, pMatrix);
  glContext.uniformMatrix4fv(prg.mvMatrixUniform, false, mvMatrix);

  glContext.uniform1f(prg.pointSize, pointSize);

  glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
  glContext.vertexAttribPointer(prg.vertexPositionAttribute, 3, glContext.FLOAT, false, 0, 0);

  glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer);
  glContext.vertexAttribPointer(prg.colorAttribute, 4, glContext.FLOAT, false, 0, 0);

  glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, indexBuffer);

  if (document.getElementById("NoStrip").checked)
  {
    glContext.drawElements(glContext.TRIANGLES, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
  else if (document.getElementById("Strip").checked)
  {
    glContext.drawElements(glContext.TRIANGLE_STRIP, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
  else if (document.getElementById("Fan").checked)
  {
    glContext.drawElements(glContext.TRIANGLE_FAN, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
  else if (document.getElementById("Line").checked)
  {
    glContext.drawElements(glContext.LINES, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
  else if (document.getElementById("Line_Strip").checked)
  {
    glContext.drawElements(glContext.LINE_STRIP, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
  else if (document.getElementById("Line_Loop").checked)
  {
    glContext.drawElements(glContext.LINE_LOOP, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
  else if (document.getElementById("Point").checked)
  {
    glContext.drawElements(glContext.POINTS, indices.length, glContext.UNSIGNED_SHORT, 0);
  }
}

function initWebGL()
{
  glContext = getGLContext('webgl-canvas');
  ctx = WebGLDebugUtils.makeDebugContext(glContext);
  initProgram();

  initPoints();

  initBuffers();
  renderLoop();
}

function initPoints()
{
  // arrays init
  vertices = [];
  colors = [];
  indices = [];

  // Positionnement des "sommet"
  vertices.push(-1.0, -1.0, -2.0);
  vertices.push(1.0, -1.0, -2.0);
  vertices.push(0.0, 1.0, -2.0);

  // Application d'une couleur sur chaque "sommet"
  colors.push(1.0, 0.0, 0.0, 1.0);
  colors.push(0.0, 1.0, 0.0, 1.0);
  colors.push(0.0, 0.0, 1.0, 1.0);

  // Insertion des index de sommet dans le tableau
  indices.push(0, 1, 2);
}


function resetPoints()
{
  for (i = indices.length - 1; i = 0; deletePoint(i--));

  document.getElementById('lstVertices').innerHTML = '<legend>Vertice colors</legend>';
  document.getElementById('lstVertices').innerHTML += '<div id="vertex0">0: <input type="color" id="color0" value="#ff0000" onchange="updateColorArrayFromColorPicker(this.id, this.value)" /><button id="delete0" onclick="deletePoint(this.id)" onmouseover="inversePointColor(this.id)" onmouseout="inversePointColor(this.id)">delete</button></div>';
  document.getElementById('lstVertices').innerHTML += '<div id="vertex1">1: <input type="color" id="color0" value="#00ff00" onchange="updateColorArrayFromColorPicker(this.id, this.value)" /><button id="delete1" onclick="deletePoint(this.id)" onmouseover="inversePointColor(this.id)" onmouseout="inversePointColor(this.id)">delete</button></div>';
  document.getElementById('lstVertices').innerHTML += '<div id="vertex2">2: <input type="color" id="color0" value="#0000ff" onchange="updateColorArrayFromColorPicker(this.id, this.value)" /><button id="delete2" onclick="deletePoint(this.id)" onmouseover="inversePointColor(this.id)" onmouseout="inversePointColor(this.id)">delete</button></div>';

  initPoints();
  initBuffers();
  renderLoop();
}

function resetCamera()
{
  xPos = 0;
  yPos = 0;
  zPos = 0;
  rotX = 0;
  rotY = 0;
  rotZ = 0;
}

function deletePoint(id)
{
  var currId = !Number.isInteger(id) ? parseInt(id.substring(6)) : id;
  indices.splice(indices.length - 1, 1);

  colors.splice(currId * 4, 4);

  vertices.splice(currId * 3, 3);

  initBuffers();

  var element = document.getElementById('vertex' + indices.length);
  element.parentNode.removeChild(element);

  for (i = 0; i < indices.length; ++i)
  {
    document.getElementById('color' + i).value = rgbToHex(colors[i * 4] * 255, colors[i * 4 + 1] * 255, colors[i * 4 + 2] * 255);
  }
}

//Façon de mettre en évidence le point qu'on s'apprête à supprimmer
function inversePointColor(id)
{
  var currId = !Number.isInteger(id) ? parseInt(id.substring(6)) : id;
  for (var i = 0; i < 3; i++)
  {
    colors[currId * 4 + i] = 1.0 - colors[currId * 4 + i];
  }
  initBuffers();

}
