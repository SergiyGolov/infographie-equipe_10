var vertexBuffer = null;
var indexBuffer = null;


var indices = [];
var vertices = [];


var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var metaballs = [];


var NUM_METABALLS = 20;
var dataToSendToGPU = [4 * NUM_METABALLS];

var SPEED = 1;
var RADIUS = 100;
var MIN_RADIUS = 50;


var canvas =null;
var WIDTH =0;
var HEIGHT =0;


function initShaderParameters(prg) {
    // Récupération d'attributs depuis le context OpenGL
    prg.vertexPositionAttribute = glContext.getAttribLocation(prg, "aVertexPosition");

    prg.pMatrixUniform = glContext.getUniformLocation(prg, 'uPMatrix');
    prg.mvMatrixUniform = glContext.getUniformLocation(prg, 'uMVMatrix');

    prg.metaballs = glContext.getUniformLocation(prg, 'uMetaballs');

    // Activation des tabeaux de données des sommets comme "attribut" OpenGL
    glContext.enableVertexAttribArray(prg.vertexPositionAttribute);
}


function initPoints() {
    // arrays init
    vertices = [
        -1.0, 1.0, // top left
        -1.0, -1.0, // bottom left
        1.0, 1.0, // top right
        1.0, -1.0 // bottom right
    ];

    for (let i = 0; i < 4; i++) {
        indices.push(i);
    }

}

function initMetaBalls() {
    /**
     * Simulation setup
     */
    
    for (var i = 0; i < NUM_METABALLS; i++) {
        var radius = Math.random() * RADIUS + MIN_RADIUS;
        var weight = 1;
        metaballs.push({
            x: Math.random() * (WIDTH - 2 * radius) + radius,
            y: Math.random() * (HEIGHT - 2 * radius) + radius,
            vy: Math.random() * SPEED - SPEED / 2.0,
            r: radius,
            weight: weight
        });
    }
}

function initBuffers() {
    // Récupération/mise à jour des tableaux de données et index
    vertexBuffer = getVertexBufferWithVertices(vertices);
    indexBuffer = getIndexBufferWithIndices(indices);
}


function initWebGL() {
    canvas = document.getElementById("webgl-canvas");
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    glContext = getGLContext('webgl-canvas');
    
    initProgram();

    initPoints();

    initMetaBalls();

    initBuffers();

    renderLoop();
}


function drawScene() {
    glContext.clearColor(0.0, 0.0, 0.0, 1.0);
    glContext.enable(glContext.DEPTH_TEST);
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    glContext.viewport(0, 0, c_width, c_height);

    glContext.uniformMatrix4fv(prg.pMatrixUniform, false, pMatrix);

    glContext.uniformMatrix4fv(prg.mvMatrixUniform, false, mvMatrix);


    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
    glContext.vertexAttribPointer(prg.vertexPositionAttribute, 2, glContext.FLOAT, false, 2 * 4, 0);

    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Update positions and speeds
    for (let i = 0; i < NUM_METABALLS; i++) {
        var mb = metaballs[i];

        mb.y += mb.vy;
        if (mb.y - mb.r < 0) {
            mb.y = mb.r + 1;
            mb.vy = Math.abs(mb.vy);
        } else if (mb.y + mb.r > HEIGHT) {
            mb.y = HEIGHT - mb.r;
            mb.vy = -Math.abs(mb.vy);
        }
    }


    for (var i = 0; i < NUM_METABALLS; i++) {
        var baseIndex = 4 * i;
        var mb = metaballs[i];
        dataToSendToGPU[baseIndex + 0] = mb.x;
        dataToSendToGPU[baseIndex + 1] = mb.y;
        dataToSendToGPU[baseIndex + 2] = mb.r;
        dataToSendToGPU[baseIndex + 3] = mb.weight;
    }

    glContext.uniform4fv(prg.metaballs, dataToSendToGPU);

    glContext.drawElements(glContext.TRIANGLE_STRIP, indices.length, glContext.UNSIGNED_SHORT, 0);
}