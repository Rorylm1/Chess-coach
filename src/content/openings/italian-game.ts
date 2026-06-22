/**
 * The Italian Game — curated journey content (M5 vertical slice).
 *
 * You play White. Main line is the Giuoco Pianissimo (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5
 * 4.c3 Nf6 5.d3), with taught deviations at Black's choice points so the drill bot can
 * "try different things" inside lines the read-through covered. Coach notes are in the
 * playful-mentor voice; evals are White-POV centipawns (provisional — the build step
 * refines them from Lichess cloud eval). Every line is legality-checked in tests.
 */

import type { Opening } from "@/lib/openings/tree";

export const italianGame: Opening = {
  slug: "italian-game",
  name: "Italian Game",
  eco: "C50–C54",
  learnerSide: "w",
  blurb: "The classic open game — fast development and an old-fashioned glare at f7.",
  idea: "The Italian is the friendliest way to start a game of chess: put a pawn in the center, develop your knight and bishop to their most natural squares, and point everything at f7 — the one square only the enemy king defends. It teaches the core opening values (rapid development, central control, king safety) better than almost anything else, which is exactly why it's been played for five centuries.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 20,
      note: "We open with 1.e4 — straight into the center, and in one stroke it frees both the queen and the light-squared bishop. The Italian is all about fast, natural development.",
      hint: "Start in the middle — the move that opens lines for both your bishop and your queen at once.",
      children: [
        {
          san: "e5",
          main: true,
          evalCp: 20,
          note: "Black mirrors with 1…e5, staking an equal claim in the center. From here the real question is who develops faster and more purposefully.",
          children: [
            {
              san: "Nf3",
              main: true,
              evalCp: 25,
              note: "2.Nf3 develops a piece and attacks the e5-pawn — a free tempo. It's always nice when a developing move arrives with a threat attached.",
              hint: "Develop a piece that also pokes at Black's central pawn.",
              children: [
                {
                  san: "Nc6",
                  main: true,
                  evalCp: 20,
                  note: "2…Nc6 defends e5 and develops in turn. Both sides are simply bringing pieces out — textbook chess so far.",
                  children: [
                    {
                      san: "Bc4",
                      main: true,
                      evalCp: 30,
                      note: "3.Bc4 is the move that names the opening — the Italian bishop, aimed straight down the diagonal at f7, the square only Black's king defends. This bishop is the soul of the Italian.",
                      hint: "Develop your bishop to its best diagonal — the one pointing at Black's most sensitive square, f7.",
                      children: [
                        // ── Black's choice point: Giuoco Piano vs Two Knights vs Hungarian ──
                        {
                          san: "Bc5",
                          main: true,
                          weight: 3,
                          evalCp: 25,
                          note: "3…Bc5 mirrors you — this is the Giuoco Piano, the \"quiet game\". Both bishops eye the enemy's weak f-pawn, and the tension is set.",
                          children: [
                            {
                              san: "c3",
                              main: true,
                              evalCp: 35,
                              note: "4.c3 looks modest, but it prepares the big idea — d4, building a broad pawn center — and clears c2 as a future bolt-hole for the bishop.",
                              hint: "A quiet pawn move that prepares to claim the center with d4 next.",
                              children: [
                                {
                                  san: "Nf6",
                                  main: true,
                                  weight: 3,
                                  evalCp: 25,
                                  note: "4…Nf6 develops with a hit on your e4-pawn, keeping pace and asking how you intend to support the center.",
                                  children: [
                                    {
                                      san: "d3",
                                      main: true,
                                      evalCp: 30,
                                      note: "5.d3 — the modern, patient choice (the Giuoco Pianissimo, \"very quiet\"). You shore up e4 and plan a slow buildup: Nbd2, castle, and a well-timed d4 once everything is in place. You've reached a healthy Italian — well done.",
                                      hint: "Quietly defend your e4-pawn and keep the position rock-solid — there's no rush here.",
                                    },
                                  ],
                                },
                                {
                                  san: "d6",
                                  weight: 1,
                                  aside: "If the bot props up its center with 4…d6 instead, just carry on with the plan: 5.d4, striking the center while you're the better-developed side.",
                                  children: [
                                    {
                                      san: "d4",
                                      main: true,
                                      hint: "It played passively — strike in the center while you're ahead in development.",
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          san: "Nf6",
                          weight: 2,
                          aside: "If instead the bot plays 3…Nf6 — the sharp Two Knights Defense — stay calm with 4.d3, keeping a solid grip rather than charging in with the tricky 4.Ng5.",
                          children: [
                            {
                              san: "d3",
                              main: true,
                              hint: "Keep it solid — defend e4 and sidestep the wild complications.",
                              children: [{ san: "Bc5", main: true }],
                            },
                          ],
                        },
                        {
                          san: "Be7",
                          weight: 1,
                          aside: "If the bot tucks the bishop away with 3…Be7 — the passive Hungarian Defense — punish the timidity by grabbing the center with 4.d4.",
                          children: [
                            {
                              san: "d4",
                              main: true,
                              hint: "It played passively — seize the whole center at once.",
                              children: [
                                {
                                  san: "exd4",
                                  main: true,
                                  children: [
                                    {
                                      san: "Nxd4",
                                      main: true,
                                      hint: "Recapture and enjoy your big, free center.",
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
      ],
    },
  ],

  panels: {
    plans:
      "White wants quick development, pressure on f7, and a well-timed d4 to expand in the center. Black wants to finish developing safely, contest the center, and free the game with a later …d5 if you ever let the tension slacken.",
    pieces:
      "The light-squared bishop is the star — it belongs on c4, raking the diagonal into f7. Knights are natural on f3 and d2 (the f3-knight guards e5; the d2-knight reroutes via f1 to g3). Castle kingside early and swing a rook to e1.",
    trap: {
      name: "The Fried Liver Attack",
      text: "After the Two Knights (3…Nf6), the greedy 4.Ng5 d5 5.exd5 Nxd5?! 6.Nxf7!? sacrifices a knight to drag Black's king into the open for a ferocious attack. It's the Italian's most famous ambush — thrilling but double-edged, so our journey sticks to the calm 4.d3.",
    },
    middlegame:
      "From the Pianissimo you get a slow-burn middlegame: maneuver the b1-knight to g3, castle, and prepare d4 to blast lines open once your pieces are home. Think patient buildup, not early fireworks — the attack arrives when everyone has arrived.",
  },
};
