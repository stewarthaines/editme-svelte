# Sample Novel — Outline

This sample is the plainest of the four catalog books — long-form fiction with front matter, clean typography, and Djot's finer affordances where fiction needs them: language-switching spans (fr/de/ru), drop caps, small caps, epigraph/attribution classes. The self-aware authorial voice is deliberate; it disarms rather than sells.

Production notes:

- No hard-wrapping — one line per paragraph.
- Front matter files are separate spine items: titlepage, copyright (deliberately a code block — semantically weak, axe-core will flag it, and that's part of the demo), dedication.

## Files (drafted)

- `titlepage.txt` — classed title/author/publisher
- `copyright.txt` — the code-block colophon
- `dedication.txt` — "For Authors"
- `chapter01.txt` — voice-forward opening; language-switch play; smallcaps demo
- `polostan.txt` — extract from Neal Stephenson's _Polostan_ with attribution + buy link; includes a Russian language switch
- `acknowledgements.txt` — stub, ends in the `[replace me]{.autology}` generator hook

## TODO (author's calls)

- Acknowledgements: real text to replace "Thanks to everyone for all the things."; wire the `autology` generator so "this book is software" lists what the book actually contains.
- Decide whether "At least it isn't A.I.-generated." stays, given the app's About-page AI disclaimer sits one view away.
- Polostan extract: confirm permission/fair-dealing position before the sample ships publicly — attribution and buy link are good practice, not a licence.
