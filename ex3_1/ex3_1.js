var vertexBuffer = null;
var indexBuffer = null;
var colorBuffer = null;
var indices = [];
var vertices = [];
var colors = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var pRotateZMatrix = mat4.create();
var pRotateXMatrix = mat4.create();
var pRotateYMatrix = mat4.create();

var fsVertices;
var fsColors;
var fsTriangles;

function initShaderParameters(prg) {
	// Récupération d'attributs depuis le context OpenGL
	prg.vertexPositionAttribute = glContext.getAttribLocation(prg, "aVertexPosition");
	prg.colorAttribute = glContext.getAttribLocation(prg, "aColor");
	prg.pMatrixUniform = glContext.getUniformLocation(prg, 'uPMatrix');
	prg.mvMatrixUniform = glContext.getUniformLocation(prg, 'uMVMatrix');

	// Activation des tabeaux de données des sommets comme "attribut" OpenGL
	glContext.enableVertexAttribArray(prg.vertexPositionAttribute);
	glContext.enableVertexAttribArray(prg.colorAttribute);
}
function initBuffers() {

	// arrays init
	vertices = [];
	colors = [];
	indices = [];

	// Positionnement des "sommet"
	vertices.push(-1.0, -1.0, 0.0);
	vertices.push(1.0, -1.0, 0.0);
	vertices.push(0.0, 1.0, 0.0);

	/*
	NB: Les coordonnées sont clotûrées entre les bornes -1.0 et 1.0
	-1.0 étant le plus à gauche ou en haut
	1.0 étant le plus à droite ou en bas

	Les axes étant :
	(z) ---> (x)
	|
	v
	(y)
	 */

	// Application d'une couleur sur chaque "sommet"
	colors.push(1.0, 0.0, 0.0, 1.0);
	colors.push(0.0, 1.0, 0.0, 1.0);
	colors.push(0.0, 0.0, 1.0, 1.0);

	// Insertion des index de sommet dans le tableau
	indices.push(0, 1, 2);

	// Récupération des tableaux de données et index
	vertexBuffer = getVertexBufferWithVertices(vertices);
	colorBuffer = getVertexBufferWithVertices(colors);
	indexBuffer = getIndexBufferWithIndices(indices);
}
function drawScene() {
	glContext.clearColor(0.9, 0.9, 0.9, 1.0);
	glContext.enable(glContext.DEPTH_TEST);
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
	glContext.viewport(0, 0, c_width, c_height);

	if (!document.getElementById("rotationContinue").checked) {
		mat4.identity(pMatrix); // Si l'on commente cette ligne, la rotation devient continue
	}
	xAngle += xRotationOffset;
	yAngle += yRotationOffset;
	zAngle += zRotationOffset;
	mat4.fromXRotation(pRotateXMatrix, xAngle);
	mat4.fromYRotation(pRotateYMatrix, yAngle);
	mat4.fromZRotation(pRotateZMatrix, zAngle);
	mat4.multiply(pMatrix, pMatrix, pRotateXMatrix);
	mat4.multiply(pMatrix, pMatrix, pRotateYMatrix);
	mat4.multiply(pMatrix, pMatrix, pRotateZMatrix);

	mat4.identity(mvMatrix);
	mat4.perspective(10, c_width / c_height, 0.1, 10000.0,pMatrix);

	glContext.uniformMatrix4fv(prg.pMatrixUniform, false, pMatrix);
	glContext.uniformMatrix4fv(prg.mvMatrixUniform, false, mvMatrix);

	glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
	glContext.vertexAttribPointer(prg.vertexPositionAttribute, 3, glContext.FLOAT, false, 0, 0);

	glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer);
	glContext.vertexAttribPointer(prg.colorAttribute, 4, glContext.FLOAT, false, 0, 0);

	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, indexBuffer);

	if (document.getElementById("NoStrip").checked) {
		glContext.drawElements(glContext.TRIANGLES, indices.length, glContext.UNSIGNED_SHORT, 0);
	} else {
		glContext.drawElements(glContext.TRIANGLE_STRIP, indices.length, glContext.UNSIGNED_SHORT, 0);
	}
}

function displayVertices() {
	var innerHTML = "<table><tr><th>Vertice number</th><th>Values</th></tr>";
	for (i = 0; i < vertices.length; ) {
		innerHTML += "<tr><td>" + parseInt(i / 3) + "</td><td><p>";
		innerHTML += 'x <input type="number" id="v' + (i) + '" min="-1.0" max="1.0" value="' + vertices[i++] + '" step="0.1" /><br>';
		innerHTML += 'y <input type="number" id="v' + (i) + '" min="-1.0" max="1.0" value="' + vertices[i++] + '" step="0.1" /><br>';
		innerHTML += 'z <input type="number" id="v' + (i) + '" min="-1.0" max="1.0" value="' + vertices[i++] + '" step="0.1" /><br>';
		innerHTML += '</p></td></tr>';
	}
	innerHTML += '</table>';
	fsVertices.innerHTML = innerHTML;
}

function displayColors() {
	var innerHTML = "<table><tr><th>Color number</th><th>Values</th></tr>";
	for (i = 0; i < colors.length; ) {
		innerHTML += "<tr><td>" + parseInt(i / 4) + "</td><td><p>";
		innerHTML += 'r <input type="number" id="c' + (i) + '" min="0.0" max="1.0" value="' + colors[i++] + '" step="0.1" /><br>';
		innerHTML += 'g <input type="number" id="c' + (i) + '" min="0.0" max="1.0" value="' + colors[i++] + '" step="0.1" /><br>';
		innerHTML += 'b <input type="number" id="c' + (i) + '" min="0.0" max="1.0" value="' + colors[i++] + '" step="0.1" /><br>';
		innerHTML += 'a <input type="number" id="c' + (i) + '" min="0.0" max="1.0" value="' + colors[i++] + '" step="0.1" /><br>';
		innerHTML += '</p></td></tr>';
	}
	innerHTML += '</p></td></tr></table>';
	fsColors.innerHTML = innerHTML;
}

function displayTriangles() {
	var innerHTML = "<table><tr><th>Triangle number</th><th>Values</th></tr>";
	for (i = 0; i < indices.length; ) {
		innerHTML += '<tr><td>' + (i) + '</td><td><input type="number" id="i' + (i) + '" min="0" max="100" value="' + indices[i++] + '" step="1" /></td></tr>';
	}
	innerHTML += '</table>';
	fsTriangles.innerHTML = innerHTML;
}

function init() {

	// init buffers
	initBuffers();

	// Refresh display
	displayVertices();
	displayColors();
	displayTriangles();
}

function createVertice() {
	vertices.push(0, 0, 0);
	colors.push(0, 0, 0, 1);
	vertexBuffer = getVertexBufferWithVertices(vertices);
	colorBuffer = getVertexBufferWithVertices(colors);
	displayVertices();
	displayColors();
}

function addTriangle() {
	var x = parseInt(vertices.length / 3) - 1;
	indices.push(x);
	indexBuffer = getIndexBufferWithIndices(indices);
	displayTriangles();
}

function updateCanvas() {

	// Read data from UI -> no security
	for (i = 0; i < vertices.length; i++) {
		vertices[i] = document.getElementById("v" + i).value;
	}
	for (i = 0; i < colors.length; i++) {
		colors[i] = document.getElementById("c" + i).value;
	}

	for (i = 0; i < indices.length; i++) {
		if (document.getElementById("i" + i).value >= parseInt(vertices.length / 3)) {
			document.getElementById("i" + i).value = 0;
			alert(document.getElementById("i" + i).value);
		}
		indices[i] = document.getElementById("i" + i).value;
	}

	vertexBuffer = getVertexBufferWithVertices(vertices);
	colorBuffer = getVertexBufferWithVertices(colors);
	indexBuffer = getIndexBufferWithIndices(indices);

	displayVertices();
	displayColors();
	displayTriangles();
}

function initWebGL() {
	glContext = getGLContext('webgl-canvas');
	initProgram();
	initBuffers();
	renderLoop();

	fsVertices = document.getElementById("fsVertices");
	fsColors = document.getElementById("fsColors");
	fsTriangles = document.getElementById("fsTriangles");

	displayVertices();
	displayColors();
	displayTriangles();
}

function stopRotation() {
	zRotationOffset=0;
	yRotationOffset=0;
	xRotationOffset=0;

	zAngle=0;
	yAngle=0;
	xAngle=0;
}
