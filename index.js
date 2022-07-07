// https://codepen.io/beno1t/pen/drvjQy
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var Nodes = {

  // Settings
  density: 15,
  
  drawDistance: 30,
  baseRadius: 3,
  maxLineThickness: 3,
  reactionSensitivity: 5,
  lineThickness: 1,

  points: [],
  mouse: { x: -1000, y: -1000, down: false },

  animation: null,

  canvas: null,
  context: null,

  imageInput: null,
  bgImage: null,
  bgCanvas: null,
  bgContext: null,
  bgContextPixelData: null,

  init: function() {
    // Set up the visual canvas 
    this.canvas = document.getElementById( 'canvas' );
    this.context = canvas.getContext( '2d' );
    this.context.globalCompositeOperation = "lighter";
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.display = 'block'

    this.imageInput = document.createElement( 'input' );
    this.imageInput.setAttribute( 'type', 'file' );
    this.imageInput.style.visibility = 'hidden';
    this.imageInput.addEventListener('change', this.upload, false);
    document.body.appendChild( this.imageInput );

    this.canvas.addEventListener('mousemove', this.mouseMove, false);
    this.canvas.addEventListener('mousedown', this.mouseDown, false);
    this.canvas.addEventListener('mouseup',   this.mouseUp,   false);
    this.canvas.addEventListener('mouseout',  this.mouseOut,  false);

    window.onresize = function(event) {
      Nodes.canvas.width = window.innerWidth;
      Nodes.canvas.height = window.innerHeight;
      Nodes.onWindowResize();    
    }

    // Load initial input image 
    this.loadData('images/shadow.png');
  },

  preparePoints: function() {

    // Clear the current points
    this.points = [];
    
    var width, height, i, j;

    var colors = this.bgContextPixelData.data;

    for( i = 0; i < this.canvas.height; i += this.density ) {

      for ( j = 0; j < this.canvas.width; j += this.density ) {

        var pixelPosition = ( j + i * this.bgContextPixelData.width ) * 4;

        // Dont use whiteish pixels
        if ( colors[pixelPosition] > 200 && (colors[pixelPosition + 1]) > 200 && (colors[pixelPosition + 2]) > 200 || colors[pixelPosition + 3] === 0 ) {
          continue;
        }
        
        var color = 'rgba(' + colors[pixelPosition] + ',' + colors[pixelPosition + 1] + ',' + colors[pixelPosition + 2] + ',' + '1)';
        this.points.push( { x: j, y: i, originalX: j, originalY: i, color: color } );

      }
    }
  },

  updatePoints: function() {

    var i, currentPoint, theta, distance;
    
    for (i = 0; i < this.points.length; i++ ){

      currentPoint = this.points[i];

      theta = Math.atan2( currentPoint.y - this.mouse.y, currentPoint.x - this.mouse.x);

      if ( this.mouse.down ) {
        distance = this.reactionSensitivity * 200 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
         (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));
      } else {
        distance = this.reactionSensitivity * 100 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
         (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));  
      }
      

      currentPoint.x += Math.cos(theta) * distance + (currentPoint.originalX - currentPoint.x) * 0.05;
      currentPoint.y += Math.sin(theta) * distance + (currentPoint.originalY - currentPoint.y) * 0.05;

    }
  },

  drawLines: function() {
    
    var i, j, currentPoint, otherPoint, distance, lineThickness;

    for ( i = 0; i < this.points.length; i++ ) {

      currentPoint = this.points[i];

      // Draw the dot.
      this.context.fillStyle = currentPoint.color;
      this.context.strokeStyle = currentPoint.color;

      for ( j = 0; j < this.points.length; j++ ){

        // Distaqnce between two points.
        otherPoint = this.points[j];

        if ( otherPoint == currentPoint ) {
          continue;
        }

        distance = Math.sqrt((otherPoint.x - currentPoint.x) * (otherPoint.x - currentPoint.x) +
         (otherPoint.y - currentPoint.y) * (otherPoint.y - currentPoint.y));

        if (distance <= this.drawDistance) {

          this.context.lineWidth = (1 - (distance / this.drawDistance)) * this.maxLineThickness * this.lineThickness;
          this.context.beginPath();
          this.context.moveTo(currentPoint.x, currentPoint.y);
          this.context.lineTo(otherPoint.x, otherPoint.y);
          this.context.stroke();
        }
      }
    }
  },

  drawPoints: function() {

    var i, currentPoint;

    for ( i = 0; i < this.points.length; i++ ) {

      currentPoint = this.points[i];

      // Draw the dot.
      this.context.fillStyle = currentPoint.color;
      this.context.strokeStyle = currentPoint.color;

      this.context.beginPath();
      this.context.arc(currentPoint.x, currentPoint.y, this.baseRadius ,0 , Math.PI*2, true);
      this.context.closePath();
      this.context.fill();

    }
  },

  draw: function() {
    this.animation = requestAnimationFrame( function(){ Nodes.draw() } );

    this.clear();
    this.updatePoints();
    this.drawLines();
    this.drawPoints();

  },

  clear: function() {
    this.canvas.width = this.canvas.width;
  },

  // The filereader has loaded the image... add it to image object to be drawn
  loadData: function( data ) {
    
    this.bgImage = new Image;
    this.bgImage.src = data;
    this.bgImage.crossOrigin = "Anonymous";

    this.bgImage.onload = function() {

      //this
      Nodes.drawImageToBackground();
    }
  },

  // Image is loaded... draw to bg canvas
  drawImageToBackground: function () {

    this.bgCanvas = document.createElement( 'canvas' );
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;

    var newWidth, newHeight;

    // If the image is too big for the screen... scale it down.
    if ( this.bgImage.width > this.bgCanvas.width - 100 || this.bgImage.height > this.bgCanvas.height - 100) {

      var maxRatio = Math.max( this.bgImage.width / (this.bgCanvas.width - 100) , this.bgImage.height / (this.bgCanvas.height - 100) );
      newWidth = this.bgImage.width / maxRatio;
      newHeight = this.bgImage.height / maxRatio;

    } else {
      newWidth = this.bgImage.width;
      newHeight = this.bgImage.height;
    }

    // Draw to background canvas
    this.bgContext = this.bgCanvas.getContext( '2d' );
    this.bgContext.drawImage( this.bgImage, (this.canvas.width - newWidth) / 2, (this.canvas.height - newHeight) / 2, newWidth, newHeight);
    this.bgContextPixelData = this.bgContext.getImageData( 0, 0, this.bgCanvas.width, this.bgCanvas.height );

    this.preparePoints();
    this.draw();
  },

  mouseDown: function( event ){
    Nodes.mouse.down = true;
  },

  mouseUp: function( event ){
    Nodes.mouse.down = false;
  },
  
  mouseMove: function(event){
    Nodes.mouse.x = event.offsetX || (event.layerX - Nodes.canvas.offsetLeft);
    Nodes.mouse.y = event.offsetY || (event.layerY - Nodes.canvas.offsetTop);
  },
  
  mouseOut: function(event){
    Nodes.mouse.x = -1000;
    Nodes.mouse.y = -1000;
    Nodes.mouse.down = false;
  },

  // Resize and redraw the canvas.
  onWindowResize: function() {
    cancelAnimationFrame( this.animation );
    this.drawImageToBackground();
  }
}
  
  setTimeout( function() {
    Nodes.init();
}, 10 );