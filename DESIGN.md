---
name: SMEasy
description: Simple rostering for Australian small businesses. One system for the whole site, app screens and marketing pages alike.
colors:
  lime: "#b7e021"
  lime-deep: "#65a30d"
  lime-wash: "#ecfccb"
  lime-ink: "#3f6212"
  lime-select: "#d9f99d"
  ink: "#111827"
  slate-secondary: "#4b5563"
  slate-muted: "#6b7280"
  slate-faint: "#c3c8d0"
  hairline: "#e5e7eb"
  divider: "#eef0f3"
  quiet-fill: "#f3f4f6"
  switch-off: "#d1d5db"
  cool-ground: "#f6f7f9"
  white: "#ffffff"
  draft-wash: "#fef3c7"
  draft-ink: "#92400e"
  published-wash: "#dcfce7"
  published-ink: "#166534"
  unfilled-wash: "#fff5f3"
  unfilled-line: "#d9534f"
  unfilled-ink: "#9b2c25"
  off-wash: "#fff7ed"
  off-line: "#fdba74"
  off-ink: "#9a3412"
  holiday-wash: "#fdf2f8"
  holiday-ink: "#9d174d"
  danger: "#b91c1c"
typography:
  display:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title-sm:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    fontFeature: "tnum"
  body:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-sm:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  label:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    fontFeature: "tnum"
  caption:
    fontFamily: "Figtree, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  sm: "10px"
  md: "12px"
  lg: "16px"
  sheet: "20px"
  pill: "999px"
  logo: "7px"
spacing:
  "1": "4px"
  "2": "6px"
  "3": "8px"
  "4": "10px"
  "5": "12px"
  "6": "14px"
  "7": "16px"
  "8": "20px"
components:
  button-accent:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-publish-pill:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-add-round:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "58px"
  button-add-round-beside-publish:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    size: "58px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-secondary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-danger:
    backgroundColor: "{colors.white}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
    height: "46px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  shift-card-unfilled:
    backgroundColor: "{colors.unfilled-wash}"
    textColor: "{colors.unfilled-ink}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  day-chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
  day-chip-holiday:
    backgroundColor: "{colors.holiday-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  status-pill-draft:
    backgroundColor: "{colors.draft-wash}"
    textColor: "{colors.draft-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  status-pill-published:
    backgroundColor: "{colors.published-wash}"
    textColor: "{colors.published-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  role-pill:
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  time-off-block:
    backgroundColor: "{colors.off-wash}"
    textColor: "{colors.off-ink}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  tab-active-indicator:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    width: "56px"
    height: "30px"
  sheet:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.sheet}"
    padding: "8px 20px 20px"
  next-shift-card:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.sheet}"
    padding: "18px 18px 16px"
---

# Design System: SMEasy

## Overview

**Creative North Star: "The Pocket Roster"**

SMEasy's app screens are the category standard done properly: a clean, modern scheduling app that sits comfortably beside Deputy, Homebase and the Square or Afterpay merchant apps. The owner opens it like any app on their phone, sees the week, taps a day, fixes a shift and publishes. Every screen is built from the same few parts: a cool off-white ground, white rounded cards lifted by soft shadows, near-black ink for text and selection, and one lime action.

The system is phone-first and touch-honest. Controls are at least 42px high (the dock buttons 56 to 58px), sheets rise from the bottom on phones, the day follows your thumb when you swipe, and small haptic ticks confirm taps on the tab bar, switches and the add button. On desktop the same language widens into a week grid inside a card, with a top nav in place of the tab bar.

Scope: the whole site. That covers the app screens (`/week`, `/team`, `/settings`, `/welcome`, login, the team roster link `/r` and the personal staff link `/s`) and, since November 2026, the marketing pages under `src/app/(marketing)/` (home, pricing, guides, FAQ, contact, privacy). Everything renders inside the `.app` scope, and the body defaults are the same cool ground, ink and Figtree. The old marketing system (cream ground, IBM Plex Sans, 4 to 6px corners, the `C` palette in `src/lib/theme.ts`) is retired. Marketing applies this system at a larger scale; see "Marketing pages" below.

**Key Characteristics:**
- Cool ground, white borderless cards, soft two-layer shadows.
- One typeface (Figtree), heavy headings (800), tabular numerals everywhere.
- Lime is the single action colour; ink marks selection.
- State lives in tinted pills and washes: amber draft, green published, dashed red unfilled, orange time off, pink public holiday.
- lucide-react line icons, 17 to 21px, stroke 2 to 2.4.
- Bottom sheets and a bottom tab bar on phones (below 720px); dialogs and a top nav on wider screens.

## Colors

A cool slate neutral family carries almost everything. A single acid lime does the asking, and a small set of tinted washes carries state.

### Primary
- **Square Lime** (`lime`): the one action colour and the logo square. It fills the Publish pill, the round add button when it stands alone, accent buttons, the active tab indicator, the on state of switches and the publish success badge. It is used as a fill, with ink text on top. It never appears as text on white.
- **Deep Lime** (`lime-deep`): lime's working shade. It tints the accent button glow, the text caret, and the + in an empty grid cell on hover or focus.
- **Lime Wash** (`lime-wash`) and **Lime Ink** (`lime-ink`): the quiet lime pair. Lime Ink labels today in the week strip and colours info-banner icons.
- **Lime Select** (`lime-select`): the text selection highlight.

### Neutral
- **Ink** (`ink`): body text, headings, primary buttons, and every selected state inside content: the selected day chip, the picked avatar ring, focus outlines and the focused input border.
- **Slate Secondary** (`slate-secondary`): secondary text such as shift times, help copy, field labels and ghost buttons.
- **Slate Muted** (`slate-muted`): tertiary text, inactive nav items, day names and the footer.
- **Slate Faint** (`slate-faint`): dashed placeholder rings, for example "add a person".
- **Hairline** (`hairline`): strokes on inputs, secondary buttons and the nav bars, plus the sheet grab handle.
- **Divider** (`divider`): row rules in the desktop grid, the default avatar fill and the active top-nav item fill.
- **Quiet Fill** (`quiet-fill`): the sheet close button and day-note panels.
- **Switch Off** (`switch-off`): the off switch track and the resting grid +.
- **Cool Ground** (`cool-ground`): the app background, the PWA background colour and overscroll.
- **White** (`white`): cards, sheets and bar surfaces (the top bar at 92% opacity, the tab bar at 96%, both blurred).

### State
- **Draft** (`draft-wash` / `draft-ink`): the week status pill while the roster is unpublished.
- **Published** (`published-wash` / `published-ink`): the status pill once the week is published ("Done" for past weeks).
- **Unfilled** (`unfilled-wash` / `unfilled-line` / `unfilled-ink`): a shift with nobody on it. Wash fill, a 1.5px dashed line, ink text, and a dashed ring in place of the avatar.
- **Time off** (`off-wash` / `off-line` / `off-ink`): approved or requested leave blocks, and time-off request cards.
- **Public holiday** (`holiday-wash` / `holiday-ink`): the holiday day chip, the grid column head and holiday notes.
- **Danger** (`danger`): the text of destructive buttons, shown on white with a hairline border, never as a filled red button.

### Role swatches
Shift roles take a calm categorical palette from `src/lib/roleColors.ts`, assigned by the role's position in the business's role list: lime, blue, apricot, lavender, teal, pink, mustard, with stone for no role. Each swatch is a wash plus a dark text colour (the full set is in the sidecar). Swatches tint role pills, avatar fills on shift cards, and grid chips.

### Named Rules
**The One Lime Rule.** Only one lime action is visible at a time. When the "Publish to team" pill shows, the round add button beside it turns ink. When the pill is gone, the add button is lime. Lime may also mark where you are (the active tab) or that something is on (a switch), but never two competing calls to act.

**The Ink Selects Rule.** Inside content, selection is ink, not lime: the selected day chip is an ink fill with white text, the chosen avatar gets a 2.5px ink ring, and focus is a 2px ink outline.

**The Wash, Not Paint Rule.** State colours appear as pale washes with a dark same-hue text colour. Saturated red appears only as the small gap dot under a day in the week strip.

## Typography

**Display Font:** Figtree (with system-ui, -apple-system, sans-serif), self-hosted, Latin subset, weights 400, 500, 600, 700 and 800.
**Body Font:** Figtree, the same family.

**Character:** A single friendly geometric sans. Its personality comes from weight contrast, with heavy 800 headings over regular 400 body text, and from tight negative tracking on large sizes.

### Hierarchy
- **Display** (800, 34px, 1.1, -0.02em): the staff next-shift time on the ink card. This is the biggest number in the product.
- **Headline** (800, 26px, -0.02em): page titles (Team, Settings, "G'day {name}"). The week title uses 800 at 24px on desktop and 19px on phones.
- **Title** (800, 20px, -0.01em): day headings in the day view and the titles of link-error screens. Sheet titles use 19px, section headings in Settings use 18px (`title-sm`).
- **Body strong** (700, 16px): person names on shift cards and switch labels. 16px is also the input size, so iOS doesn't zoom.
- **Body** (400, 15px, 1.5): help copy and button text (buttons use 600).
- **Body small** (400, 14px, 1.45): shift times, banners and notes.
- **Label** (600, 13px): field labels, role pills (700) and desktop grid chips.
- **Caption** (700, 12px): status pills, tab-bar labels and day names.

### Named Rules
**The Tabular Time Rule.** The `.app` scope sets `font-variant-numeric: tabular-nums`, so times, hours and counts line up in columns. Never turn it off for a numeric run.

**The One Family Rule.** The whole site uses Figtree only. IBM Plex is retired and no longer loaded.

**The Real Weights Rule.** Only 400, 500, 600, 700 and 800 are shipped. Specify one of those.

## Layout

Phone-first, with one content column on a cool ground. The main column is at most 1180px wide and centred, padded 20px 16px 64px. The breakpoint is 720px. Below it the top nav hides, the bottom tab bar appears, sheets dock to the bottom edge, and the main area gains bottom padding of 96px plus the safe-area inset so content clears the tab bar and the dock.

The bottom dock floats 84px above the safe area, inset 16px each side: a flexible lime Publish pill (56px) and a round 58px add button, 10px apart. On desktop the roster becomes a horizontally scrolling grid inside a card, with columns of 190px for names, seven days at least 104px wide, and 64px for totals, at a minimum width of 960px.

Spacing is a tight 2px-stepped rhythm: 4, 6, 8, 10, 12, 14, 16, 20. Most gaps are 8 to 12px, cards are padded 12px 14px (14px 16px for banners and sections), and blocks are stacked 14px apart. Safe-area insets are honoured on the top bar, tab bar, dock and sheets (`viewport-fit: cover`).

## Elevation & Depth

A soft, lifted system. Depth comes from low, diffuse two-layer shadows tinted with ink, never from strokes. Cards rest on the cool ground with an ambient shadow. Tappable cards lift on hover (hover-capable devices only). The dock buttons and sheets sit higher. The one dark surface, the staff next-shift card, gets the deepest shadow. Washed state panels (time off, day notes) drop the shadow and read as flat insets.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgba(17,24,39,0.04), 0 2px 8px rgba(17,24,39,0.06)`): every card at rest.
- **Lift** (`box-shadow: 0 4px 10px rgba(17,24,39,0.08), 0 12px 28px rgba(17,24,39,0.10)`): shift cards on hover (with a 1px rise), sheets, dialogs and the account menu.
- **Dock** (`box-shadow: 0 6px 16px rgba(17,24,39,0.22), 0 2px 4px rgba(17,24,39,0.12)`): the round add button.
- **Lime glow** (`box-shadow: 0 6px 16px rgba(101,163,13,0.35), 0 2px 4px rgba(17,24,39,0.12)`): the Publish pill. Accent buttons use a smaller glow (`0 2px 6px rgba(101,163,13,0.25)`).
- **Hero** (`box-shadow: 0 10px 30px rgba(17,24,39,0.18)`): the ink next-shift card on staff links.
- **Scrim** (`rgba(17,24,39,0.38)`): the backdrop behind sheets and dialogs.

### Named Rules
**The Borderless Card Rule.** Cards have no stroke. The shadow and the white-on-cool contrast separate them. Strokes are reserved for inputs, secondary and danger buttons, the hairline under the top bar and over the tab bar, and the dashed lines that mean "missing".

## Shapes

Generously rounded and friendly, never sharp. Controls are 10px (buttons, inputs, grid chips, time-off blocks). Day chips and inline panels are 12px. Cards are 16px. Sheets and the next-shift card are 20px (phone sheets round only the top corners). Pills and circular buttons are fully round (999px), and avatars are circles. The logo is a 24px lime square with 7px corners and a faint inner bottom shade. Keep it.

**The Dashed Means Missing Rule.** A 1.5px dashed line means nobody is there yet: the unfilled shift card, the dashed avatar ring, the "add a person" ring and the "Unfilled" option in the avatar picker. Don't use dashed lines for decoration.

## Components

### Buttons
Tactile, rounded and confident. Every button presses to a 0.97 scale.
- **Shape:** gently rounded (10px), at least 42px high, padding 10px 16px, Figtree 600 at 15px, icon gap 6px.
- **Accent (lime):** a lime fill with ink text and a small lime glow. Use it for the screen's one main action.
- **Primary (ink):** an ink fill with white text, for confirmations inside sheets.
- **Secondary:** white with a hairline border and ink text. Round 42px icon buttons (prev/next week) use this style.
- **Ghost:** transparent with slate-secondary text, for Done, Log out and the account menu.
- **Danger:** white with a hairline border and danger-red text.
- **Hover / Focus:** a 2px ink focus outline with a 2px offset. Background and shadow transition over 150ms.

### Bottom dock (signature)
The roster's primary actions, floating above the tab bar on phones. "Publish to team" is a full-width lime pill (56px, 16px text). The round add button (58px, plus icon 28px at stroke 2.6) is lime when it is alone and ink when the publish pill is showing (The One Lime Rule). Both carry dock shadows.

### Chips and pills
- **Status pill:** 12px 700, padding 3px 9px, fully round. Draft uses the amber wash, Published the green wash. Colour changes cross-fade over 400ms.
- **Role pill:** 13px 700, padding 4px 10px, fully round, filled with the role swatch.
- **Day chip (week strip):** seven equal chips in a white card with 6px padding and 4px gaps, 12px corners. Each shows the day name (12px 600), the date (18px 800) and an activity bar under the date: the bar grows with the shift count, is lime-deep (lime when selected) when there are shifts, red when there are gaps, and grey when there are none. Selected: ink fill. Holiday: pink wash. Today: the day name in lime ink.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** white on the cool ground.
- **Shadow Strategy:** Rest, then Lift on hover (see Elevation & Depth).
- **Border:** none. The unfilled card takes the dashed unfilled line.
- **Internal Padding:** 12px 14px for list cards, 14px 16px for banners and sections.

### Shift card (signature)
A full-width button card: a 40px avatar (initials in the role swatch), the name in 16px 700, times in 14px slate-secondary ("9:00am – 5:00pm · 7.5h (30m break)"), an optional note line, and a role pill on the right. When unfilled, the card is the unfilled wash with a dashed line and a dashed "?" ring in place of the avatar. On desktop the same information condenses into grid chips (10px corners, 13px 750, the role swatch wash).

### Inputs / Fields
- **Style:** white fill, a hairline border, 10px corners, padding 12px 14px, 16px text, at least 46px high. Labels sit above in 13px 600 slate-secondary with 6px spacing.
- **Focus:** the border turns ink plus a 3px lime ring (`0 0 0 3px rgba(183,224,33,0.45)`). The caret is lime-deep.

### Switch
A 50 by 30px fully round track: switch-off grey when off, lime when on. The 24px white knob has a small shadow and slides over 220ms on the expo-out curve. Toggling gives a haptic tick.

### Navigation
- **Top bar:** sticky, 60px, white at 92% with a 12px blur, a hairline bottom border, the logo on the left, and the business-name account menu on the right.
- **Top nav (720px and wider):** 15px 600 items with 18px icons. The active item is ink text on a divider fill with icon stroke 2.4. Inactive items are slate-muted with stroke 2.
- **Tab bar (below 720px):** fixed bottom, white at 96% with blur, a hairline top border, three items (Roster, Team, Settings). Each is a 21px icon above a 12px 700 label. The active item sits in a 56 by 30px lime pill with icon stroke 2.4. Tapping gives a haptic tick.

### Sheets and dialogs
On phones, a bottom sheet with 20px top corners rises in 340ms and falls in 220ms. On desktop, a centred 460px dialog fades and scales in over 260ms. Both have a 40 by 4px grab handle, a 19px 750 title, and a 40px round quiet-fill close button. Escape closes them and the body stops scrolling while they are open.

### Avatar
A circle with initials (two letters, at 36% of the avatar's size, weight 700). It is filled with the role swatch on shift cards and with lime and ink on the staff next-shift card. In the shift editor's avatar picker, the chosen avatar gets a 2.5px ink ring.

### Next-shift card (staff links)
The one dark surface: an ink card with 20px corners and the Hero shadow. It shows the shift time in Display type, "when" in lime (lime text appears only here, on ink), the role pill, and a footer row of counts with a rule at 12% white.

### Icons
lucide-react line icons, inlined. Sizes run 17 to 21px in controls (17 in buttons, 18 to 20 in nav and headers, 21 in the tab bar), with strokes from 2 to 2.4. Heavier strokes mark the active state, and the dock plus uses 2.6.

### Motion
- **Press:** scale 0.97 over 120ms, `cubic-bezier(.2,.8,.2,1)`.
- **Entrances:** the expo-out curve `cubic-bezier(.16,1,.3,1)`. Routes rise 6px over 260ms. The day slides in 28px from the side you swiped over 320ms, with a 30ms stagger. Copied shifts pop in over 450ms with a 40ms stagger.
- **Exits:** ease-in over 200 to 220ms.
- **Publish:** the badge pops in over 480ms, then its check draws itself over 420ms.
- **Colour changes:** 150 to 220ms ease.
- Loading uses a white shimmer skeleton, 1.3s.
- `prefers-reduced-motion` turns off every animation and transition.

## Marketing pages

The same Pocket Roster parts at marketing scale. Shared style objects live in `src/lib/mkt.ts` (server-safe), and the marketing classes live in the "Marketing pages" block of `globals.css`.

- **Top bar:** the app's 60px sticky bar (white at 92%, blurred, hairline). Nav items use the top-nav treatment, with the active page in ink on a divider fill. The header button is ink, never lime, because each page's own main button is the one lime action.
- **Type scale:** display 800 at clamp(38 to 64px), -0.035em, for the home hero. Page titles are 800 at clamp(32 to 44px), section titles 800 at clamp(26 to 36px), and group headings 800 at 20px. The lead is 17 to 19px slate-secondary. Article body is 17px at line-height 1.7 in #374151, with a measure of 720px or less.
- **Buttons:** links styled as app buttons at 50px (`button()` in `mkt.ts`), with a 0.97 press. Accent lime is the page's main action (hero, closing CTA, the Pro tier, the contact form submit). Secondary is white with a hairline.
- **Containers:** borderless white cards with the Rest shadow. Lists of links, the FAQ and the feature list are one card divided by divider rules (Settings-list style, with chevrons on links), never a grid of same-size cards. Each page gets at most one ink card (staff section, Pro tier, guide CTA).
- **Pills:** state washes. "Coming soon" uses the draft amber wash, "Free during early access" the lime wash, and guide categories the quiet divider pill. No uppercase eyebrows.
- **Photography:** generated documentary photos with one house look: a muted earth palette (cream, timber, olive, soft white), gentle film grain, real Australian small businesses, no logos and no readable text. Vary the framing, light and lens from shot to shot (overhead, macro, exterior, night) so they don't repeat. Guides each have `/guides/<slug>.jpg` (1400 wide), used as the article header and share image, plus a 480px `-thumb` for lists. Alt text lives in `src/content/guideImages.ts`. The business-type strip uses `/types/*.jpg` (4:3), and the desktop login uses a portrait `/login.jpg` filling the left half. Photos sit in 16px-cornered frames with the Rest shadow.
- **Proof:** the home page shows the product in its own interface (`RosterPreview`): the desktop week grid with role swatches, a time-off block and a dashed Unfilled row, and on phones the week strip and shift cards. Its shifts pop in once with the copy-last-week cascade (450ms, 40ms stagger). This is the site's one authored motion. Content stays visible without JS and with reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep exactly one lime action on screen. Turn the round add button ink whenever the lime Publish pill is visible.
- **Do** mark selection inside content in ink (an ink chip fill, a 2.5px ink ring, a 2px ink focus outline).
- **Do** set white cards on the cool ground (#f6f7f9) with the Rest shadow, 16px corners and no border.
- **Do** show state as a wash plus dark text: amber for draft, green for published, a dashed red line for unfilled, orange for time off, pink for public holidays.
- **Do** use lucide-react icons at 17 to 21px with stroke 2 to 2.4, going heavier (2.4) for the active state.
- **Do** keep numbers tabular, and make touch targets at least 42px (56 to 58px for dock actions).
- **Do** turn dialogs into bottom sheets below 720px, and honour safe-area insets on every fixed bar.

### Don't:
- **Don't** show two lime calls to action at once, and don't set lime text on white or on the cool ground.
- **Don't** put borders on cards, or use dashed lines for anything except "nobody assigned yet".
- **Don't** bring back the retired marketing look: cream grounds (#faf8f3 / #f6f4ef), IBM Plex Sans, or 4 to 6px corners, anywhere on the site.
- **Don't** use filled red buttons. Danger is red text on white with a hairline border.
- **Don't** specify font weights between the shipped steps (450, 550, 650, 750). Only 400 to 800 in hundreds are loaded.
- **Don't** label sections with small uppercase eyebrows. Headings and pills carry the hierarchy.
