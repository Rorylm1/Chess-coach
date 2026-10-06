# Opening lessons: lines, practice and history

Status: UI approved and full catalogue implementation authorised, 6 October 2026.

## Implemented catalogue

- All 15 existing openings, with 46 named lessons (four Italian; three each elsewhere).
- The approved board/explanation layout, with visible history below the explanation on the right.
- Full-line practice for White and Black, followed by one additional learner move.
- Local, versioned studied/assisted/unassisted progress; mixed practice selects a named studied line with low prior coverage and commits to it for the whole run.
- Prepared challenge answers verified offline using Stockfish 18 lite, depth 18, within 60 centipawns of the baseline at that depth. These are curated lesson answers, not unrestricted best-move grading. See `src/content/opening-lessons/challenge-checks.json` for positions and results.
- Fifteen sourced historical game replays. The original scores are preserved; move explanations are original. The famous game may illustrate a different branch, which its introduction identifies.
- Credited archival images; namesakes, early writers and later exponents are explicitly distinguished.
- Original teaching trees and strategic panels retained. Per-line static data is shared by the walkthrough and practice; the existing tree remains available to older readers/tools.
- The eval refresh tool traverses actual lessons and legacy branches, deduplicates positions, and preserves cached evaluations when a lookup fails.

The earlier proposal below is retained as planning context. Deferred beyond this release: live engine grading of arbitrary continuations and mid-session switching between compatible branches. Mixed practice intentionally gives a named lesson at the start, matching the approved UI.


## UI review checkpoint

An isolated, local Italian Game preview is available at `/openings/italian-game/preview`.
It includes four selectable demonstration lines, walkthroughs, scripted practice, one
extra learner decision, session-only progress, an archival Evans portrait and a complete
Evergreen Game replay. It uses separate content from the production catalog. Production
has not been updated with this preview. Review the UI before completing the full content
and engine verification pipeline, French pilot and catalog expansion below.

## Outcome

Give every existing opening three fully taught, named lines, with a fourth where it adds a distinct idea. Let learners choose a line, practise it, mix lines they have studied, and finish with one extra decision that connects the opening to a real game. Add a compact, illustrated origin story and one famous game per opening.

Keep the site concise: one short explanation at a time, optional history detail, and the board as the main focus. Preserve all existing openings, URLs and multiplayer behaviour.

## What we already scoped and built

The M5 section of `spec.md` already proposed a main line plus taught deviations and a scripted opponent that varies its replies. `objective.md` describes learning plans, structures, traps and typical middlegames.

The current implementation has 15 openings and 52 root-to-leaf paths. These are not 52 complete lessons: only the main path has a full board walkthrough. Alternatives appear as short asides, and some end after just four plies (two moves by each player). Main paths are 8–12 plies, or about 4–6 moves per side.

`BookMove.children` already supports branching. The drill accepts any matching child on the learner's turn and chooses weighted children on the opponent's turn. It stops as soon as a leaf is reached. There is no named line selection, per-line progress, history model or famous-game player.

Two related issues should be addressed in this work:

- `ReadThrough` switches to the summary when it reaches the final step, so that step's move note is not shown. Give the last move its own teaching step before the summary.
- `scripts/refresh-opening-evals.mjs` duplicates main-line sequences instead of deriving them from content. It already differs from the Queen's Gambit tree (nine scripted plies versus eight in the current main walkthrough). Replace this duplication before adding more lines.

## Learning flow

1. Open an opening. See its core idea, a compact history feature and a list of three or four named lines.
2. Choose a line. Each entry shows its defining idea, learner side, approximate length and completion state.
3. Walk through that line on the board. Shared opening moves remain available; offer “Start at the branch” once the common introduction has been studied.
4. Choose “Practise this line” or “Mix learned lines”. Keep the line name visible during guided practice.
5. Finish with “One more move”: apply the plan in the resulting position.
6. See a short completion message, the next line, and the option to explore the famous game.

History should be a small image-and-text feature with an era, associated person or place and a 40–70-word introduction. Put sources and extended detail behind an expandable control. On mobile it stacks above the line picker; it must not push the board behind a long article.

## Practice rules

| Mode | Opponent behaviour | Learner moves | Completion |
| --- | --- | --- | --- |
| Practise this line | Follows the selected taught line | Accept the selected continuation and explicitly authored equivalents | Reach that lesson's learning position, then complete the final challenge |
| Mix learned lines | Selects among eligible studied lines, with even coverage initially | Accept moves belonging to any remaining eligible line | Finish the reached line and its final challenge |
| One more move | Plays a prepared reply first if needed | Accept one or more curated, engine-checked good moves | One additional successful learner decision |

Use coverage-based selection for mixed practice rather than the existing popularity bias, so less common lessons still appear. Track compatible line IDs through shared prefixes; the opponent must not jump into a different, untaught branch halfway through. Let users explicitly include all lines if they want a challenge without first reading each one.

An otherwise sound move can leave the selected lesson. Say “That is a different line; here we are practising …”, rather than calling it a chess mistake. If it belongs to another authored lesson, offer to switch. Unknown off-line moves should not be labelled objectively bad without analysis. Keep hint, reveal and retry controls; record assisted completion separately from completion without hints.

The initial “best move” interpretation should allow several good answers in the final challenge. Do not require one engine top choice when several moves teach the same plan well.

### The extra move

Interpret “one more move” as one additional move by the learner, not one ply regardless of colour. If the lesson ends after the learner moves, the opponent needs a taught reply before the extra learner decision. If it already ends with an opponent move, go straight to the challenge.

This is manageable using the current board and scripted opponent. Author each challenge position, candidate moves, hints and short explanations, then verify them before release. Teach the relevant plan in the walkthrough. Curate a stable endpoint rather than simply lengthening every line by an arbitrary number of moves; some shallow branches need substantial extension first.

### Optional later extension: accept any strong move

A free-play continuation with live Stockfish is a separate scope. A strong off-book move changes the position and may leave the lesson, so the system then needs opponent play, evaluation tolerances, cancellation on reset, mobile performance handling and a clear success condition.

For that extension, lazy-load the existing engine only after the taught line and assess the learner's move from the correct side's perspective against a sufficiently searched baseline. Handle mate scores separately, and accept comparably strong moves instead of exact top-move equality. If analysis fails or times out, fall back to the prepared challenge. Do not make completion depend on an external API. The current engine wrapper returns one principal variation; multi-candidate grading would require additional work.

## Content coverage

Target 45 complete lessons across the 15 existing openings, expanding toward 60 where a fourth line is worthwhile. A current short branch counts only after it has a named lesson, complete walkthrough, practice endpoint and final challenge.

Candidate lesson families below are an editorial starting point, not approved move sequences. Validate naming, legal move orders, appropriate learner perspective and teaching value during authoring. A “line” must be a specific continuation, not just a broad family label.

| Opening | Candidate coverage |
| --- | --- |
| Italian Game | Quiet Pianissimo; central d4 approach; Two Knights with d3; optional Evans Gambit |
| Queen's Gambit | Declined; Accepted; response to the Slav, cross-linked to its existing page |
| Sicilian Defense | A selected Open Sicilian setup; Alapin response; Closed Sicilian response; optional second Open Sicilian system |
| French Defense | Advance; Exchange; Tarrasch; optional Winawer |
| Ruy Lopez | Closed; Exchange; Berlin; optional Open |
| Caro–Kann Defense | Advance; Classical; Exchange; optional Panov |
| King's Indian Defense | Classical; Sämisch; Fianchetto |
| English Opening | Reversed Sicilian; Symmetrical; Four Knights |
| London System | Against …d5; against …g6; against early …c5 pressure |
| Scotch Game | Classical …Bc5; …Nf6/Mieses; …Qh4 response |
| Vienna Game | Vienna Gambit; quiet …Nf6 line; …Nc6 response |
| Petrov Defense | Classical; Steinitz attack response; Three Knights response |
| Scandinavian Defense | …Qa5; …Qd6; modern …Nf6 |
| Slav Defense | Main …dxc4 structure; Exchange; quiet e3 structure |
| Nimzo-Indian Defense | Rubinstein e3; Classical Qc2; Sämisch a3 |

Exact lengths should follow the idea being taught. A useful starting target is 6–10 full moves from the initial position, extending further only when needed to establish the named variation. Preserve existing sound material and avoid duplicating separate courses where one cross-link suffices.

## History and imagery

For each opening, research and store:

- Origin period and place, with uncertainty made explicit where necessary.
- The person who analysed, named, popularised or developed it, using the appropriate relationship. “Invented by” is not a universal field.
- A short explanation connecting that history to the opening's character today.
- A verified portrait, or an authentic book/manuscript/venue image when there is no reliable portrait or single inventor.
- One famous game: players, event, date, result, source, verified PGN and a short explanation of what it demonstrates. Identify the featured line where it matches; do not imply every famous game illustrates all the lessons.

Example: the French Defense's name is associated with the 1834 London–Paris correspondence game, rather than a single inventor. This offers a natural history feature and a candidate historical game, subject to PGN/date verification. [Chess.com opening history](https://www.chess.com/openings/French-Defense) and [Edward Winter's collected historical evidence](https://www.chesshistory.com/winter/extra/frenchdefence.html).

Use a consistent editorial treatment: portrait crop, subtle monochrome colour treatment, fine frame, compact era label and visible attribution. Preserve the existing dark palette and typography; use CSS for presentation and real archival images for historical people. Store image dimensions, alt text, creator, source URL, licence and any required credit. Optimise local assets and reserve their space to avoid layout jumps.

Image research needs identity checks as well as reuse checks. The Commons file titled “Gioacchino-greco.jpg” has contradictory identity information: its caption calls it Charles I from Greco's book. Do not use it as a verified Greco portrait. [File record](https://commons.wikimedia.org/wiki/File:Gioacchino-greco.jpg). A [Nimzowitsch portrait record](https://commons.wikimedia.org/wiki/File:Aron_Nimzowitsch.jpg) is a candidate for the Nimzo-Indian feature; confirm provenance and reuse details before shipping.

The famous game should open an optional board replay, reusing the existing board and move ribbon. Include two or three original teaching annotations and a jump to the relevant opening position. Do not turn the complete historical game into a compulsory drill. Verify the PGN and opening relationship; do not copy modern published annotations.

## Implementation shape

- Extend `Opening` with named lesson descriptors, history and a featured game. Give book nodes stable IDs; lesson descriptors refer to a path through the shared tree, avoiding duplicated common moves.
- Add per-line titles, a short idea, authored annotations, a target endpoint, sources and a challenge. Keep lesson-specific explanations separate when a shared position needs different teaching context.
- Resolve walkthroughs and drills from the same selected lesson data. Version IDs so progress survives copy changes; invalidate progress deliberately when a lesson materially changes.
- Match moves against the actual legal move produced by `chess.js`. Explicitly author supported transpositions; position matching must include side to move, castling and en-passant rights. Do not accept arbitrary move orders merely because the pieces appear similar.
- Add a line picker and line-aware phase switching in `OpeningJourney`. Reset board, timers, feedback and progress correctly when the selected line changes.
- Add small, versioned local progress storage for studied, assisted and unassisted completions. No accounts or backend are required. Provide reset and safe fallback if storage is unavailable.
- Replace the hand-maintained eval list with traversal of every taught line and challenge. Preserve existing cached values and record engine provenance. Failed remote lookups must not erase valid data or create invented evaluations; use a pinned local engine for authoring verification where needed.
- Keep runtime lessons static. The [Lichess opening-name dataset](https://github.com/lichess-org/chess-openings) provides CC0 names and move sequences as an authoring reference, not finished teaching content. Archive source/version details when using it.
- Load only the current opening's richer lesson data and defer full historical PGNs until needed if payload size warrants it. Keep portraits responsive and lazy-load images outside the initial viewport.

## Delivery sequence

1. **Representative pilot:** Italian (White) and French (Black), three fully authored lines each, line selection, both practice modes, final challenges, history imagery and a sourced famous game each. This exercises both learner colours and the no-single-inventor case.
2. **Finish the reusable system:** migration compatibility, progress, content/eval tooling, history presentation, famous-game replay and regression coverage. Adjust lesson length and copy after exercising the pilot.
3. **Complete the catalog:** expand the remaining 13 openings in reviewed batches until every opening meets the same three-line minimum; add fourth lines selectively. Finish all 15 history features and game examples.
4. **Optional separate enhancement:** unrestricted engine-graded continuation after lessons, if the curated final challenges prove too limiting.

This is a moderate product change plus a substantial content project. The largest workload is researching, explaining and checking 45–60 lessons and 15 histories/games/images. Adding one final learner move is a comparatively small part once the lesson model is in place. Use the two-opening pilot to establish actual authoring effort before promising a catalog-wide delivery date.

## Acceptance criteria

- All 15 existing opening URLs remain available, each with at least three complete selectable lessons; no catalog replacement or silent loss of existing content.
- Every taught move, alternative, final challenge and famous-game PGN replays legally. Required explanations, sources and valid endpoints are checked for every lesson.
- A variation never appears in mixed practice unless it is in the eligible set. Each eligible lesson can be selected; choosing/resetting a line during an opponent delay cannot apply a stale move.
- Walkthrough, practice, hint and reveal refer to the same selected line. The final walkthrough move receives its explanation before the summary.
- White and Black lessons both end with the promised additional learner decision. Accepted alternatives, correct perspective, retries and assisted completions are tested.
- History distinguishes origin from namesake/populariser; images have verified subjects, credits and accessible alternatives. Every opening has one sourced game example.
- Desktop, narrow mobile, keyboard controls and reduced motion remain usable; history does not crowd out the board.
- Existing multiplayer invite visibility, room route, shared design, reconnect behaviour and relay configuration pass their release checks. Run lint, all tests and the full build, integrate into current `main`, and use Git-connected Vercel deployment without restarting the relay.

## Recommended decisions

Proceed with three strong lines per opening first; add a fourth only when it teaches something distinct. Keep guided recall and mixed practice. Use a curated, multi-answer final challenge for the “best move” request, with live engine continuation separately scoped. Keep history short and visual, and make full game replay optional.
