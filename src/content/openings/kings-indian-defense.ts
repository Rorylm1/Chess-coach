/**
 * The King's Indian Defense — curated journey content.
 *
 * You play Black. The main line reaches the Classical setup
 * (1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O), with the Sämisch and
 * Averbakh move orders taught as White deviations. Evals are White-POV
 * centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const kingsIndianDefense: Opening = {
  slug: "kings-indian-defense",
  name: "King's Indian Defense",
  eco: "E60–E99",
  learnerSide: "b",
  blurb: "Give White the center, then prove it is a target with …e5 and a kingside storm.",
  idea: "The King's Indian is a hypermodern counterattack. You let White occupy the center with pawns while you develop quickly, fianchetto the dark-squared bishop, and castle. Only then do you strike with …e5 or …c5. If White closes the center, the board splits into a race: White expands on the queenside while you throw pawns and pieces toward the king.",

  root: [
    {
      san: "d4",
      main: true,
      evalCp: 15,
      note: "White begins with 1.d4, claiming e5 and building a durable center. The King's Indian will challenge that center with pieces first and pawns later.",
      children: [
        {
          san: "Nf6",
          main: true,
          evalCp: 30,
          note: "1…Nf6 controls e4 without committing a central pawn. This flexible move invites White forward while keeping several Indian defenses available.",
          hint: "Control e4 with a piece and keep your central pawns flexible.",
          children: [
            {
              san: "c4",
              main: true,
              evalCp: 25,
              note: "2.c4 adds more queenside space and supports d5. White is accepting the invitation to build a broad pawn center.",
              children: [
                {
                  san: "g6",
                  main: true,
                  evalCp: 35,
                  note: "2…g6 prepares the dark-squared fianchetto. Your bishop is heading to the long diagonal, where it will stare through the center toward b2.",
                  hint: "Prepare to place the king's bishop on the long diagonal.",
                  children: [
                    {
                      san: "Nc3",
                      main: true,
                      evalCp: 30,
                      note: "3.Nc3 reinforces d5 and makes e4 possible. White now has the space; your job is to finish development before attacking it.",
                      children: [
                        {
                          san: "Bg7",
                          main: true,
                          evalCp: 35,
                          note: "3…Bg7 completes the fianchetto. The bishop may look blocked by White's center, but once that center moves or breaks, this diagonal can become the strongest line on the board.",
                          hint: "Complete the fianchetto and aim the bishop through White's center.",
                          children: [
                            {
                              san: "e4",
                              main: true,
                              evalCp: 40,
                              note: "4.e4 builds White's imposing pawn center. The King's Indian does not panic at the sight of it — a big center also gives you big targets.",
                              children: [
                                {
                                  san: "d6",
                                  main: true,
                                  evalCp: 45,
                                  note: "4…d6 supports the coming …e5 break and keeps e5 under control. Your position is compact, but every piece and pawn has a job.",
                                  hint: "Support the central break you plan to play next.",
                                  children: [
                                    {
                                      san: "Nf3",
                                      main: true,
                                      weight: 3,
                                      evalCp: 40,
                                      note: "5.Nf3 is the Classical setup. White develops, protects e5 and prepares to castle into the famous opposite-wing race.",
                                      children: [
                                        {
                                          san: "O-O",
                                          main: true,
                                          evalCp: 45,
                                          note: "5…O-O puts the king away before the center opens. Next you will usually play …e5; if White closes with d5, prepare …f5 and begin the kingside attack. The counterpunch is loaded.",
                                          hint: "Secure your king before striking at the center.",
                                        },
                                      ],
                                    },
                                    {
                                      san: "f3",
                                      weight: 2,
                                      aside: "If White plays 5.f3 — the Sämisch Variation — castle with 5…O-O. White may castle queenside and attack you, so get safe and prepare a quick central counterstrike.",
                                      children: [
                                        {
                                          san: "O-O",
                                          main: true,
                                          hint: "Castle before White's pawn center and kingside space turn into an attack.",
                                        },
                                      ],
                                    },
                                    {
                                      san: "Be2",
                                      weight: 1,
                                      aside: "If White develops 5.Be2 and keeps the knight flexible — an Averbakh-style move order — castle with 5…O-O. Do not reveal your central break before your king is safe.",
                                      children: [
                                        {
                                          san: "O-O",
                                          main: true,
                                          hint: "Finish king safety; the choice between …e5 and …c5 can wait one move.",
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
      "Develop with …Nf6, …g6, …Bg7 and …d6, castle, then challenge the center with …e5 or …c5. When White answers …e5 with d5, the center locks: White plays c5 and expands on the queenside, while you prepare …f5–f4 and a direct kingside attack. Hesitation is the real enemy — a closed center gives both sides permission to race.",
    pieces:
      "The g7-bishop is the opening's sleeping dragon; protect its diagonal and look for moments when the center opens. The f6-knight may reroute through d7 or e8 so the f-pawn can advance. The queen often comes to e8, the f8-rook supports …f5, and the c8-bishop develops after the center reveals which diagonal matters.",
    trap: {
      name: "The e4 break-in",
      text: "White's broad center can look untouchable, but e4 is often held by the c3-knight and little else. When that knight is pinned, exchanged, or overloaded, …Nxe4 can crack the center and expose the g7-bishop. Treat it as a calculation trigger, not a free sacrifice: check whether …f5, …Bxc3 or a discovered attack wins the piece back before jumping in.",
    },
    middlegame:
      "The famous Mar del Plata structure is a race on opposite wings. White gains queenside space with c5 and b4; Black attacks the king with …f5, …f4, …g5 and sometimes a piece sacrifice. If the center stays fluid, switch gears: pressure d4 and use the g7-bishop rather than launching pawns automatically.",
  },
};
