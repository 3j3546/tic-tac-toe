const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const MARKS = {
  X: '<path d="M10 10 L90 90"/><path d="M90 10 L10 90"/>',
  O: '<circle cx="50" cy="50" r="40"/>',
};

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const statusEl = $('status');
const winLineEl = $('win-line');
const modeEl = document.querySelector('.mode');

let board, turn, over, mode = 'ai';
const score = { X: 0, O: 0, draw: 0 };
const cells = [];

function winner(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
  }
  return b.every(Boolean) ? { player: null, line: [] } : null;
}

// 미니맥스: 컴퓨터(O)는 절대 지지 않음 (빨리 이기는 수를 우선)
function minimax(b, player, depth = 0) {
  const w = winner(b);
  if (w) return { score: w.player === 'O' ? 10 - depth : w.player === 'X' ? depth - 10 : 0 };
  let best = { score: player === 'O' ? -Infinity : Infinity };
  b.forEach((v, i) => {
    if (v) return;
    b[i] = player;
    const s = minimax(b, player === 'O' ? 'X' : 'O', depth + 1).score;
    b[i] = null;
    if (player === 'O' ? s > best.score : s < best.score) best = { score: s, index: i };
  });
  return best;
}

function markSvg(player, cls) {
  return `<svg viewBox="0 0 100 100" class="mark ${player.toLowerCase()} ${cls}">${MARKS[player]}</svg>`;
}

function aiTurn() {
  return mode === 'ai' && turn === 'O';
}

function play(i) {
  if (over || board[i]) return;
  board[i] = turn;
  cells[i].innerHTML = markSvg(turn, 'draw');
  turn = turn === 'X' ? 'O' : 'X';
  const w = winner(board);
  if (w) {
    over = true;
    w.player ? score[w.player]++ : score.draw++;
    if (w.player) showWinLine(w.line);
  }
  render(w);
  if (!over && aiTurn()) setTimeout(() => play(minimax(board, 'O').index), 450);
}

function showWinLine(line) {
  const box = boardEl.getBoundingClientRect();
  const center = (i) => {
    const r = cells[i].getBoundingClientRect();
    return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
  };
  let [x1, y1] = center(line[0]);
  let [x2, y2] = center(line[2]);
  // 양끝을 칸 바깥쪽으로 조금 늘림
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ext = 0.18 * len;
  x1 -= (dx / len) * ext; y1 -= (dy / len) * ext;
  x2 += (dx / len) * ext; y2 += (dy / len) * ext;
  const lineEl = winLineEl.querySelector('line');
  Object.entries({ x1, y1, x2, y2 }).forEach(([k, v]) => lineEl.setAttribute(k, v));
  lineEl.style.setProperty('--len', len + 2 * ext);
  winLineEl.classList.add('show');
}

function render(w) {
  board.forEach((v, i) => {
    const cell = cells[i];
    cell.disabled = over || !!v || aiTurn();
    cell.classList.toggle('dim', !!(w && w.player && !w.line.includes(i)));
    if (!v) cell.innerHTML = cell.disabled ? '' : `<span class="ghost">${markSvg(turn, '')}</span>`;
  });

  const tag = (p) => `<span class="${p.toLowerCase()}">${p}</span>`;
  statusEl.classList.toggle('win', !!w);
  $('now').classList.toggle('over', !!w);
  if (!w) {
    statusEl.innerHTML = aiTurn() ? '컴퓨터가 생각 중…' : `${tag(turn)} 차례예요`;
  } else if (!w.player) {
    statusEl.innerHTML = '무승부! 🤝';
  } else if (mode === 'ai') {
    statusEl.innerHTML = w.player === 'X' ? '이겼어요! 🎉' : '컴퓨터 승리 🤖';
  } else {
    statusEl.innerHTML = `${tag(w.player)} 승리! 🎉`;
  }

  $('score-x').classList.toggle('active', !over && turn === 'X');
  $('score-o').classList.toggle('active', !over && turn === 'O');
  $('num-x').textContent = score.X;
  $('num-o').textContent = score.O;
  $('num-draw').textContent = score.draw;
}

function reset() {
  board = Array(9).fill(null);
  turn = 'X';
  over = false;
  winLineEl.classList.remove('show');
  cells.forEach((c) => (c.innerHTML = ''));
  render(null);
}

function setMode(m) {
  mode = m;
  modeEl.dataset.mode = m;
  document.querySelectorAll('.mode-btn').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === m));
  $('label-x').textContent = m === 'ai' ? '나' : '';
  $('label-o').textContent = m === 'ai' ? '컴퓨터' : '';
  score.X = score.O = score.draw = 0;
  reset();
}

for (let i = 0; i < 9; i++) {
  const cell = document.createElement('button');
  cell.className = 'cell';
  cell.setAttribute('aria-label', `${Math.floor(i / 3) + 1}행 ${(i % 3) + 1}열`);
  cell.addEventListener('click', () => play(i));
  boardEl.appendChild(cell);
  cells.push(cell);
}

document.querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('reset').addEventListener('click', reset);
setMode('ai');
