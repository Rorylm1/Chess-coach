/**
 * Rebuild the three imported, recolorable piece families from vendored SVGs.
 * Run: node research/designs/import-extra-pieces.mjs
 * Refresh the same pinned upstream files: add --fetch (requires network access).
 * Node.js and Python 3's standard-library XML parser are the only requirements.
 * Original artwork, license texts and a source manifest remain in public/licenses/chess-pieces.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const destination = join(root, "public/licenses/chess-pieces");
const ROLES = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight", P: "pawn" };
const SOURCES = {
  "maurimo-fantasy": {
    repo: "maurimo/chess-art", revision: "d8705d8bc9879fef44208de19e2a20c937409e1f",
    file: (role) => `fantasy/${role.toLowerCase()}.svg`, license: "LICENSE", licenseFile: "LICENSE-MIT.txt",
  },
  "kiwen-suwi": {
    repo: "neverRare/kiwen-suwi", revision: "7e8f3e473f43474baeebed01e76f054cb06c0100",
    file: (role) => `version/2.100/kiwen-suwi/white-${ROLES[role]}.svg`,
    license: "LICENSE-CC-BY-4.0", licenseFile: "LICENSE-CC-BY-4.0.txt",
  },
  rhosgfx: {
    repo: "lichess-org/lila", revision: "d9f9744af7667f93d2640484f43f2ec163364c66",
    file: (role) => `public/piece/rhosgfx/w${role}.svg`,
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt", licenseFile: "LICENSE-CC0-1.0.txt",
  },
};
const rawUrl = (source, file) => `https://raw.githubusercontent.com/${source.repo}/${source.revision}/${file}`;
async function download(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  writeFileSync(path, await response.text());
}

if (process.argv.includes("--fetch")) {
  for (const [family, source] of Object.entries(SOURCES)) {
    const directory = join(destination, family);
    mkdirSync(join(directory, "source"), { recursive: true });
    for (const role of Object.keys(ROLES)) {
      await download(rawUrl(source, source.file(role)), join(directory, "source", `${role}.svg`));
    }
    await download(source.licenseUrl ?? rawUrl(source, source.license), join(directory, source.licenseFile));
    if (family !== "rhosgfx") await download(rawUrl(source, "README.md"), join(directory, "UPSTREAM-README.md"));
    else {
      const copyingUrl = rawUrl(source, "COPYING.md");
      const response = await fetch(copyingUrl);
      if (!response.ok) throw new Error(`${response.status}: ${copyingUrl}`);
      const row = (await response.text()).split("\n").find((line) => line.includes("public/piece/rhosgfx"));
      if (!row?.includes("CC0")) throw new Error("RhosGFX per-set licensing record changed");
      writeFileSync(join(directory, "UPSTREAM-LICENSE-RECORD.txt"), `Source: ${copyingUrl}\n\n${row}\n\nAuthor's CC0 grant: https://rhosgfx.itch.io/vector-chess-pieces\n`);
    }
  }
}

const originals = {};
const manifest = {};
for (const [family, source] of Object.entries(SOURCES)) {
  originals[family] = {};
  manifest[family] = { repository: `https://github.com/${source.repo}`, revision: source.revision, files: {} };
  for (const role of Object.keys(ROLES)) {
    const svg = readFileSync(join(destination, family, "source", `${role}.svg`), "utf8");
    originals[family][role] = svg;
    manifest[family].files[role] = { url: rawUrl(source, source.file(role)), sha256: createHash("sha256").update(svg).digest("hex") };
  }
}

// Use a real XML parser, resolve the source's presentation classes, then emit only
// local geometry. Fill:none detail lines, separate outline/eye shapes, and transforms
// survive; editor metadata, clip IDs, shadows and source gradient machinery do not.
const normalize = String.raw`
import json, re, sys
import xml.etree.ElementTree as ET

originals = json.load(sys.stdin)
geometry = {'path': ('d',), 'circle': ('cx','cy','r'), 'ellipse': ('cx','cy','rx','ry'),
            'rect': ('x','y','width','height','rx','ry'), 'polygon': ('points',), 'polyline': ('points',)}
presentation = {'fill','fill-rule','fill-opacity','stroke','stroke-width','stroke-linejoin','stroke-linecap','stroke-miterlimit','stroke-opacity','opacity'}
skip = {'defs','style','metadata','title','desc','namedview'}

def declarations(text):
    return dict((key.strip(), value.strip()) for key, value in re.findall(r'([\w-]+)\s*:\s*([^;{}]+)', text or ''))

def paint(value, family):
    value = value.lower().strip()
    if value == 'none': return 'none'
    if value.startswith('url(#') and family == 'maurimo-fantasy': return 'var(--pc-fill)'
    if value in ('#fff', '#ffffff', 'white', '#fff2d4'): return 'var(--pc-fill)'
    if family == 'rhosgfx' and value == '#ffdfb5':
        return 'color-mix(in srgb, var(--pc-fill) 88%, var(--pc-rim))'
    if family == 'rhosgfx' and value == '#f4c38e':
        return 'color-mix(in srgb, var(--pc-fill) 72%, var(--pc-rim))'
    if value in ('#000', '#000000', 'black', '#262626', '#1a1a1a', '#eba969', '#ff0000', '#00ff00'):
        return 'var(--pc-rim)'
    raise ValueError('Unexpected paint: ' + family + ' ' + value)

result = {}
for family, pieces in originals.items():
    output = {'vb': None, 'inner': {}}
    for role, svg in pieces.items():
        source = ET.fromstring(svg)
        vb = source.get('viewBox') or '0 0 ' + source.get('width') + ' ' + source.get('height')
        if output['vb'] not in (None, vb): raise ValueError('Inconsistent viewBox')
        output['vb'] = vb
        classes = {}
        for element in source.iter():
            if element.tag.rsplit('}', 1)[-1] == 'style':
                for name, rules in re.findall(r'\.([\w-]+)\s*\{([^{}]*)\}', element.text or ''):
                    classes[name] = {**classes.get(name, {}), **declarations(rules)}
        def render(element, inherited):
            tag = element.tag.rsplit('}', 1)[-1]
            if tag in skip or 'shadow' in element.get('class', '').split(): return ''
            if tag not in (*geometry, 'g'): raise ValueError('Unexpected visible element: ' + tag)
            style = {**inherited, **{key:value for key,value in element.attrib.items() if key in presentation}}
            for name in element.get('class', '').split(): style.update(classes.get(name, {}))
            style.update(declarations(element.get('style')))
            out = ET.Element(tag)
            transform = element.get('transform')
            if transform:
                if not re.fullmatch(r'[a-zA-Z0-9.,() +\-eE]+', transform): raise ValueError('Invalid transform')
                out.set('transform', transform)
            if tag == 'g':
                inner = ''.join(render(child, style) for child in element)
                attributes = ''.join(' ' + key + '="' + value + '"' for key,value in out.attrib.items())
                return '<g' + attributes + '>' + inner + '</g>'
            for key in geometry[tag]:
                if key in element.attrib: out.set(key, re.sub(r'\s+', ' ', element.get(key)).strip())
            out.set('fill', paint(style.get('fill', '#000'), family))
            out.set('stroke', paint(style.get('stroke', 'none'), family))
            for key in ('fill-rule','fill-opacity','stroke-linejoin','stroke-linecap','stroke-miterlimit','stroke-opacity','opacity'):
                if key in style: out.set(key, style[key])
            # These native coordinate-unit widths must scale with the viewBox. Inline
            # styles override the app's generic non-scaling-stroke rule for paths.
            out.set('style', 'vector-effect:none;paint-order:normal;stroke-width:' + style.get('stroke-width', '1'))
            return ET.tostring(out, encoding='unicode', short_empty_elements=True)
        output['inner'][role] = ''.join(render(child, {}) for child in source)
        if re.search(r'<(?:script|image|use|defs)\b|\b(?:href|id)=|url\(', output['inner'][role]):
            raise ValueError('Non-local SVG content survived normalization')
    result[family] = output
json.dump(result, sys.stdout, separators=(',', ':'))
`;
const data = JSON.parse(execFileSync("python3", ["-c", normalize], {
  input: JSON.stringify(originals), encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
}));
const generated = `/* Generated by research/designs/import-extra-pieces.mjs; rebuild from the pinned, vendored sources.
 * Maurizio Monge Fantasy: MIT; neverRare Kiwen Suwi: CC BY 4.0; RhosGFX: CC0 1.0.
 * Geometry, outline/eye layers and detail lines retained; recolored, gradients flattened,
 * shadows/editor metadata/IDs removed. Attribution: /licenses/chess-pieces/NOTICE.txt.
 */
import type { PieceSet } from "./pieceSets";

export const IMPORTED_PIECE_SETS = ${JSON.stringify(data, null, 2)} satisfies Record<string, PieceSet>;
`;
writeFileSync(join(root, "src/lib/table/importedPieceSets.ts"), generated);
writeFileSync(join(destination, "SOURCE-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Generated maurimo-fantasy, kiwen-suwi and rhosgfx: 18 local recolorable SVGs.");
