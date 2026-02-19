const ws = new WebSocket('ws://localhost:8080');

let myColor = null;        // cor atribuída a este cliente
let currentPlayer = null;  // de quem é a vez
let validMoves = [];       // movimentos válidos destacados no tabuleiro

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const blackCountEl = document.getElementById('black-count');
const whiteCountEl = document.getElementById('white-count');
const restartBtn = document.getElementById('restart-btn');

// Cria as 64 casas do tabuleiro na tela
function createBoardCells() {
  boardEl.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Ao clicar em uma casa, envia a jogada para o servidor
      cell.addEventListener('click', () => {
        // Só envia se for a vez do jogador
        if (myColor !== currentPlayer) return;

        ws.send(JSON.stringify({
          type: 'MOVE',
          payload: { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) }
        }));
      });

      boardEl.appendChild(cell);
    }
  }
}

// Atualiza o tabuleiro visual com o estado recebido do servidor
function renderBoard(board, moves) {
  const cells = boardEl.querySelectorAll('.cell');

  cells.forEach(cell => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const value = board[row][col];

    // Limpa o conteúdo anterior
    cell.innerHTML = '';
    cell.classList.remove('valid-move');

    // Coloca a peça se houver
    if (value === 'black' || value === 'white') {
      const piece = document.createElement('div');
      piece.classList.add('piece');
      piece.classList.add(value === 'black' ? 'black-piece' : 'white-piece');
      cell.appendChild(piece);
    }

    // Destaca os movimentos válidos para o jogador da vez
    const isValid = moves.some(([r, c]) => r === row && c === col);
    if (isValid) {
      cell.classList.add('valid-move');
    }
  });
}

// Atualiza o texto de status e placar
function renderStatus(state) {
  blackCountEl.textContent = state.blackCount;
  whiteCountEl.textContent = state.whiteCount;

  if (state.gameOver) {
    if (state.winner === 'draw') {
      statusEl.textContent = 'Empate!';
    } else {
      const winnerText = state.winner === 'black' ? 'Pretas vencem!' : 'Brancas vencem!';
      statusEl.textContent = winnerText;
    }
    return;
  }

  if (myColor === null) {
    statusEl.textContent = 'Aguardando jogadores...';
    return;
  }

  if (state.currentPlayer === myColor) {
    statusEl.textContent = 'Sua vez!';
  } else {
    const turn = state.currentPlayer === 'black' ? 'Pretas' : 'Brancas';
    statusEl.textContent = `Vez de: ${turn}`;
  }
}

// Recebe mensagens do servidor
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'ASSIGNED') {
    myColor = message.payload.color;
    const colorText = myColor === 'black' ? 'Pretas ⚫' : 'Brancas ⚪';
    statusEl.textContent = `Você joga com: ${colorText}`;
  }

  if (message.type === 'UPDATE') {
    const state = message.payload;
    currentPlayer = state.currentPlayer;
    validMoves = state.validMoves;
    renderBoard(state.board, validMoves);
    renderStatus(state);
  }

  if (message.type === 'ERROR') {
    console.warn('Erro:', message.payload.message);
  }
};

ws.onopen = () => {
  console.log('Conectado ao servidor!');
  createBoardCells();
};

ws.onclose = () => {
  statusEl.textContent = 'Desconectado do servidor.';
};

// Botão de reiniciar
restartBtn.addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'RESTART' }));
});