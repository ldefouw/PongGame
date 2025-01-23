const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// If your site is HTTPS, use wss://. 
// Below is an example if you're on Render:
// const socket = new WebSocket("wss://ponggame-1fry.onrender.com");
const socket = new WebSocket("wss://ponggame-1fry.onrender.com");

let playerId;
let gameState;

// Handle WebSocket messages
socket.onmessage = (message) => {
  const data = JSON.parse(message.data);

  if (data.type === 'assignPlayer') {
    playerId = data.playerId;
    console.log(`You are ${playerId}`);
  }

  if (data.type === 'updateState') {
    gameState = data.gameState;
  }
};

// Handle mouse movement (adjust for scaling and position)
document.addEventListener("mousemove", (e) => {
  if (!playerId || !gameState) return;

  const rect = canvas.getBoundingClientRect();
  const scale = canvas.height / rect.height; // Adjust for canvas scaling
  const mouseY = (e.clientY - rect.top) * scale;

  // Update paddle position
  const paddle = gameState.paddles[playerId];
  paddle.y = Math.max(0, Math.min(mouseY - paddle.height / 2, canvas.height - paddle.height));

  // Send paddle movement to server
  socket.send(JSON.stringify({ type: 'movePaddle', playerId, y: paddle.y }));
});

// Draw the ball
function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#fff";
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}

// Draw paddles
function drawPaddle(paddle) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Draw the middle line
function drawMiddleLine() {
  ctx.beginPath();
  ctx.setLineDash([5, 15]);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw Scores + "$PONG" at the top center
 */
function drawScoresAndTitle() {
  // Draw scores
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "#fff";
  ctx.fillText(`P1: ${gameState.scores.player1}`, 20, 30);
  ctx.fillText(`P2: ${gameState.scores.player2}`, canvas.width - 120, 30);

  // Draw "$PONG" centered
  const text = "$PONG";
  const textWidth = ctx.measureText(text).width;
  const x = (canvas.width - textWidth) / 2;
  const y = 30;
  ctx.fillText(text, x, y);
}

// Show winner banner
function drawWinnerBanner() {
  const winner = gameState.winner; 
  if (!winner) return; // No winner yet
  
  ctx.font = "40px 'Press Start 2P'";
  ctx.fillStyle = "yellow";
  
  const text = (winner === 'player1') ? 'P1 WINS!' : 'P2 WINS!';
  // Center the text
  const textMetrics = ctx.measureText(text);
  const x = (canvas.width - textMetrics.width) / 2;
  const y = canvas.height / 2;
  
  ctx.fillText(text, x, y);
}

// Main draw function
function draw() {
  if (!gameState) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMiddleLine();
  drawBall(gameState.ball);
  drawPaddle(gameState.paddles.player1);
  drawPaddle(gameState.paddles.player2);
  
  drawScoresAndTitle();
  drawWinnerBanner();
}

// Resize and center canvas
function resizeCanvas() {
  const aspectRatio = canvas.width / canvas.height;
  const windowAspectRatio = window.innerWidth / window.innerHeight;

  if (windowAspectRatio > aspectRatio) {
    // Window is wider than the canvas aspect ratio
    const scale = window.innerHeight / canvas.height;
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    canvas.style.left = `${(window.innerWidth - canvas.width * scale) / 2}px`;
    canvas.style.top = `0px`;
  } else {
    // Window is taller than the canvas aspect ratio
    const scale = window.innerWidth / canvas.width;
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    canvas.style.top = `${(window.innerHeight - canvas.height * scale) / 2}px`;
    canvas.style.left = `0px`;
  }
  canvas.style.position = "absolute";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Game loop (client side rendering)
function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
