// sound.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// define the .sound module and immediately invoke it in an IIFE
app.sound = (function(){
	console.log("sound.js module loaded");
	var bgAudio = undefined;
	var effectAudio = undefined;

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.25;
		effectAudio = document.querySelector("#effectAudio");
		effectAudio.volume = 0.3;
	}

	function stopBGAudio(){
		bgAudio.pause();
		bgAudio.currentTime = 0;
	}
	
	function playEffect(){
		effectAudio.play();
	}

	function playBGAudio() {
		bgAudio.play();
	}
		
	// export a public interface to this module
	return {
		init: init,
		stopBGAudio: stopBGAudio,
		playEffect: playEffect,
		playBGAudio: playBGAudio
	};
}());