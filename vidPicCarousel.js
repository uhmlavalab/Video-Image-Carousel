


// SAGE2 is available for use under the SAGE2 Software License
//
// University of Illinois at Chicago's Electronic Visualization Laboratory (EVL)
// and University of Hawai'i at Manoa's Laboratory for Advanced Visualization and
// Applications (LAVA)
//
// See full text, terms and conditions in the LICENSE.txt included file
//
// Copyright (c) 2014

////////////////////////////////////////
// A video/photo slideshow
// Written by Andy Johnson - 2014
// and Angela Zheng - 2019
////////////////////////////////////////


var vidPicCarousel = SAGE2_App.extend({
	init: function(data) {
		this.SAGE2Init("div", data);

		// SAGE2 Specifc
		this.resizeEvents = "onfinish"; //continuous
		this.maxFPS = 10.0; // Frame rate per second, influences eat checks

		// Make the background black;
		this.element.style.background = "black";
		
		// The above are SAGE2 values available to nearly all apps
		this.appSpecificInit();
	},


	appSpecificInit: function() {
		// Contains all items to cycle through
		this.bigList = [];

		// Cycle vars
		this.updateCounter = 0;
		this.loadTimer = 2;
		this.cycleRandomized = false;
		this.switchMedia = true; // Used to disable timer when showing video

		// For eating
		this.isEating = true; // default is true, can be disabled later


		// Tags to hold the media
		this.imgDiv = document.createElement("IMG");
		this.imgDiv.style.display = "block";
    this.imgDiv.setAttribute("src", "https://localhost:9090/uploads/images/sage2-1400-green_tm.png");
		this.imgDiv.style.margin = "0 auto";
		// Just add to this app's primary element
		this.element.appendChild(this.imgDiv);

		// Now for video
		this.videoDiv = document.createElement("VIDEO");
		this.videoDiv.style.display = "none"; // "block" to show
		this.videoDiv.setAttribute("type", "video/mp4");
		this.videoDiv.setAttribute("src", "http://clips.vorwaerts-gmbh.de/VfE_html5.mp4");
		this.videoDiv.style.margin = "0 auto";
		this.videoDiv.autoplay = true;
		this.element.appendChild(this.videoDiv);

		// Add load handler, use arrow function to maintain this reference
		this.imgDiv.onload = () => { this.imageLoadCallback(); };
		this.videoDiv.onloadeddata = () => { this.videoLoadCallback(); };
		// this.imgDiv.addEventListener("load", () => { this.imageLoadCallback(); });
		// this.videoDiv.addEventListener("loadeddata", () => { this.videoLoadCallback(); });

		// Video needs handlers
		// Arrow functions to retain "this" reference
		this.videoDiv.onplaying = () => {
			console.log("VIDEO IS PLAYING!");
		}
		this.videoDiv.addEventListener('ended', () => {
			console.log("VIDEO IS FINISHED!");
			this.switchMedia = true;
		}, false);
	},


	imageLoadCallback: function() {
		let widthPercent = this.sage2_width / this.imgDiv.naturalWidth;
		let heightPercent = this.sage2_height / this.imgDiv.naturalHeight;

		// Use the smaller multiplier to keep in view
		if (widthPercent < heightPercent) {
			this.imgDiv.style.width = this.imgDiv.naturalWidth * widthPercent + "px";
			this.imgDiv.style.height = this.imgDiv.naturalHeight * widthPercent + "px";
		} else {
			this.imgDiv.style.width = this.imgDiv.naturalWidth * heightPercent + "px";
			this.imgDiv.style.height = this.imgDiv.naturalHeight * heightPercent + "px";
		}
		// // Centers image, use sage2_width to get current app width
		// let widthMargin = (this.sage2_width - this.imgDiv.width) / 2;
		// console.log("WIDTH: " + this.imgDiv.width);
		// console.log("HEIGHT: " + this.imgDiv.height);
		// this.imgDiv.style.marginLeft = widthMargin + "px";
		// this.imgDiv.style.marginRight = widthMargin + "px";
	},

	videoLoadCallback: function() {
		let widthPercent = this.sage2_width / this.videoDiv.videoWidth;
		let heightPercent = this.sage2_height / this.videoDiv.videoHeight;

		// Use the smaller multiplier to keep in view
		if (widthPercent < heightPercent) {
			this.videoDiv.style.width = this.videoDiv.videoWidth * widthPercent + "px";
			this.videoDiv.style.height = this.videoDiv.videoHeight * widthPercent + "px";
		} else {
			this.videoDiv.style.width = this.videoDiv.videoWidth * heightPercent + "px";
			this.videoDiv.style.height = this.videoDiv.videoHeight * heightPercent + "px";
		}
		// // Centers image, use sage2_width to get current app width
		// let widthMargin = (this.sage2_width - this.imgDiv.width) / 2;
		console.log("WIDTH: " + this.imgDiv.width);
		console.log("HEIGHT: " + this.imgDiv.height);
		// this.imgDiv.style.marginLeft = widthMargin + "px";
		// this.imgDiv.style.marginRight = widthMargin + "px";
	},

	// ------------------------------------------------------------------------------------------------------------------------
	// ------------------------------------------------------------------------------------------------------------------------
	// Draw acts as the update function will:
	// Update the timer
	// Initiate swap if timer is up
	// Attempt to eat
	// update tries to load in a new image (set in the newImage function)
	// this image may be a completely new image (from a file)
	// or a more recent version of the same image from a webcam

	draw: function() {
		if (isMaster) {
			// Update the counter
			this.updateCounter += 1;
			// Check if time to cycle
			if ((this.updateCounter > (this.loadTimer * this.maxFPS)) && this.switchMedia) {
				// reset the timer counting towards the next image swap
				this.updateCounter = 0;
				this.cycleToNextMedia();
			}
			// Collect images / videos over carousel
			this.performEat();
		}
	},


	// Why separate this between the next function?
	cycleToNextMedia: function() {
		if (isMaster) {
			// reset the timer counting towards the next image swap
			this.updateCounter = 0;
			// if there is no big list of images to pick from then get out
			if (this.bigList.length === 0) {
				console.log(this.applicaiton + " list of photos not populated yet");
				return;
			}
			// If not randomized, get next, otherwise random index it
			if (!this.cycleRandomized) {
				this.state.counter++;
				if (this.state.counter >= this.bigList.length) {
					this.state.counter = 0;
				}
			} else {
				this.state.counter = parseInt(Math.random() * this.bigList.length);
			}
			this.newImage();
		}
	},


	// Only activate if success in next image id
	newImage: function() {
		this.switchMedia = true;
		if (typeof this.bigList[this.state.counter] != "undefined" && this.bigList[this.state.counter].name.includes(".mp4")) {
			// Disable media switching if on video, to allow it to run
			this.switchMedia = false;
			console.log("Video switch");
			this.imgDiv.style.display = "none";
			this.videoDiv.style.display = "block";
			// Switch to new video
			this.videoDiv.setAttribute("src", this.bigList[this.state.counter].name);
			// this.videoDiv.setAttribute("src", "http://clips.vorwaerts-gmbh.de/VfE_html5.mp4");
			this.videoDiv.play();
		} else {
			// Is an image
			this.imgDiv.style.display = "block";
			this.videoDiv.style.display = "none";
			this.imgDiv.src = this.bigList[this.state.counter].name;
			console.log("image");
		}
	},


	performEat: function() {
	  let imageApps = this.findAllApplicationsOfType("image_viewer");
	  let imageUrl;
	  for (let i = 0; i < imageApps.length; i++) {
			if (this.isParamAppOverThisApp(imageApps[i])) {
				imageUrl = this.getUrlOfApp(imageApps[i]);
				if (!this.isAlreadyInBigList(imageUrl)) {
					this.bigList.push({name: imageUrl});
				}
				imageApps[i].close();
			}
	  }
		let videoApps = this.findAllApplicationsOfType("movie_player")
		let videoUrl;
		for (let j = 0; j < videoApps.length; j++) {
			if (this.isParamAppOverThisApp(videoApps[j])) {
				videoUrl = this.getUrlOfApp(videoApps[j]);
				if (!this.isAlreadyInBigList(videoUrl)) {
					this.bigList.push({name: videoUrl});
				}
				videoApps[j].close();
			}
		}
	},


  findAllApplicationsOfType: function(type) {
  	let appsOfType = [];
    let appIds = Object.keys(applications);
    let app;
    for (let i = 0; i < appIds.length; i++) {
    	app = applications[appIds[i]];
    	if (app.application === type) {
    		appsOfType.push(app);
    	}
    }
  	return appsOfType;
  },


  isParamAppOverThisApp: function(app) {
  	let thisAppBounds = {
  		top: this.sage2_y,
  		left: this.sage2_x,
  		width: this.sage2_width,
  		height: this.sage2_height
  	};
  	let otherAppBounds = {
  		top: app.sage2_y,
  		left: app.sage2_x,
  		width: app.sage2_width,
  		height: app.sage2_height
  	};
  	// Top left is 0,0.
  	if ((thisAppBounds.top < otherAppBounds.top)
  		&& (thisAppBounds.left < otherAppBounds.left)
  		&& (thisAppBounds.width > otherAppBounds.width)
  		&& (thisAppBounds.height > otherAppBounds.height)
  		){
  			return true;
  	}
  	return false;
  },


  getUrlOfApp: function(app) {
  	// The different app types have different storage of url
  	if (app.application === "image_viewer") {
  		return app.state.img_url;
  	} else if (app.application === "movie_player") {
  		return app.state.video_url;
  	} else {
  		throw "App type " + app.application + " unsuported. Unable to determine URL.";
  	}
  },


	isAlreadyInBigList: function(url) {
	  for(let i = 0; i < this.bigList.length; i++) {
			if (this.bigList[i].name === url) {
				return true;
			}
	  }
	  return false;
	},



	// ------------------------------------------------------------------------------------------------------------------------
	// ------------------------------------------------------------------------------------------------------------------------

	/**
	* To enable right click context menu support this function needs to be present.
	*
	* Must return an array of entries. An entry is an object with three properties:
	*	description: what is to be displayed to the viewer.
	*	callback: String containing the name of the function to activate in the app. It must exist.
	*	parameters: an object with specified datafields to be given to the function.
	*		The following attributes will be automatically added by server.
	*			serverDate, on the return back, server will fill this with time object.
	*			clientId, unique identifier (ip and port) for the client that selected entry.
	*			clientName, the name input for their pointer. Note: users are not required to do so.
	*			clientInput, if entry is marked as input, the value will be in this property. See pdf_viewer.js for example.
	*		Further parameters can be added. See pdf_view.js for example.
	*/
	getContextEntries: function() {
		var entries = [];

		if (this.isEating) {
			entries.push({
				description: "Disable Image / Video Eating",
				callback: "toggleEat",
				parameters: {}
			});
		} else {
			entries.push({
				description: "Enable Image / Video Eating",
				callback: "toggleEat",
				parameters: {}
			});
		}

		entries.push({ description: "separator" });

		if (this.cycleRandomized) {
			entries.push({
				description: "Disable random Cycling",
				callback: "toggleRandomCycle",
				parameters: {}
			});
		} else {
			entries.push({
				description: "Enable random Cycling",
				callback: "toggleRandomCycle",
				parameters: {}
			});
			entries.push({
				description: "Set Cycle Delay",
				callback: "setCycleTimer",
				parameters: {},
				inputField: true,
				inputFieldSize: 5,
			});
		}

		entries.push({ description: "separator" });

		entries.push({
			description: "Next",
			callback: "cycleToNextMedia",
			parameters: {},
		});

		return entries;
	},


	toggleEat: function() {
		this.isEating = !this.isEating;
		// Updates UI context menu, necessary for UI to see changes. Calls getContextEntries.
		this.getFullContextMenuAndUpdate();
	},


	toggleRandomCycle: function() {
		this.cycleRandomized = !this.cycleRandomized;
		// Updates UI context menu, necessary for UI to see changes. Calls getContextEntries.
		this.getFullContextMenuAndUpdate();
	},


	setCycleTimer: function(responseObject) {
		this.loadTimer = parseFloat(responseObject.clientInput);
	},


	// ------------------------------------------------------------------------------------------------------------------------
	// ------------------------------------------------------------------------------------------------------------------------

	resize: function(date) {
		this.imgDiv.style.maxWidth = "800px";
		this.imgDiv.style.maxHeight = "600px";
		this.videoDiv.style.maxWidth = "800px";
		this.videoDiv.style.maxHeight = "600px";
	},


	load: function(date) {
	},


	event: function(eventType, pos, user, data, date) {
	},


});
