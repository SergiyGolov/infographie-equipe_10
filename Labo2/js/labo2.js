var vertexBuffer = null;
var indexBuffer = null;

// With current technique it can't be used
//var lampTopBuffer = null;
//var lampTopIndexBuffer = null;
//var lampBotBuffer = null;
//var lampBotIndexBuffer = null;

var indices = [];
var vertices = [];

// With current technique it can't be used
//var lampTopVertices = [];
//var lampTopIndices = [];
//var lampBotVertices = [];
//var lampBotIndices = [];

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var metaballs = [];


var NUM_METABALLS = 12;
var metaballsGPU = [4 * NUM_METABALLS];
var metaballsSqueezeGPU = [NUM_METABALLS];

var SPEED = 1;
var RADIUS = 60;
var MIN_RADIUS = 20;

// Update
var previousTime = new Date().getTime();

var canvas = null;
var WIDTH = 0;
var HEIGHT = 0;

var SQUEEZE_MAX = 400;

var LAMP_RADIUS_MIN = 0.6;
var LAMP_RADIUS_MAX = 0.8;
var LAMP_HEIGHT_TOP = 0.1;
var LAMP_HEIGHT_BOT = 0.1;

var light = [];
var lightActivated = true;


function initShaderParameters(prg) {
    // Récupération d'attributs depuis le context OpenGL
    prg.vertexPositionAttribute = glContext.getAttribLocation(prg, "aVertexPosition");

    prg.pMatrixUniform = glContext.getUniformLocation(prg, 'uPMatrix');
    prg.mvMatrixUniform = glContext.getUniformLocation(prg, 'uMVMatrix');

    prg.lampWidthMin = glContext.getUniformLocation(prg, 'uLampWidthMin');
    prg.lampWidthMax = glContext.getUniformLocation(prg, 'uLampWidthMax');
    prg.lampTopHeight = glContext.getUniformLocation(prg, 'uLampTopHeight');
    prg.lampBotHeight = glContext.getUniformLocation(prg, 'uLampBotHeight');


    prg.width = glContext.getUniformLocation(prg, 'uWIDTH');
    prg.height = glContext.getUniformLocation(prg, 'uHEIGHT');

    prg.lightActivated = glContext.getUniformLocation(prg, 'uLightActivated');

    prg.metaballs = glContext.getUniformLocation(prg, 'uMetaballs');
    prg.metaballsSqueeze = glContext.getUniformLocation(prg, 'uMetaballsSqueezes');
    prg.metaballsSqueezeMax = glContext.getUniformLocation(prg, 'uMetaballsSqueezeMax');

    prg.light = glContext.getUniformLocation(prg, 'uLight');

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
        var weight = radius / 100.0;
        metaballs.push({
            x: Math.random() * (WIDTH - 2 * radius) + radius,
            y: Math.random() * (HEIGHT - 2 * radius) + radius,
            vx: 0,
            vy: Math.random() * SPEED - SPEED / 2.0,
            fx: 0,
            fy: 0,
            r: radius,
            weight: weight,
            squeeze: 0
        });
    }

}

function initBuffers() {
    // Récupération/mise à jour des tableaux de données et index
    vertexBuffer = getVertexBufferWithVertices(vertices);
    indexBuffer = getIndexBufferWithIndices(indices);

    // With current technique it can't be used
    //lampTopBuffer = getVertexBufferWithVertices(lampTopVertices);
    //lampTopIndexBuffer = getIndexBufferWithIndices(lampTopIndices);
    //lampBotBuffer = getVertexBufferWithVertices(lampBotVertices);
    //lampBotIndexBuffer = getIndexBufferWithIndices(lampBotIndices);
}


function initWebGL() {
    canvas = document.getElementById("webgl-canvas");
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    light[0] = WIDTH / 2.0;
    light[1] = 0;
    //console.log(WIDTH);

    glContext = getGLContext('webgl-canvas');

    initProgram();

    initPoints();

    initMetaBalls();

    //initLamp(); With current technique it can't be used

    initBuffers();

    renderLoop();
}

function initLamp() {

    // -1.0 to 1.0

    /*
          1   3
         / \ / \
        0   2   4
    */

    let lampTopUpperLimit = -1.0;
    let lampTopBottomLimit = lampTopUpperLimit + LAMP_HEIGHT_TOP;

    lampTopVertices = [
        -LAMP_RADIUS_MAX, lampTopBottomLimit, // 0
        -LAMP_RADIUS_MIN, lampTopUpperLimit, // 1
        0, lampTopBottomLimit, // 2
        LAMP_RADIUS_MIN, lampTopUpperLimit, // 3
        LAMP_RADIUS_MAX, lampTopBottomLimit // 4
    ];

    for (let i = 0; i < lampTopVertices.length; i++) {
        lampTopIndices.push(i);
    }

    /*
        0   2   4
         \ / \ /
          1   3
    */

    let lampBotBottomLimit = 1.0;
    let lampBotUpperLimit = lampBotBottomLimit - LAMP_HEIGHT_BOT;


    lampBotVertices = [
        -LAMP_RADIUS_MAX, lampBotUpperLimit, // 0
        -LAMP_RADIUS_MIN, lampBotBottomLimit, // 1
        0, lampBotUpperLimit, // 2
        LAMP_RADIUS_MIN, lampBotBottomLimit, // 3
        LAMP_RADIUS_MAX, lampBotUpperLimit // 4
    ];

    for (let i = 0; i < lampBotVertices.length; i++) {
        lampBotIndices.push(i);
    }

}

function drawScene() {
    glContext.clearColor(0.0, 0.0, 0.0, 1.0);
    glContext.enable(glContext.DEPTH_TEST);
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    glContext.viewport(0, 0, c_width, c_height);

    glContext.uniformMatrix4fv(prg.pMatrixUniform, false, pMatrix);
    glContext.uniformMatrix4fv(prg.mvMatrixUniform, false, mvMatrix);

    glContext.uniform1f(prg.lampWidthMin, LAMP_RADIUS_MIN);
    glContext.uniform1f(prg.lampWidthMax, LAMP_RADIUS_MAX);
    glContext.uniform1f(prg.lampTopHeight, LAMP_HEIGHT_TOP);
    glContext.uniform1f(prg.lampBotHeight, LAMP_HEIGHT_BOT);

    glContext.uniform1f(prg.lightActivated, (lightActivated) ? 1.0 : 0.0);

    glContext.uniform1f(prg.width, WIDTH);
    glContext.uniform1f(prg.height, HEIGHT);

    glContext.uniform1f(prg.metaballsSqueezeMax, SQUEEZE_MAX);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
    glContext.vertexAttribPointer(prg.vertexPositionAttribute, 2, glContext.FLOAT, false, 2 * 4, 0);
    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, indexBuffer);

    let lampTopHeight = LAMP_HEIGHT_TOP * HEIGHT;
    let lampBotHeight = LAMP_HEIGHT_BOT * HEIGHT;
    let greaterRadius = (LAMP_RADIUS_MAX / 2.0) * WIDTH;
    let halfWidth = WIDTH / 2.0;

    // Get seconds elapsed
    let dt = (new Date().getTime() - previousTime) / 1000.0;
    let dt2 = dt * dt;

    // Update positions and speeds
    for (let i = 0; i < NUM_METABALLS; i++) {
        var mb = metaballs[i];

        // Reset force
        mb.fx = 0;
        mb.fy = 0;

        // Apply Gravity
        mb.fy += -9.81 * mb.weight;



        // Apply Lava Lamp Force
        if (lightActivated && (Math.random() > 0.3))
            mb.fy += ((365 * mb.r) / (mb.y * 15) + mb.weight);

        if (lightActivated && (Math.random() > 0.7))
            mb.fx += 10 * (Math.random() * 2 - 1);

        // Get acceleration
        let ax = mb.fx / mb.weight;
        let ay = mb.fy / mb.weight;

        // Get new position
        let nextX = mb.x + (mb.vx * dt) + (ax * dt2);
        let nextY = mb.y + (mb.vy * dt) + (ay * dt2);

        // Get new speed
        mb.vx = (nextX - mb.x) / dt;
        mb.vy = (nextY - mb.y) / dt;

        if (nextY < lampBotHeight) {
            nextY = lampBotHeight;
            if (mb.vy < -5)
                mb.squeeze = SQUEEZE_MAX; // tick number for squeeze animation
            mb.vy = 0;
        } else if (nextY > HEIGHT - lampTopHeight) {
            nextY = HEIGHT - lampTopHeight;
            if (mb.vy > 5)
                mb.squeeze = SQUEEZE_MAX; // tick number for squeeze animation
            mb.vy = 0;
        } else {
            if (nextY > HEIGHT - lampTopHeight - mb.radius || nextY < lampBotHeight + mb.radius)
                mb.squeeze += 3;
            else
                mb.squeeze -= 3;
        }


        // Border constraints
        if (nextX - mb.r < (halfWidth - greaterRadius) || nextX + mb.r > (halfWidth + greaterRadius)) {
            mb.vx = 0;
        }

        // Set new position
        mb.x = nextX;
        mb.y = nextY;

        // Reset previous time
        previousTime = new Date().getTime();
    }


    for (var i = 0; i < NUM_METABALLS; i++) {
        var baseIndex = 4 * i;
        var mb = metaballs[i];
        metaballsGPU[baseIndex + 0] = mb.x;
        metaballsGPU[baseIndex + 1] = mb.y;
        metaballsGPU[baseIndex + 2] = mb.r;
        metaballsGPU[baseIndex + 3] = mb.weight;
        metaballsSqueezeGPU[i] = mb.squeeze;
    }

    glContext.uniform4fv(prg.metaballs, metaballsGPU);
    glContext.uniform1fv(prg.metaballsSqueeze, metaballsSqueezeGPU);

    glContext.uniform2fv(prg.light, light);
    glContext.drawElements(glContext.TRIANGLE_STRIP, indices.length, glContext.UNSIGNED_SHORT, 0);

    // Draw lamp

    /* With current technique it can't be used

    // Top part
    glContext.bindBuffer(glContext.ARRAY_BUFFER, lampTopBuffer);
    glContext.vertexAttribPointer(prg.vertexPositionAttribute, 2, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, lampTopIndexBuffer);
    glContext.drawElements(glContext.TRIANGLE_STRIP, lampTopIndices.length, glContext.UNSIGNED_SHORT, 0);

    // Bot part
    glContext.bindBuffer(glContext.ARRAY_BUFFER, lampBotBuffer);
    glContext.vertexAttribPointer(prg.vertexPositionAttribute, 2, glContext.FLOAT, false, 0, 0);

    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, lampBotIndexBuffer);
    glContext.drawElements(glContext.TRIANGLE_STRIP, lampBotIndices.length, glContext.UNSIGNED_SHORT, 0);
    */
}

function toggleLight() {
    lightActivated = !lightActivated;
}