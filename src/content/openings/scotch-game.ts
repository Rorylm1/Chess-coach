/**
 * The Scotch Game — curated journey content.
 *
 * You play White. The main line reaches the Schmidt/Mieses structure
 * (1.e4 e5 2.Nf3 Nc6 3.d4 exd4 4.Nxd4 Nf6 5.Nxc6 bxc6), with the
 * Classical variation and a Scotch Four Knights transposition taught as
 * Black deviations. Evals are White-POV centipawns; the generated eval map
 * is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const scotchGame: Opening = {
  slug: "scotch-game",
  name: "Scotch Game",
  eco: "C44–C45",
  learnerSide: "w",
  blurb: "Open the center early, develop with tempo, and make every piece count.",
  idea: "The Scotch challenges Black's e5-pawn on move three instead of building up slowly. Once the center opens, your pieces gain clear routes and the half-open d-file becomes useful immediately. The price is that Black also develops freely, so the opening rewards purposeful play: recapture with a piece, bring the bishops out quickly, and use your small lead in activity before Black completes development.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 18,
      note: "1.e4 claims the center and opens lines for the queen and king's bishop. The Scotch will use that space to challenge Black's center before either side settles into a closed structure.",
      hint: "Take central space and release your king's bishop.",
      children: [
        {
          san: "e5",
          main: true,
          weight: 3,
          evalCp: 22,
          note: "1…e5 meets your central claim directly. Black's pawn is sound for now, but it also gives your g1-knight a natural target.",
          children: [
            {
              san: "Nf3",
              main: true,
              evalCp: 18,
              note: "2.Nf3 develops with tempo by attacking e5. You are preparing to challenge that pawn again with d4.",
              hint: "Develop a knight while putting immediate pressure on e5.",
              children: [
                {
                  san: "Nc6",
                  main: true,
                  evalCp: 22,
                  note: "2…Nc6 defends e5 and develops toward the center. With Black's defender committed, the direct central break now defines the opening.",
                  children: [
                    {
                      san: "d4",
                      main: true,
                      evalCp: 7,
                      note: "3.d4 is the Scotch Game. You challenge e5 at once, clearing the d-file and asking Black to resolve the tension before quietly completing development.",
                      hint: "Strike at Black's central pawn with your other center pawn.",
                      children: [
                        {
                          san: "exd4",
                          main: true,
                          weight: 3,
                          evalCp: 4,
                          note: "3…exd4 accepts the challenge and opens the center. Black has surrendered the e5 strongpoint, so you should restore material with active piece development.",
                          children: [
                            {
                              san: "Nxd4",
                              main: true,
                              evalCp: 6,
                              note: "4.Nxd4 recaptures with a developed piece and places the knight in the center. The open d-file and easy bishop development are the Scotch's practical payoff.",
                              hint: "Recover the pawn with a piece and centralize it at the same time.",
                              children: [
                                {
                                  san: "Nf6",
                                  main: true,
                                  weight: 3,
                                  evalCp: 10,
                                  note: "4…Nf6 is the Schmidt variation. Black attacks e4 and develops rapidly, so White usually clarifies the queenside knight before protecting the pawn.",
                                  children: [
                                    {
                                      san: "Nxc6",
                                      main: true,
                                      evalCp: 5,
                                      note: "5.Nxc6 trades the centralized knight for Black's c6-knight. You give up an active piece to damage Black's pawn structure and make the e5 advance possible next.",
                                      hint: "Exchange the defender on c6 and invite a structural weakness.",
                                      children: [
                                        {
                                          san: "bxc6",
                                          main: true,
                                          evalCp: 15,
                                          note: "5…bxc6 keeps Black's d-pawn free for …d5 but leaves doubled c-pawns. Continue with e5 to gain space and chase the f6-knight, then develop quickly with Bd3, O-O and Nc3. Black has the bishop pair, so activity matters more than trying to win a pawn immediately.",
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  san: "Bc5",
                                  weight: 2,
                                  aside: "If Black develops with 4…Bc5, meet the Classical variation with 5.Be3. You protect the d4-knight, challenge the active bishop, and prepare c3 without blocking your queen's defense of the knight.",
                                  children: [
                                    {
                                      san: "Be3",
                                      main: true,
                                      hint: "Develop while supporting the centralized knight and confronting Black's bishop.",
                                      children: [{ san: "Qf6", main: true }],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          san: "Nf6",
                          weight: 1,
                          aside: "If Black declines the exchange with 3…Nf6, play 4.Nc3. The game transposes to a Scotch Four Knights, where natural development supports your d4 center and keeps the position harmonious.",
                          children: [
                            {
                              san: "Nc3",
                              main: true,
                              hint: "Support the center by developing your other knight.",
                              children: [{ san: "Bb4", main: true }],
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

  panels: {
    plans:
      "Open the center with d4, recapture with the f3-knight, and develop the bishops before hunting for tactics. In the 4…Nf6 line, Nxc6 followed by e5 gains space and gives Black doubled c-pawns to target. Against 4…Bc5, stabilize the d4-knight with Be3 or c3 and finish development rather than trying to hold every tempo.",
    pieces:
      "The f3-knight belongs in the center on d4 until exchanging on c6 becomes useful. The light-squared bishop often goes to e3 to challenge …Bc5, while the other bishop develops actively to d3 or c4. Rooks enjoy the open d- and e-files, and the b1-knight usually comes to c3 once it will not obstruct the c-pawn.",
    trap: {
      name: "The …Qf6 fork",
      text: "After 4.Nxd4 Bc5, rushing into 5.Nxc6? allows 5…Qf6! Black attacks the knight on c6 while threatening …Qxf2 mate, so White cannot save everything comfortably. Play 5.Be3 first: it develops, reinforces d4, and challenges the bishop. In open positions, check the forcing reply before grabbing a structural prize.",
    },
    middlegame:
      "Expect open files, quick development and concrete play rather than a slow pawn-chain battle. In the Mieses structure, White uses the space-gaining e5 push and Black aims for …d5, the bishop pair and pressure along the b-file. If the structure stays symmetrical, your lead in development is temporary, so activate the rooks and bishops before launching a pawn attack.",
  },
};
