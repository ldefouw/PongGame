const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// Use wss:// if your page is served over HTTPS
const socket = new WebSocket("wss://ponggame-1fry.onrender.com");

let playerId;
let gameState;

// Listen for WebSocket messages
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

// Mouse movement
document.addEventListener("mousemove", (e) => {
  if (!playerId || !gameState) return;
  if (gameState.status !== 'running') return; // Only move paddles if game is running

  const rect = canvas.getBoundingClientRect();
  const scale = canvas.height / rect.height;
  const mouseY = (e.clientY - rect.top) * scale;

  const paddle = gameState.paddles[playerId];
  paddle.y = Math.max(0, Math.min(mouseY - paddle.height / 2, canvas.height - paddle.height));

  socket.send(JSON.stringify({ type: 'movePaddle', playerId, y: paddle.y }));
});

// Listen for "Enter" key to play again
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && gameState && gameState.status === "ended") {
    // Send a message to server to reset
    socket.send(JSON.stringify({ type: "playAgain" }));
  }
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

// Middle line
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

// Draw scores + "$PONG"
function drawScoresAndTitle() {
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "#fff";
  ctx.fillText(`P1: ${gameState.scores.player1}`, 20, 30);
  ctx.fillText(`P2: ${gameState.scores.player2}`, canvas.width - 120, 30);

  // Draw "$PONG" in the center
  const text = "$PONG";
  const textWidth = ctx.measureText(text).width;
  const x = (canvas.width - textWidth) / 2;
  const y = 30;
  ctx.fillText(text, x, y);
}

// Show winner banner
function drawWinnerBanner() {
  if (!gameState.winner) return;
  ctx.font = "40px 'Press Start 2P'";
  ctx.fillStyle = "yellow";
  const text = (gameState.winner === 'player1') ? 'P1 WINS!' : 'P2 WINS!';
  const textMetrics = ctx.measureText(text);
  const x = (canvas.width - textMetrics.width) / 2;
  const y = canvas.height / 2;
  ctx.fillText(text, x, y);

  // Show "Press Enter to Play Again"
  ctx.font = "18px 'Press Start 2P'";
  const prompt = "Press ENTER to play again";
  const promptMetrics = ctx.measureText(prompt);
  const px = (canvas.width - promptMetrics.width) / 2;
  const py = (canvas.height / 2) + 40;
  ctx.fillText(prompt, px, py);
}

// Show waiting message if status = "waiting"
function drawWaitingMessage() {
  ctx.font = "20px 'Press Start 2P'";
  ctx.fillStyle = "#fff";
  const text = "Waiting for second player...";
  const textWidth = ctx.measureText(text).width;
  const x = (canvas.width - textWidth) / 2;
  const y = canvas.height / 2 - 20;
  ctx.fillText(text, x, y);
}

// Main draw loop
function draw() {
  if (!gameState) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMiddleLine();

  // If game is running, draw ball/paddles
  if (gameState.status === 'running') {
    drawBall(gameState.ball);
    drawPaddle(gameState.paddles.player1);
    drawPaddle(gameState.paddles.player2);
  } 
  // If waiting, no ball movement or paddle
  else if (gameState.status === 'waiting') {
    drawWaitingMessage();
  }

  // Always draw scores/title
  drawScoresAndTitle();

  // If ended, draw the winner banner
  if (gameState.status === 'ended') {
    drawBall(gameState.ball); // (Ball is just stationary.)
    drawPaddle(gameState.paddles.player1);
    drawPaddle(gameState.paddles.player2);
    drawWinnerBanner();
  }
}

// Resize and center canvas
function resizeCanvas() {
  const aspectRatio = canvas.width / canvas.height;
  const windowAspectRatio = window.innerWidth / window.innerHeight;

  if (windowAspectRatio > aspectRatio) {
    const scale = window.innerHeight / canvas.height;
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    canvas.style.left = `${(window.innerWidth - canvas.width * scale) / 2}px`;
    canvas.style.top = `0px`;
  } else {
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

// Client-side draw loop
function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
