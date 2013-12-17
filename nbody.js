// INPUT DOM ELEMENTS
var object_template;
var number_selector;
var rate_selector;
var objects_box;

// RENDERING
var canvas;
var ctx;

// ARRAY OF BODY OBJECTS
var bodies = [];
var _X = 0;
var _Y = 1;

// PHYSICS CONSTANTS
var metersPerPixel = 750000000; // seven fifty million is ~ 4AU / 800 Pixels
var metersPerAU = 150000000000; // 1.5e11
var gravConst = parseFloat(6.674e-11) //m^3*kg^-1*s^-2

// ANIMATION
var secondsPerAnimatingMillisecond;
var animating = false;
var animationInterval = null;
var animationPreviousTime = null;
var animationStep = 20; // milliseconds between frames

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;



/*	
			BEGIN STARTUP FUNCTIONS
 */
window.onload = function(){
    canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	setupCanvas();

	object_template = document.getElementById("object_template");
	number_selector = document.getElementById("number_of_bodies");
	rate_input = document.getElementById("body_rate_number");
	rate_selector = document.getElementById("body_rate_unit");
	objects_box = document.getElementById("objects");
	applySettings();
}

function setupCanvas(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = "#222";
	var spacing = 20;
	for( var i=spacing; i< 800; i+=spacing ){
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(800,i);
		ctx.closePath();
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(i,0);
		ctx.lineTo(i,800);
		ctx.closePath();
		ctx.stroke();
	}
	
	ctx.fillStyle = "#555";
	ctx.beginPath();
	ctx.arc(400, 400, 3, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	
	ctx.strokeStyle = "#555";
	for( var i=1; i<3; i++ ){ 
		ctx.beginPath();
		ctx.arc(400, 400, i*metersPerAU/metersPerPixel, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.stroke();
	}
}

function redrawCanvas(){
	setupCanvas();
	bodies.map(function(body){body.updatePositionView();});
}

function applySettings(){
	var numberSelection = number_selector.value;
	var existingBodies = bodies.length;
	if (numberSelection != existingBodies) {
		updateBodyFields(numberSelection, existingBodies);
	}
	
	if( !parseFloat(rate_input.value) ){ rate_input.value = "1"; }  
	secondsPerAnimatingMillisecond = (parseFloat(rate_input.value) * parseInt(rate_selector.value)) / 1000;
}


/*
		END STARTUP FUNCTIONS
		
		
		BEGIN GLOBAL GENERAL FUNCTIONS
 */



/*
UPDATES BODIES
CURRENTLY ASSUMES PARAMETERS NEVER EQUAL
*/
function updateBodyFields(newnumberbodies, oldnumberbodies){
	var diff = newnumberbodies - oldnumberbodies;
	if (diff > 0) {
		while (diff-- > 0) {
			bodies.push( new Body(bodies.length+1) );
		}	
	} else {
		while (diff++ < 0) {
			bodies.pop().destroy();
		}
	}
}

function clearValue(element){
	element.value = "";
}


/*
			END GLOBAL MISC FUNCTIONS

			BEGIN GLOBAL ANIMATION FUNCTIONS
*/

function reset(){
	pause();
	if( bodies.map(function(body){ body.revertToInitialConditions(); }) ){
		// ensures redraw doesn't start until all bodies have reset their conditions
		redrawCanvas();
	}
}

function play(){
	if( bodies.map(function(body){ body.saveInitialConditions(); }) ){
		// ensures animation doesn't start until all bodies have saved their conditions
		animationInterval = window.setInterval(frame, animationStep);
		// alternative call for animation: window.requestAnimationFrame(frame);
	}
}

function pause(){
	window.clearInterval(animationInterval);
}

function frame(){	
	var epoch =  (new Date()).getTime();
	var t_step = secondsPerAnimatingMillisecond * animationStep;
	if(animationPreviousTime == null){
		animationPreviousTime = epoch;
		t_step = t_step / 2;
		accel();
		vel(t_step);
	} else {
		pos(t_step);
		accel();
		vel(t_step);
		redrawCanvas();
	}
	
	animationPreviousTime = epoch;
	//window.requestAnimationFrame(frame);
}

function accel(){
	for(i in bodies){
		var total_acceleration = [0,0];
		for(j in bodies){
			if (i != j){
				var r = vect_diff( bodies[j].position, bodies[i].position );		
				var mass_term = vect_scalar_mult( r, gravConst * bodies[j].mass );
				var numerator = vect_sum( bodies[i].acceleration, mass_term );
				total_acceleration = vect_sum( total_acceleration, vect_scalar_mult( numerator, 1/(Math.pow(dot(r,r), 1.5))) );
			}
		}
		// you have all acceleration vectors for i. calculate stuff.
		bodies[i].acceleration = total_acceleration;
	}
}

function pos( step ){
	for(i in bodies){
		bodies[i].calculatePosition(step);
	}
}

function vel( step ){
	for(i in bodies){
		bodies[i].calculateVelocity(step);
	}
}



function dot(vect1, vect2){
	return (vect1[_X] * vect2[_X]) + (vect1[_Y] * vect2[_Y]);
}


// vect1 - vect2
function vect_diff( vect1, vect2 ){
	return [  
		vect1[_X] - vect2[_X],
		vect1[_Y] - vect2[_Y]
	];
}

function vect_sum( vect1, vect2 ){
	return [  
		vect1[_X] + vect2[_X],
		vect1[_Y] + vect2[_Y]
	];
}

function vect_scalar_mult( vect, scalar ){
	return [  
		vect[_X] * scalar,
		vect[_Y] * scalar
	];
}






function metersToPixels(meters){
	var ret = (meters/metersPerPixel)+400;
	return ret;
}


/*
	END GLOBAL ANIMATION FUNCTIONS
	
	BEGIN GLOBAL PHYSICS FUNCTIONS
*/




/*
	END GLOBAL PHYSICS FUNCTIONS
	
	BEGIN BODY FUNCTIONS
*/



var Body = function(number){
	var configurator = object_template.cloneNode(true);
	configurator.id = "object_"+number;
	configurator.getElementsByClassName("ordinal")[0].innerHTML = number+":";

	
	var self = this;
	configurator.getElementsByClassName("nickname")[0].onblur = function(){ self.updateNickname(); };
	configurator.getElementsByClassName("mass_coeff")[0].onblur = function(){ self.updateMass(); };	
	configurator.getElementsByClassName("mass_exp")[0].onblur = function(){ self.updateMass(); };	
	configurator.getElementsByClassName("vel_x")[0].onblur = function(){ self.updateVelocityX(); };	
	configurator.getElementsByClassName("vel_y")[0].onblur = function(){ self.updateVelocityY(); };	
	configurator.getElementsByClassName("pos_x")[0].onblur = function(){ self.updatePositionX(); };	
	configurator.getElementsByClassName("pos_y")[0].onblur = function(){ self.updatePositionY(); };	
	configurator.getElementsByClassName("color")[0].onblur = function(){ self.updateColor(); };	
	
	objects_box.appendChild(configurator);

	this.configurator = configurator;
	this.mass = 0;
	this.position = [0,0];
	this.velocity = [0,0];
	this.acceleration = [0,0];
	this.color = "FFF";
	this.nickname = "Nickname";
	
	this.updatePositionView();
}

Body.prototype.updatePositionView = function(){
	ctx.fillStyle = "#"+this.color;
	ctx.beginPath();
	ctx.arc(metersToPixels(this.position[0]), metersToPixels(this.position[1]), 7, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
}


Body.prototype.saveInitialConditions = function(){
	this.initialPosition = this.position.slice(0); // slice ensures a deep copy instead of a pointer copy 
	this.initialVelocity = this.velocity.slice(0);
}

Body.prototype.revertToInitialConditions = function(){
	this.position = this.initialPosition.slice(0);
	this.velocity = this.initialVelocity.slice(0);
}


Body.prototype.updateNickname = function(){
	this.nickname = this.configurator.getElementsByClassName("nickname")[0].value;
}

Body.prototype.updateMass = function(){
	var mass_coeff = parseFloat(this.configurator.getElementsByClassName("mass_coeff")[0].value);
	var mass_exp = parseInt(this.configurator.getElementsByClassName("mass_exp")[0].value);
	if( mass_coeff && mass_exp ){ 
		this.mass = mass_coeff * Math.pow(10, mass_exp);
	}
}



Body.prototype.calculatePosition = function( step ){
	this.position = vect_sum( this.position, vect_scalar_mult( this.velocity, step) ); 
}

Body.prototype.calculateVelocity = function( step ){
	this.velocity = vect_sum( this.velocity, vect_scalar_mult( this.acceleration, step) ); 
}




Body.prototype.updateColor = function(){
	this.color = this.configurator.getElementsByClassName("color")[0].value;
	redrawCanvas();
}

Body.prototype.updateVelocityX = function(){
	var vel_box = this.configurator.getElementsByClassName("vel_x")[0];
	var value = parseFloat(vel_box.value);
	if( !value ){ vel_box.value = 0; value = 0; } 
	this.velocity[_X] = value;
}
Body.prototype.updateVelocityY = function(){
	var vel_box = this.configurator.getElementsByClassName("vel_y")[0];
	var value = parseFloat(vel_box.value);
	if( !value ){ vel_box.value = 0; value = 0; } 
	this.velocity[_Y] = value;
}

Body.prototype.updatePositionX = function(){
	var pos_box = this.configurator.getElementsByClassName("pos_x")[0];
	var value = parseFloat(pos_box.value)
	if( !value ){ pos_box.value = 0; value = 0; }
	this.position[_X] = value*metersPerAU;
	redrawCanvas();
}
Body.prototype.updatePositionY = function(){
	var pos_box = this.configurator.getElementsByClassName("pos_y")[0];
	var value = parseFloat(pos_box.value)
	if( !value ){ pos_box.value = 0; value = 0; }
	this.position[_Y] = -value*metersPerAU;
	redrawCanvas();	
}

Body.prototype.destroy = function(){
	objects_box.removeChild(this.configurator);	
}