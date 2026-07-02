# Design System - Doleth

## Product Context
- What this is: mobile-first personal financial truth system for people with fragmented, multi-layered financial lives.
- Core promise: when user closes Doleth, they know exactly where they stand.
- Product posture: calm without anesthesia, precise without coldness, premium without spectacle.
- Design scope: this document defines visual authority for every future screen.

## Aesthetic Direction
- Direction: quiet precision.
- Decoration level: restrained and intentional.
- Mood: Doleth should feel like a composed instrument, not a noisy dashboard. It should reduce pulse rate while increasing decision quality.
- Visual thesis: less fintech theater, more legible truth.

## 1. Visual Philosophy

### First 3 seconds
Doleth must transmit three things immediately:

1. this is serious;
2. this is understandable;
3. this is under control.

User should never feel dropped into a financial cockpit. They should feel that complexity has already been ordered for them.

### Emotions Doleth should generate
- orientation
- relief
- lucidity
- measured confidence
- respect for reality

### Emotions Doleth must avoid
- guilt
- urgency theater
- childish optimism
- sterile banking coldness
- generic fintech excitement

### Non-negotiable visual principles
1. state before data
2. one dominant truth per screen
3. hierarchy before density
4. explanation before decoration
5. confidence of data is visible, never implicit
6. urgency uses structure before color
7. empty space is used to clarify, not to look expensive
8. every visual emphasis must correspond to decision importance

## 2. Color System

### Color strategy
Doleth uses a restrained mineral palette built around warm light neutrals, ink text, and one calm financial accent. Color is not used to make interface feel exciting. Color is used to establish confidence, depth, and state.

Palette has four layers:
- foundation neutrals
- interface surfaces
- semantic states
- emphasis accents

### Foundation neutrals
- Ink 900: `#171A1F`
- Ink 700: `#303640`
- Ink 500: `#5C6675`
- Ink 300: `#97A0AD`
- Ink 200: `#B7BFCA`
- Ink 100: `#D6DCE3`
- Bone 000: `#F7F5F1`
- Bone 050: `#F2EFE9`
- Bone 100: `#E8E3DB`
- Bone 200: `#DDD7CE`

These are default reading colors. Doleth never uses pure black or pure white as main reading surfaces.

### Core accent family
Primary accent is mineral green. It represents usable clarity, not growth theater.

- Mineral 700: `#184E47`
- Mineral 600: `#1E5D55`
- Mineral 500: `#2A756C`
- Mineral 300: `#86B3AB`
- Mineral 100: `#DDEAE7`

Use:
- primary actions
- selected states
- positive coverage states
- active filters only when selection matters materially

### Support accent family
Muted slate blue exists only for informational emphasis and structured depth, not as brand lead.

- Slate 700: `#2A3D57`
- Slate 500: `#48617F`
- Slate 100: `#E3EAF1`

Use sparingly:
- secondary charts if ever needed
- evidentiary metadata
- non-urgent structural emphasis

### Semantic families

#### Stable / covered
- Stable text: `#1E5D55`
- Stable bg: `#E7F0EE`
- Stable border: `#B9D4CD`

#### Attention
- Attention text: `#8A5A17`
- Attention bg: `#F5EAD6`
- Attention border: `#E6C995`

#### Critical
- Critical text: `#7A4437`
- Critical bg: `#F3E7E2`
- Critical border: `#D8B0A6`

#### Info
- Info text: `#39597A`
- Info bg: `#E9EFF5`
- Info border: `#C3D2E2`

### Surface system
Surfaces are tonal, not stacked card colors.

- `surface.canvas`: `#F7F5F1`
- `surface.base`: `#F2EFE9`
- `surface.raised`: `#FBFAF7`
- `surface.subtle`: `#ECE8E1`
- `surface.inverse`: `#171A1F`

Usage rules:
- canvas is screen background
- base is default grouped surface
- raised is reserved for hero surfaces, sheets, or modal layers
- subtle is used for inline grouped rows and quiet emphasis
- inverse is only for very selective contrast moments, never entire app default

### Text system by role
- `text.strong`: Ink 900
- `text.primary`: Ink 700
- `text.secondary`: Ink 500
- `text.tertiary`: Ink 300
- `text.inverse`: Bone 000
- `text.accent`: Mineral 700
- `text.attention`: Attention text
- `text.critical`: Critical text

### Border system
- `border.subtle`: `rgba(23, 26, 31, 0.08)`
- `border.default`: `rgba(23, 26, 31, 0.14)`
- `border.strong`: `rgba(23, 26, 31, 0.22)`
- `border.accent`: Mineral 300
- `border.attention`: Attention border
- `border.critical`: Critical border

### Token model
- `color.canvas.default`
- `color.surface.base`
- `color.surface.raised`
- `color.text.strong`
- `color.text.secondary`
- `color.action.primary.bg`
- `color.action.primary.text`
- `color.action.secondary.bg`
- `color.state.attention.bg`
- `color.state.attention.border`
- `color.state.critical.bg`
- `color.state.critical.border`
- `color.data.positive`
- `color.data.neutral`
- `color.data.at-risk`

### State rules
- Normal state should rely mostly on neutrals plus one accent.
- Attention should use warm ochre family with low saturation and clear structure.
- Critical should use pale terracotta family with left border, not red card aggression.
- Semantic color never replaces explicit text.
- Green is not default for any positive number. It is reserved for meaningful stability or completion.
- Black text on white surfaces is forbidden as base look because it creates sterile contrast and destroys calm.

### Usage discipline
1. one primary accent family per viewport
2. semantic colors are for state, not decoration
3. large numbers stay neutral unless state materially changes meaning
4. background contrast should be tonal first, chromatic second
5. if two adjacent blocks both need color, one of them should de-escalate to neutral surface

## 3. Typography System

### Typeface strategy
Doleth uses typographic contrast between interpretation and accounting.

- Synthesis / calm statements: `Instrument Serif`
- UI / body / labels: `Satoshi`
- Dense data / ledger / fallback numeric detail: `IBM Plex Mono`

This creates a recognizable voice:
- human when framing reality
- exact when showing values

### Role rules
- `Instrument Serif` is only for short interpretive lines, empty-state headlines, and premium framing.
- `Satoshi` carries interface, labels, body, buttons, navigation, and section titles.
- `IBM Plex Mono` is never used for paragraph copy. It appears only where numerical alignment or evidentiary precision matters.

### Numeric rules
- all financial values use tabular numerals
- large hero values use tabular numerals in `Satoshi` if implementation supports `tnum`; fallback is `IBM Plex Mono`
- comparisons, breakdown rows, and ledger-like evidence always use tabular numerals

### Type scale
- Display XL: 40/44, weight 500, tracking `-0.03em`
- Display L: 32/36, weight 500, tracking `-0.025em`
- Display M: 28/32, weight 500, tracking `-0.02em`
- Heading L: 24/28, weight 550, tracking `-0.02em`
- Heading M: 20/24, weight 550, tracking `-0.015em`
- Heading S: 18/22, weight 550, tracking `-0.01em`
- Body L: 17/24, weight 450, tracking `-0.005em`
- Body M: 15/22, weight 450, tracking `0em`
- Body S: 13/18, weight 450, tracking `0.005em`
- Label L: 15/18, weight 520, tracking `0em`
- Label M: 13/16, weight 520, tracking `0.01em`
- Label S: 12/14, weight 520, tracking `0.02em`
- Data L: 20/24, weight 500, tracking `-0.01em`
- Data M: 16/20, weight 500, tracking `0em`
- Data S: 13/16, weight 500, tracking `0.01em`

### Hierarchy rules
1. every screen gets one visual sentence before its main number
2. numbers dominate through scale, not through bright color
3. labels stay quiet and short
4. metadata never competes with the answer
5. all uppercase is reserved for tiny structural labels only, never for core UI

### Line length
- primary reading copy: 42-64 characters
- metadata rails: 1 line preferred
- explanatory body in sheets: 55-72 characters

## 4. Spacing System

### Spacing philosophy
Doleth should feel breathable, not sparse. Air is created by hierarchy and grouping, not by making everything huge.

### Base system
Use 4px micro-grid with 8px compositional rhythm.

Spacing scale:
- 2: 2px
- 4: 4px
- 8: 8px
- 12: 12px
- 16: 16px
- 20: 20px
- 24: 24px
- 32: 32px
- 40: 40px
- 48: 48px
- 56: 56px
- 72: 72px

### Grid
- phone portrait: 4-column fluid grid
- large phone: 4-column fluid grid with wider gutters
- tablet portrait: 8-column grid
- tablet landscape and desktop app views: 12-column grid

### Margins
- small phone horizontal margin: 16px
- standard phone horizontal margin: 20px
- large phone horizontal margin: 24px
- tablet horizontal margin: 32px to 40px

### Vertical rhythm
- within component: 8 to 16
- between related units: 20 to 24
- between major zones: 32 to 40
- between screen title rail and hero: 24 to 32

### Density rules
- data-heavy rows can compress internally to 12px spacing if labels remain clear
- hero zones must breathe at 24px minimum between major internal regions
- two adjacent neutral surfaces require at least one spacing step more than surface-to-background transitions

### How to create air without wasting space
1. remove duplicate labels before adding whitespace
2. increase spacing between semantic groups, not between every item
3. keep metadata inline and condensed
4. let one dominant number own area instead of surrounding it with multiple cards
5. use clean background to create relief before introducing another bordered surface

## 5. Shape Language

### Core principle
Shapes should feel carved and deliberate, never bubbly.

### Radius scale
- `radius.xs`: 8px
- `radius.sm`: 12px
- `radius.md`: 16px
- `radius.lg`: 22px
- `radius.xl`: 28px
- `radius.full`: 999px

### Usage
- inline controls: 12px
- input fields: 16px
- grouped surfaces: 22px
- hero surfaces: 28px
- pills only when containment truly helps scan

### Borders
- borders are hairline and low-contrast by default
- strong borders are used only for state, containment, or critical hierarchy
- heavy outlines on every component are forbidden

### Separators
- default separator is 1px with `border.subtle`
- inset separators preferred over full-width rules
- separators should organize evidence and rows, not decorate sections

### Surface logic
Use a surface when:
- multiple facts depend on each other
- a state needs local containment
- interaction requires tactile grouping
- layer needs to float from canvas, like a bottom sheet or hero composition

Leave clean background when:
- statement can stand alone
- text acts as system rail or metadata
- grouping would create fake complexity
- adjacent blocks already provide enough structure

### Elevation
Doleth should rely on tonal contrast first, borders second, shadows last.

Elevation tiers:
- Tier 0: canvas only
- Tier 1: tonal lift, no shadow
- Tier 2: tonal lift + subtle border
- Tier 3: sheet/modal with soft shadow

### Shadow system
- `shadow.none`: none
- `shadow.soft`: `0 10px 30px rgba(23, 26, 31, 0.06)`
- `shadow.sheet`: `0 18px 48px rgba(23, 26, 31, 0.10)`

Rules:
- shadow never communicates urgency
- shadow never replaces hierarchy
- shadow is mostly for sheets, modal surfaces, and temporary overlays

## 6. Motion System

### Motion philosophy
Motion in Doleth proves causality. It should never feel decorative.

User should feel:
- this changed because something happened
- this number came from that action
- this layer belongs to same physical system

### Motion principles
1. animate consequence, not chrome
2. numbers settle before secondary metadata
3. avoid simultaneous full-screen motion
4. transitions should reduce uncertainty, not add excitement

### Durations
- micro feedback: 120ms
- numeric update: 180ms
- surface settle: 220ms
- sheet open/close: 280ms
- layout reflow after resolution: 320ms

### Curves
- `curve.snap`: `cubic-bezier(0.22, 1, 0.36, 1)`
- `curve.settle`: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- `curve.exit`: `cubic-bezier(0.4, 0, 0.2, 1)`

### What animates
- hero amount updates
- coverage bar changes
- attention block appears or collapses
- bottom sheet rise and dismiss
- row expansion into evidence
- button press feedback

### What should not animate
- background color floods
- decorative icon spins
- large chart entrances
- navigation chrome bouncing
- every card on first load
- semantic state changes as flashing events

### Stability through motion
When one action affects multiple units, updates happen in sequence:
1. primary number
2. directly related support unit
3. confidence / metadata

This order makes system feel accountable, not magical.

## 7. Iconography

### Style
- outline-first
- slightly geometric, slightly softened
- no cartoon corners
- no filled sticker icons

### Stroke and size
- base stroke: 1.75px at 20px and 24px icons
- small utility icons: 16px
- standard interface icons: 20px
- emphasis/action icons: 24px

### Usage rules
Use icons when they:
- reduce scan time
- mark action type
- signal state clearly
- help differentiate similar controls

Avoid icons when:
- label alone is clearer
- every row would get one by habit
- icon adds brand noise without semantic gain
- color and text already communicate state

### Special rule
Doleth should never depend on icons to explain finance. Icons support orientation, not meaning.

## 8. Component Principles

Every component in Doleth must follow these rules:

1. it resolves one semantic job
2. it exposes one primary action at most
3. it can declare information confidence
4. it supports neutral, partial, attention, and critical states if semantically relevant
5. it never hides evidence deeper than one intentional action
6. it prefers text clarity over icon density
7. it scales from compact to expanded without changing meaning
8. it uses surface only when grouping matters
9. it must remain readable with color de-emphasized
10. it should preserve calm under bad news
11. it should not require tooltip education to be understood
12. it must degrade cleanly on small screens before it fragments into extra modules

## 9. Visual Differentiators

A Doleth screenshot should be recognizable without logo because of five signatures:

1. state-led framing
   - screen answers begin with a human interpretive line before the key number

2. integrated truth surfaces
   - hero areas combine amount, context, and immediate consequence in one composition instead of generic stacked cards

3. warm mineral palette
   - no sterile white, no neon finance green, no purple startup glow

4. accounting-grade evidence
   - bottom sheets and drill-downs read like living calculations, not expandable lists

5. typographic duality
   - human serif for interpretation, precise sans or mono discipline for numbers and evidence

## 10. Design Manifesto

1. Doleth shows state before statistics.
2. Doleth uses hierarchy to calm, not to impress.
3. Doleth never decorates uncertainty.
4. Doleth treats confidence of data as visible product truth.
5. Doleth reserves emphasis for decisions, not for volume of information.
6. Doleth prefers one composed surface over many competing cards.
7. Doleth separates available money from total wealth without ambiguity.
8. Doleth uses color as meaning, never as entertainment.
9. Doleth makes evidence feel native, not forensic.
10. Doleth moves only when movement explains consequence.
11. Doleth remains dignified under financial tension.
12. Doleth feels premium because it is precise.
13. Doleth protects air without wasting room.
14. Doleth speaks human first, accounting second.
15. If a visual choice does not improve financial clarity, it does not belong.
