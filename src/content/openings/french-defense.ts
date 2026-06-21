/**
 * The French Defense — curated journey content (M5).
 *
 * You play Black. Main line is the Advance Variation (1.e4 e6 2.d4 d5 3.e5 c5 4.c3 Nc6
 * 5.Nf3), which best teaches the French's signature pawn chain and …c5 break. White's
 * third-move fork is taught as deviations: the Classical (3.Nc3) and the Exchange
 * (3.exd5). Evals are White-POV centipawns (provisional). Every line is legality-tested.
 */

import type { Opening } from "@/lib/openings/tree";

export const frenchDefense: Opening = {
  slug: "french-defense",
  name: "French Defense",
  eco: "C00–C19",
  learnerSide: "b",
  blurb: "A rock-solid pawn chain, a thematic …c5 break, and one famously bad bishop.",
  idea: "The French is a counterpuncher's defense. You answer 1.e4 with 1…e6, intending …d5 to challenge the center directly. You concede a little space and accept one long-term headache — a light-squared bishop hemmed in by your own pawns — in return for a rock-solid structure and a crystal-clear plan: lock the center, then chip away at White's pawn chain with …c5. Few openings teach strategic chess so cleanly.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 20,
      note: "White opens 1.e4. The French greets it not with a fight for e5, but with a patient plan to undermine the center.",
      children: [
        {
          san: "e6",
          main: true,
          evalCp: 25,
          note: "1…e6 — the French. A quiet move with a loud intention: next comes …d5, hitting White's center head-on.",
          hint: "Prepare to challenge the center with …d5 — open the door for it first.",
          children: [
            {
              san: "d4",
              main: true,
              evalCp: 30,
              note: "2.d4 builds the big pawn center White wants. This is exactly the structure the French is designed to attack.",
              children: [
                {
                  san: "d5",
                  main: true,
                  evalCp: 20,
                  note: "2…d5 strikes the center immediately, challenging e4 and forcing White to make the defining choice of the whole opening.",
                  hint: "Challenge White's center pawn directly, right now.",
                  children: [
                    // ── White's defining fork: Advance, Classical, or Exchange ──
                    {
                      san: "e5",
                      main: true,
                      weight: 3,
                      evalCp: 30,
                      note: "3.e5 — the Advance Variation. White locks the center and grabs space, forming the classic pawn chain (d4–e5 vs e6–d5). Now you know exactly what to do: attack its base.",
                      children: [
                        {
                          san: "c5",
                          main: true,
                          evalCp: 20,
                          note: "3…c5 — the thematic French break, striking at d4, the base of White's chain. This is the move the whole defense is built around.",
                          hint: "Hit the base of White's pawn chain — the d4-pawn.",
                          children: [
                            {
                              san: "c3",
                              main: true,
                              evalCp: 25,
                              note: "4.c3 props up d4. The tension on the d4-square is the heart of the position.",
                              children: [
                                {
                                  san: "Nc6",
                                  main: true,
                                  evalCp: 20,
                                  note: "4…Nc6 piles a second attacker onto d4. You've reached the main Advance French — a clear, plan-rich position where you grind on the queenside. Nicely done.",
                                  hint: "Develop a knight that adds pressure to d4.",
                                  children: [
                                    {
                                      san: "Nf3",
                                      main: true,
                                      evalCp: 25,
                                      note: "5.Nf3 defends d4 once more and develops. The battle lines are drawn: you'll work the queenside and the d4-point, White the kingside.",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      san: "Nc3",
                      weight: 2,
                      aside: "If White plays the Classical with 3.Nc3 (defending e4 and developing), reply 3…Nf6, adding pressure to e4 and inviting the rich main lines.",
                      children: [
                        {
                          san: "Nf6",
                          main: true,
                          hint: "Add an attacker to White's e4-pawn and develop.",
                        },
                      ],
                    },
                    {
                      san: "exd5",
                      weight: 1,
                      aside: "If White defuses with the Exchange (3.exd5), simply recapture 3…exd5. The structure goes symmetrical and drawish — play actively and outplay them in the middlegame.",
                      children: [
                        {
                          san: "exd5",
                          main: true,
                          hint: "Recapture toward the center and keep an active, easy game.",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  panels: {
    plans:
      "The French is a counterpunch: you lock the center with …d5, then chip at the base of White's pawn chain with …c5 (and sometimes …f6). Your play is on the queenside and the c-file; White's is kingside space and an attack. Pick your break and commit to it.",
    pieces:
      "The problem child is the light-squared bishop on c8, walled in by your own e6/d5 pawns — freeing it (…b6 and …Ba6, or a well-timed …f6) is a recurring theme. Knights head to c6 and toward f5 (via …Nge7 or …Nh6); rooks belong on the c-file. Keep the pressure on d4.",
    trap: {
      name: "The Milner-Barry Gambit pitfall",
      text: "In the Advance, if White gambits a pawn with the Milner-Barry (c3, Nf3, Bd3, O-O, and a sac on d4), greedily snatching on d4 and e5 before developing can walk you straight into a crushing attack on h7. The lesson: in the French Advance, finish developing before you grab material.",
    },
    middlegame:
      "Locked pawn chains make for slow, strategic play: you grind on the queenside and the d4-point while keeping your king safe, accepting a space disadvantage for a rock-solid structure and a clear plan. Patience plus the …c5 and …f6 breaks is how French middlegames are won.",
  },
};
