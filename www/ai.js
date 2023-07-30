function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

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
  return Array.apply(0, Array(count)).map(function (element, index) {
    return index + start;
  });
}

function StupidAI(grid) {
  var slf = this;
  slf.grid = grid;

  slf.copyScenario = function () {
    // Copy ourselves...
    grid = slf.grid.copyGrid();
    return grid.ai;
  };

  slf.lookForSquares = function () {
    // smartish AI -- look for a complete box...
    for (var x = 0; x < slf.grid.x_size - 1; x++) {
      //console.log('lfs: Checking column: '+x);
      for (var y = 0; y < slf.grid.y_size - 1; y++) {
        //console.log('lfs: Checking square at '+x+','+y);
        var result = slf.grid.checkForThreeSides([x, y]);
        //console.log('lfs==> '+result);
        if (result) {
          //console.log('lfs Making move with result: '+result);
          slf.makeMove(result[0], result[1], result[2]);
          return true;
        }
        //else {
        //	console.log('lfs No dice.')
        //}
      } // End for y loop
    } // End for x loop
    //console.log('No squares to be found.');
  };

  slf.lookForNonLosingMoves = function () {
    var lookAtPoint = function (x, y, vertical) {
      if (slf.isLineNotADup(x, y, vertical)) {
        console.log("Checking lookAtPoint " + x + "." + y + "." + vertical);
        if (slf.grid.checkForIncompleteSides([x, y]).length <= 2) {
          //console.log('Rejecting: we have two or fewer incomplete sides: '+slf.grid.checkForIncompleteSides([x,y]));
          return false;
        }
        if (vertical) {
          // Then we're checking out the point and the box left of it...
          if (
            x - 1 >= 0 &&
            slf.grid.checkForIncompleteSides([x - 1, y]).length <= 2
          ) {
            //console.log('Rejecting: we have two or fewer incomplete sides on left: '+slf.grid.checkForIncompleteSides([x-1,y]));
            return false;
          }
        } else {
          // horizontal... in that case, we're checking the box above...
          if (
            y - 1 >= 0 &&
            slf.grid.checkForIncompleteSides([x, y - 1]).length <= 2
          ) {
            //console.log('Rejecting: we have two or fewer incomplete sides above: '+slf.grid.checkForIncompleteSides([x,y-1]));
            return false;
          }
        }
        slf.makeMove(x, y, vertical);
        return true;
      }
    };
    return slf.iterateRandomly(lookAtPoint);
  };

  slf.lookForLeastBadAlternative = function () {
    console.log("slf.lookForLeastBadAlternative() starting...");
    best_move = false;
    squares_lost = 1000000000000000;
    for (var x = 0; x < slf.grid.x_size - 1; x++) {
      //console.log('lba Checking column: '+x);
      for (var y = 0; y < slf.grid.y_size - 1; y++) {
        //console.log('lba Checking square at '+x+','+y);
        for (var vert = 0; vert < 2; vert++) {
          if (slf.isLineNotADup(x, y, vert)) {
            // If the move is worth considering...
            console.log("Considering ", x + "." + y + "-" + vert);
            squares_looked_at = 0;
            squares_lost_this_move = 0; // Start w/ 0...
            while (squares_looked_at < 2) {
              if (squares_looked_at == 0) {
                incomplete_sides = slf.grid.checkForIncompleteSides([x, y]);
              } else if (squares_looked_at == 1) {
                // If we've already looked at a square...
                if (vert) {
                  // If we're a vertical line, we're looking at
                  // ourselves + the square to the left
                  incomplete_sides = slf.grid.checkForIncompleteSides([
                    x - 1,
                    y,
                  ]);
                } else {
                  // if we're a horizontal line, we're looking at
                  // ourselves + the square above
                  incomplete_sides = slf.grid.checkForIncompleteSides([
                    x,
                    y - 1,
                  ]);
                }
              }
              switch (incomplete_sides.length) {
                case 1:
                  console.log(
                    "WTF 1 incomplete side -- we can get the square!"
                  );
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
                  incomp_from_copied = ai.grid.checkForIncompleteSides([x, y]);
                  if (incomp_from_copied.length != 2) {
                    console.log(
                      "WTF -- copied scenario doesn't match our expectations..."
                    );
                    console.log(
                      "Copied scenario shows " +
                        ai.grid.checkForIncompleteSides([x, y]).length +
                        " incomplete sides"
                    );
                    console.log(
                      "Copied scenario shows incomplete sides: " +
                        ai.grid.checkForIncompleteSides([x, y])
                    );
                  }
                  ai.makeMove(x, y, vert);
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
                  squares_looked_at = 2;
              }
              squares_looked_at += 1;
            }
            console.log(
              x + "." + y + "-" + vert + "=> loses " + squares_lost_this_move
            );
            if (squares_lost_this_move < squares_lost) {
              squares_lost = squares_lost_this_move; // This is our new move...
              best_move = [x, y, vert];
            }
          }
        } // end for vert
      } // end for y
    } // end for x
    if (best_move) {
      console.log(
        "lba Made least bad move: " +
          best_move +
          " ... giving up " +
          squares_lost
      );
      slf.makeMove(best_move[0], best_move[1], best_move[2]);
      return true;
    } else {
      console.log("slf.lookForLeastBadAlternative failed - returning false");
      return false;
    }
  }; // end lookForLeastBadAlternative

  slf.iterateRandomly = function (doWhat) {
    // Move randomly through all squares, then hand
    // doWhat and x and a y to do something with...
    // if doWhat returns true, we end...
    yvals = shuffle(range(0, slf.grid.y_size - 1));
    xvals = shuffle(range(0, slf.grid.x_size - 1));
    //console.log('yvals = '+yvals);
    //console.log('xvals = '+xvals);
    direction = shuffle(range(0, 2));
    for (var d = 0; d < direction.length; d++) {
      for (var y = 0; y < yvals.length; y++) {
        for (var x = 0; x < xvals.length; x++) {
          if (doWhat(xvals[x], yvals[y], direction[d])) {
            return true;
          }
        }
      }
    }
  };

  slf.isLineNotADup = function (x, y, vertical) {
    //console.log('Checking for dup: '+x+'.'+y+'.'+vertical)
    if (vertical) {
      var row = slf.grid.vlines[y];
    } else {
      var row = slf.grid.hlines[y];
    }
    if (row[x] == 0) {
      //console.log('slf.isLineNotADup->true')
      return true;
    } else {
      //console.log('slf.isLineNotADup->false')
      return false;
    }
  };

  slf.lookRandom = function () {
    var lookAtPoint = function (x, y, vertical) {
      if (slf.isLineNotADup(x, y, vertical)) {
        slf.makeMove(x, y, vertical);
        return true;
      } else {
        return false;
      }
    };
    return slf.iterateRandomly(lookAtPoint);
  };

  slf.lookRandomOld = function () {
    yvals = shuffle(range(0, slf.grid.y_size - 1));
    xvals = shuffle(range(0, slf.grid.x_size - 1));
    direction = shuffle(range(0, 2));
    for (var d = 0; d < direction.length; d++) {
      for (var y = 0; y < yvals.length; y++) {
        for (var x = 0; x < xvals.length; x++) {
          dir = direction[d];
          if (dir == 1) {
            var row = slf.grid.hlines[yvals[y]];
            var vertical = false;
          } else {
            var row = slf.grid.vlines[yvals[y]];
            var vertical = true;
          }
          //console.log('Checking '+xvals[x]+'.'+yvals[y]+' v='+vertical);
          if (row[xvals[x]] == 0) {
            //console.log('Making move...'+xvals[x]+'.'+yvals[y]);
            slf.makeMove(xvals[x], yvals[y], vertical);
            return true;
          }
        }
      }
    }
  };

  slf.takeTurnDumbest = function () {
    if (slf.lookRandom()) {
      return;
    }
    //console.log('Error - no move found :(');
    alert(
      "Computer couldn't find a move - game over! \n\nRed: " +
        slf.grid.score[0] +
        "\nBlue: " +
        slf.grid.score[1]
    );
  };

  slf.takeTurnDumber = function () {
    console.log("StupidAI.takeTurn()");
    console.log("look for squares...");
    if (slf.lookForSquares()) {
      return;
    }
    console.log("look for non-losing moves...");
    if (slf.lookRandom()) {
      return;
    }
    console.log("Error - no move found :(");
    alert(
      "Computer couldn't find a move - game over! \n\nRed: " +
        slf.grid.score[0] +
        "\nBlue: " +
        slf.grid.score[1]
    );
  };

  slf.takeTurnDumb = function () {
    console.log("StupidAI.takeTurn()");
    console.log("look for squares...");
    if (slf.lookForSquares()) {
      return;
    }
    console.log("look for non-losing moves...");
    if (slf.lookForNonLosingMoves()) {
      return;
    }
    console.log("Go at random...");
    if (slf.lookRandom()) {
      return;
    }
    console.log("Error - no move found :(");
    alert(
      "Computer couldn't find a move - game over! \n\nRed: " +
        slf.grid.score[0] +
        "\nBlue: " +
        slf.grid.score[1]
    );
  };

  slf.takeTurnNotBad = function () {
    console.log("StupidAI.takeTurn()");
    console.log("look for squares...");
    if (slf.lookForSquares()) {
      return;
    }
    console.log("look for non-losing moves...");
    if (slf.lookForNonLosingMoves()) {
      return;
    }
    console.log("Look for least bad alternative...");
    if (slf.lookForLeastBadAlternative()) {
      return;
    }
    console.log("Go at random...");
    if (slf.lookRandom()) {
      return;
    }
    console.log("Error - no move found :(");
    alert(
      "Computer couldn't find a move - game over! \n\nRed: " +
        slf.grid.score[0] +
        "\nBlue: " +
        slf.grid.score[1]
    );
  };

  slf.takeTurn = function () {
    switch (slf.level) {
      case "notbad":
        console.log("Level: Not Bad");
        slf.takeTurnNotBad();
        break;
      case "dumb":
        console.log("Level: dumb");
        slf.takeTurnDumb();
        break;
      case "dumber":
        console.log("Level: dumber");
        slf.takeTurnDumber();
        break;
      case "dumbest":
        console.log("Level: dumbest");
        slf.takeTurnDumbest();
        break;
    }
  };

  slf.makeMove = function (x, y, vertical) {
    //console.log('makeMove('+x+','+y+','+vertical+')');
    xc = slf.grid.dots.toCoord(x);
    yc = slf.grid.dots.toCoord(y);
    if (vertical) {
      exc = xc;
      eyc = yc + slf.grid.dots.spacer;
    } else {
      exc = xc + slf.grid.dots.spacer;
      eyc = yc;
    }
    slf.grid.dots.startX = xc;
    slf.grid.dots.startY = yc;
    slf.grid.dots.endX = exc;
    slf.grid.dots.endY = eyc;
    //console.log('Drawing line: '+xc+'.'+yc+'-'+exc+'.'+eyc);
    //slf.grid.addLine([sx,sy],[ex,ey])
    slf.grid.dots.drawLine();
  };
}
