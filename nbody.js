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
var animationPreviousTime = null;

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
		
		
		BEGIN GLOBAL FUNCTIONS
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

function reset(){
	bodies.map(function(body){ body.revertToInitialConditions(); });
	redrawCanvas();
}

function play(){
	animating = true;
	bodies.map(function(body){ body.saveInitialConditions(); });
	window.requestAnimationFrame(frame);
}

function pause(){
	animating = false;
	animationPreviousTime = null;
}

function frame(timestamp){
	if( animating ){ 
		if(animationPreviousTime == null){
			animationPreviousTime = timestamp;
		}
		var elapse = timestamp - animationPreviousTime;
		var t_step = elapse * secondsPerAnimatingMillisecond;
		console.log(t_step);
		
		// physics code
		
		for(i in bodies){
			// total_acceleration = [0,0];
			for(j in bodies){
				/*
					var acc = gravity bodies[i]  bodies[j];
					total_acceleration[0] += acc[0];
					total_acceleration[1] += acc[1];
				*/
			}
			// you have all acceleration vectors for i. calculate stuff.
			// bodies[i].computeKinematics(total_acceleration);
		}
		
		
		redrawCanvas();
		animationPreviousTime = timestamp;
		window.requestAnimationFrame(frame);
	}
}





function metersToPixels(meters){
	var ret = (meters/metersPerPixel)+400;
	console.log(ret);
	return ret;
}


/*
	END GLOBAL FUNCTIONS

	
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
	this.initialPosition = this.position;
	this.initialVelocity = this.velocity;
}

Body.prototype.revertToInitialConditions = function(){
	this.position = this.initialPosition;
	this.velocity = this.initialVelocity;
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

Body.prototype.computeKinematics = function( accelerationArray ){
	// update accel
	
	// recalculate velocity
	
	// reset position
}

Body.prototype.updateColor = function(){
	this.color = this.configurator.getElementsByClassName("color")[0].value;
	redrawCanvas();
}

Body.prototype.updateVelocityX = function(){
	this.velocity[0] = parseFloat(this.configurator.getElementsByClassName("vel_x")[0].value);
}
Body.prototype.updateVelocityY = function(){
	this.velocity[1] = -parseFloat(this.configurator.getElementsByClassName("vel_y")[0].value);
}

Body.prototype.updatePositionX = function(){
	this.position[0] = parseFloat(this.configurator.getElementsByClassName("pos_x")[0].value)*metersPerAU;
	redrawCanvas();
}
Body.prototype.updatePositionY = function(){
	this.position[1] = -parseFloat(this.configurator.getElementsByClassName("pos_y")[0].value)*metersPerAU;
	redrawCanvas();	
}

Body.prototype.destroy = function(){
	objects_box.removeChild(this.configurator);	
}