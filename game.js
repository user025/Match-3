const BOARD_SIZE = 8;
const PIECE_TYPES = 5;
const MAX_MOVES = 20;
const TARGET_TYPE = 1;
const TARGET_COUNT = 12;
const RESOLVE_DELAY = 180;

const pieceNames = ["红圆", "蓝水滴", "绿叶", "黄星", "紫菱"];

const boardElement = document.querySelector("#board");
const targetText = document.querySelector("#targetText");
const movesText = document.querySelector("#movesText");
const messageElement = document.querySelector("#message");
const resetButton = document.querySelector("#resetButton");

let board = [];
let selectedIndex = null;
let matchedIndexes = new Set();
let movesLeft = MAX_MOVES;
let collected = 0;
let isResolving = false;
let gameOver = false;

function randomPiece() {
  return Math.floor(Math.random() * PIECE_TYPES);
}

function indexOf(row, col) {
  return row * BOARD_SIZE + col;
}

function rowOf(index) {
  return Math.floor(index / BOARD_SIZE);
}

function colOf(index) {
  return index % BOARD_SIZE;
}

function isAdjacent(firstIndex, secondIndex) {
  const rowDistance = Math.abs(rowOf(firstIndex) - rowOf(secondIndex));
  const colDistance = Math.abs(colOf(firstIndex) - colOf(secondIndex));
  return rowDistance + colDistance === 1;
}

function createBoard() {
  const nextBoard = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let piece = randomPiece();

      while (
        (col >= 2 &&
          nextBoard[indexOf(row, col - 1)] === piece &&
          nextBoard[indexOf(row, col - 2)] === piece) ||
        (row >= 2 &&
          nextBoard[indexOf(row - 1, col)] === piece &&
          nextBoard[indexOf(row - 2, col)] === piece)
      ) {
        piece = randomPiece();
      }

      nextBoard.push(piece);
    }
  }

  return nextBoard;
}

function render() {
  boardElement.innerHTML = "";

  board.forEach((piece, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = [
      "cell",
      `piece-${piece}`,
      selectedIndex === index ? "is-selected" : "",
      matchedIndexes.has(index) ? "is-matched" : "",
    ]
      .filter(Boolean)
      .join(" ");
    cell.dataset.index = String(index);
    cell.setAttribute("aria-label", `${pieceNames[piece]}，第 ${rowOf(index) + 1} 行第 ${colOf(index) + 1} 列`);
    cell.disabled = isResolving || gameOver;
    boardElement.append(cell);
  });

  targetText.textContent = `${pieceNames[TARGET_TYPE]} ${collected}/${TARGET_COUNT}`;
  movesText.textContent = String(movesLeft);
}

function showMessage(text, tone = "info") {
  messageElement.textContent = text;
  messageElement.className = `message is-visible ${tone}`;

  if (tone === "info") {
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      messageElement.className = "message";
    }, 1800);
  }
}

function swap(firstIndex, secondIndex) {
  [board[firstIndex], board[secondIndex]] = [board[secondIndex], board[firstIndex]];
}

function findMatches() {
  const matches = new Set();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let runStart = 0;

    for (let col = 1; col <= BOARD_SIZE; col += 1) {
      const current = col < BOARD_SIZE ? board[indexOf(row, col)] : null;
      const previous = board[indexOf(row, col - 1)];

      if (current !== previous) {
        if (col - runStart >= 3) {
          for (let matchCol = runStart; matchCol < col; matchCol += 1) {
            matches.add(indexOf(row, matchCol));
          }
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let runStart = 0;

    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const current = row < BOARD_SIZE ? board[indexOf(row, col)] : null;
      const previous = board[indexOf(row - 1, col)];

      if (current !== previous) {
        if (row - runStart >= 3) {
          for (let matchRow = runStart; matchRow < row; matchRow += 1) {
            matches.add(indexOf(matchRow, col));
          }
        }
        runStart = row;
      }
    }
  }

  return matches;
}

function removeMatches(matches) {
  matches.forEach((index) => {
    if (board[index] === TARGET_TYPE) {
      collected += 1;
    }
    board[index] = null;
  });
}

function collapseBoard() {
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const pieces = [];

    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const piece = board[indexOf(row, col)];
      if (piece !== null) {
        pieces.push(piece);
      }
    }

    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const nextPiece = pieces[BOARD_SIZE - 1 - row];
      board[indexOf(row, col)] = nextPiece ?? randomPiece();
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function resolveBoard() {
  isResolving = true;
  selectedIndex = null;

  while (true) {
    const matches = findMatches();
    if (matches.size === 0) {
      break;
    }

    matchedIndexes = matches;
    render();
    await sleep(RESOLVE_DELAY);

    removeMatches(matches);
    matchedIndexes = new Set();
    collapseBoard();
    render();
    await sleep(RESOLVE_DELAY);
  }

  isResolving = false;
  checkGameState();
  render();
}

function hasPossibleMove() {
  for (let index = 0; index < board.length; index += 1) {
    const row = rowOf(index);
    const col = colOf(index);
    const neighbors = [
      col < BOARD_SIZE - 1 ? indexOf(row, col + 1) : null,
      row < BOARD_SIZE - 1 ? indexOf(row + 1, col) : null,
    ].filter((neighbor) => neighbor !== null);

    for (const neighbor of neighbors) {
      swap(index, neighbor);
      const hasMatch = findMatches().size > 0;
      swap(index, neighbor);

      if (hasMatch) {
        return true;
      }
    }
  }

  return false;
}

function reshuffleBoard() {
  do {
    board = createBoard();
  } while (!hasPossibleMove());

  showMessage("棋盘没有可用交换，已重新洗牌。");
}

function checkGameState() {
  if (collected >= TARGET_COUNT) {
    gameOver = true;
    showMessage("通关成功！目标元素已收集完成。", "success");
    return;
  }

  if (movesLeft <= 0) {
    gameOver = true;
    showMessage("挑战失败，步数用完了。点击重新开始再试一次。", "danger");
    return;
  }

  if (!hasPossibleMove()) {
    reshuffleBoard();
  }
}

async function handleCellClick(event) {
  const cell = event.target.closest(".cell");
  if (!cell || isResolving || gameOver) {
    return;
  }

  const index = Number(cell.dataset.index);

  if (selectedIndex === null) {
    selectedIndex = index;
    render();
    return;
  }

  if (selectedIndex === index) {
    selectedIndex = null;
    render();
    return;
  }

  if (!isAdjacent(selectedIndex, index)) {
    selectedIndex = index;
    showMessage("只能交换上下左右相邻的元素。");
    render();
    return;
  }

  const previousIndex = selectedIndex;
  swap(previousIndex, index);
  selectedIndex = null;
  render();

  if (findMatches().size === 0) {
    await sleep(RESOLVE_DELAY);
    swap(previousIndex, index);
    showMessage("没有形成三连，交换已换回。");
    render();
    return;
  }

  movesLeft -= 1;
  await resolveBoard();
}

function resetGame() {
  board = createBoard();
  selectedIndex = null;
  matchedIndexes = new Set();
  movesLeft = MAX_MOVES;
  collected = 0;
  isResolving = false;
  gameOver = false;

  if (!hasPossibleMove()) {
    reshuffleBoard();
  }

  showMessage("交换相邻元素，收集蓝水滴吧！");
  render();
}

boardElement.addEventListener("click", handleCellClick);
resetButton.addEventListener("click", resetGame);

resetGame();
