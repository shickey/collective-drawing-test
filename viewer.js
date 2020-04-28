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

ctx.lineWidth = 2.0;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function clamp(val, min, max) {
  return val < min ? min : (val > max ? max : val);
}

function lerp(start, finish, t) {
  return ((finish - start) * t) + start;
}

function hexRGBtoHSL(hex) {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  hexInt = parseInt(hex, 16);
  
  let r = ((hexInt >> 16) & 0xFF) / 255.0;
  let g = ((hexInt >>  8) & 0xFF) / 255.0;
  let b = ((hexInt      ) & 0xFF) / 255.0;
  
  let colMax = Math.max(r, g, b);
  let colMin = Math.min(r, g, b);
  
  let v = colMax;
  let c = colMax - colMin;
  let l = (colMax + colMin) / 2.0;
  
  let hue = 0;
  if (c !== 0) {
    if (v === r) {
      hue = 60 * ((g - b) / c);
    }
    else if (v === g) {
      hue = 60 * (2 + ((b - r) / c));
    }
    else {
      hue = 60 * (4 + ((r - g) / c));
    }
  }
  
  let sat = 0;
  if (l !== 0 && l !== 1) {
    sat = c / (1 - Math.abs((2 * v) - c - 1));
  }
  
  return {
    h: clamp(Math.round(hue), 0, 360),
    s: clamp(Math.round(sat * 100), 0, 100),
    l: clamp(Math.round(l * 100), 0, 100)
  };
}

function renderPercentageOfDrawingAtOffset(drawing, pct, xOffset) {
  ctx.strokeStyle = drawing.penColor;
  ctx.beginPath();
  let totalPtsToDraw = Math.floor(drawing.points.length * pct);
  drawing.points.forEach((pt, idx) => {
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
const BACKGROUND_TRANSITION_TIME_IN_MSEC = DRAWING_TIME_IN_MSEC / 2;

let inFlight = [];

let backgroundColor = '#000';
let backgroundTransition = null;

function draw(timestamp) {
  // Kick-off
  if (inFlight.length === 0) {
    let possibleDrawing = getNextDrawing();
    if (possibleDrawing !== undefined) {
      backgroundColor = possibleDrawing.backgroundColor;
      inFlight.push({
        points: possibleDrawing.points,
        backgroundColor: possibleDrawing.backgroundColor,
        penColor: possibleDrawing.penColor,
        startTime: timestamp,
        lastDrawTime: timestamp,
      });
    }
  }
  
  let toAdd = [];
  let toDeleteIndices = [];
  
  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, 600, 300);
  
  inFlight.forEach(function(drawing, idx) {
    let {points, startTime, lastDrawTime} = drawing;
    let prevPct = (lastDrawTime - startTime) / DRAWING_TIME_IN_MSEC;
    let pct = (timestamp - startTime) / DRAWING_TIME_IN_MSEC;
    
    // If we're finished drawing this one, start drawing another
    if (prevPct <= 1.0 && pct >= 1.0) {
      let nextDrawing = getNextDrawing();
      
      backgroundTransition = {
        from: hexRGBtoHSL(backgroundColor),
        to: hexRGBtoHSL(nextDrawing.backgroundColor),
        toHex: nextDrawing.backgroundColor,
        startTime: timestamp
      };
      
      toAdd.push({
        points: nextDrawing.points,
        backgroundColor: nextDrawing.backgroundColor,
        penColor: nextDrawing.penColor,
        startTime: timestamp,
        lastDrawTime: timestamp,
      });
    }
    
    // If we're done drawing this one, mark it for deletion
    if (pct > 1.75) {
      toDeleteIndices.push(idx);
    }
    
    // Draw lines
    let xOffset = (0.75 - pct) * CANVAS_WIDTH;
    renderPercentageOfDrawingAtOffset(drawing, pct, xOffset);
    drawing.lastDrawTime = timestamp;
  });
  
  // Update background transition, if necessary
  if (backgroundTransition !== null) {
    let t = (timestamp - backgroundTransition.startTime) / BACKGROUND_TRANSITION_TIME_IN_MSEC;
    if (t >= 1.0) {
      // Transition over
      backgroundColor = backgroundTransition.toHex;
      backgroundTransition = null;
    }
    else {
      let { from, to } = backgroundTransition;
      let h = lerp(from.h, to.h, t);
      let s = lerp(from.s, to.s, t);
      let l = lerp(from.l, to.l, t);
      backgroundColor = `hsl(${h}deg, ${s}%, ${l}%)`;
    }
  }
  
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