(function() {

let canvas = document.getElementById('viewer');
let ctx = canvas.getContext('2d');

var drawings = [];
var nextDrawingsQueue = [];
drawingsRef.on('child_added', function(data) {
  // We always want to see "our" drawing asap,
  // so we queue drawings to show up as they come
  // in over the wire. Once they've been seen once,
  // we put them in the `drawings` array to be randomly
  // chosen later if the queue is empty
  nextDrawingsQueue.push(data.val());
});

ctx.strokeStyle = `hsl(275deg, 55%, 55%)`;
ctx.lineWidth = 2.0;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function renderPercentageOfDrawingAtOffset(drawing, pct, xOffset) {
  ctx.beginPath();
  let totalPtsToDraw = Math.floor(drawing.length * pct);
  drawing.forEach((pt, idx) => {
    if (idx > totalPtsToDraw) {
      return;
    }
    if (idx === 0) {
      ctx.moveTo(pt.x + xOffset, pt.y);
    }
    else {
      ctx.lineTo(pt.x + xOffset, pt.y);
    }
  });
  ctx.stroke();
}

function getNextDrawing() {
  if (nextDrawingsQueue.length > 0) {
    let drawing = nextDrawingsQueue.shift();
    drawings.push(drawing);
    return drawing;
  }
  else if (drawings.length > 0) {
    return drawings[getRandomInt(drawings.length)];
  }
  return undefined;
}

const DRAWING_TIME_IN_MSEC = 5000;

let inFlight = [];

function draw(timestamp) {
  ctx.clearRect(0, 0, 600, 300);
  
  // Kick-off
  if (inFlight.length === 0) {
    let possibleDrawing = getNextDrawing();
    if (possibleDrawing !== undefined) {
      inFlight.push({
        points: possibleDrawing,
        startTime: timestamp,
        lastDrawTime: timestamp,
      });
    }
  }
  
  let toAdd = [];
  let toDeleteIndices = [];
  
  inFlight.forEach(function(drawing, idx) {
    let {points, startTime, lastDrawTime} = drawing;
    let prevPct = (lastDrawTime - startTime) / DRAWING_TIME_IN_MSEC;
    let pct = (timestamp - startTime) / DRAWING_TIME_IN_MSEC;
    
    // If we're finished drawing this one, start drawing another
    if (prevPct <= 1.0 && pct >= 1.0) {
      toAdd.push({
        points: getNextDrawing(),
        startTime: timestamp,
        lastDrawTime: timestamp,
      });
    }
    
    // If we're done drawing this one, mark it for deletion
    if (pct > 1.75) {
      toDeleteIndices.push(idx);
    }
    
    let xOffset = (0.75 - pct) * CANVAS_WIDTH;
    renderPercentageOfDrawingAtOffset(points, pct, xOffset);
    drawing.lastDrawTime = timestamp;
  })
  
  // Remove old drawings
  if (toDeleteIndices.length > 0) {
    inFlight = inFlight.filter((el, idx) => !toDeleteIndices.includes(idx));
  }
  
  // Add new drawings
  if (toAdd.length > 0) {
    inFlight = inFlight.concat(toAdd);
  }
  
  window.requestAnimationFrame(draw);
    
}

window.requestAnimationFrame(draw);
  
})();