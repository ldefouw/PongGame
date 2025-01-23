const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;  // 1) pull PORT from environment, default to 8080 if missing
const server = new WebSocket.Server({ port: PORT });  // 2) create server using that PORT


let players = {}; // Store player connections
let gameState = {
  ball: { x: 400, y: 200, dx: 3, dy: 3, radius: 10 },
  paddles: {
    player1: { x: 10, y: 150, width: 10, height: 100 },
    player2: { x: 780, y: 150, width: 10, height: 100 },
  },
  scores: { player1: 0, player2: 0 },
};

server.on('connection', (ws) => {
  let playerId = Object.keys(players).length < 1 ? 'player1' : 'player2';

  players[playerId] = ws;
  ws.send(JSON.stringify({ type: 'assignPlayer', playerId }));

  console.log(`${playerId} connected`);

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'movePaddle') {
      gameState.paddles[data.playerId].y = data.y;
    }
  });

  ws.on('close', () => {
    console.log(`${playerId} disconnected`);
    delete players[playerId];
  });
});

setInterval(() => {
  // Update ball position
  const ball = gameState.ball;

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Collision with top/bottom walls
  if (ball.y <= 0 || ball.y >= 400 - ball.radius) ball.dy = -ball.dy;

  // Collision with paddles
  const paddle1 = gameState.paddles.player1;
  const paddle2 = gameState.paddles.player2;

  if (
    ball.x - ball.radius <= paddle1.x + paddle1.width &&
    ball.y >= paddle1.y &&
    ball.y <= paddle1.y + paddle1.height
  ) {
    ball.dx = -ball.dx;
  }

  if (
    ball.x + ball.radius >= paddle2.x &&
    ball.y >= paddle2.y &&
    ball.y <= paddle2.y + paddle2.height
  ) {
    ball.dx = -ball.dx;
  }

  // Scoring
  if (ball.x <= 0) {
    gameState.scores.player2++;
    resetBall();
  }
  if (ball.x >= 800) {
    gameState.scores.player1++;
    resetBall();
  }

  // Send updated game state to all players
  broadcast(JSON.stringify({ type: 'updateState', gameState }));
}, 1000 / 60);

function resetBall() {
  gameState.ball = { x: 400, y: 200, dx: 3, dy: 3, radius: 10 };
}

function broadcast(message) {
  Object.values(players).forEach((player) => player.send(message));
}