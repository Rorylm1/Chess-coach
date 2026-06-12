/**
 * Decorative, non-interactive board motif for the landing.
 * Real M0-era chessboard craft: strong square contrast, full readable position,
 * coordinates, and a last-move highlight. The playable board arrives in M1.
 *
 * Position: Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5.
 * Uppercase = white, lowercase = black. "." = empty.
 */
const POSITION: string[][] = [
  ["r", ".", "b", "q", "k", ".", "n", "r"], // rank 8
  ["p", "p", "p", "p", ".", "p", "p", "p"], // rank 7
  [".", ".", "n", ".", ".", ".", ".", "."], // rank 6
  [".", ".", "b", ".", "p", ".", ".", "."], // rank 5
  [".", ".", "B", ".", "P", ".", ".", "."], // rank 4
  [".", ".", ".", ".", ".", "N", ".", "."], // rank 3
  ["P", "P", "P", "P", ".", "P", "P", "P"], // rank 2
  ["R", "N", "B", "Q", "K", ".", ".", "R"], // rank 1
];

const GLYPH: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

// Last move e2 -> e4: row 6 col 4, and row 4 col 4.
const LAST_MOVE = new Set(["6,4", "4,4"]);

export function DecorativeBoard() {
  return (
    <figure className="board-figure">
      <div className="board-wrap">
        <span className="brk tl" aria-hidden="true" />
        <span className="brk tr" aria-hidden="true" />
        <span className="brk bl" aria-hidden="true" />
        <span className="brk br" aria-hidden="true" />
        <div
          className="board"
          role="img"
          aria-label="A chessboard showing the Italian Game after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5. White has just played the pawn from e2 to e4."
        >
          {POSITION.map((rankRow, row) =>
            rankRow.map((code, col) => {
              const rankNum = 8 - row;
              const isLight = (col + rankNum) % 2 === 0;
              const isLast = LAST_MOVE.has(`${row},${col}`);
              const isWhite = code !== "." && code === code.toUpperCase();
              const classes = [
                "sq",
                isLight ? "lt" : "dk",
                isLast ? "last" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div key={`${row}-${col}`} className={classes}>
                  {col === 0 && <span className="coord rank">{rankNum}</span>}
                  {row === 7 && <span className="coord file">{FILES[col]}</span>}
                  {code !== "." && (
                    <span className={`piece ${isWhite ? "w" : "b"}`} aria-hidden="true">
                      {GLYPH[code]}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </figure>
  );
}
