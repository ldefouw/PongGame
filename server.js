const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const server = new WebSocket.Server({ port: PORT });

let players = {}; // Store player connections

let gameState = {
  status: 'waiting', // waiting | running | ended
  ball: { x: 400, y: 200, dx: 3, dy: 3, radius: 10 },
  paddles: {
    player1: { x: 10, y: 150, width: 10, height: 100 },
    player2: { x: 780, y: 150, width: 10, height: 100 },
  },
  scores: { player1: 0, player2: 0 },
  winner: null
};

// Assign players
server.on('connection', (ws) => {
  let playerId;
  if (!players.player1) {
    playerId = 'player1';
  } else if (!players.player2) {
    playerId = 'player2';
  } else {
    // If we already have two players, you could reject or do something else:
    ws.send(JSON.stringify({ type: 'roomFull', message: '2 players already connected.' }));
    ws.close();
    return;
  }

  // Store the new player
  players[playerId] = ws;
  console.log(`${playerId} connected`);

  // Send assigned player info
  ws.send(JSON.stringify({ type: 'assignPlayer', playerId }));

  // Check how many players are connected now
  const numPlayers = Object.keys(players).length;
  if (numPlayers === 2) {
    // We have two players; start the game (if not ended)
    if (gameState.status !== 'ended') {
      gameState.status = 'running';
      broadcastState();
    }
  }

  // Handle incoming messages
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'movePaddle') {
      gameState.paddles[data.playerId].y = data.y;
    } else if (data.type === 'playAgain') {
      // If the game ended, reset
      if (gameState.status === 'ended') {
        resetGame();
        // If both players are still here, set running
        if (Object.keys(players).length === 2) {
          gameState.status = 'running';
        } else {
          gameState.status = 'waiting';
        }
        broadcastState();
      }
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`${playerId} disconnected`);
    delete players[playerId];

    // If any player leaves, set game to waiting or ended
    if (Object.keys(players).length < 2 && gameState.status === 'running') {
      gameState.status = 'waiting';
      broadcastState();
    }
  });
});

// 60 fps update
setInterval(() => {
  if (gameState.status === 'running') {
    updateGame();
    broadcastState();
  }
}, 1000 / 60);

function updateGame() {
  const ball = gameState.ball;
  const p1 = gameState.paddles.player1;
  const p2 = gameState.paddles.player2;

  // Move the ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Top/bottom bounce
  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= 400) {
    ball.dy = -ball.dy;
  }

  // Paddle collisions
  // 1) player1
  if (
    ball.x - ball.radius <= p1.x + p1.width &&
    ball.y >= p1.y &&
    ball.y <= p1.y + p1.height
  ) {
    ball.dx = -ball.dx * 1.15;
    ball.dy = ball.dy * 1.15;
  }
  // 2) player2
  if (
    ball.x + ball.radius >= p2.x &&
    ball.y >= p2.y &&
    ball.y <= p2.y + p2.height
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

function checkForWin() {
  if (gameState.scores.player1 >= 5) {
    gameState.winner = 'player1';
    gameState.status = 'ended';
  } else if (gameState.scores.player2 >= 5) {
    gameState.winner = 'player2';
    gameState.status = 'ended';
  }
}

function resetBall() {
  gameState.ball = { x: 400, y: 200, dx: 3, dy: 3, radius: 10 };
}

function resetGame() {
  console.log("Resetting game...");
  // Reset scores
  gameState.scores.player1 = 0;
  gameState.scores.player2 = 0;
  gameState.winner = null;
  resetBall();
}

// Broadcast the entire gameState
function broadcastState() {
  broadcast(JSON.stringify({ type: 'updateState', gameState }));
}

function broadcast(message) {
  Object.values(players).forEach((player) => {
    if (player && player.readyState === WebSocket.OPEN) {
      player.send(message);
    }
  });
}
