# Opening lesson source notes

Researched 6 October 2026. Source links are stored with each history, image and game in `src/content/opening-lessons` and exposed in the UI.

- Opening names, characteristic variations and historical summaries were checked against the corresponding Chess.com opening guides. Explanations are original, concise teaching notes.
- Historical scores were selected from the unannotated PGN Mentor player collections. The Immortal Draw score was transcribed from its published Wikipedia game record. Scores retain their original endings; no continuation is appended to a resigned game.
- Commons image metadata was checked for subject, creator, licence and dimensions. Reused classic images retain the existing homepage feature’s credits, with no changes to those assets. The Spanish court painting is labelled as a nineteenth-century interpretation, not a contemporary Ruy López portrait.
- Every lesson move, challenge answer and complete historical game replays through chess.js in release tests.
- All challenge answers were checked with the local Stockfish 18 lite single-thread engine at depth 18. The recorded baseline and candidate scores are from the side-to-move perspective, not a displayed rating. Maximum accepted loss at this depth: 60 centipawns. Engine comparison is a practical authoring check, not proof of optimal play.
- Browser verification covered full White and Black practice, the additional learner move, hints, saved completion after refresh, mixed eligibility, line-switch timer cancellation, an authored alternative, historical replay and the 390 px mobile layout.

The original 15-opening catalogue, trees, URLs and strategic panels remain intact. The landing page, shared global styles and multiplayer implementation are outside this change.
