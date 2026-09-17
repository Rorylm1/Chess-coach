/**
 * The English Opening — curated journey content.
 *
 * You play White. The main line reaches the Four Knights English
 * (1.c4 e5 2.Nc3 Nf6 3.Nf3 Nc6 4.g3 d5 5.cxd5 Nxd5), with the Symmetrical
 * English and an Indian setup taught as Black deviations. Evals are White-POV
 * centipawns; the generated eval map is authoritative.
 */

import type { Opening } from "@/lib/openings/tree";

export const englishOpening: Opening = {
  slug: "english-opening",
  name: "English Opening",
  eco: "A10–A39",
  learnerSide: "w",
  blurb: "Control the center from the flank, then choose the right moment to break it open.",
  idea: "The English begins with a sideways question rather than a frontal charge. By playing c4, you control d5, keep both central pawns flexible, and invite Black to reveal a plan first. You can steer into calm positional play or sharp reversed-Sicilian battles, but the guiding habit stays the same: develop, fianchetto the king's bishop, and only then decide whether d4 or an attack on the queenside is the right break.",

  root: [
    {
      san: "c4",
      main: true,
      evalCp: 20,
      note: "1.c4 is the English Opening. From the flank, the c-pawn controls d5 and asks Black how they intend to occupy the center before you commit either central pawn.",
      hint: "Claim d5 from the wing while keeping both central pawns flexible.",
      children: [
        {
          san: "e5",
          main: true,
          weight: 3,
          evalCp: 25,
          note: "1…e5 takes space and creates a reversed Sicilian: you have the extra tempo, while Black builds a classical center. Your next job is to pressure d5 and develop without hurry.",
          children: [
            {
              san: "Nc3",
              main: true,
              evalCp: 25,
              note: "2.Nc3 develops toward the center and reinforces your grip on d5. The knight also keeps both g3 and an eventual d4 available.",
              hint: "Develop the queenside knight to add another eye to d5.",
              children: [
                {
                  san: "Nf6",
                  main: true,
                  evalCp: 30,
                  note: "2…Nf6 develops naturally and supports Black's e4 advance. Both sides are now contesting the dark squares without resolving the central tension.",
                  children: [
                    {
                      san: "Nf3",
                      main: true,
                      evalCp: 25,
                      note: "3.Nf3 controls e5 and d4 while preparing to castle. In the English, patient development is often more valuable than declaring the pawn structure too early.",
                      hint: "Bring out the other knight and make castling possible.",
                      children: [
                        {
                          san: "Nc6",
                          main: true,
                          evalCp: 30,
                          note: "3…Nc6 completes the Four Knights setup. Black has natural development, but the d5-square remains the strategic hinge of the position.",
                          children: [
                            {
                              san: "g3",
                              main: true,
                              evalCp: 25,
                              note: "4.g3 prepares the English bishop's ideal home on g2. From there it will pressure the long diagonal and support central or queenside play.",
                              hint: "Prepare to fianchetto the bishop onto the long diagonal.",
                              children: [
                                {
                                  san: "d5",
                                  main: true,
                                  weight: 3,
                                  evalCp: 20,
                                  note: "4…d5 uses Black's central space before you can clamp down on that square. The center is now asking to be clarified.",
                                  children: [
                                    {
                                      san: "cxd5",
                                      main: true,
                                      evalCp: 25,
                                      note: "5.cxd5 exchanges your flank pawn for Black's central pawn — the strategic bargain behind 1.c4. You remove Black's space and open the c-file for later rook pressure.",
                                      hint: "Trade the flank pawn for Black's central pawn and open the c-file.",
                                      children: [
                                        {
                                          san: "Nxd5",
                                          main: true,
                                          evalCp: 20,
                                          note: "5…Nxd5 restores material and centralizes a knight. Continue with Bg2 and O-O, then challenge that knight or strike with d4 once your king is safe. You have reached a healthy Four Knights English.",
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  san: "Bb4",
                                  weight: 1,
                                  aside: "If Black pins your knight with 4…Bb4, meet it with 5.Bg2. The pin is not dangerous, and completing the fianchetto matters more than trying to chase the bishop.",
                                  children: [
                                    {
                                      san: "Bg2",
                                      main: true,
                                      hint: "Ignore the harmless pin and complete the fianchetto.",
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
          san: "c5",
          weight: 2,
          aside: "If Black mirrors you with 1…c5, you have a Symmetrical English. Play 2.Nc3, developing while keeping d4 in reserve; the symmetry will break when one side chooses a central pawn break.",
          children: [
            {
              san: "Nc3",
              main: true,
              hint: "Develop toward the center and keep the d-pawn flexible.",
              children: [{ san: "Nc6", main: true }],
            },
          ],
        },
        {
          san: "Nf6",
          weight: 2,
          aside: "If Black starts with 1…Nf6, stay true to the English with 2.g3. You prepare Bg2 and can choose later between a pure English setup and a transposition to a d4 opening.",
          children: [
            {
              san: "g3",
              main: true,
              hint: "Prepare the long-diagonal bishop while keeping your central pawns uncommitted.",
              children: [{ san: "g6", main: true }],
            },
          ],
        },
      ],
    },
  ],

  panels: {
    plans:
      "Develop the knights, fianchetto with g3 and Bg2, castle, and watch the d5-square. If Black builds a broad center, undermine it with d4 or b4; if the center stays closed, gain queenside space with a3, Rb1 and b4. The English rewards waiting until Black's structure tells you which break matters.",
    pieces:
      "The g2-bishop is your long-range anchor, so avoid burying it behind an unnecessary e4–d3 chain. Knights usually belong on c3 and f3, the queen's rook often finds b1 or c1, and the dark-squared bishop can develop to g2, b2 or even a3 depending on Black's setup.",
    trap: {
      name: "The poisoned b4 pawn",
      text: "In many English positions White expands with b4 and seems to leave that pawn loose. If Black's knight grabs it too early with …Nxb4, Qa4 can check the king and attack the knight at once, often winning material or trapping the raider. Before offering the pawn, verify the queen really has the a4 route — the pattern is useful, but it is not automatic.",
    },
    middlegame:
      "Expect a maneuvering middlegame with pressure on the queenside and a delayed central break. Reversed-Sicilian structures after …e5 can become kingside attacks because your extra tempo matters; symmetrical structures call for patient improvement and a well-prepared d4 or b4. Do not mistake flexibility for passivity — your quiet setup is storing choices.",
  },
};
