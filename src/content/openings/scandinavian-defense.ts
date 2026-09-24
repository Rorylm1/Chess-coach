/**
 * The Scandinavian Defense — curated journey content.
 *
 * You play Black. The main line is the classical 3...Qa5 variation
 * (1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.d4 Nf6 5.Nf3 c6 6.Bc4 Bf5),
 * with the Tennison-style 2.Nf3 gambit and a quieter 4.Nf3 move order
 * taught as White deviations. Evals are White-POV centipawns; the
 * generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const scandinavianDefense: Opening = {
  slug: "scandinavian-defense",
  name: "Scandinavian Defense",
  eco: "B01",
  learnerSide: "b",
  blurb: "Challenge 1.e4 immediately, then build a compact position with every piece finding a clear square.",
  idea: "The Scandinavian answers 1.e4 with the immediate 1…d5, asking White to resolve the center before either side has developed a piece. After the usual exchange, Black accepts one queen tempo with …Qxd5 and …Qa5 in return for a simple position: develop with …Nf6, reinforce the center with …c6, bring the light-squared bishop outside the pawn chain, then play …e6 and castle. White keeps a little more space, but your pawn structure is sound and your plan is visible from move one.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 18,
      note: "1.e4 takes central space and opens lines for White's queen and king's bishop. The Scandinavian refuses to mirror it and challenges the pawn at once.",
      children: [
        {
          san: "d5",
          main: true,
          evalCp: 36,
          note: "1…d5 defines the Scandinavian Defense. You attack e4 before developing, making White decide whether to exchange, advance, or support the pawn.",
          hint: "Strike directly at White's e-pawn with your queen pawn.",
          children: [
            {
              san: "exd5",
              main: true,
              weight: 4,
              evalCp: 32,
              note: "2.exd5 is White's principled and most common reply. White removes your central pawn and expects to gain time when your queen recaptures.",
              children: [
                {
                  san: "Qxd5",
                  main: true,
                  evalCp: 48,
                  note: "2…Qxd5 restores material immediately. The queen will be attacked, but its next move is part of the opening plan rather than a disaster: one lost tempo buys you a clean, forcing route into familiar structures.",
                  hint: "Recover the pawn now with the piece that can reach d5.",
                  children: [
                    {
                      san: "Nc3",
                      main: true,
                      weight: 3,
                      evalCp: 46,
                      note: "3.Nc3 develops with tempo against your queen. White gains the expected move, so choose a useful queen square and then stop moving her unless the position demands it.",
                      children: [
                        {
                          san: "Qa5",
                          main: true,
                          evalCp: 52,
                          note: "3…Qa5 is the classical retreat. The queen stays active, eyes c3 and a2, and leaves d8 free for a rook later. Her job now is to stand still while the minor pieces catch up.",
                          hint: "Keep the queen active on the edge, where she pressures c3 without blocking development.",
                          children: [
                            {
                              san: "d4",
                              main: true,
                              weight: 3,
                              evalCp: 48,
                              note: "4.d4 builds White's ideal pawn center. Do not try to tear it down immediately; develop against it and prepare the restrained …c6 and …e6 shell.",
                              children: [
                                {
                                  san: "Nf6",
                                  main: true,
                                  evalCp: 54,
                                  note: "4…Nf6 develops toward the center and attacks e4. The knight also clears g8, bringing you one step closer to castling while White's king is still in the middle.",
                                  hint: "Develop the king's knight to pressure White's center and prepare to castle.",
                                  children: [
                                    {
                                      san: "Nf3",
                                      main: true,
                                      evalCp: 48,
                                      note: "5.Nf3 protects e5 and helps White castle. White has a little more room, but there is no direct threat; continue assembling your compact setup.",
                                      children: [
                                        {
                                          san: "c6",
                                          main: true,
                                          evalCp: 55,
                                          note: "5…c6 gives the queen a retreat to c7 or d8, controls b5, and supports a later …e6 without abandoning d5. This modest move is the backbone of the classical Scandinavian structure.",
                                          hint: "Build the compact pawn shell and give your queen an escape route.",
                                          children: [
                                            {
                                              san: "Bc4",
                                              main: true,
                                              evalCp: 50,
                                              note: "6.Bc4 develops actively toward f7 before Black has castled. The bishop looks menacing, but your position is ready for another developing move with tempo and purpose.",
                                              children: [
                                                {
                                                  san: "Bf5",
                                                  main: true,
                                                  evalCp: 56,
                                                  note: "6…Bf5 develops the light-squared bishop before …e6 shuts it in. Next play …e6, …Nbd7, and …Be7 or …Bb4, then castle. You have conceded a little space, not a weakness: the position is sturdy and every remaining piece has a natural route.",
                                                  hint: "Bring the queen's bishop outside the pawn chain before playing …e6.",
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
                            {
                              san: "Nf3",
                              weight: 1,
                              aside: "If White develops with 4.Nf3 before playing d4, answer 4…Nf6. You keep the same setup and can meet d4 with …c6; do not invent a queen adventure just because White changed the move order.",
                              children: [
                                {
                                  san: "Nf6",
                                  main: true,
                                  hint: "Develop normally and keep aiming for the familiar …c6, …Bf5, and …e6 shell.",
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
            {
              san: "Nf3",
              weight: 1,
              aside: "If White offers the Tennison-style gambit with 2.Nf3, accept with 2…dxe4, but remember the trap: after 3.Ng5 Nf6 4.d3 exd3 5.Bxd3, the natural 5…e6 is safer than the greedy-looking …h6, which can expose your queen through a sacrifice on f7.",
              children: [
                {
                  san: "dxe4",
                  main: true,
                  hint: "Accept the loose e-pawn, then meet the knight jump with calm development rather than pawn chasing.",
                  children: [
                    {
                      san: "Ng5",
                      main: true,
                      children: [
                        {
                          san: "Nf6",
                          main: true,
                          hint: "Develop a knight, guard h7, and make White prove the gambit.",
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
      "Challenge e4 with …d5 and, after exd5, use …Qxd5 and …Qa5 to recover the pawn while keeping the queen useful. Then stop spending tempi on her: play …Nf6, …c6, develop the light bishop to f5 or g4 before …e6, and finish with …Nbd7, …Be7, and castling. Later, pressure White's d4-pawn with rooks on d8 and central breaks such as …c5 when they are properly prepared.",
    pieces:
      "The c8-bishop is your priority piece: bring it to f5 or g4 before …e6 closes the diagonal. The g8-knight belongs on f6, while the b8-knight usually develops to d7 because c6 is occupied by a pawn. The queen starts actively on a5 but should retreat to c7 or d8 if chased. Rooks then use d8 and e8, aiming at White's central pawns rather than launching a premature wing attack.",
    trap: {
      name: "The Tennison f7 decoy",
      text: "After 1.e4 d5 2.Nf3 dxe4 3.Ng5 Nf6 4.d3 exd3 5.Bxd3, 5…h6? walks into White's point: 6.Nxf7 Kxf7 7.Bg6+! Kxg6 8.Qxd8, and Black's queen disappears. The cure is practical rather than flashy: play 5…e6, cover the vulnerable diagonal, develop, and make White justify the sacrificed pawn.",
    },
    middlegame:
      "The classical Scandinavian often becomes a Caro-Kann-like middlegame with black pawns on c6 and e6 against White's e4–d4 center. White has more space and may try Ne5, Bf4, or queenside expansion to bother the a5-queen; Black has a durable structure and clear targets. Exchange a pair of active white pieces when convenient, contest the d-file, and time …c5 or …e5 only after development is complete.",
  },
};
