// All of these functions are in the global scope
		
"use strict";

// returns mouse position in local coordinate system of element
function getMouse(e){
	var mouse = {} // make an object
	mouse.x = e.pageX - e.target.offsetLeft;
	mouse.y = e.pageY - e.target.offsetTop;
	return mouse;
}

function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}

// Used for collision detection - TODO Create Quad Trees
function circleCollision(circle1, circle2) {
	var dx = circle1.loc.x - circle2.loc.x;
	var dy = circle1.loc.y - circle2.loc.y;

	var d = Math.sqrt((dx * dx) + (dy * dy));

	return d < (circle1.radius + circle2.radius);
}

function getDistance(p1,p2) {
	return Math.sqrt((p1.loc.x-p2.loc.x) * (p1.loc.x-p2.loc.x) + 
					 (p1.loc.y-p2.loc.y) * (p1.loc.y-p2.loc.y));
}

function draw(ctx) {
	// Draw a circle for now
	ctx.save();
	ctx.beginPath();
	ctx.arc(this.loc.x, this.loc.y, this.radius, 0, Math.PI * 2, false);
	ctx.closePath();
	ctx.fillStyle = this.fillStyle;
	ctx.fill();
	ctx.restore();
}

function checkBoundaries(change, ctx) {

	// check boundaries - RACE CONDITION WITH COLLIDING WITH OBJECTS
	if (this.loc.x + change.x < 0 + this.radius || this.loc.x + change.x > ctx.canvas.width - this.radius) {
		change.x = this.loc.x + change.x < 0 + this.radius ? 1 : -1; // push player a little just in case radius increased
	}
	if (this.loc.y + change.y < 0 + this.radius || this.loc.y + change.y > ctx.canvas.height - this.radius) {
		change.y = this.loc.y + change.y < 0 + this.radius ? 1 : -1; 
	}

	return change;
}

function Vector(x,y) {
	this.x = x;
	this.y = y;
	this.mag = Math.sqrt(this.x * this.x + this.y * this.y);
	this.normalize = function() {
		this.calcMag();
		this.x /= this.mag;
		this.y /= this.mag;
	};
	this.scaleBy = function(scale) {
		this.x *= scale;
		this.y *= scale;
	};
	this.setAngle = function(angle) {
		this.x = Math.cos(angle) * this.mag;
		this.y = Math.sin(angle) * this.mag;
	};
	this.sub = function(target) {
		this.x -= target.x;
		this.y -= target.y;
	};
	this.add = function(target) {
		this.x += target.x;
		this.y += target.y;
	};
	this.limit = function(max) {
		this.x = this.x < 0 ? Math.max(this.x,-max) : Math.min(this.x,max);
		this.y = this.y < 0 ? Math.max(this.y,-max) : Math.min(this.y,max)
	};
	this.div = function(num) {
		this.x /= num;
		this.y /= num;
	};
	this.mult = function(num) {
		this.x *= num;
		this.y *= num;
	};
	this.calcMag = function() {
		this.mag = Math.sqrt(this.x * this.x + this.y * this.y);
	};
	return this;
}

function onScreen(obj, player, w, h) {

	return (obj.loc.x + obj.radius > player.loc.x - w/2 && obj.loc.x - obj.radius < player.loc.x + w/2 &&
			   obj.loc.y + obj.radius > player.loc.y - h/2 && obj.loc.y - obj.radius < player.loc.y + h/2);
}

function makeColor(red, green, blue, alpha){
	var color='rgba('+red+','+green+','+blue+', '+alpha+')';
	return color;
}

/*
Function Name: clamp(val, min, max)
Author: Web - various sources
Return Value: the constrained value
Description: returns a value that is
constrained between min and max (inclusive) 
*/
function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}


 // FULL SCREEN MODE
function requestFullscreen(element) {
	if (element.requestFullscreen) {
	  element.requestFullscreen();
	} else if (element.mozRequestFullscreen) {
	  element.mozRequestFullscreen();
	} else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
	  element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
	  element.webkitRequestFullscreen();
	}
	// .. and do nothing if the method is not supported
}


