(function() {

let canvas = document.getElementById('editor');
let ctx = canvas.getContext('2d');

let discardButton = document.getElementById('discard');
let sendButton = document.getElementById('send');

let path = [];
let drawing = false;
let drawingExists = false;

let backgroundColor = '#000';
let penColor = '#fff';

ctx.lineWidth = 2.0;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

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
    // Normalize the color representations
    ctx.fillStyle = backgroundColor;
    let background = ctx.fillStyle;
    ctx.fillStyle = penColor;
    let pen = ctx.fillStyle;
    
    drawingsRef.push({
      points: path,
      backgroundColor: background,
      penColor: pen
    });
    
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
  
  if (!drawing && !drawingExists) {
    // Check for color selection
    if (y <= 20) {
      if (x < 180) {
        let idx = Math.floor(x / 20);
        if (idx === 0) {
          backgroundColor = '#000';
        }
        else {
          backgroundColor = `hsl(${Math.floor((idx - 1) * (360 / 8))}deg, 55%, 20%)`;
        }
      }
      else if (x >= 420) {
        let idx = Math.floor((x - 420) / 20);
        if (idx === 8) {
          penColor = '#fff';
        }
        else {
          penColor = `hsl(${Math.floor(idx * (360 / 8))}deg, 55%, 65%)`;
        }
      }
    }
  }
  
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

function draw() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, 600, 300);
  
  if (!drawing && !drawingExists) {
    // Background color selection
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 20, 20);
    for (let i = 0; i < 8; ++i) {
      ctx.fillStyle = `hsl(${Math.floor(i * (360 / 8))}deg, 55%, 20%)`
      ctx.fillRect((i * 20) + 20, 0, 20, 20);
    }
    
    
    // Pen color selection
    for (let i = 0; i < 8; ++i) {
      ctx.fillStyle = `hsl(${Math.floor(i * (360 / 8))}deg, 55%, 65%)`
      ctx.fillRect(420 + (i * 20), 0, 20, 20);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(580, 0, 20, 20);
    
    ctx.fillText('background color', 10, 35);
    ctx.fillText('drawing color', 530, 35);
  }
  
  ctx.fillStyle = penColor;
  ctx.strokeStyle = penColor;
  
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