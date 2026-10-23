const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const aiEl = document.getElementById('ai');

let board, turn, over;
const score = { X: 0, O: 0, draw: 0 };

function winner(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
  }
  return b.every(Boolean) ? { player: null, line: [] } : null;
}

// 미니맥스: 컴퓨터(O)는 절대 지지 않음
function minimax(b, player) {
  const w = winner(b);
  if (w) return { score: w.player === 'O' ? 10 : w.player === 'X' ? -10 : 0 };
  let best = { score: player === 'O' ? -Infinity : Infinity };
  b.forEach((v, i) => {
    if (v) return;
    b[i] = player;
    const s = minimax(b, player === 'O' ? 'X' : 'O').score;
    b[i] = null;
    if (player === 'O' ? s > best.score : s < best.score) best = { score: s, index: i };
  });
  return best;
}

function play(i) {
  if (over || board[i]) return;
  board[i] = turn;
  turn = turn === 'X' ? 'O' : 'X';
  const w = winner(board);
  if (w) {
    over = true;
    w.player ? score[w.player]++ : score.draw++;
  }
  render(w);
  if (!over && aiEl.checked && turn === 'O') setTimeout(() => play(minimax(board, 'O').index), 300);
}

function render(w) {
  boardEl.innerHTML = '';
  board.forEach((v, i) => {
    const cell = document.createElement('button');
    cell.className = 'cell' + (v ? ' ' + v : '') + (w && w.line.includes(i) ? ' win' : '');
    cell.textContent = v || '';
    cell.disabled = over || !!v || (aiEl.checked && turn === 'O');
    cell.addEventListener('click', () => play(i));
    boardEl.appendChild(cell);
  });
  statusEl.textContent = w
    ? (w.player ? `${w.player} 승리!` : '무승부!')
    : `${turn} 차례`;
  scoreEl.textContent = `X ${score.X} : ${score.O} O · 무승부 ${score.draw}`;
}

function reset() {
  board = Array(9).fill(null);
  turn = 'X';
  over = false;
  render(null);
}

document.getElementById('reset').addEventListener('click', reset);
aiEl.addEventListener('change', reset);
reset();
