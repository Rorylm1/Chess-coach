/**
 * The Vienna Game — curated journey content.
 *
 * You play White. The main line reaches the Vienna Gambit, Breyer Variation
 * (1.e4 e5 2.Nc3 Nf6 3.f4 d5 4.fxe5 Nxe4 5.Nf3 Be7), with the Max Lange
 * Defense and an early gambit acceptance taught as Black deviations. Evals
 * are White-POV centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const viennaGame: Opening = {
  slug: "vienna-game",
  name: "Vienna Game",
  eco: "C25–C29",
  learnerSide: "w",
  blurb: "Develop first, then launch the f-pawn with your center already reinforced.",
  idea: "The Vienna develops the queen's knight before the king's knight, keeping f-pawn freedom for a delayed gambit. Against …Nf6, f4 creates immediate attacking chances without abandoning e4; against quieter setups, you can bring the bishop to c4 and play a normal open game. The key is not to attack on autopilot: if Black counters with …d5, answer in the center, develop quickly, and let open lines — not an exposed king — power your initiative.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 18,
      note: "1.e4 claims the center and opens the queen and king's bishop. The Vienna begins as an open game, but keeps one important choice in reserve: your f-pawn may still advance.",
      hint: "Take central space and release your king's bishop.",
      children: [
        {
          san: "e5",
          main: true,
          weight: 3,
          evalCp: 22,
          note: "1…e5 meets your center symmetrically. Instead of attacking that pawn with the usual king's knight, the Vienna develops the other knight first.",
          children: [
            {
              san: "Nc3",
              main: true,
              evalCp: 8,
              note: "2.Nc3 defines the Vienna Game. The knight supports e4, controls d5, and leaves the g1-knight uncommitted so the f-pawn can advance before that knight develops.",
              hint: "Develop the queen's knight and reinforce e4 before deciding where the other knight belongs.",
              children: [
                {
                  san: "Nf6",
                  main: true,
                  weight: 3,
                  evalCp: 3,
                  note: "2…Nf6 attacks e4 and is Black's most direct reply. Because your c3-knight already protects the pawn, you can turn that spare tempo into kingside space.",
                  children: [
                    {
                      san: "f4",
                      main: true,
                      evalCp: 5,
                      note: "3.f4 is the Vienna Gambit. You challenge e5 and open the f-file, betting on fast development and central control rather than trying to keep a perfect pawn shield.",
                      hint: "Use the pawn that your move order deliberately left free to challenge Black's center.",
                      children: [
                        {
                          san: "d5",
                          main: true,
                          weight: 3,
                          evalCp: 0,
                          note: "3…d5 is Black's principled counterstrike. Instead of clinging to e5 or grabbing on f4, Black attacks your center while your king is still in the middle.",
                          children: [
                            {
                              san: "fxe5",
                              main: true,
                              evalCp: 4,
                              note: "4.fxe5 accepts the central challenge and attacks the f6-knight. The pawn will not remain on e5 forever, but exchanging it opens the f-file and draws Black's knight into the center.",
                              hint: "Capture toward the center and make the attacked knight respond.",
                              children: [
                                {
                                  san: "Nxe4",
                                  main: true,
                                  weight: 3,
                                  evalCp: 0,
                                  note: "4…Nxe4 removes your e-pawn and plants a knight on an active central square. The position is balanced but sharp: chasing the knight too soon only helps Black, so development comes first.",
                                  children: [
                                    {
                                      san: "Nf3",
                                      main: true,
                                      evalCp: 3,
                                      note: "5.Nf3 is the calm move in a tactical position. You develop, prepare to castle, control g5 and d4, and avoid weakening your king merely to question the e4-knight.",
                                      hint: "Bring out your remaining knight and prepare to castle instead of chasing Black's centralized knight.",
                                      children: [
                                        {
                                          san: "Be7",
                                          main: true,
                                          evalCp: 0,
                                          note: "5…Be7 reaches the Breyer Variation. Black prepares to castle and calmly supports the position; continue with d4 or Qe2, develop the bishop to d3, and castle. Your compensation is activity and an open f-file, not a quick forced win.",
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
                          san: "exf4",
                          weight: 1,
                          aside: "If Black accepts with 3…exf4, answer 4.e5. Your central pawn chases the f6-knight and wins time to recover the gambit pawn; this is why Black normally counterstrikes with …d5 instead.",
                          children: [
                            {
                              san: "e5",
                              main: true,
                              hint: "Advance the supported center pawn with tempo on Black's knight.",
                              children: [{ san: "Ng8", main: true }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  san: "Nc6",
                  weight: 2,
                  aside: "If Black develops with 2…Nc6, choose the quieter 3.Bc4. You aim at f7, prepare d3 and Nf3, and keep the option of f4 without forcing a risky gambit against a well-defended center.",
                  children: [
                    {
                      san: "Bc4",
                      main: true,
                      hint: "Develop the bishop toward Black's sensitive f7-square.",
                      children: [{ san: "Nf6", main: true }],
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
      "Against …Nf6, use f4 to challenge e5, but meet …d5 in the center rather than launching a premature kingside rush. Develop with Nf3, d4 or Qe2, Bd3 and O-O; then use the open f-file and your space. Against …Nc6, Bc4 and d3 give you a flexible open-game setup before you decide whether f4 is safe.",
    pieces:
      "The c3-knight is the Vienna's anchor: it protects e4 and controls d5 before the attack begins. The g1-knight usually comes to f3 after the f-pawn advances, the light-squared bishop points from c4 or d3 toward the kingside, and the f1-rook becomes useful quickly once castling places it on the opened f-file.",
    trap: {
      name: "The Würzburger sting",
      text: "After 3.f4 d5 4.fxe5 Nxe4, the natural-looking 5.d3 invites 5…Qh4+ and a forcing tangle after 6.g3 Nxg3. White can survive with accurate play, but the rook on h1 and exposed king make every move concrete. The practical cure is the journey move 5.Nf3: develop, cover h4, and make Black prove the centralized knight belongs on e4.",
    },
    middlegame:
      "Expect an open, tactical middlegame in which development outranks pawn counting. In the main gambit line, Black enjoys the e4 outpost while White gets open files, active bishops and chances to build a strong d4 center. If Black chooses …Nc6 instead, the game is calmer and resembles an Italian setup with an extra option to expand by f4.",
  },
};
