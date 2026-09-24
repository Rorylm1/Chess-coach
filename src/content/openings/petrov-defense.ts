/**
 * The Petrov Defense — curated journey content.
 *
 * You play Black. The main line is the Classical Attack
 * (1.e4 e5 2.Nf3 Nf6 3.Nxe5 d6 4.Nf3 Nxe4 5.d4 d5 6.Bd3 Be7),
 * with the Steinitz Attack and Three Knights Game taught as White
 * deviations. Evals are White-POV centipawns; the generated eval map is
 * authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const petrovDefense: Opening = {
  slug: "petrov-defense",
  name: "Petrov Defense",
  eco: "C42–C43",
  learnerSide: "b",
  blurb: "Meet the king's knight with your own and counterattack instead of defending.",
  idea: "The Petrov answers 2.Nf3 with 2…Nf6, attacking e4 rather than spending a move protecting e5. If White takes, the precise …d6 move order chases the advanced knight before you recover the pawn. That sequence leads to a sound, nearly symmetrical position, but equality is not automatic: centralize the knight on e4, support it with …d5, finish development, and be ready to give up the outpost when White challenges it.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 18,
      note: "1.e4 claims the center and opens White's queen and king's bishop. The Petrov begins as an open game, so answer in kind before introducing the counterattack.",
      children: [
        {
          san: "e5",
          main: true,
          evalCp: 22,
          note: "1…e5 takes equal central space and gives your pieces natural squares. You are inviting the usual knight attack on this pawn, with a less usual reply prepared.",
          hint: "Match White's central pawn and open lines for your queen and king's bishop.",
          children: [
            {
              san: "Nf3",
              main: true,
              evalCp: 18,
              note: "2.Nf3 develops with tempo by attacking e5. Instead of defending that pawn with …Nc6, the Petrov creates a threat of its own.",
              children: [
                {
                  san: "Nf6",
                  main: true,
                  evalCp: 22,
                  note: "2…Nf6 defines the Petrov Defense. Your knight attacks e4, so if White captures e5 you can restore the material balance — after first inserting one important move.",
                  hint: "Counterattack White's e-pawn with the king's knight instead of defending e5.",
                  children: [
                    {
                      san: "Nxe5",
                      main: true,
                      weight: 3,
                      evalCp: 20,
                      note: "3.Nxe5 is the Classical Variation. White accepts your challenge and takes the pawn, but the knight has stepped onto a square you can attack with tempo.",
                      children: [
                        {
                          san: "d6",
                          main: true,
                          evalCp: 18,
                          note: "3…d6 is the move-order key. Chase the e5-knight first; copying White with the immediate …Nxe4 gives White tactical chances against your exposed knight and king.",
                          hint: "Attack the advanced knight before recovering your own missing center pawn.",
                          children: [
                            {
                              san: "Nf3",
                              main: true,
                              evalCp: 18,
                              note: "4.Nf3 returns the knight to safety. White has gained no material, but has encouraged your d-pawn forward and hopes to use the first move in a balanced position.",
                              children: [
                                {
                                  san: "Nxe4",
                                  main: true,
                                  evalCp: 20,
                                  note: "4…Nxe4 now recovers the pawn safely. Your knight takes an active central post; keep it there while it is useful, but do not waste tempi trying to preserve it at any cost.",
                                  hint: "Now that White's knight has retreated, restore material equality in the center.",
                                  children: [
                                    {
                                      san: "d4",
                                      main: true,
                                      evalCp: 24,
                                      note: "5.d4 is the Classical Attack. White builds a broad center and prepares Bd3, c4, or Re1 to question your e4-knight.",
                                      children: [
                                        {
                                          san: "d5",
                                          main: true,
                                          evalCp: 18,
                                          note: "5…d5 supports the knight and fixes a symmetrical center. This is active equality, not a draw offer: your next jobs are development, castling, and responding cleanly when White attacks e4.",
                                          hint: "Use the d-pawn to secure the centralized knight and claim equal space.",
                                          children: [
                                            {
                                              san: "Bd3",
                                              main: true,
                                              evalCp: 22,
                                              note: "6.Bd3 develops while directly challenging your e4-knight. You can meet that pressure with calm development because the knight is tactically supported by the d5-pawn.",
                                              children: [
                                                {
                                                  san: "Be7",
                                                  main: true,
                                                  evalCp: 18,
                                                  note: "6…Be7 prepares to castle and keeps the position flexible. After O-O, develop with …Nc6 and decide whether the e4-knight should retreat or exchange only when White's c4 or Re1 makes the question concrete.",
                                                  hint: "Develop the bishop, prepare to castle, and resist moving the central knight without a reason.",
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
                        },
                      ],
                    },
                    {
                      san: "d4",
                      weight: 2,
                      aside: "If White plays the Steinitz Attack with 3.d4, take on e4 with 3…Nxe4. After 4.Bd3, answer 4…d5: the same active knight and supported center appear through a different move order.",
                      children: [
                        {
                          san: "Nxe4",
                          main: true,
                          hint: "Accept the central pawn now; White cannot win your e5-pawn without allowing the balance to be restored.",
                          children: [
                            {
                              san: "Bd3",
                              main: true,
                              children: [
                                {
                                  san: "d5",
                                  main: true,
                                  hint: "Support the centralized knight and establish an equal share of the center.",
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      san: "Nc3",
                      weight: 1,
                      aside: "If White chooses 3.Nc3, play 3…Nc6 and transpose to the Four Knights Game. Mirror the healthy development, then choose …Bb4 or …Bc5 according to White's setup rather than forcing a pawn capture.",
                      children: [
                        {
                          san: "Nc6",
                          main: true,
                          hint: "Develop the other knight and accept the sound Four Knights transposition.",
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
      "Counterattack e4 with …Nf6, and if White takes e5, insert …d6 before …Nxe4. In the Classical structure, support the e4-knight with …d5, develop and castle, then meet c4 or Re1 without sentiment: retreat or exchange the knight if that completes your development cleanly. Your aim is active equality with a sound center, not endless symmetry.",
    pieces:
      "The f6-knight is the opening's protagonist: it counterattacks e4, recaptures there, and may later trade on c3 or return to f6. The light-squared bishop usually develops to e7 or d6 before castling; the b8-knight belongs on c6, adding pressure to d4. Put rooks on e8 and d8 as files open, and avoid blocking the c8-bishop without a plan.",
    trap: {
      name: "The copycat knight trap",
      text: "After 1.e4 e5 2.Nf3 Nf6 3.Nxe5, the tempting 3…Nxe4?! copies White one move too soon. Following 4.Qe2, a careless 4…Nf6?? allows 5.Nc6+: the discovered check along the e-file also attacks Black's queen on d8, so the queen is lost. The Petrov's precise cure is simple and thematic: play 3…d6 first, drive the white knight away, and only then take e4.",
    },
    middlegame:
      "Expect an open or semi-open middlegame with a symmetrical pawn skeleton and small, concrete imbalances. White often spends c4 or Re1 to dislodge your e4-knight; in return, those moves define targets and squares for your pieces. Trades are usually comfortable for Black, but passive imitation is not: use the central outpost to finish development, then contest the open files before White's first-move initiative becomes lasting pressure.",
  },
};
