/** An offline roll composes a new palette and world, rather than choosing three presets. */
import { formatHex } from "culori";
import { backstop } from "./backstop";
import { createRecipe, type RecentTable, type TableRecipe } from "./brief";
import { hexA, type TableSpec } from "./spec";

const TYPE_TRIOS = [
  ["Bungee", "Nunito", "Space Mono"], ["Righteous", "Sora", "IBM Plex Mono"],
  ["Rye", "Lora", "Courier Prime"], ["Lemon", "Nunito Sans", "Space Mono"],
  ["Bodoni Moda", "Lora", "IBM Plex Mono"], ["Rubik Mono One", "Rubik", "Space Mono"],
  ["Cinzel Decorative", "Alegreya", "Courier Prime"], ["Fredoka", "Nunito", "IBM Plex Mono"],
  ["Monoton", "Barlow", "Space Mono"], ["DM Serif Display", "DM Sans", "IBM Plex Mono"],
] as const;
const ADJECTIVES = ["Jellybean", "Moonlit", "Electric", "Upside-down", "Paper", "Cosmic", "Bubblegum", "Velvet", "Clockwork", "Starlit", "Mushroom", "Tangerine"];
const PLACES = ["Parade", "Orchard", "Planetarium", "Carnival", "Lagoon", "Cabaret", "Post Office", "Playground", "Observatory", "Tea Party", "Disco", "Cloud Factory"];
const pick = <T,>(a: readonly T[], random: () => number) => a[Math.floor(random() * a.length)];

export function fallbackTable(recent: RecentTable[] = [], recipe = createRecipe(recent), random = Math.random): TableSpec {
  const color = (h: number, s: number, l: number) => formatHex({ mode: "hsl", h: (h + 360) % 360, s, l });
  const h = recipe.hue, other = (h + 120 + random() * 100) % 360;
  const bg = color(h, 0.48 + random() * 0.25, recipe.light ? 0.89 : 0.12);
  const ink = color(h, 0.42, recipe.light ? 0.1 : 0.96);
  const accent = color(other, 0.8, recipe.light ? 0.35 : 0.73);
  const evaluation = color(h + 35, 0.88, recipe.light ? 0.32 : 0.75);
  const fontChoices = TYPE_TRIOS.filter(([font]) => !recent.some((s) => s.fontDisplay === font));
  const [fontDisplay, fontBody, fontMono] = pick(fontChoices, random);
  const names = ADJECTIVES.flatMap((a) => PLACES.map((p) => `${a} ${p}`)).filter((name) => !recent.some((s) => s.name === name));
  return backstop({
    id: `fb-${crypto.randomUUID()}`, name: pick(names, random),
    flavor: `Step into ${recipe.brief}`, brief: recipe.brief,
    fontDisplay, fontBody, fontMono, displayWeight: 400, displaySpacing: "0.03em", displayTransform: "none",
    corner: pick(["round", "square", "deco", "notch", "bracket"] as const, random), frame: recipe.frame,
    motion: pick(["boot", "rise", "draw"] as const, random), radius: Math.floor(random() * 17),
    bg, bgGradient: atmosphere(recipe, accent, evaluation),
    panel: color(h, 0.4, recipe.light ? 0.96 : 0.17), panel2: color(h, 0.46, recipe.light ? 0.9 : 0.13),
    surface: color(h, 0.44, recipe.light ? 0.85 : 0.22), hairline: hexA(ink, 0.25), hairline2: hexA(ink, 0.16),
    ink, inkSoft: color(h, 0.22, recipe.light ? 0.27 : 0.8), inkFaint: color(h, 0.2, recipe.light ? 0.33 : 0.7),
    accentInteractive: accent, accentInteractiveDim: accent, accentEval: evaluation, accentEvalDim: evaluation,
    boardLight: color(h, 0.6, 0.82 + random() * 0.1), boardDark: color(other, 0.57 + random() * 0.2, 0.26 + random() * 0.13),
    pieceWhite: color(other, 0.7, 0.93), pieceWhiteRim: color(other, 0.65, 0.09),
    pieceBlack: color(h, 0.7, 0.14), pieceBlackRim: color(h, 0.75, 0.94),
    boardAccent: accent, boardLast: evaluation, coordOnLight: "#15111d", coordOnDark: "#fff7ed", pieceStyle: recipe.pieceStyle,
  });
}

function atmosphere(recipe: TableRecipe, accent: string, evaluation: string): string {
  const a = hexA(accent, 0.12), b = hexA(evaluation, 0.1);
  switch (recipe.composition) {
    case "oversized off-center concentric rings":
      return `repeating-radial-gradient(circle at 8% 12%, ${a} 0 2px, transparent 3px 48px)`;
    case "diagonal candy stripes":
      return `repeating-linear-gradient(135deg, ${a} 0 22px, transparent 22px 66px)`;
    case "a theatrical fan of conic rays":
      return `repeating-conic-gradient(from 20deg at 15% 30%, ${a} 0deg 12deg, transparent 12deg 30deg)`;
    case "a quilt of repeating linear marks":
      return `repeating-linear-gradient(90deg, ${a} 0 2px, transparent 2px 40px), repeating-linear-gradient(0deg, ${b} 0 2px, transparent 2px 40px)`;
    default:
      return `radial-gradient(circle at 12% 15%, ${a} 0 12%, transparent 12.2%), radial-gradient(circle at 85% 70%, ${b} 0 24%, transparent 24.2%), radial-gradient(ellipse at 55% 0%, ${a}, transparent 65%)`;
  }
}
