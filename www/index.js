const FINAL = 2
const PREVIEW = 3

function deepCopyArray (a) {
	var b = $.extend(true, [], a);
	return b}

var isMouseDown = false;
document.onmousedown = function () {isMouseDown = true};
document.onmouseup = function () {isMouseDown = false};

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function range(start, count) {
  return Array.apply(0, Array(count))
    .map(function (element, index) { 
      return index + start;  
    });
}


function AbstractGrid (x_size, y_size,dots) {
	var slf = this;
	slf.x_size = x_size;
	slf.y_size = y_size;
	slf.score = [0,0]
	slf.turn = 0
	slf.dots = dots
	slf.empty = true

	slf.ai = new StupidAI(slf);
	slf.complete_squares = [] // Array containing all complete squares...
	// We keep track of all lines by their upper left coordinates...
	// All lines are stored, then, in too arrays of arrays which
	// represent are coordinate systems. In hlines, lines are assumed
	// to move to the right. In vlines, lines move down.
	slf.hlines = []
	slf.vlines = []
	for (var y=0; y <= y_size; y++) {
		var row_h = []
		var row_y = []
		for (var x=0; x <= slf.x_size; x++) {
			row_h.push(0);
			row_y.push(0);
		}
		slf.hlines.push(row_h)
		slf.vlines.push(row_y)
	}

	slf.copyGrid = function () {
		// Used for AI to make scenarios...
		var copy = new AbstractGrid(slf.x_size,slf.y_size,new FakeDots());
		copy.dots.grid = copy
		copy.score = deepCopyArray(slf.score)
		copy.hlines = deepCopyArray(slf.hlines)
		copy.vlines = deepCopyArray(slf.vlines)
		copy.complete_squares = deepCopyArray(slf.complete_squares);
		copy.turn = slf.turn
		return copy
	}

	slf.getHLine = function(x, y) {
		return slf.hlines[y][x]
	}
	
	slf.getVLine = function(x, y) {
		return slf.vlines[y][x]
	}

	slf.checkSquare = function (p1) {
		//console.log('Checking square: '+p1)
		squareString = p1[0]+'.'+p1[1]
		if (slf.complete_squares.indexOf(squareString) > -1) {
			//console.log('Square was already complete.');
			return
		}
		if (p1[0] < 0) {return}
		if (p1[1] < 0) {return}
		score = 0
		score += slf.getHLine(p1[0],p1[1]) // origin
		//console.log('H '+p1[0]+','+p1[1]+'+='+score)
		score += slf.getHLine(p1[0],p1[1]+1) // below origin
		//console.log('H '+p1[0]+','+(p1[1]+1)+'+='+score)
		score += slf.getVLine(p1[0],p1[1]) // origin (down)
		//console.log('V '+p1[0]+','+(p1[1])+'+='+score)
		score += slf.getVLine(p1[0]+1,p1[1]) // right of origin
		//console.log('V '+(p1[0]+1)+','+p1[1]+'+='+score)
		//console.log('We have '+score+' out of 4 sides');
		if (score == 4) {
			// There's a square!
			//console.log('A square!');
			slf.alternate_turn = false
			slf.complete_squares.push(squareString);
			slf.score[slf.turn] += 1
			return p1
		}
	}

	slf.checkForIncompleteSides = function (p1) {
		squareString = p1[0]+'.'+p1[1]
		//console.log('Checking for three sides: '+squareString)
		if (slf.complete_squares.indexOf(squareString) > -1) {
			//console.log('Square was already complete.');
			return false
		}
		if (p1[0] < 0) {return false}
		if (p1[1] < 0) {return false}
		score = 0
		var incomplete = []
		if (slf.getHLine(p1[0],p1[1]) == 0) { // origin
			incomplete.push([p1[0],p1[1],false])
		}
		if (slf.getHLine(p1[0],p1[1]+1)==0) { // below origin
			incomplete.push([p1[0],p1[1]+1,false])
		}
		if (slf.getVLine(p1[0],p1[1])==0) { // origin (down)
			//console.log('V '+p1[0]+','+(p1[1])+'+='+score)
			incomplete.push([p1[0],p1[1],true]);
		}
		if (slf.getVLine(p1[0]+1,p1[1])==0) { // right of origin
			//console.log('V '+(p1[0]+1)+','+p1[1]+'+='+score)
			incomplete.push([p1[0]+1,p1[1],true])
		}
		//console.log('There are '+incomplete.length+' incomplete sides');
		return incomplete
	}

	slf.checkForThreeSides = function (p1) {
		incomplete = slf.checkForIncompleteSides(p1);
		if (incomplete) {
			if (incomplete.length == 1) {
				// There's an almost complete square!
				//console.log('There is just one incomplete side: '+incomplete);
				return incomplete[0]
			}
		}
	}

	slf.addLine = function(p1, p2) {
		// Given two coordinates, we draw a line...
		slf.alternate_turn = true
		if (p1[0]==p2[0]) {
			// Our X coordinates match...
			if (p2[1] > p1[1]) {
				var y1 = p1[1]
				var y2 = p2[1]
			}
			else {
				// Swap them if they're wrong way around...
				var y1 = p2[1]
				var y2 = p1[1]
			}
			if ((y2 - y1) != 1) {
				console.log('Warning: incorrect gap between points '+p1+'+'+p2)
			}
			//console.log('slf.vlines['+y1+']['+p1[0]+']=1');
			slf.empty = false
			slf.vlines[y1][p1[0]] = 1
			//console.log('Added vertical line (turn '+slf.turn+'): '+p1[0]+','+p1[1])
			// We just added a vertical line -- let's check the relevant square (to the left and right of the top)
			slf.dots.drawVictory(slf.checkSquare([p1[0],y1]))
			slf.dots.drawVictory(slf.checkSquare([p1[0]-1,y1]))
		}
		else if (p1[1]==p2[1]) {
			// Our Y coordinates match...
			if (p2[0] > p1[0]) {
				var x1 = p1[0]
				var x2 = p2[0]
			}
			else {
				var x1 = p2[0];
				var x2 = p1[0];
			}
			if ((x2-x1) != 1) {
				console.log('Warning: incorrect gap between points '+p1+'+'+p2);
			}
			//console.log('slf.hlines['+p1[1]+']['+x1+']=1');
			slf.hlines[p1[1]][x1] = 1
			slf.empty = false
			//console.log('Added horizontal line: '+p1[0]+','+p1[1])
			// We just added a horizontal line -- let's check the relevant squares (at the origin and above it...
			slf.dots.drawVictory(slf.checkSquare([x1,p1[1]]));
			slf.dots.drawVictory(slf.checkSquare([x1,p1[1]-1]));
		}
		else {
			console.log("That's odd -- we shouldn't ever get here :( Points: "+p1+','+p2)
		}
		if (slf.alternate_turn) {
			slf.alternateTurn()
		}
		clearInterval(slf.animating)			
		slf.animating = false
		if (slf.dots.use_ai) {
			if (slf.turn == 0 && slf.dots.aiFirstCheckbox.checked) {
				slf.ai.takeTurn();}
			else if (slf.turn == 1 && slf.dots.aiFirstCheckbox.checked==false) {
				slf.ai.takeTurn();}
		}
		return p1,p2
	} // end slf.addLine()

	slf.alternateTurn = function () {
		if (slf.turn == 1) {
			slf.turn = 0
		}
		else {
			slf.turn = 1
		}
		slf.dots.drawTurn();
	}
}
						
function FakeDots () {
	// Used in AI as a result of poor MVC separation -- sorry world
	var slf = this;
	slf.spacer = 1;
	slf.drawLine = function () {
		//console.log("FakeDots.drawLine");
		slf.grid.addLine([slf.startX,slf.startY],[slf.endX,slf.endY]);
	}
	slf.toCoord = function (n) {return n};
	slf.drawTurn = function () {return false};
	slf.drawVictory = function () { return false };
}
	
		

function Dots () {
	var slf = this;
	this.score = [0,0]
	this.setupCanvas = function () {
		slf.canvas = document.getElementById("board");
		slf.animationCanvas = document.getElementById("animate");
		slf.lmCanvas = document.getElementById("lastmove");
		slf.ctx = slf.canvas.getContext("2d");
		slf.actx = slf.animationCanvas.getContext("2d");
		slf.lmctx = slf.lmCanvas.getContext("2d");
		slf.canvas.width = Math.round(screen.width*0.85);
		slf.canvas.height = Math.round(screen.height*0.85);
		slf.animationCanvas.width = slf.canvas.width;
		slf.animationCanvas.height = slf.canvas.height;
		slf.lmCanvas.width = slf.canvas.width;
		slf.lmCanvas.height = slf.canvas.height;
		slf.canvas.style.border = "1px solid #000";
		document.body.appendChild(slf.canvas);
		slf.animationCanvas.addEventListener('mousemove',slf.onMouseMove,false);
		slf.animationCanvas.addEventListener('mousedown',slf.onMouseDown,false);
		slf.animationCanvas.addEventListener('mouseup',slf.onMouseUp,false);
		slf.animationCanvas.addEventListener('touchmove',slf.onTouchMove,false);
		slf.animationCanvas.addEventListener('touchend',slf.onTouchEnd,false);
		slf.aiCheckbox = document.getElementById('ai');
		slf.aiCheckbox.addEventListener('click',slf.onAIClick)
		slf.aiFirstCheckbox = document.getElementById('computer_first');
		slf.aiFirstCheckbox.addEventListener('click',slf.onAIFirstClick)
		slf.use_ai = slf.aiCheckbox.checked;
		slf.restartButton = document.getElementById('restart');
		slf.restartButton.addEventListener('click',slf.onRestart);
		slf.xBox = document.getElementById('x')
		slf.yBox = document.getElementById('y')
		slf.xBox.addEventListener('change',slf.xyChange);
		slf.yBox.addEventListener('change',slf.xyChange);
		slf.levelButton = document.getElementById('level');
		slf.levelButton.addEventListener('change',slf.onLevelChange)
		slf.restartNote = document.getElementById('resetNote')
	}

	this.circle_radius = 9
	this.spacer = 50
	
	this.xyChange = function (event) {
		if (slf.grid.empty) {
			// If there's no play, just change the grid...
			slf.onRestart()
		}
		else {
			// otherwise wait for restart
		slf.restartNote.style.display = 'block';
		}
	}

	this.onLevelChange = function(event) {
		console.log('Level Change!');
		slf.grid.ai.level = slf.levelButton.options[slf.levelButton.selectedIndex].value;
	}

	this.onRestart = function (event) {
		console.log('onRestart');
		slf.restartNote.style.display = 'none';
		slf.ctx.beginPath()
		slf.ctx.clearRect(0,0,slf.canvas.width,slf.canvas.height);
		slf.lmctx.clearRect(0,0,slf.canvas.width,slf.canvas.height);
		slf.actx.clearRect(0,0,slf.canvas.width,slf.canvas.height);
		slf.ctx.beginPath()
		slf.autoDrawGrid();
		slf.onAIFirstClick(); // Make us go first if we're set to go first
	}

	this.onAIClick = function (event) {
		slf.use_ai = slf.aiCheckbox.checked
		slf.onAIFirstClick(event)
	}

	this.onAIFirstClick = function (event) {
		if (slf.aiFirstCheckbox.checked) {
			if (slf.use_ai) {
				slf.grid.ai.takeTurn();
			}
		}
	}

	this.autoDrawGrid = function () {
		x_size = parseInt(slf.xBox.value);
		y_size = parseInt(slf.yBox.value);
		x_space = slf.canvas.width / (x_size+1)
		y_space = slf.canvas.height / (y_size+1)
		if (x_space < y_space) {
			console.log('x is the limiter');
			slf.spacer = x_space
		}
		else {
			console.log('y is the limiter');
			slf.spacer = y_space
		}
		slf.circle_radius = Math.round(slf.spacer / 5)
		if (slf.circle_radius < 1) {
			slf.circle_radius = 1
		}
		slf.drawGrid(x_size,y_size);
 		slf.grid.ai.level = slf.levelButton.options[slf.levelButton.selectedIndex].value;
	}

	this.drawGrid = function (x_size, y_size) {
		slf.ctx.strokeStyle = "#000000";
		slf.ctx.fillStyle = "#000000";
		var circle_radius = this.circle_radius
		var spacer = this.spacer
		for (var x=1; x <= x_size; x++) {
			for (var y=1; y <= y_size; y++) {
				//console.log('ctx.arc('+x*slf.spacer+','+y*slf.spacer+','+circle_radius+')');
				slf.ctx.moveTo(x*spacer,y*spacer);
				slf.ctx.arc(x*spacer,y*spacer,circle_radius,0,2*Math.PI);
				slf.ctx.fill();
			}
		}
		slf.grid = new AbstractGrid(x_size,y_size,slf)
	}

	slf.setTurnColor = function(ctx) {
	    if (slf.grid.turn == 0) {
		ctx.strokeStyle = "#ff0000";
		ctx.fillStyle = "#ff0000";
	    }
	    else {
		ctx.strokeStyle = "#0000ff";				
		ctx.fillStyle = "#0000ff";				
	    }
	}

	slf.drawVictory = function (pt) {
		//console.log('drawVicotyr->'+pt);
		if (pt) {
			//console.log('Drawing victory mark!');
			var x = slf.toCoord(pt[0])+0.5*slf.spacer
			var y = slf.toCoord(pt[1])+0.5*slf.spacer
			slf.ctx.beginPath();
			slf.ctx.moveTo(x,y);
			slf.setTurnColor(slf.ctx);
			//console.log('slf.ctx.arc('+x+','+y+','+slf.spacer*0.3+',0,2*Math.PI)');
			slf.ctx.arc(x,y,slf.spacer*0.3,0,2*Math.PI)
			slf.ctx.fill();
			slf.ctx.stroke();
			slf.ctx.font = Math.round(slf.spacer*0.3) + "px Comic Sans MS";
			slf.ctx.fillStyle = "#ffffff";
			slf.ctx.textAlign = "center";
			slf.ctx.fillText(""+slf.grid.score[slf.grid.turn],x,y+slf.spacer*0.1);
		}
	}

	slf.drawTurn = function () {
		var start_x = slf.canvas.width - 20
		var start_y = 10
		slf.ctx.beginPath();
		slf.ctx.moveTo(start_x, start_y);
		slf.setTurnColor(slf.ctx);
		slf.ctx.lineTo(start_x+10,start_y);
		slf.ctx.lineTo(start_x+10,start_y+10);
		slf.ctx.lineTo(start_x,start_y+10);
		slf.ctx.lineTo(start_x,start_y);
		slf.ctx.stroke()
		slf.ctx.fill();
	}

	this.startX = -1;
	this.startY = -1;
	this.endX = -1;
	this.endY = -1;
	this.last_draw = 0

    slf.animating = false;

    slf.highlights = [[-1,-1],[-1,-1]];

    this.highlightGridPoint = function(idx,x,y) {
	if (slf.highlights[idx][0]==x && slf.highlights[idx][1]==y) {
	    return
	}
	else {
	    console.log('highlighting point %s,%s (idx %s)',x,y,idx);
	    slf.actx.beginPath()
	    slf.actx.arc(
		slf.round(x,true),
		slf.round(y,false,true),					 
		slf.circle_radius,0,2*Math.PI
	    );
	    slf.setTurnColor(slf.actx)
	    slf.actx.moveTo(slf.round(x,true),slf.round(y,false,true));
	    slf.actx.stroke(); slf.actx.fill();
	    slf.actx.closePath();
	    slf.highlights[idx] = [x,y]
	    return true;
	}
	
    }
    
    this.updateAnimation = function () {
	// First, clear whatever is there...
	var cleared = false;
	function highlightPoint (idx,x,y) {
	    // highlight starting point...
	    // Now figure out which direction we're going...
	    gx = slf.round(x,true);
	    gy = slf.round(y,false,true);
	    if (! cleared && (slf.highlights[idx][0] != gx || slf.highlights[idx][1] != gy)) {
		console.log('Clear rectangle! highlight %s,%s is changing',slf.highlights[idx][0],slf.highlights[idx][1])
		slf.actx.clearRect(0,0,slf.canvas.width,slf.canvas.height);
		cleared = true;
	    }
	    if (gx != slf.highlights[idx][gx] || gy != slf.highlights[idx][gy]) {
		return slf.highlightGridPoint(idx,gx,gy);
	    }
	}
	// Highlight our starting point...
	updated = false;
	if (slf.startX > -1 && slf.startY > -1) {
	     updated = highlightPoint(0,slf.startX,slf.startY)
	 }
	 if (slf.endX > -1 && slf.endY > -1) {
	     updated = updated || highlightPoint(1,slf.endX,slf.endY)
	 }
	if (updated) {
	    console.log('we have a change - drawing line!');
	    slf.setTurnColor(slf.actx);
	    slf.drawLine(PREVIEW);
	    // slf.actx.beginPath();
	    // slf.actx.moveTo(slf.round(slf.startX),slf.startY)
	    // slf.actx.lineTo(slf.endX,slf.endY);
	    // slf.actx.setLineDash([2,4]);
	    // slf.actx.lineWidth = 2;
	    // slf.actx.stroke();
	}
	return;
    }

    this.onTouchMove = function (event) {
	if (! slf.inTouch) {
	    console.log('first touch');
	    slf.inTouch = true;
	    slf.isMouseDown = true;
	    slf.touches = [];
	    slf.touches.push(event.touches);
	    slf.startX = event.touches[0].pageX  - slf.canvas.offsetLeft;
	    slf.startY = event.touches[0].pageY - slf.canvas.offsetTop;
	    console.log('startX,startY=%s,%s',slf.startX,slf.startY);

	}
	else {
	    slf.touches.push(event.touches);
	    //console.log('we have %s new events added to %s total',event.touches.length,slf.touches.length);
	    //console.log('onTouchMove %s',event);
	    slf.endX = event.touches[0].pageX  - slf.canvas.offsetLeft;
	    slf.endY = event.touches[0].pageY - slf.canvas.offsetTop;
	    slf.updateAnimation();
	}
	//if (slf.animating==false) {
	    //console.log('Start interval');
	    //slf.animating = setInterval(slf.updateAnimation,50)
    //}
    }
	
	this.onMouseMove = function (event) {
	    console.log('onMouseMove %s',event);
		if (isMouseDown) {
			//alert('Mouse is down')
			var x = event.pageX - slf.canvas.offsetLeft
			var y = event.pageY - slf.canvas.offsetTop
			if (slf.startX > -1) {
				slf.endX = x;
				slf.endY = y;
			}
			else {
				slf.startX = x;
				slf.startY = y;
				//console.log('Update startX'+slf.startX+'+'+slf.startY);
			}
			if (slf.animating==false) {
				//console.log('Start interval');
				slf.animating = setInterval(slf.updateAnimation,100)
			}
		}
	} // end onMouseMove

    this.round = function (n,is_x,is_y) {
	//i = n / slf.spacer;
	//i = Math.round(i);
	//n = i*slf.spacer;
	//return n;
	gn = slf.toGrid(n)
	if (gn < 0) {gn = 0}
	if (is_y && gn > (slf.grid.x_size - 1)) {
	    gn = slf.grid.x_size - 1
	}
	if (! is_x && gn > (slf.grid.y_size - 1)) {
	    gn = slf.grid.y_size - 1
	}
	return slf.toCoord(gn);
    }
	this.toGrid = function (n) {
		i = n / slf.spacer
		i = Math.round(i)
		return i-1
	}

	this.toCoord = function (n) {
		return (n+1) * slf.spacer
	}

    this.onTouchEnd = function (event) {
	console.log('onTouchEnd changedTouches=%s (%s)',event.changedTouches, event.changedTouches.length)
	if (event.changedTouches) {
	    slf.touches.push(event.changedTouches);
	}
	slf.startX = slf.touches[0][0].pageX - slf.canvas.offsetLeft
	slf.startY = slf.touches[0][0].pageY - slf.canvas.offsetTop
	slf.endX = slf.touches[slf.touches.length-1][0].pageX - slf.canvas.offsetLeft
	slf.endY = slf.touches[slf.touches.length-1][0].pageY - slf.canvas.offsetTop
	slf.touches = [];; slf.inTouch = false;
	console.log('We have seen %s touches. We go from (%s,%s) to (%s,%s)',
		    slf.touches.length,
		    slf.startX,slf.startY,
		    slf.endX,slf.endY);
	slf.drawLine()
	// var x = event.changedTouches[0].pageX - slf.canvas.offsetLeft
	// 	var y = event.changedTouches[0].pageY - slf.canvas.offsetTop
	// 	if ((slf.startX > -1) && (slf.endX > -1)) {
	// 		slf.drawLine()
	// 	}
	//console.log('Clearing animation interval.');
	clearInterval(slf.animating)
	slf.animating = false
	slf.updateAnimation()
    }
   
    this.onMouseDown = function (event) {
	console.log('mousedown %s',event);
	var x = event.pageX - slf.canvas.offsetLeft
	var y = event.pageY - slf.canvas.offsetTop
	// Draw animation in a bit...
	if (slf.startX > -1) {
	    console.log('Draw line final!');
	    slf.endX = x;
	    slf.endY = y;
	    slf.drawLine()
	    //slf.startX = -1; slf.startY = -1; slf.endX = -1; slf.endY = -1;
	}
	else {
	    slf.startX = x;
	    slf.startY = y;
	}}
    
    this.onMouseUp = function(event) {
	//console.log('onMouseUp %s',event)
	var x = event.pageX - slf.canvas.offsetLeft
	var y = event.pageY - slf.canvas.offsetTop
	if ((slf.startX > -1) && (slf.endX > -1)) {
	    // We are making a line...
	    slf.drawLine()
	    slf.startX = -1; slf.startY = -1; slf.endX = -1; slf.endY = -1;
	}
	//console.log('Clearing animation interval.');
	clearInterval(slf.animating)
	slf.animating = false
	slf.updateAnimation()
    }

    this.drawLine = function (mode) {
	if (! mode) {mode = FINAL;}
	// console.log('Draw line: '+slf.startX+','+slf.startY+'->'+slf.endX+','+slf.endY);
	var sx = slf.toGrid(slf.startX); 
	var sy = slf.toGrid(slf.startY);
	var ex = slf.toGrid(slf.endX);
	var ey = slf.toGrid(slf.endY);
	// console.log('drawLine mode:%s %s,%s -> %s,%s',
	// 	    mode,
	// 	    sx,sy,
	// 	    ex,ey);
	if (ex >= slf.grid.x_size) {ex = slf.grid.x_size - 1}
	if (ey >= slf.grid.y_size) {ey = slf.grid.y_size - 1}
	if (sx >= slf.grid.x_size) {sx = slf.grid.x_size - 1}
	if (sy >= slf.grid.y_size) {sy = slf.grid.y_size - 1}
	if (ex < 0) {ex = 0}
	if (ey < 0) {ey = 0}
	if (sx < 0) {sx = 0}
	if (sy < 0) {sy = 0}
	//console.log('Draw line: '+sx+','+sy+'->'+ex+','+ey);
	if (((ey==sy) || (ex==sx)) && ((ey!=sy) || (ex!=sx))) {
	    // We only act if we're a straight line...
	    if ((ey - sy) > 1) {
		ey = sy+1
	    }
	    else if ((sy - ey) > 1) {
		sy = ey+1
	    }
	    else if ((ex - sx) > 1) {
		ex = sx+1
	    }
	    else if ((sx - ex) > 1) {
		sx = ex+1
	    }
	    // Now draw the actual path...
	    if (mode==FINAL) {
		slf.actx.clearRect(0,0,slf.animationCanvas.width,slf.animationCanvas.height);
		slf.ctx.beginPath();
		slf.setTurnColor(slf.ctx);
		slf.setTurnColor(slf.lmctx);
		slf.ctx.moveTo(slf.toCoord(sx),slf.toCoord(sy));
		slf.ctx.lineTo(slf.toCoord(ex),slf.toCoord(ey));
		slf.lmctx.clearRect(0,0,slf.lmCanvas.width,slf.lmCanvas.height)
		slf.lmctx.beginPath()
		slf.lmctx.lineWidth = 5
		slf.lmctx.moveTo(slf.toCoord(sx),slf.toCoord(sy));
		slf.lmctx.lineTo(slf.toCoord(ex),slf.toCoord(ey));
		slf.lmctx.stroke()
		//alert('Drawing line from '+slf.startX+'+'+slf.startY+' to '+slf.endX+'+'+slf.endY);
		slf.ctx.stroke()
		//console.log('Adding line to grid now: '+sx+','+sy+'-'+ex+','+ey);
		slf.grid.addLine([sx,sy],[ex,ey])
		slf.startX = -1; slf.startY = -1; slf.endX = -1; slf.endY = -1;
	    }
	    else {
		//console.log('Drawing preview line from %s,%s to %s,%s',sx,sy,ex,ey);
		slf.setTurnColor(slf.actx);
		slf.actx.beginPath();
		slf.actx.lineWidth = 5;
		slf.actx.setLineDash([3,6]);
		slf.actx.moveTo(slf.toCoord(sx),slf.toCoord(sy));
		slf.actx.lineTo(slf.toCoord(ex),slf.toCoord(ey));
		slf.actx.stroke();
	    }
	}

    }
    
}
	
function draw () {
    dots = new Dots(); // Global...
    xratio = screen.width/screen.height
    ydots = 8
    xdots = 8 * xratio
    document.getElementById('x').value = Math.round(xdots)
    document.getElementById('y').value = Math.round(ydots)
    dots.setupCanvas();
    dots.autoDrawGrid();
    dots.drawTurn();
    dots.onAIFirstClick(true) // Make us go first if we're set to go first :)
}

$(document).ready(
    function () {
	$('#play').click(function () {
	    $('#controls').slideUp();
	    $('#menu').slideDown();
	}
			); // end click
	$('#menu').click(function () {
	    $('#controls').slideDown();
	    $('#menu').slideUp();
	}) // end click
	draw();
    })// end document ready

