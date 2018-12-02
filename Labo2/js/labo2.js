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


var NUM_METABALLS = 15;
var metaballsGPU = [4 * NUM_METABALLS];
var metaballsSqueezeGPU=[NUM_METABALLS];

var SPEED = 1; 
var RADIUS = 60;
var MIN_RADIUS = 20;


var canvas = null;
var WIDTH = 0;
var HEIGHT = 0;

var SQUEEZE_MAX=250;

var LAMP_RADIUS_MIN = 0.6;
var LAMP_RADIUS_MAX = 0.8;
var LAMP_HEIGHT_TOP = 0.1;
var LAMP_HEIGHT_BOT = 0.1;


function initShaderParameters(prg) {
    // Récupération d'attributs depuis le context OpenGL
    prg.vertexPositionAttribute = glContext.getAttribLocation(prg, "aVertexPosition");

    prg.pMatrixUniform = glContext.getUniformLocation(prg, 'uPMatrix');
    prg.mvMatrixUniform = glContext.getUniformLocation(prg, 'uMVMatrix');

    prg.lampWidthMin = glContext.getUniformLocation(prg, 'uLampWidthMin');
    prg.lampWidthMax = glContext.getUniformLocation(prg, 'uLampWidthMax');
    prg.lampTopHeight = glContext.getUniformLocation(prg, 'uLampTopHeight');
    prg.lampBotHeight = glContext.getUniformLocation(prg, 'uLampBotHeight');

    prg.metaballs = glContext.getUniformLocation(prg, 'uMetaballs');
    prg.metaballsSqueeze = glContext.getUniformLocation(prg, 'uMetaballsSqueezes');
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
        var weight = 1;
        metaballs.push({
            x: Math.random() * (WIDTH - 2 * radius) + radius,
            y: Math.random() * (HEIGHT - 2 * radius) + radius,
            vy: Math.random() * SPEED - SPEED / 2.0,
            r: radius,
            weight: weight,
            squeeze:0
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

    console.log(WIDTH);

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
    glContext.clearColor(1.0, 1.0, 1.0, 1.0);
    glContext.enable(glContext.DEPTH_TEST);
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    glContext.viewport(0, 0, c_width, c_height);

    glContext.uniformMatrix4fv(prg.pMatrixUniform, false, pMatrix);
    glContext.uniformMatrix4fv(prg.mvMatrixUniform, false, mvMatrix);

    glContext.uniform1f(prg.lampWidthMin, LAMP_RADIUS_MIN);
    glContext.uniform1f(prg.lampWidthMax, LAMP_RADIUS_MAX);
    glContext.uniform1f(prg.lampTopHeight, LAMP_HEIGHT_TOP);
    glContext.uniform1f(prg.lampBotHeight, LAMP_HEIGHT_BOT);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
    glContext.vertexAttribPointer(prg.vertexPositionAttribute, 2, glContext.FLOAT, false, 2 * 4, 0);
    glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, indexBuffer);

    let lampTopHeight = LAMP_HEIGHT_TOP * HEIGHT;
    let lampBotHeight = LAMP_HEIGHT_BOT * HEIGHT;
    let greaterRadius = (LAMP_RADIUS_MAX / 2.0) * WIDTH;
    let halfWidth = WIDTH / 2.0;

    // Update positions and speeds
    for (let i = 0; i < NUM_METABALLS; i++) {
        var mb = metaballs[i];

        if (mb.squeeze == 0) {
            mb.y += mb.vy;
            if (mb.y - mb.r < 0) {
                mb.y = mb.r + 1;
                mb.vy = Math.abs(mb.vy) + random() - random();
            } else if (mb.y + mb.r  > HEIGHT) {
                mb.y = HEIGHT - mb.r;
                mb.saveVy=-mb.vy;
                mb.vy = 0;
                mb.squeeze = SQUEEZE_MAX; // tick number for squeeze animation
            }
        } else {
            mb.squeeze--;
            if (mb.squeeze == 0) {
                mb.vy = mb.saveVy;
            }

        }

        // Constraints
        if(mb.y < lampBotHeight || mb.y > HEIGHT - lampTopHeight)
        {
            mb.vy = -mb.vy;
        }    
        
        console.log(halfWidth - greaterRadius);
        if(mb.x - mb.r < (halfWidth - greaterRadius))
        {
            mb.x += 0.1;
        } 
        else if(mb.x + mb.r > (halfWidth + greaterRadius))
        {
            mb.x -= 0.1;
        }
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
    var light = [];
    light[0] = WIDTH / 2.0;
    light[1] = 0;
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