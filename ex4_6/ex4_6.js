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
	vertices.push(-0.8, -0.8, 0.0);
	vertices.push( 0.8, -0.8, 0.0);
	vertices.push(-0.8,  0.8, 0.0);
	vertices.push( 0.8,  0.8, 0.0);

	// Application d'une couleur sur chaque "sommet"
	colors.push(0.0, 0.0, 0.0, 1.0);
	colors.push(0.0, 0.0, 0.0, 1.0);
	colors.push(0.0, 0.0, 0.0, 1.0);
	colors.push(0.0, 0.0, 0.0, 1.0);

	// Insertion des index de sommet dans le tableau
	indices.push(0, 1, 2, 3);

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

	mat4.identity(pMatrix); // Si l'on commente cette ligne, la rotation devient continue
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

	glContext.drawElements(glContext.TRIANGLE_STRIP, indices.length, glContext.UNSIGNED_SHORT, 0);

}

function initWebGL() {
	glContext = getGLContext('webgl-canvas');
	initProgram();
	initBuffers();
	renderLoop();
}
