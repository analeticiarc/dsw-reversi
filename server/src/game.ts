export type Cell = null | 'black' | 'white';
export type Board = Cell[][];

export interface GameState {
  board: Board;
  currentPlayer: 'black' | 'white';
  winner: 'black' | 'white' | 'draw' | null;
  gameOver: boolean;
  blackCount: number;
  whiteCount: number;
}

// direções pra verificar jogadas válidas
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];

function createBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

export function createGame(): GameState {
  const board = createBoard();

  // posicao inicial do reversi
  board[3][3] = 'black';
  board[4][4] = 'black';
  board[3][4] = 'white';
  board[4][3] = 'white';

  return {
    board,
    currentPlayer: 'black', // pretas sempre começam
    winner: null,
    gameOver: false,
    blackCount: 2,
    whiteCount: 2,
  };
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// retorna quais peças devem ser viradas
function getFlips(board: Board, row: number, col: number, player: 'black' | 'white'): [number, number][] {
  const opponent = player === 'black' ? 'white' : 'black';
  const toFlip: [number, number][] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line: [number, number][] = [];
    let r = row + dr;
    let c = col + dc;

    while (inBounds(r, c) && board[r][c] === opponent) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    // se tiver uma peça nossa depois das do oponente, então vira
    if (line.length > 0 && inBounds(r, c) && board[r][c] === player) {
      toFlip.push(...line);
    }
  }

  return toFlip;
}

export function isValidMove(board: Board, row: number, col: number, player: 'black' | 'white'): boolean {
  if (board[row][col] !== null) return false;
  return getFlips(board, row, col, player).length > 0;
}

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

export function applyMove(state: GameState, row: number, col: number): GameState {
  const { board, currentPlayer } = state;

  if (!isValidMove(board, row, col, currentPlayer)) {
    return state;
  }

  const newBoard: Board = board.map(r => [...r]);

  newBoard[row][col] = currentPlayer;

  // vira as pecas capturadas
  const flips = getFlips(newBoard, row, col, currentPlayer);
  for (const [r, c] of flips) {
    newBoard[r][c] = currentPlayer;
  }

  const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';

  const nextHasMoves = getValidMoves(newBoard, nextPlayer).length > 0;
  const currentHasMoves = getValidMoves(newBoard, currentPlayer).length > 0;

  const { blackCount, whiteCount } = countPieces(newBoard);

  // fim de jogo se ninguem pode jogar
  if (!nextHasMoves && !currentHasMoves) {
    let winner: 'black' | 'white' | 'draw' | null = null;
    if (blackCount > whiteCount) winner = 'black';
    else if (whiteCount > blackCount) winner = 'white';
    else winner = 'draw';

    return { board: newBoard, currentPlayer: nextPlayer, winner, gameOver: true, blackCount, whiteCount };
  }

  // se o proximo jogador nao tem jogadas, passa a vez
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