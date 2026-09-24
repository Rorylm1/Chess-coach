/**
 * The Nimzo-Indian Defense - curated journey content.
 *
 * You play Black. The main line is the Rubinstein system
 * (1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 O-O 5.Bd3 d5 6.Nf3 c5),
 * with the Classical and Samisch systems taught as White deviations.
 * Evals are White-POV centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const nimzoIndianDefense: Opening = {
  slug: "nimzo-indian-defense",
  name: "Nimzo-Indian Defense",
  eco: "E20-E59",
  learnerSide: "b",
  blurb: "Pin the c3-knight, restrain e4, and trade the bishop pair for lasting pressure on White's center.",
  idea: "The Nimzo-Indian begins with active piece play rather than an immediate pawn occupation of the center. By pinning the c3-knight with ...Bb4, Black makes e4 harder to achieve and is often ready to exchange that bishop for the knight, leaving White with doubled c-pawns. The position stays flexible: castle early, challenge d4 with ...d5 or ...c5, and decide whether White's center should be attacked, blockaded, or simplified.",

  root: [
    {
      san: "d4",
      main: true,
      evalCp: 20,
      note: "1.d4 takes space and controls e5. The Nimzo-Indian will answer with piece pressure first, keeping both central pawns flexible.",
      children: [
        {
          san: "Nf6",
          main: true,
          evalCp: 26,
          note: "1...Nf6 develops and stops White from building the ideal e4 center without preparation. It also keeps several Indian defenses available.",
          hint: "Develop a knight to control e4 before committing a central pawn.",
          children: [
            {
              san: "c4",
              main: true,
              evalCp: 20,
              note: "2.c4 supports a broad queenside center and adds control over d5. White is ready to develop Nc3 and push e4 next.",
              children: [
                {
                  san: "e6",
                  main: true,
                  evalCp: 27,
                  note: "2...e6 opens the diagonal for the dark-squared bishop and reinforces the fight for d5. Black is preparing the pin that gives the opening its character.",
                  hint: "Open the bishop's path so it can pin White's next developing knight.",
                  children: [
                    {
                      san: "Nc3",
                      main: true,
                      evalCp: 23,
                      note: "3.Nc3 develops naturally and threatens to support e4. This is the invitation Black needs; without this knight on c3, there is no true Nimzo-Indian.",
                      children: [
                        {
                          san: "Bb4",
                          main: true,
                          evalCp: 27,
                          note: "3...Bb4 defines the Nimzo-Indian. The bishop pins the knight to the king, increases control of e4, and threatens to trade on c3 when doubled pawns would become useful targets.",
                          hint: "Pin the c3-knight and make White's desired e4 advance harder to arrange.",
                          children: [
                            {
                              san: "e3",
                              main: true,
                              weight: 4,
                              evalCp: 22,
                              note: "4.e3 is the Rubinstein system. White calmly develops the f1-bishop and accepts that the c-pawns may be doubled later in exchange for the bishop pair.",
                              children: [
                                {
                                  san: "O-O",
                                  main: true,
                                  evalCp: 28,
                                  note: "4...O-O keeps every central option open and gets the king safe. There is no need to surrender the b4-bishop until the exchange improves Black's position.",
                                  hint: "Secure your king while preserving the choice between central pawn breaks.",
                                  children: [
                                    {
                                      san: "Bd3",
                                      main: true,
                                      evalCp: 23,
                                      note: "5.Bd3 aims at h7 and prepares quick castling. White's pieces are becoming active, so Black should claim a firm share of the center.",
                                      children: [
                                        {
                                          san: "d5",
                                          main: true,
                                          evalCp: 28,
                                          note: "5...d5 establishes a classical foothold and directly contests e4. The center is now stable enough for Black to prepare a second challenge with ...c5.",
                                          hint: "Occupy the center and put another brake on White's e4 advance.",
                                          children: [
                                            {
                                              san: "Nf3",
                                              main: true,
                                              evalCp: 23,
                                              note: "6.Nf3 completes White's kingside development and adds pressure to e5 and d4. Black should strike before White castles and settles comfortably.",
                                              children: [
                                                {
                                                  san: "c5",
                                                  main: true,
                                                  evalCp: 29,
                                                  note: "6...c5 attacks d4 and completes Black's central setup. Next, choose the moment for ...dxc4, ...Nc6, or ...Bxc3; the point is pressure, not collecting the doubled pawns immediately.",
                                                  hint: "Challenge the base of White's center with your other central pawn.",
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
                              san: "Qc2",
                              weight: 2,
                              aside: "If White chooses the Classical system with 4.Qc2, castle with 4...O-O. The queen supports e4 and plans to recapture on c3 without doubled pawns, so finish king safety and prepare ...d5 or ...c5 rather than releasing the pin automatically.",
                              children: [
                                {
                                  san: "O-O",
                                  main: true,
                                  hint: "Castle and keep the central structure flexible while White's queen is committed.",
                                },
                              ],
                            },
                            {
                              san: "a3",
                              weight: 1,
                              aside: "If White immediately asks the bishop with 4.a3 - the Samisch Variation - answer 4...Bxc3+. White gains the bishop pair after bxc3, but the doubled c-pawns give you fixed targets; follow with ...c5 and pressure c4 and d4.",
                              children: [
                                {
                                  san: "Bxc3+",
                                  main: true,
                                  hint: "Exchange for the knight and give White a lasting structural weakness.",
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
      "Use ...Bb4 to restrain e4, castle, then challenge d4 with ...d5 or ...c5. Exchange on c3 when doubled pawns will become durable targets or when removing the knight weakens e4. If White avoids structural damage, keep the bishop and use the pin to gain time. The Nimzo-Indian is flexible by design: make White reveal the center before choosing your pawn structure.",
    pieces:
      "The f6-knight controls e4 and usually stays central. The b4-bishop is a strategic bargaining chip, not a piece to save at all costs. The c8-bishop often develops to b7 after ...b6 or to a6 to pressure c4; the b8-knight usually reaches c6 or d7. Put rooks on c8 and d8 behind the files your pawn breaks are likely to open.",
    trap: {
      name: "The pinned knight and the e4 mirage",
      text: "White often wants e4, but the c3-knight may only appear to support that square: while it is pinned by ...Bb4, moving it can expose the king or lose material. Whenever White pushes e4 before fully solving the pin, calculate ...Nxe4. If the knight cannot safely recapture, Black may win a central pawn and open the b4-bishop's line at the same time.",
    },
    middlegame:
      "Nimzo-Indian middlegames revolve around a clear trade: White may own the bishop pair and extra central space, while Black gets faster development and targets in the c-pawn structure. Blockade c4, pressure c3 and d4, and use open c- and d-files. If White keeps a healthy structure with Qc2, play more dynamically against the center and do not drift into a passive bishop-versus-space position.",
  },
};
