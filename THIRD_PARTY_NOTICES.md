# Additional chess piece artwork

The board randomizer includes these externally authored piece families:

| Family | Artist | License | Source |
| --- | --- | --- | --- |
| Fantasy (`maurimo-fantasy`) | Maurizio Monge | MIT | [chess-art](https://github.com/maurimo/chess-art/tree/d8705d8bc9879fef44208de19e2a20c937409e1f/fantasy) |
| Kiwen Suwi (`kiwen-suwi`) | neverRare | CC BY 4.0 | [Kiwen Suwi 2.100](https://github.com/neverRare/kiwen-suwi/tree/7e8f3e473f43474baeebed01e76f054cb06c0100/version/2.100/kiwen-suwi) |
| Vector Ranks (`rhosgfx`) | RhosGFX | CC0 1.0 | [Artist's release](https://rhosgfx.itch.io/vector-chess-pieces), [pinned SVG distribution](https://github.com/lichess-org/lila/tree/d9f9744af7667f93d2640484f43f2ec163364c66/public/piece/rhosgfx) |

The application recolors these pieces while preserving the source geometry,
separate outline and eye layers, and outline-only detail paths. It removes editor
metadata, reusable IDs and optional shadows; Fantasy's source gradients become
flat material fills, and RhosGFX's shading layers use relative color mixtures.

[The public notice](public/licenses/chess-pieces/NOTICE.txt) records the complete
attribution, chosen licenses, modifications and original sources. Full license
texts and untouched source SVGs are vendored beside it. [The source manifest](public/licenses/chess-pieces/SOURCE-MANIFEST.json)
records pinned revisions, individual URLs and SHA-256 digests.

Fantasy uses Maurizio Monge's current explicit MIT grant in the pinned author
README and LICENSE. Some source SVGs still contain historical GPL metadata; the
current author-issued MIT grant is preserved in the vendored source directory.

Rebuild the normalized module offline with
`node research/designs/import-extra-pieces.mjs`; add `--fetch` only to download the
same pinned source files again. The importer requires Node.js and Python 3.
