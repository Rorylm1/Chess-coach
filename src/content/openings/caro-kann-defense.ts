/**
 * The Caro–Kann Defense — curated journey content.
 *
 * You play Black. The main line is the Advance Variation
 * (1.e4 c6 2.d4 d5 3.e5 Bf5 4.Nf3 e6 5.Be2 c5), with the Classical,
 * Exchange, Shirov and Tal approaches taught as White deviations. Evals are
 * White-POV centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const caroKannDefense: Opening = {
  slug: "caro-kann-defense",
  name: "Caro–Kann Defense",
  eco: "B10–B19",
  learnerSide: "b",
  blurb: "Meet 1.e4 with a sturdy center — and free the bishop before closing the door.",
  idea: "The Caro–Kann builds the move …d5 with 1…c6. It spends a tempo compared with the French, but earns something valuable: the light-squared bishop can escape to f5 before …e6 closes the pawn chain. The result is a sound structure, a safe king, and clear targets in White's center — ideal if you like absorbing early pressure and improving your position move by move.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 20,
      note: "White claims the center with 1.e4. The Caro–Kann will challenge it with a pawn supported by another pawn, not with a tactical skirmish.",
      children: [
        {
          san: "c6",
          main: true,
          evalCp: 30,
          note: "1…c6 is the Caro–Kann. It prepares …d5 while keeping the light-squared bishop's diagonal open — the detail that separates this defense from the French.",
          hint: "Support a coming …d5 push without blocking your light-squared bishop.",
          children: [
            {
              san: "d4",
              main: true,
              evalCp: 25,
              note: "2.d4 gives White the ideal-looking center. That is not a problem: you prepared a direct challenge to it on move one.",
              children: [
                {
                  san: "d5",
                  main: true,
                  evalCp: 25,
                  note: "2…d5 attacks e4 with a pawn that c6 securely supports. White must now advance, exchange, or defend — and each choice gives you a clear plan.",
                  hint: "Play the central break your first move prepared.",
                  children: [
                    {
                      san: "e5",
                      main: true,
                      weight: 3,
                      evalCp: 30,
                      note: "3.e5 is the Advance Variation. White gains space and fixes a pawn chain, but your important bishop still has time to get outside it.",
                      children: [
                        {
                          san: "Bf5",
                          main: true,
                          evalCp: 30,
                          note: "3…Bf5 solves the opening's strategic puzzle before playing …e6. The bishop is active, the d5-pawn is firm, and your position has no obvious bad piece.",
                          hint: "Develop the bishop now, before …e6 would lock it behind your pawns.",
                          children: [
                            {
                              san: "Nf3",
                              main: true,
                              weight: 3,
                              evalCp: 25,
                              note: "4.Nf3 is calm development. White supports the center and prepares to castle rather than chasing your bishop immediately.",
                              children: [
                                {
                                  san: "e6",
                                  main: true,
                                  evalCp: 25,
                                  note: "4…e6 completes the compact pawn triangle. This would have imprisoned the bishop one move ago; now it simply makes d5 rock solid and opens the dark bishop.",
                                  hint: "Close and reinforce the pawn chain now that your bishop is safely outside it.",
                                  children: [
                                    {
                                      san: "Be2",
                                      main: true,
                                      evalCp: 20,
                                      note: "5.Be2 prepares White to castle. With the immediate pressure over, it is time to attack the base of White's pawn chain.",
                                      children: [
                                        {
                                          san: "c5",
                                          main: true,
                                          evalCp: 20,
                                          note: "5…c5 challenges d4, the base of White's chain. The c-pawn did its first job by supporting …d5; now it moves again to undermine White's center. That is the Caro–Kann in one tidy plan.",
                                          hint: "Reuse the c-pawn to attack the base of White's central chain.",
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
                              aside: "If White chooses 4.Nc3 and hints at g4 — the sharp Shirov approach — play 4…e6. Keep the center firm and be ready to retreat the bishop without loosening your king.",
                              children: [
                                {
                                  san: "e6",
                                  main: true,
                                  hint: "Reinforce d5 and open your dark-squared bishop; stay calm under the bishop chase.",
                                },
                              ],
                            },
                            {
                              san: "h4",
                              weight: 1,
                              aside: "If White launches the Tal Variation with 4.h4, answer 4…h5. It gives the bishop h7 as a real retreat and stops h5 from trapping it against your own pawns.",
                              children: [
                                {
                                  san: "h5",
                                  main: true,
                                  hint: "Make a safe retreat square for the bishop before White plays h5.",
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
                      aside: "If White defends e4 with 3.Nc3 — the Classical Variation — take with 3…dxe4. After Nxe4, your bishop can still develop outside the chain before …e6.",
                      children: [
                        {
                          san: "dxe4",
                          main: true,
                          hint: "Release the central tension and make White recapture before developing your bishop.",
                        },
                      ],
                    },
                    {
                      san: "exd5",
                      weight: 1,
                      aside: "If White chooses the Exchange Variation with 3.exd5, recapture 3…cxd5. The structure is symmetrical, but your pieces develop easily and the c-file can become useful.",
                      children: [
                        {
                          san: "cxd5",
                          main: true,
                          hint: "Recapture with the c-pawn and open the c-file for a rook later.",
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
      "Challenge e4 with …d5, get the light bishop outside the chain, then use …e6 and …c5 to attack White's center. You are rarely trying to win quickly; you are trying to reach a structure with no weaknesses and enough pressure that White's extra space becomes something they must defend.",
    pieces:
      "The light bishop goes to f5 or g4 before …e6. The b8-knight often develops to d7, leaving c6 free for the c-pawn's break; the g8-knight heads to f6 or e7 and often finds f5. Rooks belong on c8 and d8 once the central files open. Do not rush the queen — this defense rewards compact coordination.",
    trap: {
      name: "The bishop chase",
      text: "After …Bf5, White may play h4 and threaten h5, followed by g4, to build a pawn cage around your bishop. Autopilot …e6 can leave it with no safe square. Meet the immediate h-pawn rush with …h5 so h7 remains available; against a slower g4 plan, choose the retreat before the net closes.",
    },
    middlegame:
      "Caro–Kann middlegames are sturdy rather than passive. You often trade one pair of pieces, pressure d4 or e5, and enter an endgame with a healthy pawn structure. In the Advance, the position can become sharp if White attacks your bishop, but the strategic compass stays simple: finish development, hit the center, and let solidity become activity.",
  },
};
