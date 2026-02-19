// Define os tipos possíveis de uma casa: nula, preta ou branca
export type Cell = null | 'black' | 'white';

// O tabuleiro é uma matriz 8x8
export type Board = Cell[][];

// Estado completo do jogo
export interface GameState {
  board: Board;
  currentPlayer: 'black' | 'white';
  winner: 'black' | 'white' | 'draw' | null;
  gameOver: boolean;
  blackCount: number;
  whiteCount: number;
}

// As 8 direções possíveis no tabuleiro (horizontal, vertical e diagonal)
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];

// Cria um tabuleiro vazio 8x8
function createBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

// Inicializa o jogo com as 4 peças do centro conforme item (a)
export function createGame(): GameState {
  const board = createBoard();

  // Posições iniciais: brancas em (3,4) e (4,3), pretas em (3,3) e (4,4)
  board[3][3] = 'black';
  board[4][4] = 'black';
  board[3][4] = 'white';
  board[4][3] = 'white';

  return {
    board,
    currentPlayer: 'black', // pretas começam, conforme item (a)
    winner: null,
    gameOver: false,
    blackCount: 2,
    whiteCount: 2,
  };
}

// Verifica se uma posição está dentro do tabuleiro
function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Retorna as peças que seriam viradas se o jogador colocar em (row, col)
// Isso implementa a regra do item (b) e (c)
function getFlips(board: Board, row: number, col: number, player: 'black' | 'white'): [number, number][] {
  const opponent = player === 'black' ? 'white' : 'black';
  const toFlip: [number, number][] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line: [number, number][] = [];
    let r = row + dr;
    let c = col + dc;

    // Percorre na direção enquanto encontrar peças do oponente
    while (inBounds(r, c) && board[r][c] === opponent) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    // Se após as peças do oponente houver uma peça do jogador, as do meio viram
    if (line.length > 0 && inBounds(r, c) && board[r][c] === player) {
      toFlip.push(...line);
    }
  }

  return toFlip;
}

// Verifica se um movimento é válido (item b): casa vazia + ao menos 1 peça virada
export function isValidMove(board: Board, row: number, col: number, player: 'black' | 'white'): boolean {
  if (board[row][col] !== null) return false;
  return getFlips(board, row, col, player).length > 0;
}

// Retorna todos os movimentos válidos para um jogador
export function getValidMoves(board: Board, player: 'black' | 'white'): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove(board, r, c, player)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

// Conta as peças de cada cor no tabuleiro
function countPieces(board: Board): { blackCount: number; whiteCount: number } {
  let blackCount = 0;
  let whiteCount = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'black') blackCount++;
      if (cell === 'white') whiteCount++;
    }
  }
  return { blackCount, whiteCount };
}

// Aplica um movimento ao estado do jogo e retorna o novo estado
export function applyMove(state: GameState, row: number, col: number): GameState {
  const { board, currentPlayer } = state;

  // Verifica se o movimento é válido
  if (!isValidMove(board, row, col, currentPlayer)) {
    return state; // movimento inválido, retorna estado sem alteração
  }

  // Copia o tabuleiro para não mutar o original
  const newBoard: Board = board.map(r => [...r]);

  // Coloca a peça na posição escolhida
  newBoard[row][col] = currentPlayer;

  // Vira as peças capturadas (item c)
  const flips = getFlips(newBoard, row, col, currentPlayer);
  for (const [r, c] of flips) {
    newBoard[r][c] = currentPlayer;
  }

  // Alterna o jogador (item d)
  const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';

  // Verifica se o próximo jogador tem movimentos
  const nextHasMoves = getValidMoves(newBoard, nextPlayer).length > 0;
  const currentHasMoves = getValidMoves(newBoard, currentPlayer).length > 0;

  // Contagem de peças
  const { blackCount, whiteCount } = countPieces(newBoard);

  // Verifica fim de jogo (item e): nenhum jogador pode mover
  if (!nextHasMoves && !currentHasMoves) {
    let winner: 'black' | 'white' | 'draw' | null = null;
    if (blackCount > whiteCount) winner = 'black';
    else if (whiteCount > blackCount) winner = 'white';
    else winner = 'draw';

    return { board: newBoard, currentPlayer: nextPlayer, winner, gameOver: true, blackCount, whiteCount };
  }

  // Se o próximo jogador não tem movimentos, o atual joga de novo
  const actualNext = nextHasMoves ? nextPlayer : currentPlayer;

  return {
    board: newBoard,
    currentPlayer: actualNext,
    winner: null,
    gameOver: false,
    blackCount,
    whiteCount,
  };
}