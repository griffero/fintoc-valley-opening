# Verified old Fintoc brand assets

Retrieved 2026-09-07. Original bytes from Fintoc's official GitHub organization. No drawing, tracing, or geometry alteration was performed.

## Ready to use

- `old-fintoc-logo.svg`: Combined old symbol + lowercase wordmark. SVG viewBox `0 0 107 24`; 4 paths: one compound wordmark path plus three symbol paths. The symbol is a blue dot at left and a rounded two-tone right-pointing chevron at right. Wordmark is dark purple. Source: https://raw.githubusercontent.com/fintoc-com/quickstart/b3e932d3dcdeb9719f37500bf96d1d72c54eb229/frontend/src/imagotipo.svg
- `old-fintoc-symbol.svg`: Old symbol alone. SVG viewBox `0 0 20 24`; 3 paths (upper chevron segment, lower chevron segment, dot). Source: https://raw.githubusercontent.com/fintoc-com/quickstart/1b4a21558716c4eb70ca2ce568f872c9a7efe8b0/frontend/src/logo.svg

## Provenance and date

The combined logo was added in official `fintoc-com/quickstart` commit `b3e932d3dcdeb9719f37500bf96d1d72c54eb229`, dated **2021-05-11 04:51:40 UTC**, message "Add styles". GitHub history: https://github.com/fintoc-com/quickstart/commits/main/frontend/src/imagotipo.svg

The symbol's latest change was official commit `1b4a21558716c4eb70ca2ce568f872c9a7efe8b0`, dated **2021-05-06 21:54:44 UTC**, message "Add account list with data retrieved from node fintoc". First addition was 2021-05-05, commit `894a9f942f6b790d659c5de2bbfb4cfb65d7ca6b`. GitHub history: https://github.com/fintoc-com/quickstart/commits/main/frontend/src/logo.svg

Both pinned downloads are byte-identical to the same paths currently remaining in the official repository. Commit API responses are saved in this folder.

The official article **Del código al diseño**, by Belén Galindo, 2024-10-29, explicitly presents before/after brand applications. The old dot/chevron and old wordmark in its BEFORE image visually match these SVG paths. It describes four years with the old logo and the new binary-inspired bar mark. Article: https://www.fintoc.com/cl/blog/del-codigo-al-diseno

The official launch article **Rebranding de Fintoc**, by Cristóbal Griffero, dated **2024-09-26**, announces the new brand. Thus these files are confidently the historical identity used from the early company years before the September 2024 rebrand. Article: https://www.fintoc.com/mx/blog/rebranding

## Colors and fidelity

The downloaded 2021 combined SVG uses wordmark `#0E0946` with fill-opacity `0.88`, symbol upper segment `#6A8DF9`, and main chevron/dot `#475FF1`. These are authentic values in the original 2021 SVG. The 2024 before collage shows a later, more saturated/paler lavender treatment; no claim is made that the 2021 SVG color values match the very last pre-rebrand palette exactly. Geometry is a verified old logo and visibly matches the old brand.

The compound wordmark path includes holes; retain SVG winding/holes when extruding. The symbol is already separated into 3 real paths for editable Three.js geometry. The combined SVG has only a rectangular clipPath around the art, not raster content. No embedded font or bitmap.

## Official raster references

- `official-before.png`: 1280 × 720, official pre-rebrand collage from the design article. https://9zjwe62qxerp8z8t.public.blob.vercel-storage.com/media/wf-3155ea504cf6.png
- `official-after.png`: 1280 × 720, official post-rebrand collage from the same article. https://9zjwe62qxerp8z8t.public.blob.vercel-storage.com/media/wf-05cf57abe719.png
- `quickstart-imagotipo.svg.png`: Quick Look render of original combined SVG solely for inspection; padded square, use SVG itself for production.
- `quickstart-fintoc.png`: 250 × 250 old-symbol round badge from official quickstart `_media/fintoc.png`; authentic but unnecessary given SVG.
- `quickstart-isotipo.png`: 20 × 24 version of the old symbol.
- `widget-logo.png`: REJECTED. Vue placeholder logo, not Fintoc; do not use.

Confidence: **high** that these are authentic original old Fintoc paths, based on first-party source, 2021 commit history, and visual agreement with first-party before/after article.
