// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
    WINDOW_WIDTH : 1920, 
    WINDOW_HEIGHT: 1080,
    WIDTH: 10000,
    HEIGHT: 10000,

    canvas: undefined,
    ctx: undefined,

    viewCanvas: undefined,
    viewCtx: undefined,

   	lastTime: 0, // used by calculateDeltaTime() 
    debug: false,

    // HUD
    playerScore : 0,
    playerMult : 1,
    nextLevel : 1000,
    timeAlive : 0,
    hint : true,

    mouse: {}, // mouse coords in relation to game
    mouse_raw: undefined, // mouse DOM coords

    GAME_STATE: { 
		BEGIN : 0,
		DEFAULT : 1,
		END : 2
	},	

    cells: [],

    // Cell Fake Enumeration
    CELL_STATE: {
    	DEFAULT: 0,
    	EATEN: 1,
    	SEEKING: 2, // seeking player or other smaller obj
    	HIDDEN: 3
    },

    CELL_TYPE: {
    	STATIC: 0,
    	ENEMY: 1,
    	PLAYER: 2,
    	POINT: 3
    },

    CELL: Object.freeze({
    	NUM_CELLS_START: 1000,
    	MAX_NUM_ENEMIES: 50,
    	MIN_RADIUS: 8,
    	MAX_RADIUS: 15
    }),

    // original 8 fluorescent crayons: https://en.wikipedia.org/wiki/List_of_Crayola_crayon_colors#Fluorescent_crayons
	//  "Ultra Red", "Ultra Orange", "Ultra Yellow","Chartreuse","Ultra Green","Ultra Blue","Ultra Pink","Hot Magenta"
	colors: ["253,91,120,","255,96,55,","255,153,102,","255,255,102,","102,255,102,","80,191,230,","255,110,255,","238,52,210,"],

    // pause the screen
    paused: false,
    animationId: 0,

    // Loaded by main.js

    // UI
	myKeys : undefined, // required - loaded by main.js
	keyCheck : undefined,
	input : undefined,

	// animation
	dt : 0,

	// counters
	eatenCount : 0,

	// boost
	boostTimer : 0,
	prevLocation : undefined,
	mouseDown : false,
	
	// audio
	sound : undefined,
    
    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.getElementById("main");
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');

		// window and background canvas
		this.viewCanvas = document.getElementById("window");
		this.viewCanvas.width = this.WINDOW_WIDTH;
		this.viewCanvas.height = this.WINDOW_HEIGHT;
		this.viewCtx = this.viewCanvas.getContext('2d');

		// position DOM UI based off view width
		this.input = document.getElementById("input");
		this.input.style.left = this.WINDOW_WIDTH / 2 - this.input.offsetWidth/ 2 + "px";
		this.input.style.top = this.WINDOW_HEIGHT / 2 - this.input.offsetHeight/ 2 + "px";

		this.numCells = this.CELL.NUM_CELLS_START;
		this.numEnemies = 0;
		this.makeCells(this.numCells);

		this.gameState = this.GAME_STATE.BEGIN;

		this.keyCheck = this.keyPressed.call(this);

		// hook up events
		this.viewCanvas.onmousemove = this.doMousemove.bind(this);
		this.viewCanvas.onmousedown = this.doMousedown.bind(this);
		this.viewCanvas.onmouseup = this.doMouseup.bind(this);

		this.input.onclick = this.doButtonClick.bind(this);

		// start the game loop
		this.update();
	},

	// main update method
	update: function(){

		// 1) LOOP
		// schedule a call to update()
	 	this.animationId = requestAnimationFrame(this.update.bind(this));
	 	// 2) PAUSED?
	 	// if so, bail out of loop
	 	if (this.paused && this.gameState == this.GAME_STATE.DEFAULT) {
	 		this.drawPauseScreen(this.viewCtx);
	 		return;
	 	}
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	this.dt = this.calculateDeltaTime();

	 	// 4) UPDATE
	 	// i) update cells and calc mouse location
	 	this.calcMouse();
	 	this.updateCells();

	 	// ii) detect collisions
	 	this.checkForCollisions();

		// iv) Copy data to view window
		this.drawWindow(this.viewCtx);

		// v) Draw HUD
	 	this.drawHUD(this.viewCtx);

	 	// CHECK FOR CHEATS / DEBUG
	 	this.keyCheck();
	},

	// reset the game
	reset: function() {
		this.numCells = this.CELL.NUM_CELLS_START;
		this.playerScore = 0;
		this.playerMult = 0;
		this.numEnemies = 0;
		this.timeAlive = 0;
		this.eatenCount = 0;
		this.cells = [];
		this.makeCells(this.numCells);
	},

	// mouse functions
	doMousemove: function(e) {
		// new raw mouse position incase player does not move mouse
		var mouse = getMouse(e);
		this.mouse_raw = mouse;
	},

	doMousedown: function(e) {
		if (this.gameState != this.GAME_STATE.DEFAULT) {
			return; // get out of here
		}
		this.prevLocation = new Vector(this.cells[0].loc.x, this.cells[0].loc.y);
		this.mouseDown = true;
		this.hint = false;
	},

	doMouseup: function(e) {
		var player = this.cells[0];
		player.maxSpeed = 4;

		this.mouseDown = false;
	},

	calcMouse: function() {
		if (this.mouse_raw == undefined || this.gameState != this.GAME_STATE.DEFAULT) {
			return; // incase player hasn't moved mouse yet
		}
		var x = this.cells[0].loc.x - this.WINDOW_WIDTH/2 + this.mouse_raw.x;
		var y = this.cells[0].loc.y - this.WINDOW_HEIGHT/2 + this.mouse_raw.y;
		this.mouse.x = x;
		this.mouse.y = y;
	},

	doButtonClick: function(e) {
		switch(this.gameState) {
				case this.GAME_STATE.BEGIN:
					this.gameState = this.GAME_STATE.DEFAULT;
					this.sound.playBGAudio();
					break;
				case this.GAME_STATE.END:
					this.gameState = this.GAME_STATE.DEFAULT;
					this.sound.playBGAudio();
					this.reset();
					break;
		}
	},

	keyPressed: function() {
		return function() {
			if (this.gameState == this.GAME_STATE.DEFAULT) {
				if (this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_R]) {
					this.gameState = this.GAME_STATE.END;
					console.log("GAME OVER MAN");
				}
			}
		}
	},

	// Player class
	Player: function(x, y, state, type, color) {
		var move = function(mouse,ctx) {
			// Easing : https://processing.org/examples/easing.html
			var easing = 0.05;

			if (mouse) {

				var dx = mouse.x - this.loc.x;
				var dy = mouse.y - this.loc.y;

				var change = {};

				// do movement
				// hrz
				if (dx < 0) {
					change.x = dx * easing < -this.maxSpeed ? -this.maxSpeed : dx * easing;
				}
				else {
					change.x = dx * easing > this.maxSpeed ? this.maxSpeed : dx * easing;
				}

				// vrt
				if (dy < 0) {
					change.y = dy * easing < -this.maxSpeed ? -this.maxSpeed : dy * easing;
				}
				else {
					 change.y = dy * easing > this.maxSpeed ? this.maxSpeed : dy * easing;
				}

				change = checkBoundaries.call(this,change,ctx);

				this.loc.x += change.x;
				this.loc.y += change.y;
			}
		};

		// Add x and y properties
		this.opacity = 0.1;
		this.baseColor = color;
		this.loc = new Vector(x,y);
		this.radius = 24;
		this.maxSpeed = 4; // pixels per second
		this.state = state;
		this.type = type;
		this.mult = 1; // score multiplier for leveling up
		this.score = 0;
		this.levelUp = false; // used for animating decreased size

		// functions
		this.move = move;
		this.draw = draw.bind(this);

		return this;
	},

	// Enemy class
	Enemy: function(radius, position, state, type, color) {
		var update = function() {
			this.vel.add(this.acc);
			this.vel.limit(this.maxSpeed);
			this.loc.add(this.vel);
			this.acc.mult(0);
		};

		// https://gamedevelopment.tutsplus.com/tutorials/understanding-steering-behaviors-wander--gamedev-1624
		// https://processing.org/discourse/beta/num_1254529623.html
		var seek = function() {
			var MAX_FORCE = 0.1;
			var desired = new Vector(this.target.loc.x, this.target.loc.y);
			desired.sub(new Vector(this.loc.x,this.loc.y));
			desired.normalize();
			desired.scaleBy(this.maxSpeed);

			var steer = desired;
			steer.sub(this.vel);
			// steer.limit(MAX_FORCE);

			this.applyForce(steer);
		};

		var applyForce = function(force) {
			this.acc.add(force);
		};

		// add a radius property
		this.radius = radius;

		// add .x and .y properties
		this.loc = position;

		// make more properties
		this.opacity = 0.1;
		this.baseColor = color;
		this.type = type;
		this.state = state;

		this.vel = new Vector(0,0);
		this.acc = new Vector(0,0);
		this.wanderAngle = 0.0; // degrees
		this.maxSpeed = 4;
		this.target = undefined; 
		this.score = 0;
		this.mult = 1;
		this.levelUp = false; // used for animating decreased size

		// methods
		this.seek = seek;
		this.applyForce = applyForce;
		this.update = update;

		this.draw = draw.bind(this);

		return this;
	},

	// Cell class
	Cell: function(radius, position, state, type, color) {
		// add a radius property
		this.radius = radius;
		this.opacity = 0.1;

		// add .x and .y properties
		this.loc = position;

		// make more properties
		this.baseColor = color;

		this.state = state;
		this.type = type;
		
		// draw
		this.draw = draw.bind(this);

		return this;
	},

	// main cell update function
	updateCells: function() {
		if (this.gameState == this.GAME_STATE.DEFAULT) {
	 		for (var i = 0; i < this.cells.length; ++i) {
	 			if (this.cells[i].state == this.CELL_STATE.EATEN) continue;

	 			// all visable cells
	 			if (this.cells[i].opacity != 1) {
	 				this.cells[i].opacity += 0.1;
	 				this.cells[i].fillStyle = "rgba(" + this.cells[i].baseColor + this.cells[i].opacity + ")";
	 			}

	 			if (this.cells[i].type == this.CELL_TYPE.STATIC) continue; // dont care about regular cells

		 		if (this.cells[i].type == this.CELL_TYPE.ENEMY) {
		 			this.getClosestCell(this.cells[i]);
		 			this.cells[i].update();
		 		}
		 		else if (this.cells[i].type == this.CELL_TYPE.PLAYER) {
		 			if (this.mouseDown) {
	 					this.playerBoosting();
	 				}

		 			this.cells[i].move(this.mouse,this.ctx);
	 				this.timeAlive += this.dt;
		 		}

		 		if (this.cells[i].levelUp) {
		 			this.decreaseRadius(this.cells[i]);
		 		}
			}
		}			
	},

	// boosting ability 
	playerBoosting: function() {

		// if player clicks mouse boost
		var player = this.cells[0];
		if (player.radius < this.CELL.MAX_RADIUS + 1) {
			player.maxSpeed = 4;
			return; // you can't boost anymore
		}
		player.maxSpeed = 6;
		player.radius -= (this.dt * 10)
		this.boostTimer += this.dt;

		if (this.boostTimer > .2) {
			this.boostTimer = 0;
			this.cells.push(new this.Cell(10, this.prevLocation, this.CELL_STATE.DEFAULT, this.CELL_TYPE.STATIC, player.baseColor));
			this.prevLocation = player.loc;
			this.doMousedown();
		}
	},

	// level up helper
	levelUp: function(cell) {
		cell.levelUp = true;
		cell.fillStyle = this.colors[cell.mult % this.colors.length];
		cell.mult++;
	},

	// animate the decreased radius of leveling up
	decreaseRadius: function(cell) {
		if (cell.radius != this.CELL.MAX_RADIUS + 1) {
			cell.radius = cell.radius - 10 < this.CELL.MAX_RADIUS + 1 ? this.CELL.MAX_RADIUS + 1 : cell.radius - 10;
		}
		else {
			cell.levelUp = false;
		}
	},

	// https://forum.unity3d.com/threads/clean-est-way-to-find-nearest-object-of-many-c.44315/
	// finds closest cell
	getClosestCell: function(cell) {
		var target = undefined;
		var minDist = Infinity;
		for (var i = 0; i < this.cells.length; ++i) {
			var dist = getDistance(this.cells[i], cell);
			if (cell != this.cells[i] && dist < minDist && this.cells[i].radius < cell.radius && 
						this.cells[i].state != this.CELL_STATE.EATEN && this.cells[i].type != this.CELL_TYPE.POINT) {	
				target = this.cells[i];
				minDist = dist;
			}
		}

		cell.target = target == undefined ? this.cells[1] : target;
		cell.seek();
	},

	// cell making factory
	makeCells: function(num) {

		for (var i = 0; i < num; ++i) {
			var c = this.colors[i % this.colors.length];

			if (this.cells[0] == undefined || this.cells[0].type != this.CELL_TYPE.PLAYER) {
				// player specific properties and special objects
				var state = this.CELL_STATE.DEFAULT;
				var type = this.CELL_TYPE.PLAYER;	
				this.cells.push(new this.Player(this.WIDTH/2, this.HEIGHT/2, state, type, c));
			}

			if (this.numEnemies < this.CELL.MAX_NUM_ENEMIES) {
				// Enemy Specific properties
				var r = this.CELL.MAX_RADIUS + 1;
				// add .x and .y properties
				var loc = new Vector(getRandom(r * 2, this.WIDTH - r * 2), getRandom(r * 2, this.HEIGHT - r * 2));

				var state = this.CELL_STATE.SEEKING;
				var type = this.CELL_TYPE.ENEMY;
				this.cells.push(new this.Enemy(r, loc, state, type, c));
				this.numEnemies++;
			}
			else {
				// cell specific properties
				var r = getRandom(this.CELL.MIN_RADIUS, this.CELL.MAX_RADIUS);
				// add .x and .y properties
				var loc = new Vector(getRandom(r * 2, this.WIDTH - r * 2), getRandom(r * 2, this.HEIGHT - r * 2));

				var state = this.CELL_STATE.DEFAULT;
				var type = this.CELL_TYPE.STATIC;
				this.cells.push(new this.Cell(r, loc, state, type, c));
			}
		}
	},

	// check circles for collision
	checkForCollisions: function(){
		if(this.gameState == this.GAME_STATE.DEFAULT){
			// check for collisions between circlesFchec
			for(var i=0;i<this.cells.length; i++){
				var c1 = this.cells[i];
				// only check collision if cell is seeking ignore regular cells.
				if (c1.type == this.CELL_TYPE.STATIC || c1.type == this.CELL_TYPE.POINT) continue;   
				if (c1.state == this.CELL_STATE.EATEN) continue;
				for(var j=0;j<this.cells.length; j++){
					var c2 = this.cells[j];
				// don't check for collisions if c2 is the same circle
					if (c1 == c2) continue; 
				// don't check for collisions if c2 is already eaten or hidden for center point 
					if (c2.state == this.CELL_STATE.EATEN || c2.state == this.CELL_STATE.HIDDEN) continue;
					if(circleCollision(c1,c2) ){
						if (c1.radius > c2.radius) {
							c2.state = this.CELL_STATE.EATEN;
							c1.radius += (c2.radius/10);

							this.eatenCount++;
							c1.score += (c1.radius / 10) * c1.mult;

							// check if leveling up
							if (c1.score > 500 + 500 * c1.mult) {
								this.levelUp(c1);
							}

							if (c1.type == this.CELL_TYPE.PLAYER) {
								this.playerScore = c1.score;
								this.playerMult = c1.mult;
								this.nextLevel = Math.round(500 + 500* c1.mult);
								this.sound.playEffect();
							}
							else if (c2.type == this.CELL_TYPE.ENEMY) {
								this.numEnemies--;
							}
							else if (c2.type == this.CELL_TYPE.PLAYER) {
								this.gameState = this.GAME_STATE.END;
								this.sound.stopBGAudio();
							}
						}
					}
				}
			} // end for

			// Replenish Cells
			if (this.eatenCount > 10) {
				this.cells = this.cells.filter(this.eatenFilter.bind(this));
		 		this.makeCells(this.eatenCount);
		 		this.eatenCount = 0;
			}
		} // end if
	},

	// Draws a viewer - should only expand as the cell expands
	drawWindow: function(ctx) {
		ctx.save();

		if (this.gameState == this.GAME_STATE.BEGIN) {
			return; // get out of here
		}
		if (this.gameState == this.GAME_STATE.DEFAULT) {

			// DRAW	
			// i) clear the window
			this.drawBackground(this.ctx);

			// ii) draw cells
			this.drawCells(this.ctx);

			// iii) copy to view canvas
			var dx = this.cells[0].loc.x - this.WINDOW_WIDTH/2;
			var dy = this.cells[0].loc.y - this.WINDOW_HEIGHT/2;
			var sx = 0, sy = 0, w = this.WINDOW_WIDTH, h = this.WINDOW_HEIGHT;

			ctx.fillStyle = "black";
			// used to draw borders
			if (dx < 0) {
				ctx.fillRect(0,0,-dx,this.WINDOW_HEIGHT);
			}
			if (dx > this.WIDTH - this.WINDOW_WIDTH) {
				ctx.fillRect(this.WIDTH - dx,0,this.WINDOW_WIDTH,this.WINDOW_HEIGHT);
			}
			if (dy < 0) {
				ctx.fillRect(0,0,this.WINDOW_WIDTH,-dy);
			}
			if (dy > this.HEIGHT - this.WINDOW_HEIGHT) {
				ctx.fillRect(0,this.HEIGHT - dy,this.WINDOW_WIDTH,this.WINDOW_HEIGHT);
			}
			this.copyCanvas(ctx,dx,dy,sx,sy,w,h);
		}		
		
		ctx.restore()
	},

	// copies portion of main canvas to viewer
	copyCanvas: function(ctx,dx,dy,sx,sy,w,h) {
		ctx.drawImage(this.canvas,dx,dy,this.WINDOW_WIDTH,this.WINDOW_HEIGHT,sx,sy,w, h);
	},

	drawBackground: function(ctx) {
		// Draw grid for now - may switch to other type of background
		ctx.save()
		
		// set some drawing state variables
		ctx.strokeStyle = "white";
		ctx.fillStyle = '#000000';
		ctx.lineWidth = 0.5;

		var dx = this.cells[0].loc.x - this.WINDOW_WIDTH/2;
		var dy = this.cells[0].loc.y - this.WINDOW_HEIGHT/2;

		// check to make sure not outside boundaries of "main"
		if (dx < 0 || dx > this.WIDTH - this.WINDOW_WIDTH) {
			dx = dx < 0 ? 0 : this.WIDTH - this.WINDOW_WIDTH;
		}
		if (dy < 0 || dy > this.HEIGHT - this.WINDOW_HEIGHT) {
			dy = dy < 0 ? 0 : this.HEIGHT - this.WINDOW_HEIGHT;
		}

		var numLines = 50;

		ctx.fillRect(dx, dy, this.WINDOW_WIDTH, this.WINDOW_HEIGHT);
		
		// lets do some modulus math

		// lets draw vertical lines
		var x = numLines - dx % numLines; // location of first line
		var y = numLines - dy % numLines;

		for (; x < this.WINDOW_WIDTH; x += numLines) {
			ctx.beginPath();
			ctx.moveTo(dx + x, dy);
			ctx.lineTo(dx + x, dy + this.WINDOW_HEIGHT);
			ctx.stroke();
		}

		for (; y < this.WINDOW_HEIGHT; y += numLines) {
			ctx.beginPath();
			ctx.moveTo(dx, dy + y);
			ctx.lineTo(dx + this.WINDOW_WIDTH, dy + y);
			ctx.stroke();
		}
		
		// restore the drawing state
		ctx.restore();
	},

	drawCells: function(ctx) {
		for (var i = 0; i < this.cells.length; ++i) {
			var c = this.cells[i];
			if (!onScreen(c,this.cells[0],this.WINDOW_WIDTH,this.WINDOW_HEIGHT)) continue;
			if (c.state == this.CELL_STATE.EATEN) continue;
			if (c.state == this.CELL_STATE.OFF_SCREEN) continue;
			c.draw(ctx);
		}
	},

	// Draws HUD and score info
	drawHUD: function(ctx) {
		ctx.save();

		// i) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.viewCtx,"dt: " + this.dt.toFixed(3), this.WINDOW_WIDTH - 150, this.WINDOW_HEIGHT - 10, "18pt courier", "white");
		}		

		// Show or hide the button
		this.input.style.display = this.gameState == this.GAME_STATE.BEGIN || this.gameState == this.GAME_STATE.END ? "inline" : "none";

		// STATE == BEGIN
		if (this.gameState == this.GAME_STATE.BEGIN) {

			ctx.fillStyle = "Black";
			ctx.fillRect(0,0,this.WINDOW_WIDTH,this.WINDOW_HEIGHT);

			ctx.translate(this.WINDOW_WIDTH/2,this.WINDOW_HEIGHT/2);
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// TITLE
			this.fillText(ctx,"Cellular Contamination", 0, -210, "60pt Audiowide", "white");
			this.fillText(ctx,"By Alex Cook", 0, -120, "20pt Audiowide", "white");

			// DESCRIPTION
			this.fillText(ctx,"Move your mouse to control the cell", 0, 110, "15pt Audiowide", "white");
			this.fillText(ctx,"Eat other cells to Grow larger", 0, 135, "15pt Audiowide", "white");
			this.fillText(ctx,"As your score and size increases, you level up", 0, 160, "15pt Audiowide", "white");
			this.fillText(ctx,"Each level increases your multiplier but", 0, 185, "15pt Audiowide", "white");
			this.fillText(ctx,"Your size and max size is decreased", 0, 210, "15pt Audiowide", "white");
			this.fillText(ctx,"How long can you last?", 0, 235, "15pt Audiowide", "white");
		}

		// STATE == DEFAULT
		if (this.gameState == this.GAME_STATE.DEFAULT) {

			if (this.playerMult > 1) {
				this.fillText(ctx,"Score: " + Math.round(this.playerScore) + "(" + this.nextLevel + ") | Multiplier: x" + this.playerMult, 40, 40, "20pt Audiowide", "white");
			}
			else {
				this.fillText(ctx,"Score: " + Math.round(this.playerScore) + "(" + this.nextLevel + ")", 40, 40, "20pt Audiowide", "white");
			}
			this.fillText(ctx,"Time Alive: " + Math.round(this.timeAlive), this.WINDOW_WIDTH - 220, 40, "20pt Audiowide", "white");

			if (this.hint) {
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				this.fillText(ctx,"Try left-clicking the mouse to get out of tricky situations", this.WINDOW_WIDTH/2, this.WINDOW_HEIGHT - 40, "20pt Audiowide", "white");
			}
		}

		// STATE == END
		if (this.gameState == this.GAME_STATE.END) {

			input.innerHTML = "Try Again";
			this.input.style.left = this.WINDOW_WIDTH / 2 - this.input.offsetWidth/ 2 + "px";
			this.input.style.top = this.WINDOW_HEIGHT / 2 - this.input.offsetHeight/ 2 + "px";

			ctx.fillStyle = "black";
			ctx.fillRect(0,0,this.WINDOW_WIDTH,this.WINDOW_HEIGHT);

			ctx.translate(this.WINDOW_WIDTH/2,this.WINDOW_HEIGHT/2);
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			// TITLE
			this.fillText(ctx,"GAME OVER ", 0, -150, "60pt Audiowide", "white");

			// DESCRIPTION
			this.fillText(ctx,"Final Score: " + Math.round(this.playerScore), 0, 110, "15pt Audiowide", "white");
			this.fillText(ctx,"Time Alive: " + Math.round(this.timeAlive), 0, 135, "15pt Audiowide", "white");
			this.fillText(ctx,"Do you want to try again?", 0, 160, "15pt Audiowide", "white");
		}

		ctx.restore();
	},

	// filter for cell array to filter eaten cells out
	eatenFilter: function(cell) {
		return cell.state != this.CELL_STATE.EATEN;
	},

	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},

	drawPauseScreen: function(ctx) {
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,this.WINDOW_WIDTH,this.WINDOW_HEIGHT);
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		this.fillText(ctx,"... PAUSED ...", this.WINDOW_WIDTH/2, this.WINDOW_HEIGHT/2, "40pt courier", "white");
		ctx.restore();
	},

	pauseGame: function() {
		this.paused = true;
		this.sound.stopBGAudio();

		// stop the animation loop
		cancelAnimationFrame(this.animationId);

		// call update() once so pause screen gets drawn
		this.update();
	},

	resumeGame: function() {
		// start audio
		this.sound.playBGAudio();
		this.paused = false;

		// stop the animation loop
		cancelAnimationFrame(this.animationId);

		// restart the loop
		this.update();
	},
    
}; // end app.main