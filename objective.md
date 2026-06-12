# Objective

Build a personal chess coach that makes studying chess more enjoyable, more consistent, and more useful. The app should help Rory play real games, understand mistakes, learn openings, and gradually get better without turning chess improvement into a cold engine spreadsheet.

The project starts as a personal tool, not a public platform. It should optimize for a learning loop that feels good enough to return to: play, ask for help, understand one useful idea, remember the lesson, and keep going.

## Vision

The vision is a web-based chess companion that sits between raw engine analysis and human learning.

Chess engines are excellent at finding the best move, but they are not naturally good teachers. This app should translate chess truth into coaching: what mattered, why it mattered, what pattern to remember, and what to try next time.

The product should live somewhere between a serious training tool and a playful coach. It should be accurate and genuinely useful, but it should also feel approachable, encouraging, and a little fun. The goal is not to clone chess.com or Lichess. The goal is to build a personal coach that understands how Rory learns.

At its core, the app should answer one question after every meaningful chess moment:

> What is the useful lesson here?

## Goals

- Make chess study more enjoyable, so improvement feels like something to return to rather than something to endure.
- Help Rory get better by grounding feedback in real positions from real games.
- Support play against an adjustable bot with on-demand coaching.
- Explain mistakes, missed opportunities, tactics, plans, and opening ideas in plain language.
- Build a guided opening-learning experience that teaches not just moves, but plans, piece placement, common traps, and typical middlegame themes.
- Remember recurring weaknesses over time and turn them into targeted practice.
- Keep the experience personal, lightweight, and local-first while the project is still primarily for Rory.

## Product Principles

- **Play first.** Learning should begin from games and positions, not from abstract lectures.
- **Coach, do not just evaluate.** The app should explain the idea behind a move, not merely report an engine score.
- **On-demand help.** Coaching should feel available, not intrusive. The app should not constantly interrupt play.
- **Engine-grounded, human-explained.** The engine provides chess accuracy; the coaching layer turns that into useful teaching.
- **Openings as ideas, not memorization.** Opening study should explain plans, structures, threats, and common continuations, not just drill move orders.
- **Personal over generic.** The app should get better by learning Rory's recurring mistakes, preferred openings, and weak spots.
- **Fun but not gimmicky.** The tone can be playful, but the learning should stay real.
- **Small loops beat grand systems.** Each session should leave Rory with one or two memorable chess ideas.

## V1 Focus

The first version should prove the core learning loop:

1. Play a legal game of chess in the browser against an adjustable bot.
2. Ask for a hint or explanation when stuck.
3. Receive coaching grounded in engine analysis.
4. Finish the game and review key moments.
5. Save the game and track recurring mistake themes locally.

V1 does not need accounts, cloud sync, a full curriculum, or a complete opening trainer. It should feel polished enough to use, but narrow enough to actually finish.

## Opening Learning Vision

Openings should become a major learning mode after the core play-and-coach loop works.

The opening feature should guide Rory through different chess openings by teaching:

- The main purpose of the opening.
- Typical pawn structures.
- Where the pieces usually belong.
- Common tactical ideas and traps.
- What both sides are trying to achieve.
- How the opening commonly transitions into a middlegame.
- Which mistakes Rory personally makes in that opening.

The aim is not to memorize long lines for their own sake. The aim is to build confidence: when an opening appears in a game, Rory should know what kind of position it is and what plans are available.

## Coach Personality

The coach should feel like a playful mentor: warm, direct, practical, and lightly witty. It should celebrate good ideas, call out mistakes without being harsh, and focus on the most useful lesson rather than overwhelming the player with every possible line.

The coach should be comfortable saying things like:

- "The tactic was hiding in the pin."
- "Your instinct was right, but the move order mattered."
- "This is an opening position where the plan matters more than the next engine move."
- "You keep giving away dark-square control. That is becoming a theme."

The tone should make chess feel more learnable, not less serious.

## What This Is Not

- Not a clone of chess.com, Lichess, or any existing chess platform.
- Not an engine UI with a friendly label pasted on top.
- Not a full social chess site.
- Not a public SaaS product on day one.
- Not an app that lets the LLM invent chess analysis without engine grounding.
- Not an opening memorization machine that ignores plans and understanding.

## Long-Term Direction

If the core loop works, the project can grow into a personalized chess learning system:

- Guided opening journeys.
- Imported game review from PGN, Lichess, or Chess.com.
- Targeted lessons based on recurring weaknesses.
- Puzzle sets generated from Rory's own mistakes.
- Human-like sparring partners with different styles.
- Progress dashboards that show what is improving.
- Cloud sync and accounts if the personal tool becomes worth expanding.

The long-term dream is simple: make it easier and more enjoyable for Rory to become a stronger chess player.
