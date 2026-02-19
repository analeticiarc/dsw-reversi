import { WebSocketServer, WebSocket } from 'ws';
import { createGame, applyMove, getValidMoves, GameState } from './game';

// Porta onde o servidor vai rodar
const PORT = 8080;

// Cria o servidor WebSocket
const wss = new WebSocketServer({ port: PORT });

// Estado global do jogo (uma partida por vez)
let gameState: GameState = createGame();

// Lista de clientes conectados (máximo 2 jogadores)
const clients: WebSocket[] = [];

console.log(`Servidor rodando na porta ${PORT}`);

// Envia o estado atual do jogo para todos os clientes conectados
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
      validMoves, // envia os movimentos válidos para o cliente destacar no tabuleiro
    },
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Quando um cliente se conecta
wss.on('connection', (ws: WebSocket) => {
  // Recusa mais de 2 conexões
  if (clients.length >= 2) {
    ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Sala cheia.' } }));
    ws.close();
    return;
  }

  clients.push(ws);

  // Define qual cor este cliente joga com base na ordem de conexão
  const playerColor = clients.length === 1 ? 'black' : 'white';

  console.log(`Jogador conectado: ${playerColor}`);

  // Avisa o cliente qual cor ele é
  ws.send(JSON.stringify({ type: 'ASSIGNED', payload: { color: playerColor } }));

  // Envia o estado inicial para todos
  broadcast(gameState);

  // Quando recebe uma mensagem do cliente
  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());

      // Mensagem de jogada: { type: 'MOVE', payload: { row, col } }
      if (message.type === 'MOVE') {
        const { row, col } = message.payload;

        // Aplica o movimento e atualiza o estado global
        const newState = applyMove(gameState, row, col);

        // Se o estado não mudou, o movimento era inválido
        if (newState === gameState) {
          ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Movimento inválido.' } }));
          return;
        }

        gameState = newState;

        // Transmite o novo estado para todos os clientes
        broadcast(gameState);
      }

      // Mensagem de reinício: { type: 'RESTART' }
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