const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");
const statusText = document.getElementById("statusText");
const difficultyBtns = document.querySelectorAll(".difficulty-menu button");

let selected = null;
let currentTurn = "white";
let gameOver = false;

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

/* INICIO */
difficultyBtns.forEach(btn => {
    btn.onclick = () => {
        document.querySelector(".difficulty-menu").classList.add("hidden");
        boardEl.classList.remove("hidden");
        turnText.classList.remove("hidden");
        drawBoard();
    };
});

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
                p.className = `piece ${cell === cell.toUpperCase() ? "white" : "black"}`;
                sq.appendChild(p);
            }

            sq.onclick = () => handleClick(x, y);
            boardEl.appendChild(sq);
        });
    });
}

function handleClick(x, y) {
    if (gameOver) return;

    clearHighlights();
    const piece = board[y][x];

    if (selected) {
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
    highlightMoves(x, y);
}

/* ===== MOVIMIENTO ===== */

function makeMove(fx, fy, tx, ty) {
    const f = board[fy].split("");
    const t = board[ty].split("");

    t[tx] = f[fx];
    f[fx] = ".";

    board[fy] = f.join("");
    board[ty] = t.join("");
}

function afterMove() {
    currentTurn = currentTurn === "white" ? "black" : "white";
    turnText.textContent = `Turno: ${currentTurn === "white" ? "Blancas" : "Negras"}`;

    if (isCheckMate(currentTurn)) {
        gameOver = true;
        statusText.textContent = `JAQUE MATE — Ganan ${currentTurn === "white" ? "Negras" : "Blancas"}`;
    } else if (isInCheck(currentTurn)) {
        statusText.textContent = "JAQUE";
    } else {
        statusText.textContent = "";
    }
}

/* ===== REGLAS ===== */

function isLegalMove(fx, fy, tx, ty) {
    const piece = board[fy][fx];
    if (!basicMoveAllowed(fx, fy, tx, ty)) return false;

    const copy = board.map(r => r);
    makeMove(fx, fy, tx, ty);
    const illegal = isInCheck(isWhite(piece) ? "white" : "black");
    board = copy;

    return !illegal;
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
            if (dx === 0 && dy === 2 * dir && fy === start && target === "." && board[fy + dir][fx] === ".") return true;
            if (Math.abs(dx) === 1 && dy === dir && target !== ".") return true;
            return false;
        }
        case "r": return clearPath(fx, fy, tx, ty) && (dx === 0 || dy === 0);
        case "b": return clearPath(fx, fy, tx, ty) && Math.abs(dx) === Math.abs(dy);
        case "q": return clearPath(fx, fy, tx, ty) && (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy));
        case "n": return Math.abs(dx * dy) === 2;
        case "k": return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    }
    return false;
}

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

/* ===== JAQUE ===== */

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

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const p = board[y][x];
            if (p !== "." && isWhite(p) === (color === "white")) {
                for (let ty = 0; ty < 8; ty++) {
                    for (let tx = 0; tx < 8; tx++) {
                        if (isLegalMove(x, y, tx, ty)) return false;
                    }
                }
            }
        }
    }
    return true;
}

function isWhite(p) {
    return p === p.toUpperCase();
}

function highlightMoves(x, y) {
    document.querySelectorAll(".square").forEach(sq => {
        const tx = +sq.dataset.x;
        const ty = +sq.dataset.y;
        if (isLegalMove(x, y, tx, ty)) sq.classList.add("move");
        if (tx === x && ty === y) sq.classList.add("selected");
    });
}

function clearHighlights() {
    document.querySelectorAll(".square").forEach(s =>
        s.classList.remove("move", "selected")
    );
}
