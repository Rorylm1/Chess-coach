/**
 * The Sicilian Defense — curated journey content (M5).
 *
 * You play Black. Main line is the Open Sicilian (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6
 * 5.Nc3), with White's big second-move fork taught as deviations: the Alapin (2.c3) and
 * the Closed (2.Nc3), plus the Moscow (3.Bb5+). Evals are White-POV centipawns
 * (provisional — the build step refines them). Every line is legality-checked in tests.
 */

import type { Opening } from "@/lib/openings/tree";

export const sicilianDefense: Opening = {
  slug: "sicilian-defense",
  name: "Sicilian Defense",
  eco: "B20–B99",
  learnerSide: "b",
  blurb: "Chess's most popular fighting reply to 1.e4 — counterattack, not symmetry.",
  idea: "The Sicilian is the most popular and most combative answer to 1.e4. Instead of mirroring White with 1…e5, you stake a claim on the center from the side with 1…c5 — refusing symmetry and playing for a win with the black pieces. You trade a wing pawn for White's central d-pawn, get a half-open c-file aimed at the white queenside, and invite a sharp, double-edged race. It's not for the faint-hearted, and that's exactly the point.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 20,
      note: "White opens 1.e4, grabbing the center. Rather than meet it head-on, the Sicilian answers asymmetrically — and the most ambitious black opening begins.",
      children: [
        {
          san: "c5",
          main: true,
          evalCp: 25,
          note: "1…c5 — the Sicilian. You attack the d4-square from the flank, steering the game into rich, unbalanced positions where Black plays for the full point, not just equality.",
          hint: "Answer 1.e4 from the wing — fight for d4 without mirroring.",
          children: [
            {
              san: "Nf3",
              main: true,
              weight: 3,
              evalCp: 25,
              note: "2.Nf3 develops and prepares the central break d4 — this is the gateway to the Open Sicilian, the main battlefield.",
              children: [
                {
                  san: "d6",
                  main: true,
                  evalCp: 30,
                  note: "2…d6 is flexible and solid: it supports a future …e5 or …e6 and keeps your options open between the great Sicilian systems.",
                  hint: "A flexible pawn move that supports the center and keeps your setups open.",
                  children: [
                    {
                      san: "d4",
                      main: true,
                      weight: 3,
                      evalCp: 25,
                      note: "3.d4 strikes in the center, inviting the trade that defines the Open Sicilian.",
                      children: [
                        {
                          san: "cxd4",
                          main: true,
                          evalCp: 25,
                          note: "3…cxd4 makes the key Sicilian trade — your wing pawn for White's center pawn. You get a central majority and the half-open c-file.",
                          hint: "Take in the center — trade your flank pawn for White's central one.",
                          children: [
                            {
                              san: "Nxd4",
                              main: true,
                              evalCp: 30,
                              note: "4.Nxd4 recaptures, and White enjoys a lead in development and central space — the price you pay for your structural trumps.",
                              children: [
                                {
                                  san: "Nf6",
                                  main: true,
                                  evalCp: 25,
                                  note: "4…Nf6 develops with a hit on e4, forcing White to defend the center.",
                                  hint: "Develop a knight that also attacks White's e4-pawn.",
                                  children: [
                                    {
                                      san: "Nc3",
                                      main: true,
                                      evalCp: 30,
                                      note: "5.Nc3 defends e4 and develops. You've reached the great crossroads of the Open Sicilian — the Najdorf, Dragon, and Scheveningen all branch from here. A fighting position, exactly what you wanted.",
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
                      san: "Bb5+",
                      weight: 1,
                      aside: "If White avoids the Open with 3.Bb5+ — the quieter Moscow Variation — block the check with 3…Bd7 and offer to trade White's good bishop.",
                      children: [
                        {
                          san: "Bd7",
                          main: true,
                          hint: "Block the check with a piece, not a pawn — and offer a trade.",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              san: "c3",
              weight: 2,
              aside: "If White plays the Alapin with 2.c3 (planning d4 with a big center), strike at once with 2…d5 — because c3 has taken away the knight's defense of e4, you can challenge the center immediately.",
              children: [
                {
                  san: "d5",
                  main: true,
                  hint: "c3 blocked White's knight — hit the center directly before it's built.",
                },
              ],
            },
            {
              san: "Nc3",
              weight: 1,
              aside: "If White chooses the Closed Sicilian with 2.Nc3, just develop naturally with 2…Nc6 and prepare …g6 and a kingside fianchetto — there's no rush.",
              children: [
                {
                  san: "Nc6",
                  main: true,
                  hint: "Develop a knight to its natural square and prepare a calm setup.",
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
      "You trade a flank pawn for White's central d-pawn, ending up with a central majority and a half-open c-file aimed at White's queenside. You're playing for the initiative, not equality. White gets a lead in development and kingside attacking chances in return — most Sicilians are a race between opposite-wing attacks.",
    pieces:
      "The half-open c-file is your highway: a rook belongs on c8. The f6-knight pressures e4; …a6 and …e5 or …e6 shape your structure (Najdorf, Scheveningen). The dark-squared bishop goes to e7, or fianchettoes to g7 in the Dragon. Castle short and counterpunch.",
    trap: {
      name: "The Magnus Smith Trap",
      text: "A warning for Dragon players: after a careless early …g6, White's Bc4 plus a timely Nxc6 and e5 can fork the long diagonal and win material. The fix is move-order care — …Bg7 and …O-O before inviting Bc4. In the Sicilian, knowing the tactic is the difference between a winning counterattack and a lost king.",
    },
    middlegame:
      "Opposite-side attacks define the Sicilian: White storms one wing (often with f4–f5 and a pawn or piece sacrifice) while you blast the other with …b5–b4 and a rook down the c-file. Tempo is everything — count the race and never get distracted from your queenside play.",
  },
};
