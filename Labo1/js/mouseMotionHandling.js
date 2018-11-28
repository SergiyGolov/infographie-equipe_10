/*******************************************************************************
		Mouse motion handling
*******************************************************************************/

// get a reference to the webgl canvas
var myCanvas = document.getElementById('webgl-canvas');
myCanvas.onmousemove = handleMouseMove;
myCanvas.onmousedown = handleMouseDown;
myCanvas.onmouseup = handleMouseUp;
myCanvas.onmousewheel = handleMouseWheel;


// this variable will tell if the mouse is being moved while pressing the button
var rotY = 0; //rotation on the Y-axis (in degrees)
var rotX = 0; //rotation on the X-axis (in degrees)
var rotZ = 0;
var dragging = false;
var oldMousePos = {
  x: 0,
  y: 0
};
var mousePos;
var rotSpeed = 1.0; //rotation speed
var mouseButton;



function handleMouseWheel(event)
{
  var wheel = event.wheelDelta / 120; //n or -n

  if (dragging)
  {
    rotZ += wheel > 0 ? 2 * rotSpeed : wheel < 0 ? 2 * -rotSpeed : 0;
  }
  else
  {
    zPos += (wheel / 2) / 10;
  }

  event.preventDefault();
}




function handleMouseMove(event)
{
  event = event || window.event; // IE-ism

  mousePos = {
    x: event.clientX,
    y: event.clientY
  };
  if (dragging)
  {


    dX = mousePos.x - oldMousePos.x;
    dY = mousePos.y - oldMousePos.y;

    //console.log((mousePos.x - oldMousePos.x) + ", " + (mousePos.y - oldMousePos.y)); //--- DEBUG LINE ---


    rotY += dX > 0 ? rotSpeed : dX < 0 ? -rotSpeed : 0;
    rotX += dY > 0 ? rotSpeed : dY < 0 ? -rotSpeed : 0;
    oldMousePos = mousePos;
  }
}

function handleMouseDown(event)
{
  mouseButton = event.button;
  if (mouseButton == 2) // 2=>right mouse button
  {
    oldMousePos.x = oldMousePos.y = 0;
    dragging = true;
  }
}

function handleMouseUp(event)
{
  mouseButton = event.button;

  if (mouseButton == 2)
  {
    dragging = false;
  }
}

// in the next function 'currentRy' is usefull for the exercice 8-9
var currentRy = 0; //keeps the current rotation on y, used to keep the billboards orientation



function rotateModelViewMatrixUsingQuaternion(stop)
{
  rotateMatrix(stop, mvMatrix);

}


function rotateMatrix(stop, matrix)
{
  stop = typeof stop !== 'undefined' ? stop : false;
  //use quaternion rotations for the rotation of the object with the mouse
  /*angle = degToRad(rotY);
	currentRy += angle;
	rotYQuat = quat.create([0, Math.sin(angle/2), 0, Math.cos(angle/2)]);

	angle = degToRad(rotX);
	rotXQuat = quat4.create([Math.sin(angle/2), 0, 0, Math.cos(angle/2)]);

	myQuaternion = quat4.multiply(rotYQuat, rotXQuat);
	mvMatrix = mat4.multiply(quat4.toMat4( myQuaternion ), mvMatrix);
*/
  rx = degToRad(rotX);
  ry = degToRad(rotY);
  rz = degToRad(rotZ);

  rotXQuat = quat.create();
  quat.setAxisAngle(rotXQuat, [1, 0, 0], rx);

  rotYQuat = quat.create();
  quat.setAxisAngle(rotYQuat, [0, 1, 0], ry);

  rotZQuat = quat.create();
  quat.setAxisAngle(rotZQuat, [0, 0, 1], rz);

  myQuaternion = quat.create();
  quat.multiply(myQuaternion, rotYQuat, rotXQuat);
  quat.multiply(myQuaternion, rotZQuat, myQuaternion);

  rotationMatrix = mat4.create();
  mat4.identity(rotationMatrix);
  mat4.fromQuat(rotationMatrix, myQuaternion);
  mat4.multiply(matrix, matrix, rotationMatrix);
  //reset rotation values, otherwise rotation accumulates
  if (stop)
  {
    rotX = 0.;
    rotY = 0.;
  }
}
