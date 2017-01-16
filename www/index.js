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

function StupidAI (grid) {
	
	var slf = this
	slf.grid = grid
	
	slf.copyScenario = function () {
		// Copy ourselves...
		grid = slf.grid.copyGrid();
		return grid.ai
	}

	slf.lookForSquares = function () {
		// smartish AI -- look for a complete box...
		for (var x=0; x < (slf.grid.x_size - 1); x++) {
			//console.log('lfs: Checking column: '+x);
			for (var y=0; y < (slf.grid.y_size - 1); y++) {
				//console.log('lfs: Checking square at '+x+','+y);
				var result = slf.grid.checkForThreeSides([x,y])
				//console.log('lfs==> '+result);
				if (result) {
					//console.log('lfs Making move with result: '+result);
					slf.makeMove(result[0],result[1],result[2]);
					return true;
				}
				//else {
				//	console.log('lfs No dice.')
				//}
			} // End for y loop
		} // End for x loop
		//console.log('No squares to be found.');
	}

	slf.lookForNonLosingMoves = function () {
		var lookAtPoint = function (x, y, vertical) {
			if (slf.isLineNotADup(x,y,vertical)) {
				console.log('Checking lookAtPoint '+x+'.'+y+'.'+vertical);
				if (slf.grid.checkForIncompleteSides([x,y]).length <= 2) {
					//console.log('Rejecting: we have two or fewer incomplete sides: '+slf.grid.checkForIncompleteSides([x,y]));
					return false
				}
				if (vertical) {
					// Then we're checking out the point and the box left of it...
					if ((x-1) >= 0 && slf.grid.checkForIncompleteSides([x-1,y]).length <= 2) {
						//console.log('Rejecting: we have two or fewer incomplete sides on left: '+slf.grid.checkForIncompleteSides([x-1,y]));
						return false
					}
				}
				else {
					// horizontal... in that case, we're checking the box above...
					if ((y-1) >= 0 && slf.grid.checkForIncompleteSides([x,y-1]).length <= 2) {
						//console.log('Rejecting: we have two or fewer incomplete sides above: '+slf.grid.checkForIncompleteSides([x,y-1]));
						return false
					}
				}
				slf.makeMove(x,y,vertical)
				return true
			}}
		return slf.iterateRandomly(lookAtPoint);
	}

	slf.lookForLeastBadAlternative = function () {
		console.log('slf.lookForLeastBadAlternative() starting...');
		best_move = false
		squares_lost = 1000000000000000
		for (var x=0; x < (slf.grid.x_size - 1); x++) {
			//console.log('lba Checking column: '+x);
			for (var y=0; y < (slf.grid.y_size - 1); y++) {
				//console.log('lba Checking square at '+x+','+y);
				for (var vert=0; vert < 2; vert++) {
					if (slf.isLineNotADup(x,y,vert)) {
						// If the move is worth considering...
						console.log('Considering ',x+'.'+y+'-'+vert);
						squares_looked_at = 0 
						squares_lost_this_move = 0; // Start w/ 0...
						while (squares_looked_at < 2) {
							if (squares_looked_at==0) {
								incomplete_sides = slf.grid.checkForIncompleteSides([x,y])
							}
							else if (squares_looked_at==1) {
								// If we've already looked at a square...
								if (vert) {
									// If we're a vertical line, we're looking at
									// ourselves + the square to the left
									incomplete_sides = slf.grid.checkForIncompleteSides([x-1,y])
								}
								else {
									// if we're a horizontal line, we're looking at
									// ourselves + the square above
									incomplete_sides = slf.grid.checkForIncompleteSides([x,y-1])
								}
							}
							switch (incomplete_sides.length) {
							case 1:
								console.log('WTF 1 incomplete side -- we can get the square!');
								squares_lost_this_move = -1;
							case 3:
								squares_lost_this_move += 0;
							case 4:
								squares_lost_this_move += 0;
							case 2:
								// console.log('2 incomplete sides -- as expected... how bad is it?');
								// In this case we're giving up a squares, so the
								// question is, how bad is it... to find out, we must
								// play out the next move...
								var ai = slf.copyScenario();
								incomp_from_copied = ai.grid.checkForIncompleteSides([x,y]);
								if (incomp_from_copied.length != 2) {
									console.log("WTF -- copied scenario doesn't match our expectations...")
									console.log('Copied scenario shows '+ai.grid.checkForIncompleteSides([x,y]).length + ' incomplete sides');
								console.log('Copied scenario shows incomplete sides: '+ai.grid.checkForIncompleteSides([x,y]));
								}
								ai.makeMove(x,y,vert)
								// Now find out how many squares there are...
								//squares_lost_this_move = 0;
								while (ai.lookForSquares()) {
									//console.log("Ok, that's bad...");
									squares_lost_this_move += 1;
								}
								if (squares_lost_this_move == 0) {
									//console.log('Very strange: we didnt see any success -- why not?');
								}
								// If we've played out the scenario, then we don't need to do it again...
								squares_looked_at = 2
							}
							squares_looked_at += 1
						}
						console.log(x+'.'+y+'-'+vert+'=> loses '+squares_lost_this_move);
						if (squares_lost_this_move < squares_lost) {
							squares_lost = squares_lost_this_move; // This is our new move...
							best_move = [x,y,vert]
						}
					}
				} // end for vert
			} // end for y
		} // end for x
		if (best_move) {
			console.log('lba Made least bad move: '+best_move+' ... giving up '+squares_lost);
			slf.makeMove(best_move[0],best_move[1],best_move[2]);
			return true;
		}
		else {
			console.log('slf.lookForLeastBadAlternative failed - returning false');
			return false
		}
	} // end lookForLeastBadAlternative
	
	slf.iterateRandomly = function(doWhat) {
		// Move randomly through all squares, then hand
		// doWhat and x and a y to do something with...
		// if doWhat returns true, we end...
		yvals = shuffle(range(0,slf.grid.y_size - 1));
		xvals = shuffle(range(0,slf.grid.x_size - 1))
		//console.log('yvals = '+yvals);
		//console.log('xvals = '+xvals);
		direction = shuffle(range(0,2))
		for (var d=0; d < direction.length; d++) {
			for (var y=0; y < yvals.length; y++) {
				for (var x=0; x < xvals.length; x++) {
					if (doWhat(xvals[x],yvals[y],direction[d])) {
						return true
					}
				}
			}
		}
	}

	slf.isLineNotADup = function (x, y, vertical) {
		//console.log('Checking for dup: '+x+'.'+y+'.'+vertical)
		if (vertical) {
			var row = slf.grid.vlines[y]
		}
		else {
			var row = slf.grid.hlines[y]
		}
		if (row[x]==0) {
			//console.log('slf.isLineNotADup->true')
			return true}
		else {
			//console.log('slf.isLineNotADup->false')
			return false
		}
	}

	slf.lookRandom = function () {
		var lookAtPoint = function (x, y, vertical) {
			if (slf.isLineNotADup(x,y,vertical)) {
				slf.makeMove(x,y,vertical)
				return true
			}
			else {
				return false
			}}
		return slf.iterateRandomly(lookAtPoint)
	}

	slf.lookRandomOld = function () {
		yvals = shuffle(range(0,slf.grid.y_size - 1));
		xvals = shuffle(range(0,slf.grid.x_size - 1))
		direction = shuffle(range(0,2))
		for (var d=0; d < direction.length; d++) {
			for (var y=0; y < yvals.length; y++) {
				for (var x=0; x < xvals.length; x++) {
					dir = direction[d]
					if (dir==1) {
						var row = slf.grid.hlines[yvals[y]]
						var vertical = false;
					}
					else {
						var row = slf.grid.vlines[yvals[y]]
						var vertical = true;
					}
					//console.log('Checking '+xvals[x]+'.'+yvals[y]+' v='+vertical);
					if (row[xvals[x]]==0) {
						//console.log('Making move...'+xvals[x]+'.'+yvals[y]);
						slf.makeMove(xvals[x],yvals[y],vertical)
						return true}
				}
			}
		}
	}

	slf.takeTurnDumbest = function () {
		if (slf.lookRandom()) {return}
		//console.log('Error - no move found :(');
		alert("Computer couldn't find a move - game over! \n\nRed: "+slf.grid.score[0]+'\nBlue: '+slf.grid.score[1])
	}

	slf.takeTurnDumber = function () {
		console.log('StupidAI.takeTurn()');
		console.log('look for squares...');
		if (slf.lookForSquares()) {return}
		console.log('look for non-losing moves...');
		if (slf.lookRandom()) {return}
		console.log('Error - no move found :(');
		alert("Computer couldn't find a move - game over! \n\nRed: "+slf.grid.score[0]+'\nBlue: '+slf.grid.score[1])

	}

	slf.takeTurnDumb = function () {
		console.log('StupidAI.takeTurn()');
		console.log('look for squares...');
		if (slf.lookForSquares()) {return}
		console.log('look for non-losing moves...');
		if (slf.lookForNonLosingMoves()) {return}
		console.log('Go at random...');
		if (slf.lookRandom()) {return}
		console.log('Error - no move found :(');
		alert("Computer couldn't find a move - game over! \n\nRed: "+slf.grid.score[0]+'\nBlue: '+slf.grid.score[1])
	}

	slf.takeTurnNotBad = function () {
		console.log('StupidAI.takeTurn()');
		console.log('look for squares...');
		if (slf.lookForSquares()) {return}
		console.log('look for non-losing moves...');
		if (slf.lookForNonLosingMoves()) {return}
		console.log('Look for least bad alternative...');
		if (slf.lookForLeastBadAlternative()) {return};
		console.log('Go at random...');
		if (slf.lookRandom()) {return}
		console.log('Error - no move found :(');
		alert("Computer couldn't find a move - game over! \n\nRed: "+slf.grid.score[0]+'\nBlue: '+slf.grid.score[1])
	}


	slf.takeTurn = function () {
		switch (slf.level) {
		case 'notbad':
			console.log('Level: Not Bad')
			slf.takeTurnNotBad();
			break;
		case 'dumb':
			console.log('Level: dumb')
			slf.takeTurnDumb();
			break;
		case 'dumber':
			console.log('Level: dumber')
			slf.takeTurnDumber();
			break;
		case 'dumbest':
			console.log('Level: dumbest')
			slf.takeTurnDumbest();
			break;
		}
	}

	slf.makeMove = function (x,y,vertical) {
		//console.log('makeMove('+x+','+y+','+vertical+')');
		xc = slf.grid.dots.toCoord(x)
		yc = slf.grid.dots.toCoord(y)
		if (vertical) {
			exc = xc;
			eyc = yc + slf.grid.dots.spacer
		}
		else {
			exc = xc + slf.grid.dots.spacer
			eyc = yc}
		slf.grid.dots.startX = xc;
		slf.grid.dots.startY = yc;
		slf.grid.dots.endX = exc;
		slf.grid.dots.endY = eyc;
		//console.log('Drawing line: '+xc+'.'+yc+'-'+exc+'.'+eyc);
		//slf.grid.addLine([sx,sy],[ex,ey])
		slf.grid.dots.drawLine();
	}
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
	this.animating = false
	this.updateAnimation = function () {
	    // First, clear whatever is there...
	    console.log('Update animation!');
	    slf.actx.clearRect(0,0,
	    slf.animationCanvas.width, 
	    slf.animationCanvas.height);
		if (slf.startX > -1 && slf.startY > -1) {
			// highlight starting point...
			// Now figure out which direction we're going...
			slf.actx.beginPath()
			slf.actx.arc(
				slf.round(slf.startX),
				slf.round(slf.startY),					 
				slf.circle_radius,0,2*Math.PI
			);
			slf.setTurnColor(slf.actx)
			slf.actx.moveTo(slf.round(slf.startX),slf.round(slf.startY));
		        slf.actx.stroke(); slf.actx.fill();
			slf.actx.closePath(); 
			if (isMouseDown) {
				//console.log('Mouse is down...');
				if (Math.abs(slf.endY - slf.round(slf.startY)) > 
						Math.abs(slf.endX - slf.round(slf.startX))) {
					// if the Y gap is greater than the X gap, then 
					// we are presumably trying to move vertically...
					var x = slf.startX
					var y = slf.endY
					var endPoint = [slf.startX,slf.round(slf.endY)]
				}
				else {
					// otherwise, we're presumably moving horizontally...
					var y = slf.startY
					var x = slf.endX
					var endPoint = [slf.round(slf.endX),slf.startY]
				}
			
				slf.actx.beginPath();
				slf.actx.lineTo(x,y);
				console.log('animating line from ' + slf.startX+','+slf.startY+'  to '+x+','+y);
				slf.actx.stroke();
				// endPoint highlighting...
				slf.actx.beginPath()
				slf.actx.arc(
					slf.round(slf.startX),
					slf.round(slf.startY),					 
					slf.circle_radius,0,2*Math.PI
				);
				slf.setTurnColor(slf.actx)
				slf.actx.stroke(); slf.actx.fill();
			}}}

	this.onTouchMove = function (event) {
		var x = event.touches[0].pageX  - slf.canvas.offsetLeft;
		var y = event.touches[0].pageY - slf.canvas.offsetTop;
		if (slf.startX > -1) {
			slf.endX = y
			slf.endY = y
			//console.log('onTouchMove: endX,endY->'+slf.endX+','+slf.endY)
		}
		else {
			slf.startX = x;
			slf.startY = y;
			//console.log('onTouchMove: startX,startY->'+slf.startX+','+slf.startY)
		}
		if (slf.animating==false) {
		    console.log('Start interval');
		    slf.animating = setInterval(slf.updateAnimation,50)
		}
	}
	
	this.onMouseMove = function (event) {
		//console.log('onMouseMove');
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

	this.round = function (n) {
		//i = n / slf.spacer;
		//i = Math.round(i);
		//n = i*slf.spacer;
		//return n;
		return slf.toCoord(slf.toGrid(n))
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
		var x = event.changedTouches[0].pageX - slf.canvas.offsetLeft
		var y = event.changedTouches[0].pageY - slf.canvas.offsetTop
		if ((slf.startX > -1) && (slf.endX > -1)) {
			slf.drawLine()
		}
		//console.log('Clearing animation interval.');
		clearInterval(slf.animating)
		slf.animating = false
		slf.updateAnimation()
	}
		
	this.onMouseDown = function (event) {
		var x = event.pageX - slf.canvas.offsetLeft
		var y = event.pageY - slf.canvas.offsetTop
		// Draw animation in a bit...
		if (slf.startX > -1) {
			slf.endX = x;
			slf.endY = y;
			slf.drawLine()
			slf.startX = -1; slf.startY = -1; slf.endX = -1; slf.endY = -1;
		}
		else {
			slf.startX = x;
			slf.startY = y;
		}}

	this.onMouseUp = function(event) {
		//console.log('onMouseUp')
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

	this.drawLine = function () {
		//console.log('Draw line: '+slf.startX+','+slf.startY+'->'+slf.endX+','+slf.endY);
		var sx = slf.toGrid(slf.startX); 
		var sy = slf.toGrid(slf.startY);
		var ex = slf.toGrid(slf.endX);
		var ey = slf.toGrid(slf.endY);
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
		}
		slf.startX = -1; slf.startY = -1; slf.endX = -1; slf.endY = -1;
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
    })// end document ready

