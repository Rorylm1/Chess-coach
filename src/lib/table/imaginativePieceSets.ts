import type { PieceSet } from "./pieceSets";

/** Original, recolorable SVG artwork. These are different silhouettes, not filters
 * on Staunton pieces. Each world keeps the crown/cross, turret, split mitre, horse,
 * and small pawn head readable even on a phone-sized board. */
function outlined(body: string, detail = ""): string {
  return `<g fill="var(--pc-fill)" stroke="var(--pc-rim)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${body}"/>${detail}</g>`;
}

function lines(d: string): string {
  return `<path d="${d}" fill="none"/>`;
}

const orbital: PieceSet = {
  vb: "0 0 64 64",
  inner: {
    K: outlined(
      "M29 5h6v6h6v6h-6v5c10 1 15 8 15 16l-7 7 5 9H16l5-9-7-7c0-8 5-15 15-16v-5h-6v-6h6Z",
      lines("M15 35c8-7 26-7 34 0M14 38c8 7 28 7 36 0M22 48h20") +
        '<path d="M7 37c0-5 11-9 25-9s25 4 25 9-11 9-25 9S7 42 7 37Z" fill="none"/>',
    ),
    Q: outlined(
      "M17 28 12 19l11 7 9-15 9 15 11-7-5 9-4 18 6 8H15l6-8Z",
      '<circle cx="12" cy="17" r="4"/><circle cx="32" cy="9" r="4"/><circle cx="52" cy="17" r="4"/>' +
        lines("M16 34c8-5 24-5 32 0M19 44h26M23 49h18") +
        '<ellipse cx="32" cy="38" rx="25" ry="6" fill="none"/>',
    ),
    R: outlined(
      "M15 13h8v8h5V11h8v10h5v-8h8v17l-7 6v11l7 7H15l7-7V36l-7-6Z",
      lines("M16 29h32M23 46h18") +
        '<circle cx="32" cy="38" r="5" fill="var(--pc-rim)" stroke="none"/>' +
        '<ellipse cx="32" cy="52" rx="25" ry="5" fill="none"/>',
    ),
    B: outlined(
      "M32 8c-8 8-15 16-15 25 0 7 5 11 10 13l-9 9h28l-9-9c5-2 10-6 10-13 0-9-7-17-15-25Z",
      lines("M37 15 27 31M21 37h22") +
        '<ellipse cx="32" cy="42" rx="22" ry="5" fill="none"/>',
    ),
    N: outlined(
      "M21 53c1-8 8-13 14-20l-12 5-11-7 9-14 9-3 3-7 9 11c10 9 12 20 5 35Z",
      lines("M20 24 31 21 35 26 24 30M41 22c6 7 5 14 1 21M17 47h32") +
        '<ellipse cx="32" cy="53" rx="24" ry="5"/>',
    ),
    P: outlined(
      "M24 35c-6-3-8-8-6-13 2-6 7-9 14-9s12 3 14 9c2 5 0 10-6 13l-3 10 9 9H18l9-9Z",
      lines("M20 23h24M23 29h18") +
        '<ellipse cx="32" cy="36" rx="22" ry="5"/><path d="M24 49h16" fill="none"/>',
    ),
  },
};

const botanical: PieceSet = {
  vb: "0 0 64 64",
  inner: {
    K: outlined(
      "M28 23c-14 2-15 12-10 19l9-5-2 11-11 8h36l-11-8-2-11 9 5c5-7 4-17-10-19v-5c8 2 11-3 9-7-4-2-7 0-9 2 2-8-2-11-4-11s-6 3-4 11c-2-2-5-4-9-2-2 4 1 9 9 7Z",
      lines("M32 25v23M21 31l11 6 11-6M25 55l7-7 7 7"),
    ),
    Q: outlined(
      "M32 7c7 6 9 12 8 18l12-10c3 18-3 28-15 30l2 5 10 6H15l10-6 2-5C15 43 9 33 12 15l12 10c-1-6 1-12 8-18Z",
      lines("M18 27c3 11 9 15 14 15s11-4 14-15M32 14v28M26 52h12"),
    ),
    R: outlined(
      "M18 14h8v9h12v-9h8v28l5 13H13l5-13Z",
      '<path d="M18 36C7 34 8 25 8 25c8-1 14 3 10 11ZM46 39c11-2 11-11 11-11-8-2-14 3-11 11Z"/>' +
        lines("M32 27v21M25 36v9M39 35v9M20 51h24") +
        '<path d="M29 14V9h6v5"/>',
    ),
    B: outlined(
      "M32 7c-1 8-17 13-17 27 0 7 6 11 13 11l-2 6-12 5h36l-12-5-2-6c7 0 13-4 13-11C49 20 33 15 32 7Z",
      lines("M37 18 26 32M32 35v14M20 36l12 5 12-5M25 54l7-5 7 5"),
    ),
    N: outlined(
      "M18 56c1-10 9-15 15-22l-9 4-12-7 9-14 10-3 3-8 8 10c11 7 14 18 10 30l-4 10Z",
      '<path d="M43 19c12-4 15 2 15 2l-9 6 7 5-8 5 6 6-7 3"/>' +
        lines("M29 21h3M17 29l9 3M40 29c5 7 3 15-4 22M22 53h23"),
    ),
    P: outlined(
      "M32 17c11 0 15 8 10 16-2 3-5 5-8 5v10l11 8H19l11-8V38c-3 0-6-2-8-5-5-8-1-16 10-16Z",
      '<path d="M32 20C20 18 20 9 20 9c9-2 14 4 12 11ZM32 18C32 7 43 7 43 7c1 7-4 12-11 11Z"/>' +
        lines("M21 27h22M27 52h10"),
    ),
  },
};

const origami: PieceSet = {
  vb: "0 0 64 64",
  inner: {
    K: outlined(
      "M28 5h8v7h7v7h-7v7l10 6-8 12 12 12H14l12-12-8-12 10-6v-7h-7v-7h7Z",
      lines("M18 32h28L32 44Zm14 12v12M14 56l18-8 18 8M28 26h8"),
    ),
    Q: outlined(
      "M10 16 25 28l7-20 7 20 15-12-9 27 7 13H12l7-13Z",
      lines("M10 16 32 40l22-24M25 28l7 12 7-12M19 43h26M12 56l20-10 20 10M32 8v32"),
    ),
    R: outlined(
      "M13 12h10v10h6V12h6v10h6V12h10v18l-8 8v9l8 9H13l8-9v-9l-8-8Z",
      lines("M13 30h38L32 40Zm19 10v12M21 47l11 5 11-5M13 56l19-4 19 4"),
    ),
    B: outlined(
      "M32 6 48 28 36 44l15 12H13l15-12-12-16Z",
      lines("M32 6v22L16 28M32 28l16 0M32 28l4 16h-8ZM39 16 27 30M13 56l19-8 19 8"),
    ),
    N: outlined(
      "M15 56 30 35l-8 4-12-9 13-14h9l4-10 16 18-6 18 6 14Z",
      lines("M23 16 36 24 30 35M36 6v18h16M36 24l-6 11 16 7M15 56l23-7 14 7M30 35l8 14M23 23h3"),
    ),
    P: outlined(
      "M32 12 44 23l-5 15h-4v6l13 12H16l13-12v-6h-4l-5-15Z",
      lines("M20 23h24L32 34ZM32 12v11M25 38h14M16 56l16-8 16 8M29 44h6"),
    ),
  },
};

const pixel: PieceSet = {
  vb: "0 0 64 64",
  inner: {
    K: outlined(
      "M28 4h8v8h8v8h-8v8h8v8h-4v12h8v8H16v-8h8V36h-4v-8h8v-8h-8v-8h8Z",
      lines("M24 32h16M24 48h16"),
    ),
    Q: outlined(
      "M8 16h8v12h8V12h4V8h8v4h4v16h8V16h8v16h-8v8h-4v8h8v8H12v-8h8v-8h-4v-8H8Z",
      lines("M20 36h24M24 48h16"),
    ),
    R: outlined(
      "M12 12h8v8h8v-8h8v8h8v-8h8v20h-8v16h8v8H12v-8h8V32h-8Z",
      lines("M20 28h24M28 36v8M36 36v8M20 48h24"),
    ),
    B: outlined(
      "M28 8h8v8h8v8h4v12h-8v8h-4v4h12v8H16v-8h12v-4h-4v-8h-8V24h4v-8h8Z",
      '<path d="M32 16v8h-8v8h8v-8h8v-8Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M24 36h16"),
    ),
    N: outlined(
      "M28 8h8v8h8v8h8v32H16V44h8v-8H12V24h8v-8h8Z",
      '<path d="M24 24h8v8h-8Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M40 32v8h-8v8M20 52h28"),
    ),
    P: outlined(
      "M24 12h16v4h4v16h-8v8h4v8h8v8H16v-8h8v-8h4v-8h-8V16h4Z",
      lines("M24 28h16M24 48h16"),
    ),
  },
};

/** Wind-up tin toys: chunky joints, keyholes and little mechanical feet. The
 * headgear carries the chess role; the toy bodies provide a different silhouette. */
const clockwork: PieceSet = {
  vb: "0 0 64 64",
  inner: {
    K: outlined(
      "M29 4h6v6h6v6h-6v5h9v15l-5 5v7h8v9H34v-6h-4v6H17v-9h8v-7l-5-5V21h9v-5h-6v-6h6Z",
      '<path d="M20 30h-7v12h7M44 30h7v12h-7"/>' +
        '<path d="M26 27h4v4h-4ZM34 27h4v4h-4Z" fill="var(--pc-rim)" stroke="none"/>' +
        '<path d="M32 39a2 2 0 0 0-1 3.7V45h2v-2.3a2 2 0 0 0-1-3.7Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M26 36h12M21 53h5M38 53h5"),
    ),
    Q: outlined(
      "M14 12 23 20 32 6 41 20 50 12 44 29v9l-7 5 7 8v6H20v-6l7-8-7-5v-9Z",
      '<path d="M20 34h-7v10h7M44 34h7v10h-7"/>' +
        '<path d="M25 31h5v4h-5ZM34 31h5v4h-5Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M20 25h24M26 46h12M23 51h18M32 52v5"),
    ),
    R: outlined(
      "M14 10h9v10h5V10h8v10h5V10h9v23l-5 6v8h6v10H35v-7h-6v7H13V47h6v-8l-5-6Z",
      '<path d="M14 30H8v13h11M50 30h6v13H45"/>' +
        '<path d="M25 29h14v11H25Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M18 25h28M32 29v11M24 44h16M18 52h6M40 52h6"),
    ),
    B: outlined(
      "M32 5 46 23v11l-8 7v7h8v9H34v-6h-4v6H18v-9h8v-7l-8-7V23Z",
      '<path d="M18 29h-6v13h10M46 29h6v13H42"/>' +
        lines("M37 14 27 25M21 28h22M25 35h14M27 43h10") +
        '<path d="M27 29h4v4h-4ZM35 29h4v4h-4Z" fill="var(--pc-rim)" stroke="none"/>',
    ),
    N: outlined(
      "M19 47 29 34l-8 3-11-6 4-10 10-6h7l3-9 10 12 8 12v17Z",
      '<path d="M41 14l8-2 1 8 7 2-4 7 4 6-7 4"/>' +
        '<path d="M23 23h5v5h-5Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M14 30h9M37 26l7 9-9 11") +
        '<path d="M18 45h31v7H18Z"/><circle cx="23" cy="52" r="6"/><circle cx="44" cy="52" r="6"/>' +
        '<circle cx="23" cy="52" r="2" fill="var(--pc-rim)" stroke="none"/><circle cx="44" cy="52" r="2" fill="var(--pc-rim)" stroke="none"/>',
    ),
    P: outlined(
      "M22 14h20l5 6v13l-9 5v9h6v10H33v-6h-2v6H20V47h6v-9l-9-5V20Z",
      '<path d="M17 29h-5v13h8"/>' +
        lines("M47 31h5M52 31c-6-1-6-7-2-7 5 0 2 7 2 7s-3 7 2 7c4 0 4-6-2-7Z") +
        '<path d="M24 23h5v5h-5ZM35 23h5v5h-5Z" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M25 33h14M27 41h10M27 45h10"),
    ),
  },
};

/** Sea-glass royalty above a tide pool: scallops, coral, liquid curves and curled
 * tentacles. The knight is a seahorse and the small round-headed pawn a jellyfish. */
const tidal: PieceSet = {
  vb: "0 0 64 64",
  inner: {
    K: outlined(
      "M29 4h6v7h7v6h-7v6c8 1 11 6 10 12l-5 9c-2 5 4 9 9 4-1 9-9 12-17 7-8 5-16 2-17-7 5 5 11 1 9-4l-5-9c-1-6 2-11 10-12v-6h-7v-6h7Z",
      lines("M25 29c3-3 11-3 14 0M22 34c7 5 13 5 20 0M26 43c3 2 9 2 12 0M32 44v10"),
    ),
    Q: outlined(
      "M12 28c-7-8-2-16 6-13-1-9 10-12 14-4 4-8 15-5 14 4 8-3 13 5 6 13l-13 16c2 8 8 6 12 2 0 9-9 14-19 8-10 6-19 1-19-8 4 4 10 6 12-2Z",
      lines("M12 25l20 17 20-17M19 19l13 23 13-23M32 16v26M25 47c3 3 11 3 14 0"),
    ),
    R: outlined(
      "M14 12h9v10h5V10h8v12h5V12h9v18c0 5-7 6-9 10-3 6 1 11 9 9-2 8-11 11-18 5-7 6-16 3-18-5 8 2 12-3 9-9-2-4-9-5-9-10Z",
      '<path d="M21 42C11 42 6 36 7 30c0-4 6-4 6 0 0 4 4 6 8 6M43 42c10 0 15-6 14-12 0-4-6-4-6 0 0 4-4 6-8 6"/>' +
        lines("M17 28h30M28 35v8M36 35v8M25 48c4 3 10 3 14 0"),
    ),
    B: outlined(
      "M32 6c1 9 16 15 16 27 0 8-6 12-11 13 0 6 6 7 10 2 1 9-7 12-15 7-8 5-16 2-15-7 4 5 10 4 10-2-5-1-11-5-11-13C16 21 31 15 32 6Z",
      lines("M37 18 26 33M22 35c3 8 17 8 20 0M32 44v10"),
    ),
    N: outlined(
      "M27 8 34 5l5 9c9 4 15 11 14 20-1 6-7 10-15 13-7 3-8 7-3 9 5 1 9-2 6-6 8 2 9 12-2 12-13 0-22-9-15-18l8-11-9 5-12-7 7-11 10-5Z",
      '<path d="M45 18l10-2-3 8 7 2-7 6 4 6-9 2"/>' +
        '<circle cx="28" cy="23" r="2" fill="var(--pc-rim)" stroke="none"/>' +
        lines("M15 29l10 3M40 26c5 3 5 7 1 11M29 47c-5 9 3 12 9 10"),
    ),
    P: outlined(
      "M32 14c11 0 18 9 18 21-3 4-6 4-9 2l-3 2c5 5 10 9 6 15-2 3-7 4-9 0 5 1 6-2 3-5l-6-6-6 6c-3 3-2 6 3 5-2 4-7 3-9 0-4-6 1-10 6-15l-3-2c-3 2-6 2-9-2 0-12 7-21 18-21Z",
      lines("M19 31c7-3 19-3 26 0M24 21c-2 3-3 6-3 9M32 38v15M43 40c7 1 11 7 8 12M21 40c-7 1-11 7-8 12"),
    ),
  },
};

export const IMAGINATIVE_PIECE_SETS = { orbital, botanical, origami, pixel, clockwork, tidal };
