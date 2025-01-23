const WebSocket = require('ws');
const PORT = process.env.PORT || 8080; 
const server = new WebSocket.Server({ port: PORT });

let players = {}; // Store player connections
let gameState = {
  ball: { x: 400, y: 200, dx: 3, dy: 3, radius: 10 },
  paddles: {
    player1: { x: 10, y: 150, width: 10, height: 100 },
    player2: { x: 780, y: 150, width: 10, height: 100 },
  },
  scores: { player1: 0, player2: 0 },
  winner: null // "player1" or "player2" when someone wins
};

server.on('connection', (ws) => {
  // Assign player1 or player2
  let playerId = Object.keys(players).length < 1 ? 'player1' : 'player2';

  players[playerId] = ws;
  ws.send(JSON.stringify({ type: 'assignPlayer', playerId }));

  console.log(`${playerId} connected`);

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'movePaddle') {
      // Update the paddle position in game state
      gameState.paddles[data.playerId].y = data.y;
    }
  });

  ws.on('close', () => {
    console.log(`${playerId} disconnected`);
    delete players[playerId];
  });
});

// Main game loop (60 fps)
setInterval(() => {
  updateGame();
  broadcast(JSON.stringify({ type: 'updateState', gameState }));
}, 1000 / 60);

/** Update ball position, handle collisions & scoring */
function updateGame() {
  const ball = gameState.ball;
  const paddle1 = gameState.paddles.player1;
  const paddle2 = gameState.paddles.player2;

  // Stop the ball if there's a winner already
  if (gameState.winner) {
    return;
  }

  // Move the ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Top/bottom wall bounce
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= 400) {
    ball.dy = -ball.dy;
  }

  // Collision with paddle1
  if (
    ball.x - ball.radius <= paddle1.x + paddle1.width &&
    ball.y >= paddle1.y &&
    ball.y <= paddle1.y + paddle1.height
  ) {
    // Reverse direction + 15% acceleration
    ball.dx = -ball.dx * 1.15;
    ball.dy = ball.dy * 1.15;
  }

  // Collision with paddle2
  if (
    ball.x + ball.radius >= paddle2.x &&
    ball.y >= paddle2.y &&
    ball.y <= paddle2.y + paddle2.height
  ) {
    ball.dx = -ball.dx * 1.15;
    ball.dy = ball.dy * 1.15;
  }

  // Scoring
  if (ball.x <= 0) {
    gameState.scores.player2++;
    checkForWin();
    resetBall();
  } else if (ball.x >= 800) {
    gameState.scores.player1++;
    checkForWin();
    resetBall();
  }
}

/** Check if either player reached 5 points */
function checkForWin() {
  if (gameState.scores.player1 >= 5) {
    gameState.winner = 'player1';
  } else if (gameState.scores.player2 >= 5) {
    gameState.winner = 'player2';
  }
}

/** Reset ball to center with original speed */
function resetBall() {
  gameState.ball = { x: 400, y: 200, dx: 3, dy: 3, radius: 10 };
}

/** Broadcast a message to all connected players */
function broadcast(message) {
  Object.values(players).forEach((player) => {
    if (player && player.readyState === WebSocket.OPEN) {
      player.send(message);
    }
  });
}
