(function() {

let canvas = document.getElementById('editor');
let ctx = canvas.getContext('2d');

let discardButton = document.getElementById('discard');
let sendButton = document.getElementById('send');

let path = [];
let drawing = false;
let drawingExists = false;

discardButton.addEventListener('click', function(e) {
  if (drawingExists) {
    path = [];
    drawingExists = false;
    discardButton.disabled = true;
    sendButton.disabled = true;
  }
});

sendButton.addEventListener('click', function(e) {
  if (drawingExists) {
    drawingsRef.push(path);
    path = [];
    drawingExists = false;
    discardButton.disabled = true;
    sendButton.disabled = true;
  }
});


function distSq(x1, y1, x2, y2) {
  return ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
}

canvas.addEventListener('mousedown', function(e) {
  let x = e.offsetX;
  let y = e.offsetY;
  
  if (!drawing) {
    // Check to see if we should start drawing
    if (distSq(x, y, 10, 150) < (10 * 10)) {
      drawing = true;
      path = [{x: 0, y: 150}];
    }
  }
  else {
    // Check if we should stop drawing
    if (distSq(x, y, 590, 150) < (10 * 10)) {
      drawing = false;
      drawingExists = true;
      path.push({x: 600, y: 150});
      discardButton.disabled = false;
      sendButton.disabled = false;
    }
  }
  
  if (drawing) {
    path.push({x, y});
  }
})

canvas.addEventListener('mousemove', function(e) {
  if (drawing) {
    path.push({x: e.offsetX, y: e.offsetY});
  }
});

ctx.fillStyle = `hsl(175deg, 55%, 55%)`;
ctx.strokeStyle = `hsl(175deg, 55%, 55%)`;
ctx.lineWidth = 2.0;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

function draw() {
  ctx.clearRect(0, 0, 600, 300);
  
  if (path.length > 1) {
    ctx.beginPath();
    path.forEach((pt, idx) => {
      if (idx === 0) {
        ctx.moveTo(pt.x, pt.y);
      }
      else {
        ctx.lineTo(pt.x, pt.y);
      }
    });
    ctx.stroke();
  }
  
  if (!drawing) {
    if (!drawingExists) {
      ctx.beginPath();
      ctx.arc(0, 150, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText('click here to start drawing', 20, 150);
    }
  }
  else {
    ctx.beginPath();
    ctx.arc(600, 150, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText('click here to stop drawing', 480, 150);
  }
  
  window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);

})();