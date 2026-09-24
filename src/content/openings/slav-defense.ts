/**
 * The Slav Defense - curated journey content.
 *
 * You play Black. The main line is the Classical Slav
 * (1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5 6.e3 e6),
 * with the Exchange Slav and the Quiet Slav taught as White deviations.
 * Evals are White-POV centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const slavDefense: Opening = {
  slug: "slav-defense",
  name: "Slav Defense",
  eco: "D10-D19",
  learnerSide: "b",
  blurb: "Hold the center without burying your queen's bishop, then finish development behind a sturdy pawn shell.",
  idea: "The Slav meets the Queen's Gambit with 2...c6, supporting d5 while leaving the light-squared bishop free. That small move-order detail is the opening's whole character: develop calmly, use ...dxc4 when it buys time for ...Bf5, and only then close the center with ...e6. White will usually recover the c4-pawn, but Black reaches a sound position with the traditional problem bishop already active and clear breaks with ...c5 or ...e5 to aim for.",

  root: [
    {
      san: "d4",
      main: true,
      evalCp: 20,
      note: "1.d4 claims central space and opens White's c1-bishop. The Slav answers symmetrically before choosing a distinctive way to support the center.",
      children: [
        {
          san: "d5",
          main: true,
          evalCp: 27,
          note: "1...d5 meets White's center head-on and keeps the position classical. If White offers the c-pawn, you will defend this point without trapping your light-squared bishop.",
          hint: "Match White's central pawn and take a firm share of the center.",
          children: [
            {
              san: "c4",
              main: true,
              weight: 4,
              evalCp: 24,
              note: "2.c4 offers the Queen's Gambit, attacking d5 and asking how Black intends to maintain the center.",
              children: [
                {
                  san: "c6",
                  main: true,
                  evalCp: 31,
                  note: "2...c6 defines the Slav. The c-pawn reinforces d5 while the e-pawn stays home, so the c8-bishop still has a clear road to f5 or g4.",
                  hint: "Support d5 with the pawn that leaves your light-squared bishop free.",
                  children: [
                    {
                      san: "Nf3",
                      main: true,
                      weight: 3,
                      evalCp: 25,
                      note: "3.Nf3 develops, controls e5, and keeps White flexible. Black should answer with equally useful development rather than rush the bishop out too soon.",
                      children: [
                        {
                          san: "Nf6",
                          main: true,
                          evalCp: 31,
                          note: "3...Nf6 develops toward the center and adds control over e4. More subtly, it waits to see White's setup before deciding when ...Bf5 is safe.",
                          hint: "Develop the king's knight and increase your control of e4.",
                          children: [
                            {
                              san: "Nc3",
                              main: true,
                              weight: 3,
                              evalCp: 28,
                              note: "4.Nc3 brings another piece into the fight for d5 and e4. Now the direct bishop sortie can allow a nasty Qb3 double attack, so first change the center.",
                              children: [
                                {
                                  san: "dxc4",
                                  main: true,
                                  evalCp: 35,
                                  note: "4...dxc4 is the characteristic Classical Slav decision. You are not trying to keep the pawn forever; removing the c-pawn frees the d5-square and makes ...Bf5 possible without the same cxd5 and Qb3 pressure.",
                                  hint: "Release the central tension and temporarily accept the gambit pawn before developing your bishop.",
                                  children: [
                                    {
                                      san: "a4",
                                      main: true,
                                      evalCp: 29,
                                      note: "5.a4 stops ...b5 from securely holding the c4-pawn. White intends e3 and Bxc4, so use the gained tempo to solve your opening's key piece.",
                                      children: [
                                        {
                                          san: "Bf5",
                                          main: true,
                                          evalCp: 35,
                                          note: "5...Bf5 is the Slav's payoff. The light-squared bishop develops actively outside the future e6-pawn chain, watches e4, and leaves Black ready to build a compact position.",
                                          hint: "Develop the light-squared bishop outside the pawn chain while you still can.",
                                          children: [
                                            {
                                              san: "e3",
                                              main: true,
                                              evalCp: 31,
                                              note: "6.e3 opens the diagonal for White to recover the c4-pawn. Black should now secure the center and prepare smooth kingside development.",
                                              children: [
                                                {
                                                  san: "e6",
                                                  main: true,
                                                  evalCp: 37,
                                                  note: "6...e6 completes the Slav structure only after the bishop is safely outside it. Continue with ...Bb4, ...Nbd7, and castling; when development is complete, the freeing ...c5 or ...e5 break is your route to equality.",
                                                  hint: "Now that the bishop is active, reinforce d5 and open the way to develop your dark-squared bishop.",
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
                              san: "e3",
                              weight: 1,
                              aside: "If White chooses the Quiet Slav with 4.e3, develop 4...Bf5. Because White has committed the c1-bishop behind the e3-pawn, the immediate Qb3 pressure is less dangerous; follow with ...e6 and natural development.",
                              children: [
                                {
                                  san: "Bf5",
                                  main: true,
                                  hint: "Use the quiet move order to place your light-squared bishop actively before playing ...e6.",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      san: "cxd5",
                      weight: 1,
                      aside: "If White exchanges immediately with 3.cxd5, answer 3...cxd5. The position becomes symmetrical, so develop actively with ...Nf6, ...Nc6, and ...Bf5 rather than trying to manufacture tactics.",
                      children: [
                        {
                          san: "cxd5",
                          main: true,
                          hint: "Recapture with the c-pawn to restore your central pawn and keep the e-file pawn flexible.",
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
      "Support d5 with ...c6, develop ...Nf6, and time ...dxc4 so the light-squared bishop can escape to f5 before ...e6. Do not cling to the c4-pawn at the cost of development. Once castled, challenge White's center with ...c5 or ...e5; in quieter structures, use the c-file and queenside minority play instead of forcing a kingside attack.",
    pieces:
      "The c8-bishop is the opening's star and usually belongs on f5, sometimes g4. The g8-knight goes to f6; the b8-knight often develops to d7 because c6 is occupied, though it can reach c6 after the c-pawn exchanges. The dark-squared bishop uses e7 or b4, the queen often supports from c7, and the rooks belong on c8 and d8 behind the central breaks.",
    trap: {
      name: "The premature-bishop Qb3 fork",
      text: "Do not assume ...Bf5 is automatic. After 1.d4 d5 2.c4 c6 3.Nc3 Bf5?! 4.cxd5 cxd5 5.Qb3, White attacks both b7 and d5, and Black cannot comfortably save everything. The main line avoids this move-order sting with ...Nf6 and then ...dxc4 before ...Bf5. In the Slav, freeing the bishop matters, but timing matters more.",
    },
    middlegame:
      "Classical Slav middlegames are sound rather than passive. White usually regains c4 and may use a queenside space edge; Black has a compact c6-e6 shell, an active light-squared bishop, and few weaknesses. Complete development before breaking with ...c5 or ...e5, contest the open d- and c-files, and welcome sensible exchanges when they leave your structure easier to play.",
  },
};
