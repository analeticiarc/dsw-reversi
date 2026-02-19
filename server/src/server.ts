import { WebSocketServer, WebSocket } from 'ws';
import { createGame, applyMove, getValidMoves, GameState } from './game';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

let gameState: GameState = createGame();
const clients: WebSocket[] = [];

console.log(`Servidor rodando na porta ${PORT}`);

function broadcast(state: GameState) {
  const validMoves = getValidMoves(state.board, state.currentPlayer);

  const message = JSON.stringify({
    type: 'UPDATE',
    payload: {
      board: state.board,
      currentPlayer: state.currentPlayer,
      winner: state.winner,
      gameOver: state.gameOver,
      blackCount: state.blackCount,
      whiteCount: state.whiteCount,
      validMoves,
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Sala cheia.' } }));
    ws.close();
    return;
  }

  clients.push(ws);

  const playerColor = clients.length === 1 ? 'black' : 'white';

  console.log(`Jogador conectado: ${playerColor}`);
  console.log('Total de jogadores:', clients.length);

  ws.send(JSON.stringify({ type: 'ASSIGNED', payload: { color: playerColor } }));

  broadcast(gameState);

  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'MOVE') {
        const { row, col } = message.payload;
        console.log(`Tentando mover em: ${row}, ${col}`);

        const newState = applyMove(gameState, row, col);

        if (newState === gameState) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Movimento inválido.' } }));
          return;
        }

        gameState = newState;
        broadcast(gameState);
      }

      if (message.type === 'RESTART') {
        gameState = createGame();
        broadcast(gameState);
      }

    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Mensagem inválida.' } }));
    }
  });

  // Quando um cliente desconecta
  ws.on('close', () => {
    const index = clients.indexOf(ws);
    if (index !== -1) clients.splice(index, 1);
    console.log(`Jogador desconectado. Clientes restantes: ${clients.length}`);
  });
});