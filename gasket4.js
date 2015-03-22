	
var canvas;
var gl;

var shadeBool=1;

var points = [];
var colors = [];
var normalsArray = [];

var NumTimesToSubdivide = 4;

var mouse_mode = true;

var posX=0, posY=0;
var numVerts = 0;
var numPlaneVerts = 0;

var rotateMatrix = mat4( 1, 0, 0, 0,
						0, 1, 0, 0,
						0, 0, 1, 0,
						0, 0, 0, 1);

var lightPosition = vec4(0.0, 2.0, -2.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var lightX=0, lightY=2, lightZ=-2;

var ctm;
var ambientColor, diffuseColor, specularColor;

var start=true;

var trans1=0, trans2=0;

var left = -2.0;
var right = 2.0;
var ytop = 2.0;
var bottom = -2.0;
var near = -10;
var far = 10;
var r = 4.0, theta=0.0, phi=0.0;
var fov = 75.0;
var at = vec3(0.0,0.0,0.0);
var up = vec3(0.0,1.0,0.0);
var eye = vec3(r*Math.sin(theta)*Math.cos(phi), 
        r*Math.sin(theta)*Math.sin(phi), r*Math.cos(theta));
        
eye[2] -= 2.8;
        
var modelViewMatrixPlane = lookAt(eye, at, up);
var modelViewMatrix = lookAt(eye, at, up);
var projectionMatrix = perspective(135, 1, 0.1, 1000);


window.onload = function init()
{
	
	// Load canvas.
	
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
   
    // Configure webgl and load shaders.
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Calculate shading values.
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    // Draw tetra.
    
    tetrahedron( va, vb, vc, vd, NumTimesToSubdivide);
	numVerts = points.length;
	
	// Draw plane.
	
	drawPlane();
	numPlaneVerts = points.length - numVerts;
    
    // Create and initialize buffers.
    
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	// Set up perspectives.
	
	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );


	// ROTATION BUTTONS
	
		
	document.getElementById("rotateX").onclick = function(event) {
		var phi=.2;
		rotate = mat4( 1.0,  0.0,  0.0,  0.0,
                      	0.0,  Math.cos(phi),  -1*Math.sin(phi), 0.0,
                      	0.0,  Math.sin(phi),  Math.cos(phi), 0.0,
                      	0.0,  0.0,  0.0, 1.0 );
				
		modelViewMatrix = mult(modelViewMatrix, rotate);
		
	};
	
	document.getElementById("rotateY").onclick = function(event) {
		var phi=.2;
		rotate = mat4( Math.cos(phi),  -1*Math.sin(phi),  0.0,  0.0,
                      	Math.sin(phi),  Math.cos(phi),  0.0, 0.0,
                      	0.0,  0.0,  1.0, 0.0,
                      	0.0,  0.0,  0.0, 1.0 );
				
		modelViewMatrix = mult(modelViewMatrix, rotate);
	};
	
	document.getElementById("rotateZ").onclick = function(event) {
		var phi=.2;
		rotate = mat4( Math.cos(phi),  0.0,  Math.sin(phi),  0.0,
                      	0.0,  1.0,  0.0, 0.0,
                      	-1*Math.sin(phi),   0.0,  Math.cos(phi), 0.0,
                      	0.0,  0.0,  0.0, 1.0 );
				
		modelViewMatrix = mult(modelViewMatrix, rotate);		
	};
	
	
	// FOV BUTTONS
	
	
	document.getElementById("increase").onclick = function(event) {
		fov += 5;
		
		projectionMatrix = perspective(fov, 1, 0.1, 1000);
	};
	
	document.getElementById("decrease").onclick = function(event) {
		fov -= 5;
		
		projectionMatrix = perspective(fov, 1, 0.1, 1000);
	};
	
	
	// TRANSLATE/ROTATE MOUSE SWITCH
	
	
	document.getElementById("mouseMode").onclick = function(event) {
	
		if(mouse_mode) {
			mouse_mode = false;
			document.getElementById("mouseMode").innerHTML = "Rotate Mode";
		}
		else {
			mouse_mode = true;
			document.getElementById("mouseMode").innerHTML = "Translate Mode";
		}
	};
	
	
	// KEY EVENTS
	
	
	window.onkeydown = function( event ) {
		
		// Adjust tetrahedron based on key.
		
        var key = String.fromCharCode(event.keyCode);
        switch( key ) {
        	case 'A':
        		at[0] -= .05;
        		break;
        	case 'D':
        		at[0] += .05;
        		break;
        	
        	case 'W':
        		eye[2] -= .05;
        		break;
        	case 'S':
        		eye[2] += .05;
        		break;	
        	case 'R':
        		eye[1] += .05;
        		break;
        	case 'F':
        		eye[1] -= .05;
        		break;
        
        	case 'U':
        		//lightPosition = vec4(0.0, 2.0, 2.0, 0.0 );
        		lightZ += .2;
        		break;
        	case 'J':
        		lightZ -= .2;
        		break;
        	case 'H':
        		lightX -= .2;
        		break;
        	case 'K':
        		lightX += .2;
        		break;
        	case 'O':
        		lightY += .2;
        		break;
        	case 'L':
        		lightY -= .2;
        		break;
        
        
        }
        
        lightPosition = vec4(lightX, lightY, lightZ, 0.0 );
        
        gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
        modelViewMatrix = lookAt(eye, at, up);
    };

	canvas.onmousemove = function (event) {
		
		if(mouse_mode) {
			
			if(posX == 0 && posY == 0) {
				posX = event.clientX;
				posY = event.clientY;
			}
			
			// ROTATE MODE
			
			else {
				var posXUpdate = event.clientX;
				var posYUpdate = event.clientY;
				
				// Left
				if(posXUpdate < posX) {
					var phi=.05;
					rotate = mat4( Math.cos(phi),  0.0,  -1*Math.sin(phi),  0.0,
                    				0.0,  1.0,  0.0, 0.0,
                    				Math.sin(phi),   0.0,  Math.cos(phi), 0.0,
                   					0.0,  0.0,  0.0, 1.0 );
				
					modelViewMatrix = mult(modelViewMatrix, rotate);
					//rotateMatrix = mult(rotateMatrix, rotate);
				}
				
				// Right
				else if(posXUpdate > posX) {
					var phi=.05;
					var rotate = mat4( Math.cos(phi),  0.0,  Math.sin(phi),  0.0,
                  					0.0,  1.0,  0.0, 0.0,
                   					-1*Math.sin(phi),   0.0,  Math.cos(phi), 0.0,
                					0.0,  0.0,  0.0, 1.0 );
				
					modelViewMatrix = mult(modelViewMatrix, rotate);
				}
				// Down
				if(posYUpdate < posY) {
					var phi=.05;
					var rotate = mat4( 1.0,  0.0,  0.0,  0.0,
                  					0.0,  Math.cos(phi),  Math.sin(phi), 0.0,
                   					0.0,   -1*Math.sin(phi),  Math.cos(phi), 0.0,
                					0.0,  0.0,  0.0, 1.0 );
				
					modelViewMatrix = mult(modelViewMatrix, rotate);
				}
				// Up
				else if(posYUpdate > posY) {
					var phi=.05;
					var rotate = mat4( 1.0,  0.0,  0.0,  0.0,
                  					0.0,  Math.cos(phi),  -1*Math.sin(phi), 0.0,
                   					0.0,   Math.sin(phi),  Math.cos(phi), 0.0,
                					0.0,  0.0,  0.0, 1.0 );
				
					modelViewMatrix = mult(modelViewMatrix, rotate);
				}
				
				
				posX = posXUpdate;
				posY = posYUpdate;
			}
			
		}
		
		// TRANSLATE MODE
		
		else {
			
			if(posX == 0 && posY == 0) {
				posX = event.clientX;
				posY = event.clientY;
			}
			
			else {
				
				var posXUpdate = event.clientX;
				var posYUpdate = event.clientY;
				
				// Left
				if(posXUpdate < posX) {
					translate = mat4( 1.0,  0.0,  0.0, -0.05,
                      				  0.0,  1.0,  0.0, 0.0,
                      				  0.0,  0.0,  1.0, 0.0,
                      				  0.0,  0.0,  0.0, 1.0 );
					modelViewMatrix = mult(modelViewMatrix, translate);
				}
				// Right
				else if(posXUpdate > posX) {
					translate = mat4( 1.0,  0.0,  0.0, 0.05,
                      				  0.0,  1.0,  0.0, 0.0,
                      				  0.0,  0.0,  1.0, 0.0,
                      				  0.0,  0.0,  0.0, 1.0 );
					modelViewMatrix = mult(modelViewMatrix, translate);
				}
				// Down
				if(posYUpdate < posY) {
					translate = mat4( 1.0,  0.0,  0.0, 0.0,
                      				  0.0,  1.0,  0.0, 0.05,
                      				  0.0,  0.0,  1.0, 0.0,
                      				  0.0,  0.0,  0.0, 1.0 );
					modelViewMatrix = mult(modelViewMatrix, translate);
				}
				// Up
				else if(posYUpdate > posY) {
					translate = mat4( 1.0,  0.0,  0.0, 0.0,
                      				  0.0,  1.0,  0.0, -0.05,
                      				  0.0,  0.0,  1.0, 0.0,
                      				  0.0,  0.0,  0.0, 1.0 );
					modelViewMatrix = mult(modelViewMatrix, translate);
				}
				posX = posXUpdate;
				posY = posYUpdate;
			}
		}
	}
	shadeBool=1;
	
	gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
	gl.uniform1f( gl.getUniformLocation(program, 
       "shadeBool"),shadeBool );
	
	shadeBool=1;
    update();
};


function triangle( a, b, c )
{

    // add colors and vertices for one triangle

    var baseColors = [
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0)
    ];

    colors.push( baseColors[0] );
    colors.push( baseColors[1] );
    colors.push( baseColors[2] );
    points.push( a );
    points.push( b );  
    points.push( c );
    
    normalsArray.push(a);
    normalsArray.push(b);
    normalsArray.push(c);
    
}

function tetrahedron( a, b, c, d, n )
{
    // tetrahedron with each side using
    // a different color
    
    divideTriangle( a, b, c, n );
    divideTriangle( d, c, b, n );
    divideTriangle( a, d, b, n );
    divideTriangle( a, c, d, n );
}

function divideTriangle( a, b, c, count )
{
    // check for end of recursion
    
    if ( count > 0 ) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(a, ab, ac, count-1);
        divideTriangle(ab, b, bc, count-1);
        divideTriangle(bc, c, ac, count-1);
        divideTriangle(ab, bc, ac, count-1);
        
    }
    else {
    	triangle(a, b, c);
    }
}


function square( a, b, c, d, color) {
	
	var someColors = [
		vec3(.5, .5, .5),
		vec3(1.0, 1.0, 0)
	]
	
	for(var k=0; k < 6; k++)
		floorColors.push(someColors[color]);
	
	floorPoints.push(a, b, d);
	floorPoints.push(a, c, d);
	
	normalsArray.push(a, b, d);
    normalsArray.push(a, c, d);
	
}

function drawPlane() {
	// Make plane
	
	var pColors = [
		vec3(1.0, 1.0, 1.0),
		vec3(0.0, 0.0, 0.0)
	]
    
	
	var i = 0; 
	if(NumTimesToSubdivide < 5) i++;
    for (var z = 100.0; z > -100.0; z -= 5.0) {
        for (var x = -100.0; x < 100.0; x += 5.0) {
            if (i % 2) {
        // Add 6 colors to current square.
            colors.push( pColors[0]);
            colors.push( pColors[0]);
            colors.push( pColors[0]);
            colors.push( pColors[0]);
            colors.push( pColors[0]);
            colors.push( pColors[0]);
        }
        else {
        // Add 6 different colors to current square.
            colors.push( pColors[1]);
            colors.push( pColors[1]);
            colors.push( pColors[1]);
            colors.push( pColors[1]);
            colors.push( pColors[1]);
            colors.push( pColors[1]);
        }
        // Add 6 points that make the square. Each point
			points.push(vec3(x, -.9, z));//y=-.9
            points.push(vec3(x-5, -.9, z));
            points.push(vec3(x, -.9, z-5));
            points.push(vec3(x, -.9, z-5));
            points.push(vec3(x-5, -.9, z-5));
            points.push(vec3(x-5, -.9, z));
            
            ++i;
        }
        ++i;
    }
}

function update() {
	requestAnimationFrame(update);
	render();
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //modelViewMatrixPlane = mult(modelViewMatrixPlane, lookAt(eye, at, up));
	//modelViewMatrix = mult(modelViewMatrix, lookAt(eye, at, up));
    //modelViewMatrix = lookAt(eye, at, up);
    //modelViewMatrixPlane = lookAt(eye, at, up);
    
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    
    gl.drawArrays( gl.TRIANGLES, 0, numVerts );
    //for(var i=0; i < numVerts; i+=3) {
    //	gl.drawArrays(gl.TRIANGLES, i, 3);
    //}
    
    //modelViewMatrixPlane = lookAt(eye, at, up);
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrixPlane));
    //gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    gl.drawArrays( gl.TRIANGLES, numVerts, numPlaneVerts );
    //for(var i=0; i < numPlaneVerts; i+=3) {
    //	gl.drawArrays(gl.TRIANGLES, numVerts+i, 3);
    //}
}
