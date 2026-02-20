const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");
const statusText = document.getElementById("statusText");
const difficultyBtns = document.querySelectorAll(".difficulty-menu button");

let selected = null;
let currentTurn = "white";
let gameOver = false;
let enPassant = null;

const pieces = {
    r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
    R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"
};

let board = [
    "rnbqkbnr",
    "pppppppp",
    "........",
    "........",
    "........",
    "........",
    "PPPPPPPP",
    "RNBQKBNR"
];

let moved = {
    whiteKing: false,
    blackKing: false,
    whiteRookA: false,
    whiteRookH: false,
    blackRookA: false,
    blackRookH: false
};

/* ========= INICIO ========= */
difficultyBtns.forEach(btn => {
    btn.onclick = () => {
        document.querySelector(".difficulty-menu").classList.add("hidden");
        boardEl.classList.remove("hidden");
        turnText.classList.remove("hidden");
        drawBoard();
    };
});

/* ========= RENDER ========= */
function drawBoard() {
    boardEl.innerHTML = "";
    board.forEach((row, y) => {
        [...row].forEach((cell, x) => {
            const sq = document.createElement("div");
            sq.className = `square ${(x + y) % 2 ? "dark" : "light"}`;
            sq.dataset.x = x;
            sq.dataset.y = y;

            if (cell !== ".") {
                const p = document.createElement("span");
                p.textContent = pieces[cell];
                p.className = `piece ${isWhite(cell) ? "white" : "black"}`;
                sq.appendChild(p);
            }

            sq.onclick = () => handleClick(x, y);
            boardEl.appendChild(sq);
        });
    });
}

/* ========= INPUT ========= */
function handleClick(x, y) {
    if (gameOver) return;

    const piece = board[y][x];

    if (selected) {
        if (piece !== "." && isWhite(piece) === (currentTurn === "white")) {
            selected = { x, y };
            drawBoard();
            highlightMoves(x, y);
            return;
        }

        if (isLegalMove(selected.x, selected.y, x, y)) {
            makeMove(selected.x, selected.y, x, y);
            afterMove();
        }

        selected = null;
        drawBoard();
        return;
    }

    if (piece === ".") return;
    if (isWhite(piece) !== (currentTurn === "white")) return;

    selected = { x, y };
    drawBoard();
    highlightMoves(x, y);
}

/* ========= MOVIMIENTO REAL ========= */
function makeMove(fx, fy, tx, ty) {
    const piece = board[fy][fx];

    // EN PASSANT
    if (piece.toLowerCase() === "p" && enPassant &&
        tx === enPassant.x && ty === enPassant.y) {
        const dir = isWhite(piece) ? 1 : -1;
        board[ty + dir] = replaceChar(board[ty + dir], tx, ".");
    }

    board[ty] = replaceChar(board[ty], tx, piece);
    board[fy] = replaceChar(board[fy], fx, ".");

    // CASTLING
    if (piece.toLowerCase() === "k" && Math.abs(tx - fx) === 2) {
        if (tx > fx) {
            board[ty] = replaceChar(board[ty], 5, board[ty][7]);
            board[ty] = replaceChar(board[ty], 7, ".");
        } else {
            board[ty] = replaceChar(board[ty], 3, board[ty][0]);
            board[ty] = replaceChar(board[ty], 0, ".");
        }
    }

    // FLAGS
    if (piece === "K") moved.whiteKing = true;
    if (piece === "k") moved.blackKing = true;
    if (piece === "R" && fx === 0) moved.whiteRookA = true;
    if (piece === "R" && fx === 7) moved.whiteRookH = true;
    if (piece === "r" && fx === 0) moved.blackRookA = true;
    if (piece === "r" && fx === 7) moved.blackRookH = true;

    // EN PASSANT FLAG
    enPassant = null;
    if (piece.toLowerCase() === "p" && Math.abs(ty - fy) === 2) {
        enPassant = { x: fx, y: (fy + ty) / 2 };
    }
}

/* ========= POST MOVE ========= */
function afterMove() {
    currentTurn = currentTurn === "white" ? "black" : "white";
    turnText.textContent = `Turno: ${currentTurn === "white" ? "Blancas" : "Negras"}`;

    if (isCheckMate(currentTurn)) {
        gameOver = true;
        statusText.textContent = "JAQUE MATE";
    } else if (isInCheck(currentTurn)) {
        statusText.textContent = "JAQUE";
    } else {
        statusText.textContent = "";
    }
}

/* ========= VALIDACIÓN ========= */
function isLegalMove(fx, fy, tx, ty) {
    if (!basicMoveAllowed(fx, fy, tx, ty)) return false;

    const copyBoard = board.map(r => r);
    const copyEP = enPassant && { ...enPassant };

    simulateMove(fx, fy, tx, ty);
    const illegal = isInCheck(currentTurn);

    board = copyBoard;
    enPassant = copyEP;

    return !illegal;
}

function simulateMove(fx, fy, tx, ty) {
    board[ty] = replaceChar(board[ty], tx, board[fy][fx]);
    board[fy] = replaceChar(board[fy], fx, ".");
}

function basicMoveAllowed(fx, fy, tx, ty) {
    if (fx === tx && fy === ty) return false;

    const piece = board[fy][fx];
    const target = board[ty][tx];
    if (target !== "." && isWhite(target) === isWhite(piece)) return false;

    const dx = tx - fx;
    const dy = ty - fy;

    switch (piece.toLowerCase()) {
        case "p": {
            const dir = isWhite(piece) ? -1 : 1;
            const start = isWhite(piece) ? 6 : 1;

            if (dx === 0 && dy === dir && target === ".") return true;
            if (dx === 0 && dy === 2 * dir && fy === start &&
                board[fy + dir][fx] === "." && target === ".") return true;
            if (Math.abs(dx) === 1 && dy === dir &&
                (target !== "." || enPassant?.x === tx)) return true;
            return false;
        }
        case "r": return clearPath(fx, fy, tx, ty) && (dx === 0 || dy === 0);
        case "b": return clearPath(fx, fy, tx, ty) && Math.abs(dx) === Math.abs(dy);
        case "q": return clearPath(fx, fy, tx, ty);
        case "n": return Math.abs(dx * dy) === 2;
        case "k": return Math.abs(dx) <= 1 && Math.abs(dy) <= 1 || canCastle(fx, fy, tx);
    }
    return false;
}

function canCastle(fx, fy, tx) {
    if (Math.abs(tx - fx) !== 2) return false;

    if (currentTurn === "white" && moved.whiteKing) return false;
    if (currentTurn === "black" && moved.blackKing) return false;

    return true;
}

/* ========= CHECK ========= */
function isInCheck(color) {
    let kx, ky;
    board.forEach((r, y) =>
        [...r].forEach((c, x) => {
            if (c.toLowerCase() === "k" && isWhite(c) === (color === "white")) {
                kx = x; ky = y;
            }
        })
    );

    return board.some((r, y) =>
        [...r].some((c, x) =>
            c !== "." &&
            isWhite(c) !== (color === "white") &&
            basicMoveAllowed(x, y, kx, ky)
        )
    );
}

function isCheckMate(color) {
    if (!isInCheck(color)) return false;

    for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
            if (board[y][x] !== "." && isWhite(board[y][x]) === (color === "white"))
                for (let ty = 0; ty < 8; ty++)
                    for (let tx = 0; tx < 8; tx++)
                        if (isLegalMove(x, y, tx, ty)) return false;

    return true;
}

/* ========= HELPERS ========= */
function clearPath(fx, fy, tx, ty) {
    const dx = Math.sign(tx - fx);
    const dy = Math.sign(ty - fy);
    let x = fx + dx, y = fy + dy;
    while (x !== tx || y !== ty) {
        if (board[y][x] !== ".") return false;
        x += dx; y += dy;
    }
    return true;
}

function highlightMoves(x, y) {
    document.querySelectorAll(".square").forEach(sq => {
        const tx = +sq.dataset.x;
        const ty = +sq.dataset.y;
        if (isLegalMove(x, y, tx, ty)) sq.classList.add("move");
        if (tx === x && ty === y) sq.classList.add("selected");
    });
}

function isWhite(p) {
    return p === p.toUpperCase();
}

function replaceChar(str, i, ch) {
    return str.substring(0, i) + ch + str.substring(i + 1);
}
