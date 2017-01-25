// The myKeys object will be in the global scope - it makes this script 
// really easy to reuse between projects

"use strict";

var app = app || {};

// start IIFE
app.myKeys = function(){
	var myKeys = {};

	myKeys.KEYBOARD = Object.freeze({
		"KEY_P": 80,
		"KEY_D": 68,
		"KEY_R": 82
	});

	// myKeys.keydown array to keep track of which keys are down
	// this is called a "key daemon"
	// main.js will "poll" this array every frame
	// this works because JS has "sparse arrays" - not every language does
	myKeys.keydown = [];


	// event listeners
	window.addEventListener("keydown",function(e){
		console.log("keydown=" + e.keyCode);
		myKeys.keydown[e.keyCode] = true;
	});
		
	window.addEventListener("keyup",function(e){
		console.log("keyup=" + e.keyCode);
		myKeys.keydown[e.keyCode] = false;
		
		var char = String.fromCharCode(e.keyCode);

		// pausing and resuming
		if (char == "p" || char == "P"){
			if (app.main.paused){
				app.main.resumeGame();
			} else {
				app.main.pauseGame();
			}
		}

		// Debug Mode
		if (char == "d" || char == "D"){
			app.main.debug = !app.main.debug;
		}

	});

	return myKeys;
}() // end IIFE