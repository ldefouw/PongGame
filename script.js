const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// Ball
let ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 2, dy: 2, radius: 10 };

// Paddle
let paddleWidth = 10, paddleHeight = 100;
let player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2 };
let player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2 };

// Movement
let player1Move = 0, player2Move = 0;

// Draw objects
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle(player) {
  ctx.fillStyle = "#0095DD";
  ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
}

// Update game state
function update() {
  // Ball movement
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Collision with walls
  if (ball.y + ball.dy < ball.radius || ball.y + ball.dy > canvas.height - ball.radius) {
    ball.dy = -ball.dy;
  }

  // Collision with paddles
  if (
    (ball.x - ball.radius < player1.x + paddleWidth && ball.y > player1.y && ball.y < player1.y + paddleHeight) ||
    (ball.x + ball.radius > player2.x && ball.y > player2.y && ball.y < player2.y + paddleHeight)
  ) {
    ball.dx = -ball.dx;
  }

  // Move paddles
  player1.y += player1Move;
  player2.y += player2Move;

  // Keep paddles within canvas
  player1.y = Math.max(Math.min(player1.y, canvas.height - paddleHeight), 0);
  player2.y = Math.max(Math.min(player2.y, canvas.height - paddleHeight), 0);
}

// Draw game
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBall();
  drawPaddle(player1);
  drawPaddle(player2);
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();