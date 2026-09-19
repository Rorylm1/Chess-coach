/**
 * The Queen's Gambit — curated journey content (M5).
 *
 * You play White. Four real variations share one book tree and each runs six moves deep.
 * The Orthodox Defense is the canonical walkthrough; the drill chooses among all four.
 * Every route is legality-checked in tests.
 */

import type { Opening } from "@/lib/openings/tree";

export const queensGambit: Opening = {
  slug: "queens-gambit",
  name: "Queen's Gambit",
  eco: "D06–D69",
  learnerSide: "w",
  blurb: "Offer a pawn to seize the center — the most principled way to play 1.d4.",
  idea: "The Queen's Gambit is the most respected way to play 1.d4 — and it isn't really a gambit at all. You offer the c4-pawn not to sacrifice it, but to lure Black's central d-pawn away from the center. Whether Black declines, accepts, or props it up, you end up with easier development and a mobile pawn center. It's the purest lesson in central strategy in all of chess.",

  defaultLineId: "orthodox-defense",
  lines: [
    {
      id: "orthodox-defense",
      name: "Queen's Gambit Declined: Orthodox Defense",
      description:
        "Black builds a solid d5–e6 centre, breaks the pin, castles, and develops the queen's knight behind it.",
      moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "Nf3", "O-O", "e3", "Nbd7"],
    },
    {
      id: "accepted",
      name: "Queen's Gambit Accepted",
      description:
        "Black takes on c4, while White recovers the pawn calmly and converts the time into rapid development.",
      moves: ["d4", "d5", "c4", "dxc4", "e3", "Nf6", "Bxc4", "e6", "Nf3", "c5", "O-O", "a6"],
    },
    {
      id: "slav-defense",
      name: "Slav Defense: Main Line",
      description:
        "Black supports d5 with …c6 and develops the light-squared bishop before closing it in with …e6.",
      moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6"],
    },
    {
      id: "exchange-variation",
      name: "Queen's Gambit Declined: Exchange Variation",
      description:
        "White resolves the central tension with cxd5 and builds long-term pressure against Black's queenside structure.",
      moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "Be7", "e3", "O-O"],
    },
  ],

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
                              note: "4.Bg5 pins the f6-knight to the queen, adding indirect pressure to Black's d5 strongpoint.",
                              hint: "Develop the dark-squared bishop with tempo by pinning the f6-knight.",
                              children: [
                                {
                                  san: "Be7",
                                  main: true,
                                  evalCp: 30,
                                  note: "4…Be7 calmly breaks the pin and prepares to castle without weakening the kingside.",
                                  children: [
                                    {
                                      san: "Nf3",
                                      main: true,
                                      evalCp: 35,
                                      note: "5.Nf3 completes White's natural kingside development and keeps both central breaks available.",
                                      hint: "Develop the kingside knight and get ready to castle.",
                                      children: [
                                        {
                                          san: "O-O",
                                          main: true,
                                          evalCp: 30,
                                          note: "5…O-O secures Black's king. The position is quiet, but both sides are still fighting over e4 and c5.",
                                          children: [
                                            {
                                              san: "e3",
                                              main: true,
                                              evalCp: 35,
                                              note: "6.e3 supports d4 and releases the light-squared bishop, ready for Bd3 and a safe castle.",
                                              hint: "Support the centre and open a route for your light-squared bishop.",
                                              children: [
                                                {
                                                  san: "Nbd7",
                                                  main: true,
                                                  evalCp: 30,
                                                  note: "6…Nbd7 completes the Orthodox setup. Black is solid; White now chooses between Rc1, Bd3, and a central break.",
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
                              san: "cxd5",
                              evalCp: 25,
                              note: "4.cxd5 enters the Exchange Variation, fixing Black with a queenside pawn majority that White can attack later.",
                              hint: "Resolve the central tension and give Black an enduring queenside structure.",
                              children: [
                                {
                                  san: "exd5",
                                  main: true,
                                  evalCp: 25,
                                  note: "4…exd5 recaptures with the e-pawn, creating the Carlsbad structure: White's c-pawn has traded for Black's e-pawn.",
                                  children: [
                                    {
                                      san: "Bg5",
                                      main: true,
                                      evalCp: 30,
                                      note: "5.Bg5 develops with a pin and makes it harder for Black to free the position with …c5.",
                                      hint: "Develop the bishop actively and pin the main defender of d5.",
                                      children: [
                                        {
                                          san: "Be7",
                                          main: true,
                                          evalCp: 25,
                                          note: "5…Be7 unpins and prepares to castle, accepting the long-term structural battle.",
                                          children: [
                                            {
                                              san: "e3",
                                              main: true,
                                              evalCp: 30,
                                              note: "6.e3 reinforces d4 and opens the light-squared bishop before White starts the minority attack.",
                                              hint: "Build the centre and free your remaining bishop.",
                                              children: [
                                                {
                                                  san: "O-O",
                                                  main: true,
                                                  evalCp: 25,
                                                  note: "6…O-O reaches the classic Exchange QGD structure. White's long-term plan is b4–b5 against c6.",
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
                {
                  san: "dxc4",
                  weight: 2,
                  note: "2…dxc4 accepts the gambit. Black wins a pawn for the moment, but releases the centre and gives White useful developing tempi.",
                  aside: "In the Queen's Gambit Accepted, don't chase the pawn with the queen; prepare Bxc4 while developing.",
                  children: [
                    {
                      san: "e3",
                      main: true,
                      evalCp: 35,
                      note: "3.e3 opens the f1-bishop so White can recover c4 naturally instead of wasting time on a pawn hunt.",
                      hint: "Don't chase the pawn — open lines so you can win it back calmly.",
                      children: [
                        {
                          san: "Nf6",
                          main: true,
                          evalCp: 30,
                          note: "3…Nf6 develops and controls e4, making White prove that the missing c-pawn is only temporary.",
                          children: [
                            {
                              san: "Bxc4",
                              main: true,
                              evalCp: 35,
                              note: "4.Bxc4 restores material while developing a bishop to an active diagonal toward f7.",
                              hint: "Recover the pawn with development now that the bishop's path is open.",
                              children: [
                                {
                                  san: "e6",
                                  main: true,
                                  evalCp: 30,
                                  note: "4…e6 prepares …c5 and releases Black's dark-squared bishop, challenging White's central space.",
                                  children: [
                                    {
                                      san: "Nf3",
                                      main: true,
                                      evalCp: 35,
                                      note: "5.Nf3 develops, guards e5, and brings White one move from castling.",
                                      hint: "Develop the kingside knight before securing your king.",
                                      children: [
                                        {
                                          san: "c5",
                                          main: true,
                                          evalCp: 30,
                                          note: "5…c5 immediately attacks d4 — Black's key freeing break in the Accepted variation.",
                                          children: [
                                            {
                                              san: "O-O",
                                              main: true,
                                              evalCp: 35,
                                              note: "6.O-O gets the king safe before deciding how to meet the pressure on d4.",
                                              hint: "Your development has earned you the right to castle.",
                                              children: [
                                                {
                                                  san: "a6",
                                                  main: true,
                                                  evalCp: 30,
                                                  note: "6…a6 prepares …b5 and asks the c4-bishop where it wants to live. The Accepted has become an open, active middlegame.",
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
                {
                  san: "c6",
                  weight: 2,
                  note: "2…c6 is the Slav Defense: Black reinforces d5 without trapping the light-squared bishop behind …e6.",
                  aside: "Against the Slav, develop naturally; Black's bishop is free, but the extra …c6 move gives White time too.",
                  children: [
                    {
                      san: "Nf3",
                      main: true,
                      evalCp: 30,
                      note: "3.Nf3 develops and controls e5 while keeping White flexible about Nc3 and e3.",
                      hint: "Develop a knight and keep it simple — the pawn can wait.",
                      children: [
                        {
                          san: "Nf6",
                          main: true,
                          evalCp: 25,
                          note: "3…Nf6 adds another defender to d5 and prepares Black to take on c4 under better conditions.",
                          children: [
                            {
                              san: "Nc3",
                              main: true,
                              evalCp: 30,
                              note: "4.Nc3 increases the pressure on d5 and fully commits White to occupying the centre.",
                              hint: "Bring the other knight out and increase the pressure on d5.",
                              children: [
                                {
                                  san: "dxc4",
                                  main: true,
                                  evalCp: 25,
                                  note: "4…dxc4 releases the tension now that White's knight blocks the c-pawn from protecting c4.",
                                  children: [
                                    {
                                      san: "a4",
                                      main: true,
                                      evalCp: 30,
                                      note: "5.a4 stops …b5 from cementing Black's extra pawn and prepares to recover c4 safely.",
                                      hint: "Stop Black from defending the c4-pawn with a queenside pawn push.",
                                      children: [
                                        {
                                          san: "Bf5",
                                          main: true,
                                          evalCp: 25,
                                          note: "5…Bf5 develops the bishop outside the pawn chain — the strategic point of the Slav move order.",
                                          children: [
                                            {
                                              san: "e3",
                                              main: true,
                                              evalCp: 30,
                                              note: "6.e3 opens the f1-bishop so Bxc4 can follow, while keeping the centre secure.",
                                              hint: "Open the bishop's diagonal so the c4-pawn can be recovered.",
                                              children: [
                                                {
                                                  san: "e6",
                                                  main: true,
                                                  evalCp: 25,
                                                  note: "6…e6 completes Black's development scheme only after the bishop has escaped. That is the Slav's core idea.",
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
