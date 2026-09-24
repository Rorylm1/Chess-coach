/**
 * The London System — curated journey content.
 *
 * You play White. The main line builds the classical London shell
 * (1.d4 d5 2.Nf3 Nf6 3.Bf4 e6 4.e3 Bd6 5.Bg3 O-O), with an Indian
 * move order and Black's early ...c5 challenge taught as deviations.
 * Evals are White-POV centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const londonSystem: Opening = {
  slug: "london-system",
  name: "London System",
  eco: "D02",
  learnerSide: "w",
  blurb: "Build a dependable setup, then turn quiet development into a kingside attack.",
  idea: "The London is a system rather than a forcing sequence: develop the dark-squared bishop before playing e3, support the center with c3, and aim the bishops toward Black's king. Its familiar setup is useful, but the real lesson is to watch Black's pawn breaks. Meet an early …c5 actively, keep the d4-pawn secure, and use Ne5 or e4 when your pieces are ready to leave the shell.",

  root: [
    {
      san: "d4",
      main: true,
      evalCp: 20,
      note: "1.d4 claims e5 and c5 while opening the diagonal for your c1-bishop. In the London, that bishop is coming outside the pawn chain before e3 closes the door.",
      hint: "Start with the queen's pawn and reserve an active square for the c1-bishop.",
      children: [
        {
          san: "d5",
          main: true,
          weight: 3,
          evalCp: 20,
          note: "1…d5 matches your central claim. Black has built a sound center, so your plan is development with pressure rather than an immediate pawn confrontation.",
          children: [
            {
              san: "Nf3",
              main: true,
              evalCp: 15,
              note: "2.Nf3 develops, protects d4, and prevents …e5. It also keeps the b1-knight free for its usual London route through d2.",
              hint: "Develop the kingside knight and reinforce your central pawn.",
              children: [
                {
                  san: "Nf6",
                  main: true,
                  evalCp: 20,
                  note: "2…Nf6 develops toward the center and increases Black's control of e4. Now is the moment to place your signature bishop before playing e3.",
                  children: [
                    {
                      san: "Bf4",
                      main: true,
                      evalCp: 20,
                      note: "3.Bf4 defines the London System. The bishop escapes the pawn chain, eyes c7, and helps build a future Bd3–Qe2 battery toward Black's king.",
                      hint: "Bring the dark-squared bishop outside the pawn chain while the diagonal is open.",
                      children: [
                        {
                          san: "e6",
                          main: true,
                          weight: 3,
                          evalCp: 20,
                          note: "3…e6 supports d5 and opens Black's dark-squared bishop. The position is solid on both sides; completing your compact pawn triangle comes next.",
                          children: [
                            {
                              san: "e3",
                              main: true,
                              evalCp: 20,
                              note: "4.e3 supports d4 and releases your light-squared bishop. Because Bf4 came first, both bishops can now develop freely.",
                              hint: "Anchor the center and open a path for the other bishop.",
                              children: [
                                {
                                  san: "Bd6",
                                  main: true,
                                  evalCp: 20,
                                  note: "4…Bd6 challenges your most active bishop. Trading immediately is playable, but keeping the bishop preserves more attacking potential.",
                                  children: [
                                    {
                                      san: "Bg3",
                                      main: true,
                                      evalCp: 20,
                                      note: "5.Bg3 keeps the bishop and invites …Bxg3, when hxg3 would open the h-file toward Black's king. The retreat is active, not timid.",
                                      hint: "Preserve the bishop on the same diagonal and welcome a useful h-file if Black trades.",
                                      children: [
                                        {
                                          san: "O-O",
                                          main: true,
                                          evalCp: 20,
                                          note: "5…O-O brings Black's king to safety. You have reached the classical London shell: continue with Bd3, c3, Nbd2 and O-O, then choose Ne5 or e4 according to Black's setup.",
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
                          san: "c5",
                          weight: 2,
                          aside: "If Black strikes immediately with 3…c5, answer 4.e3. Keep d4 supported, then meet …Nc6 with c3; the setup survives, but stay alert to …Qb6 pressure on b2.",
                          children: [
                            {
                              san: "e3",
                              main: true,
                              hint: "Support d4 and calmly continue the London structure.",
                              children: [
                                {
                                  san: "Nc6",
                                  main: true,
                                  children: [
                                    {
                                      san: "c3",
                                      main: true,
                                      hint: "Build the pawn triangle and give d4 another defender.",
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
          san: "Nf6",
          weight: 2,
          aside: "If Black starts with 1…Nf6, play 2.Nf3 and keep the London flexible. After …g6 or …e6, Bf4, e3 and c3 still build the same useful structure.",
          children: [
            {
              san: "Nf3",
              main: true,
              hint: "Develop and protect d4 without committing the queenside knight.",
              children: [{ san: "g6", main: true }],
            },
          ],
        },
      ],
    },
  ],

  panels: {
    plans:
      "Build the London triangle with d4, e3 and c3, develop with Bf4, Nf3, Bd3 and Nbd2, then castle. From there, Ne5 is the usual outpost and e4 is the freeing break. If Black challenges with …c5 and …Qb6, defend b2 deliberately rather than playing the setup on autopilot.",
    pieces:
      "The dark-squared bishop belongs on f4 or g3, safely outside the e3 pawn chain. The light-squared bishop often goes to d3 to point at h7, the b1-knight usually develops to d2, and the f3-knight can jump to e5. The queen often supports the attack from e2 or c2.",
    trap: {
      name: "The Greek Gift on h7",
      text: "When your bishop sits on d3, knight on f3 or e5, and queen can reach h5, Bxh7+ may drag Black's king into a mating attack. It works only when Ng5+ arrives with support and Black cannot escape through g6 or g8. Treat the pattern as a calculation prompt, not a sacrifice to play automatically.",
    },
    middlegame:
      "Expect a sturdy center followed by a choice of wings. Against a quiet setup, plant a knight on e5 and build with Qe2, Bd3 and f4 for kingside pressure. Against an early …c5, the game becomes more central: protect d4, consider dxc5 or e4, and use the c- and e-files rather than forcing an attack that is not there.",
  },
};
