/**
 * The Ruy Lopez — curated journey content.
 *
 * You play White. The main line introduces the Morphy Defense
 * (1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7), with the Berlin and
 * Steinitz defenses taught as Black deviations. Evals are White-POV centipawns;
 * the generated eval map is authoritative. Every line is legality-tested.
 */

import type { Opening } from "@/lib/openings/tree";

export const ruyLopez: Opening = {
  slug: "ruy-lopez",
  name: "Ruy Lopez",
  eco: "C60–C99",
  learnerSide: "w",
  blurb: "The Spanish classic — pressure e5, preserve the bishop, and build before you break.",
  idea: "The Ruy Lopez starts like the Italian, then asks a deeper question. By playing Bb5, you pressure the knight that protects e5 and make Black spend time clarifying the queenside. The bishop is not trying to win a pawn immediately; it is creating lasting pressure while you castle, prepare c3 and d4, and improve every piece before opening the position.",

  root: [
    {
      san: "e4",
      main: true,
      evalCp: 20,
      note: "1.e4 takes space, opens two pieces, and invites an open game. The Ruy Lopez begins with the most direct claim in the center.",
      hint: "Claim the center and open lines for both your queen and king's bishop.",
      children: [
        {
          san: "e5",
          main: true,
          evalCp: 20,
          note: "Black answers symmetrically with 1…e5. That pawn is well placed, but its main defender will soon become a target.",
          children: [
            {
              san: "Nf3",
              main: true,
              evalCp: 25,
              note: "2.Nf3 develops with tempo by attacking e5. Good opening moves make a piece better and ask the opponent a question at the same time.",
              hint: "Develop a knight while attacking Black's central pawn.",
              children: [
                {
                  san: "Nc6",
                  main: true,
                  evalCp: 20,
                  note: "2…Nc6 protects e5 and develops. The knight now does two jobs — which makes it the perfect piece to pressure.",
                  children: [
                    {
                      san: "Bb5",
                      main: true,
                      evalCp: 30,
                      note: "3.Bb5 is the Spanish bishop. It attacks the c6-knight that guards e5, but the point is patient pressure rather than a quick pawn grab.",
                      hint: "Develop the bishop to pressure the knight that guards e5.",
                      children: [
                        {
                          san: "a6",
                          main: true,
                          weight: 3,
                          evalCp: 25,
                          note: "3…a6 is the Morphy Defense. Black asks the bishop to decide immediately: trade on c6 or keep the long-term pressure.",
                          children: [
                            {
                              san: "Ba4",
                              main: true,
                              evalCp: 30,
                              note: "4.Ba4 keeps the bishop and its pressure. You are happy to let Black gain a little queenside space because this bishop may become powerful when the center opens.",
                              hint: "Keep the bishop and preserve the pressure along the a4–e8 diagonal.",
                              children: [
                                {
                                  san: "Nf6",
                                  main: true,
                                  weight: 3,
                                  evalCp: 25,
                                  note: "4…Nf6 develops with an attack on e4. Black has caught up in development, so securing your king matters more than defending everything with pawns.",
                                  children: [
                                    {
                                      san: "O-O",
                                      main: true,
                                      evalCp: 30,
                                      note: "5.O-O gets the king safe and calmly offers e4. If Black grabs it too soon, Re1 and pressure on e5 usually restore the pawn. Development is doing the defending for you.",
                                      hint: "Make your king safe and bring the rook toward the open center in one move.",
                                      children: [
                                        {
                                          san: "Be7",
                                          main: true,
                                          evalCp: 25,
                                          note: "5…Be7 prepares Black to castle. You have reached a classical Closed Ruy Lopez setup: next come Re1, c3, d4 and a slow build-up with every piece joining in.",
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  san: "d6",
                                  weight: 1,
                                  aside: "If Black chooses 4…d6 — the Steinitz setup — play 5.c3. It gives the bishop a retreat square and prepares d4 without loosening your position.",
                                  children: [
                                    {
                                      san: "c3",
                                      main: true,
                                      hint: "Give the bishop an escape square while preparing the central d4 break.",
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
                          aside: "If Black plays the Berlin Defense with 3…Nf6, castle with 4.O-O. Keep developing and let Black decide whether taking e4 is worth the pressure that follows.",
                          children: [
                            {
                              san: "O-O",
                              main: true,
                              hint: "Castle first; your rook will soon help challenge the e-file.",
                            },
                          ],
                        },
                        {
                          san: "d6",
                          weight: 1,
                          aside: "If Black plays the Old Steinitz Defense with 3…d6, build the center with 4.d4. Black is solid but cramped, so claim the space they have offered.",
                          children: [
                            {
                              san: "d4",
                              main: true,
                              hint: "Use Black's passive setup to establish a second pawn in the center.",
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
      "Build before you break. Castle, play Re1 and c3, then choose d4 when your pieces support it. The pressure on e5 restricts Black even when you never win the pawn. Black usually seeks …b5, …d6 and a timely …d5 break to free the position.",
    pieces:
      "The b5-bishop often retreats to a4 and then b3 or c2, where it watches the kingside. The queen's knight commonly travels d2–f1–g3, the dark bishop develops to e3 or g5, and the rooks take e1 and d1. In the Ruy, a piece may spend several moves reaching its ideal square — that is the point, not wasted time.",
    trap: {
      name: "Noah's Ark",
      text: "The a4-bishop needs an escape route. In some Steinitz structures Black can chase it with …b5 and then seal b3 with …c4. A careless pawn grab can leave the bishop trapped behind Black's a6–b5–c4 chain. Play c3 early when the structure calls for it, and do not confuse pressure on e5 with permission to grab everything.",
    },
    middlegame:
      "Closed Ruy Lopez middlegames are slow burns. White improves pieces and prepares d4 or a kingside expansion; Black looks for …d5 or queenside space. The center may stay closed for a long time, then one pawn break releases years of stored-up piece pressure all at once.",
  },
};
