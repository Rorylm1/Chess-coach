/**
 * The Queen's Gambit — curated journey content (M5).
 *
 * You play White. Main line is the Queen's Gambit Declined (1.d4 d5 2.c4 e6 3.Nc3 Nf6
 * 4.Bg5 Be7 5.Nf3), with the famous fork at Black's second move taught as deviations:
 * the Accepted (…dxc4) and the Slav (…c6). Evals are White-POV centipawns (provisional —
 * the build step refines them). Every line is legality-checked in tests.
 */

import type { Opening } from "@/lib/openings/tree";

export const queensGambit: Opening = {
  slug: "queens-gambit",
  name: "Queen's Gambit",
  eco: "D06–D69",
  learnerSide: "w",
  blurb: "Offer a pawn to seize the center — the most principled way to play 1.d4.",
  idea: "The Queen's Gambit is the most respected way to play 1.d4 — and it isn't really a gambit at all. You offer the c4-pawn not to sacrifice it, but to lure Black's central d-pawn away from the center. Whether Black declines, accepts, or props it up, you end up with easier development and a mobile pawn center. It's the purest lesson in central strategy in all of chess.",

  root: [
    {
      san: "d4",
      main: true,
      evalCp: 20,
      note: "1.d4 stakes the center with the queen's pawn — a slower, more strategic battlefield than 1.e4, where structure matters more than early fireworks.",
      hint: "Open with the queen's pawn — claim the center the strategic way.",
      children: [
        {
          san: "d5",
          main: true,
          evalCp: 20,
          note: "1…d5 is the classical, symmetrical reply — Black plants a pawn in the center to match yours. Now you spring the question.",
          children: [
            {
              san: "c4",
              main: true,
              evalCp: 30,
              note: "2.c4 — the Queen's Gambit. You're not really giving up a pawn; you're offering to trade your wing c-pawn for Black's central d-pawn, which would hand you a free, mobile center.",
              hint: "Strike at Black's center pawn from the side, offering the gambit.",
              children: [
                // ── The famous fork: Decline, Accept, or Slav ──
                {
                  san: "e6",
                  main: true,
                  weight: 3,
                  evalCp: 30,
                  note: "2…e6 declines the gambit (the QGD) — solid and respected, though it does shut in Black's light-squared bishop. The fight will be about the center and the c-file.",
                  children: [
                    {
                      san: "Nc3",
                      main: true,
                      evalCp: 40,
                      note: "3.Nc3 develops and adds a second attacker to d5 — the central tension is the whole story now.",
                      hint: "Develop a knight that also leans on Black's d5-pawn.",
                      children: [
                        {
                          san: "Nf6",
                          main: true,
                          evalCp: 30,
                          note: "3…Nf6 develops and defends d5 a third time. Both sides are mobilizing around the central pawns.",
                          children: [
                            {
                              san: "Bg5",
                              main: true,
                              evalCp: 40,
                              note: "4.Bg5 pins the f6-knight against the queen, quietly increasing the pressure on d5 — a hallmark Queen's Gambit move.",
                              hint: "Develop the dark-squared bishop to its most active square, pinning a knight.",
                              children: [
                                {
                                  san: "Be7",
                                  main: true,
                                  weight: 3,
                                  evalCp: 30,
                                  note: "4…Be7 calmly breaks the pin and prepares to castle. You've reached the classical, rock-solid heart of the QGD — well played.",
                                },
                                {
                                  san: "h6",
                                  weight: 1,
                                  aside: "If Black pokes the bishop with 4…h6, just retreat with 5.Bh4 — you keep the pin and lose nothing.",
                                  children: [
                                    {
                                      san: "Bh4",
                                      main: true,
                                      hint: "Keep the pin alive — retreat along the diagonal rather than trade.",
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
                  san: "dxc4",
                  weight: 2,
                  aside: "If the bot grabs the pawn with 2…dxc4 — the Queen's Gambit Accepted — don't chase it. Play 3.e3, opening your bishop to recapture on c4 at leisure while you keep the center.",
                  children: [
                    {
                      san: "e3",
                      main: true,
                      hint: "Don't chase the pawn — open lines so you can win it back calmly.",
                    },
                  ],
                },
                {
                  san: "c6",
                  weight: 2,
                  aside: "If the bot supports the center with 2…c6 — the Slav Defense — develop naturally with 3.Nf3; the c4-pawn isn't running away, and you'll regain it or the center later.",
                  children: [
                    {
                      san: "Nf3",
                      main: true,
                      hint: "Develop a knight and keep it simple — the pawn can wait.",
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
      "White wants to trade the flank c-pawn for Black's central d-pawn, ending up with a mobile center and freer development. Black wants to either give the pawn back soundly and fight for the …c5 or …e5 freeing break, or (rarely wise) cling to it and fall behind in development.",
    pieces:
      "The dark-squared bishop loves g5, pinning the f6-knight and pressing d5. Knights belong on c3 and f3, the c3-knight eyeing d5. Castle short, then put rooks on c1 and d1 where the open and half-open files will appear.",
    trap: {
      name: "The Elephant Trap",
      text: "In the QGD, if White greedily grabs with an early Nxd5?? after …Nbd7, Black wins a piece: …Nxd5! and after Bxd8 the zwischenzug …Bb4+ skewers the king and queen, regaining everything with interest. A famous reminder that the d5-pawn can bite back.",
    },
    middlegame:
      "You usually reach a minority attack or central-break middlegame: White rolls b4–b5 on the queenside to manufacture a weakness, or breaks with e4; Black answers with …c5 or …e5. Knowing which break you're playing for is most of the game.",
  },
};
