const boardEl = document.getElementById("board");
const turnText = document.getElementById("turnText");

let selected = null;
let currentTurn = "white";

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

function drawBoard() {
    boardEl.innerHTML = "";

    board.forEach((row, y) => {
        [...row].forEach((cell, x) => {
            const square = document.createElement("div");
            square.className = `square ${(x + y) % 2 ? "dark" : "light"}`;
            square.dataset.x = x;
            square.dataset.y = y;

            if (cell !== ".") {
                const piece = document.createElement("span");
                piece.textContent = pieces[cell];
                piece.className = `piece ${cell === cell.toUpperCase() ? "white" : "black"}`;
                square.appendChild(piece);
            }

            square.addEventListener("click", () => handleClick(x, y));
            boardEl.appendChild(square);
        });
    });
}

function handleClick(x, y) {
    clearHighlights();

    const piece = board[y][x];

    if (selected) {
        if (isLegalMove(selected.x, selected.y, x, y)) {
            movePiece(selected.x, selected.y, x, y);
            switchTurn();
        }
        selected = null;
        drawBoard();
        return;
    }

    if (piece === ".") return;

    const isWhite = piece === piece.toUpperCase();
    if ((isWhite && currentTurn !== "white") || (!isWhite && currentTurn !== "black")) return;

    selected = { x, y };
    highlightMoves(x, y);
}

function highlightMoves(x, y) {
    document.querySelectorAll(".square").forEach(sq => {
        const tx = +sq.dataset.x;
        const ty = +sq.dataset.y;

        if (isLegalMove(x, y, tx, ty)) {
            sq.classList.add("move");
        }

        if (tx === x && ty === y) {
            sq.classList.add("selected");
        }
    });
}

function clearHighlights() {
    document.querySelectorAll(".square").forEach(sq => {
        sq.classList.remove("move", "selected");
    });
}

function movePiece(fx, fy, tx, ty) {
    const row = board[fy].split("");
    const targetRow = board[ty].split("");

    targetRow[tx] = row[fx];
    row[fx] = ".";

    board[fy] = row.join("");
    board[ty] = targetRow.join("");
}

function switchTurn() {
    currentTurn = currentTurn === "white" ? "black" : "white";
    turnText.textContent = `Turno: ${currentTurn === "white" ? "Blancas" : "Negras"}`;
}

/* MOVIMIENTOS LEGALES BÁSICOS */
function isLegalMove(fx, fy, tx, ty) {
    if (fx === tx && fy === ty) return false;

    const piece = board[fy][fx];
    const target = board[ty][tx];

    const isWhite = piece === piece.toUpperCase();
    if (target !== "." && (target === target.toUpperCase()) === isWhite) return false;

    const dx = tx - fx;
    const dy = ty - fy;

    switch (piece.toLowerCase()) {
        case "p":
            const dir = isWhite ? -1 : 1;
            if (dx === 0 && dy === dir && target === ".") return true;
            return false;

        case "r":
            return dx === 0 || dy === 0;

        case "b":
            return Math.abs(dx) === Math.abs(dy);

        case "q":
            return dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);

        case "n":
            return Math.abs(dx * dy) === 2;

        case "k":
            return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    }
    return false;
}

drawBoard();
