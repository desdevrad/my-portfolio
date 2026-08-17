# Gravitas+ — site architecture

Open `index.html`. Static files, no build step, no dependencies. A GitHub Pages
workflow is included in `.github/workflows/deploy.yml`.

```
index.html                        Home
topics.html                       Topic index (filter + search)
topic-computable-universe.html    A full worked topic — all seven layers
topic-machine-hypothesis.html     Topic 03 — the roadmap's starting topic
account.html                      Sign in / create an account
magazine.html                     Article archive
article-hypothesis-or-sentence.html  A full article — the Magazine template
lab.html                          Interactive lab
game-hypothesis-machine.html      A game you can actually play
learn.html                        The four learning paths
path-ai-in-research.html          One path, expanded
community.html                    Roles, weekly experiment, events
newsletter.html                   Subscribe + archive
about.html                        What this is, and the editorial rules
assets/                           gravitas.css · site.css · hero.css · site.js · hero.js
```

---

## The two decisions that shaped everything

### 1. The topic is the unit, not the video

The roadmap says a video is the *beginning* of a path. So the site is not
organised around episodes — it is organised around **questions**. A topic is
one question with every layer wrapped around it:

| Layer | What it does |
|---|---|
| 01 Film | the way in |
| 02 Essay | the argument, at two depths |
| 03 Sources | three levels — start here / go further / primary |
| 04 Timeline | how the question developed |
| 05 Simulation | something to break |
| 06 Viewpoints | the strongest case *against* our own reading, plus a poll |
| 07 Discussion | comments, this week's question, a public correction log |

`topic-computable-universe.html` is built out in full so the pattern is
concrete rather than described.

### 2. One page, two audiences — not two sites

The brief asks for a clear entry for the general reader *and* real depth for
researchers. The obvious answer — a separate "for researchers" section — is the
wrong one: it splits the audience at the door, halves the value of every piece,
and makes people classify themselves before they know what is inside.

Instead there is a **depth switch** in the header. It re-renders the page in
place: the essay has an overview version and an in-depth version carrying the
mathematics, the code and the primary citations. The choice persists across
pages, and neither version is a teaser — both are the whole argument.

---

## Navigation

Five items: **Topics · Magazine · Lab · Learn · Community**

The roadmap lists six spaces, but Newsletter is an *action*, not a place, so it
is a persistent CTA in the header and footer rather than a nav slot. There is
deliberately no "Watch" item either: here a video opens a topic, it is not a
destination of its own.

## What actually works

Not mockups:

- **Depth switch** — swaps the essay, persists across pages
- **Filtering** — type chips plus free-text search, live count, empty state
- **Hypothesis Machine** — the 2-4-6 task with a physics skin. It counts how many
  of your tests were *confirming* versus *falsifying*, and tells you the ratio at
  the end. Most players find they spent their effort trying to be right rather
  than trying to be wrong, which is the whole lesson.
- **Lorenz simulation** — two identical systems started a hair apart. Set the
  initial precision and watch the prediction horizon collapse; divergence time is
  reported live.
- **Hero** — two-body orbit (draggable on touch), pucker grid with click-ripple, comet cursor
- **Generative card art** — lab cards draw themselves instead of shipping photos

Polls, comments and sign-up forms are front-end only, and say so on screen rather
than pretending to be live.

## Verified

- No console errors on any page
- No broken internal links
- Exactly one `h1` per page
- No horizontal overflow at 360 / 390 / 768 / 1024 / 1440 / 1920px
- Mobile menu opens and closes on selection on every page
- Reduced motion honoured throughout

## Notes

- `gravitas.css` is the brand design system, unchanged. Everything new is in `site.css`.
- Copy is placeholder-grade in places — the architecture is the deliverable.
- To go live you need a backend for: newsletter, accounts, comments, polls.


---

## Changes in this pass

**The depth switch is now contextual.** It was rendering on all eleven pages but
only doing something on one. A persistent control that is inert nine times out of
eleven teaches people to ignore it, and then it is invisible on the pages where
it matters. It now appears only on the topic and the magazine — the two places
that respond to it.

**The magazine gained a second axis.** Depth now works there as reading level
alongside the topic filters: technical pieces recede in Overview and come forward
In depth. They are dimmed rather than hidden, because a list whose count silently
drops looks broken.

**A real article page.** `article-hypothesis-or-sentence.html` is the lead essay
built out — two depths, its own graded sources, and a hand-off to the topic,
the game and the open question. It doubles as the Magazine template.

**Nothing is a dead click any more.** Cards for content that does not exist yet
keep their place, but lose their `href`, gain a **Planned** chip, and cannot be
clicked or focused. Six cited papers were wired to real DOIs and arXiv entries
(Turing 1936, Feynman 1982, Lorenz 1963, Deutsch 1985, Lloyd 2002, Landauer
1961) — a citation that goes nowhere looks like scholarship and isn't.

**A real bug, found and fixed.** The mobile menu never opened on the home page.
`site.js` and `hero.js` both bound the hamburger; both fired on the same tap, the
second read the state the first had just set, and it toggled straight back shut —
so it failed on exactly the one page that loads `hero.js`. The duplicate is gone.

## Verified

| | |
|---|---|
| Pages | 12 |
| Broken links | 0 |
| Unreachable pages | 0 |
| Clickable dead links | 0 |
| Horizontal overflow | none at 360 / 390 / 768 / 1024 / 1440 / 1920px |
| Console errors | none on any page |
| Accessibility | one `h1` per page, skip link, `lang`, no unlabelled buttons, no missing `alt` |
| Mobile menu | opens, closes on selection, navigates |
| Depth switch | +597px of content on the topic, persists across pages |
| Topic simulation | animating and responds to its control |

The only remaining `href="#"` are the five social icons — outbound profiles for
you to fill in, not missing pages.

## Second pass

**Topic 03 is now built out.** The roadmap names AI and ML in scientific
research as the starting point, but the site was leading with *Is the universe
computable?* — a strategic mismatch. `topic-machine-hypothesis.html` carries
all seven layers and the roadmap's harder questions rather than a
tools-and-prompts tour.

Its simulation earns its place: a hidden relationship, noisy measurements, and a
model whose flexibility you control. Raise it and the fit keeps improving while
the prediction gets worse — the essay's argument made touchable rather than
asserted. Measured across the range, fit-error falls monotonically while
prediction-error turns around and climbs.

**The link wiring now lives in the build.** Last pass I repaired the dead links
by editing the output, so the next rebuild wiped every one of them. Source
wiring, the contact address, the community actions and the defusing of unbuilt
cards are all part of `defuse.py` now, and the build is idempotent — running it
twice gives the same clean result.

## Known gaps

Content, not structure: two topics of four, one article, one path of four, one
game of six. The generators mean the next topic is data entry rather than a
rebuild.


---

## Third pass

**Hero** read *Science, and the gravity of questions underneath it*, with
**gravity** carrying the emphasis.

**Grids no longer orphan a card.** `auto-fit` packs as many as will fit and
strands the remainder on a row of its own — that is where the 5+1 and 4+1 came
from. Each grid now declares a column count that divides its item count: six
spaces as 3+3, six roles as 3+3, five programmes as 3+2. Verified at six widths;
every row fills its full width, and the headings no longer count the items
("One path through the site", "What we make", "Roles").

**Join was rebuilt.** It was a form dropped on a flat band. It now uses the
hero's own treatment — the spacetime well and starfield behind it, real vertical
room, and the six roles shown as things you become rather than a sentence
describing them.

**Sign in / create an account** (`account.html`). One page, two panels, switched
rather than navigated, deep-linkable via `#in` and `#up`, with role selection at
sign-up. A **Sign in** action sits in the header on all fourteen pages.

**The host is only on About.** Name and photo removed from the hero, the footer,
the topic byline and the sample comment, ready for other contributors.

**Design-system corrections.** Topic 03's poll was a bespoke component; it now
uses the same result-bar poll as the other topics. The lab's number entry
suppressed the browser spin buttons — small grey chrome that was the ugliest
thing on the page — and reads as a value you are about to test. Both topic
simulations were pinned to the top of their panel and are now vertically centred
(20px above and below).

**Removed:** the Overview / In depth control from the Magazine; "English first"
from the footer and About.


---

## Fourth pass

**The depth switch moved out of the header** into a labelled bar at the top of
the section it governs. In the header it was permanent chrome competing with
navigation on all fourteen pages; in place it reads as a property of the content
and can say what it does.

**Switching depth no longer disturbs the layout.** The rule was
`[data-level="deep"] { display: block }`, which stamped on whatever the element's
own layout was — a flex source row became a block, its level badge lost
`flex: none` and stretched, and the text beside it shifted. `revert` had the same
fault in reverse (an `li` came back as `list-item`, not the author's `flex`). The
rule now only ever *hides* the other side, so every visible element keeps exactly
the display its own CSS gives it. Measured across a switch: badge width and link
position identical, `display: flex` in both states. It also means the content is
all visible with no JavaScript at all.

**Topic 04's simulation fills its panel.** The attractor was drawn from a fixed
baseline at 62% of the height and extends upward from there, so the bottom of the
box was empty — the panel was centred but the figure inside it was not. It now
measures the trajectory's own bounds and derives scale and offset from them:
16px of padding on all four sides, at any size.

**About has a team section** with the photo, built as a list rather than a
one-off block, with an open slot for the contributors to come.

**Also:** TikTok added to the footer on all fourteen pages; the sign-in row's
checkbox and "Forgotten password" now share a baseline; the role cards at sign-up
are all the same height.


---

## Fifth pass

**The Lorenz simulation sits still.** Fitting the view to the live trail meant
scale and offset were recomputed every frame as the trail grew, so the whole
figure breathed — that was the tweaking. It now frames the attractor's known
extent once, on resize only, so the view is constant: 42px above, 40px below,
zero drift between samples. (Hoisting caught me out on the way: `var VIEW` was
declared after its first use, so the script threw and nothing drew at all.)

**Topic 03 was never actually designed.** I had invented `dsr-head`,
`dsr-rail` and `tl` class names that exist nowhere in the stylesheet, so the
page fell back to unstyled defaults — content against the top edge, and a
section rail with no spacing between its links. It is now built from the same
components as Topic 04 (`head_block`, `.layer`, `.topic-nav`, `.split`,
`.video`), and the timeline is a dated list rather than a decorated one.

**Also:** footer icons reordered — YouTube, Instagram, TikTok, X, LinkedIn,
Telegram. About's introduction cut to about a third, team cards enlarged with
LinkedIn and Google Scholar links. The host's comment restored in Topic 04.
Sign-in row separated from the submit button. The community's "How it works"
card now sits level with the poll (0px difference). The join block reduced to one
dominant line and one quiet answer. The magazine drop cap set to a true two-line
cap, so nothing is left hanging under it.

## Sixth pass

**Dossiers are Topics.** The word is gone from the interface, the copy, the class
names (`.topic-nav`), the custom property (`--g-topic-nav-h`) and the filenames —
`topics.html`, `topic-computable-universe.html`, `topic-machine-hypothesis.html`.
Renaming the files breaks any link anyone already holds to the old URLs; that is
a real cost, and worth paying once rather than carrying two vocabularies.

**Hero rewritten.** It now reads *Science, AI and the gravity of underlying
questions*, with **gravity** still carrying the emphasis, over a lede that names
what the project is actually about: how science works, how it changes the world,
and what AI/ML does to research and education. The two calls to action are
**Explore Topics** and **Try Lab** — the first now goes to the index rather than
straight into one topic, because sending a first-time reader into a single
28-minute film was a narrower door than the site deserves. Its icon changed from
a play triangle to an arrow to match.

**The hero no longer fights the reader's finger.** Two things were wrong on touch.
A press-and-drag over the hero started a text selection — magnifier, handles, the
lot — and the gravity interaction was lost behind a selection nobody wanted; hero
copy is now unselectable on coarse pointers (`user-select`, `touch-callout`, plus
`selectstart`/`contextmenu` guards in `hero.js` for engines that ignore the CSS).
Links and buttons keep their long-press menus, and everything below the hero stays
selectable, quotable and translatable.

Second, there was no way to play with the orbit at all: any drag scrolled the
page, which fired `pointercancel` and dropped the third mass the moment it
appeared. There is now a `touch-action: none` patch centred on the pair
(`.lp-orbit__hit`), sized to about 70% of the canvas so it covers the
strong-influence radius with margin. Inside it a drag perturbs the orbit; a few
dozen pixels outside it the page scrolls normally. Locking the whole hero would
have been simpler and would also have trapped the reader on a screen the orbit
nearly fills — the escape route is the point.
