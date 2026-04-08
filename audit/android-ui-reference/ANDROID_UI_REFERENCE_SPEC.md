# Hayame Android UI Reference (iOS Parity Baseline)

## UI Parity Summary

This reference mirrors the provided iOS visual baseline for Hayame and standardizes it into a consistent Android-native Compose presentation without changing product scope. It preserves:

- The same page hierarchy, card-first layout, and marketplace structure
- Hayame blue/white brand language with soft-light surfaces
- Rounded cards, pill controls, and dense but readable info rows
- 5-tab bottom navigation (`Home`, `Explore`, `Trips`, `Saved`, `More`)

It intentionally does not add new features, alter flows, or redesign interaction models.

## Design Tokens

### Color

- `BrandBlue`: `#1484D9`
- `BrandNavy`: `#0A2B54`
- `BrandLight`: `#EDF7FF`
- `PageBackground`: `#F7FAFF`
- `Card`: `#FFFFFF`
- `Border`: `#14000000`
- `MutedText`: `#737D91`
- Status: `Success #1CA15F`, `Warning #ED8F30`, `Danger #E04141`

### Spacing (dp)

`4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28`

### Corner Radius (dp)

- `Chip`: 10
- `Input`: 12
- `Row`: 14
- `Card`: 16
- `Hero`: 20
- `Pill`: 999

### Type Hierarchy

- Display: 32 / Bold
- Headline: 26, 22 / Bold
- Title: 18, 16 / Bold; 14 / Semibold
- Body: 14, 13, 12 / Medium
- Label: 12, 11, 10 / Semibold

### Buttons

- Primary: blue-to-navy horizontal gradient, pill radius, white text
- Secondary: light-blue surface, blue border tint, navy text
- Tap targets maintain Android-friendly touch area with padded pill surfaces

### Cards

- White surface, 1dp light border, soft elevation
- Internal vertical rhythm: 8-14dp
- Outer page gutters: 16dp

### Bottom Navigation Behavior

- Fixed 5 tabs: `Home`, `Explore`, `Trips`, `Saved`, `More`
- Active tab uses blue icon/label + light indicator
- Inactive tabs use muted text/icon
- `More` supports unread badge count
- State persists at root scaffold level

## Screen-by-Screen Reference

### 1) Splash

- Layout top-to-bottom:
  1. Gradient background with two soft circular accents
  2. Centered logo block
  3. Tagline
  4. Thin branded progress indicator
- Components: logo container, subtitle text, linear progress
- Spacing: horizontal 24dp; vertical group gap 18dp
- Radius: input/card style for logo block
- Text hierarchy: headline for brand, body for tagline
- Buttons: none
- Card style: soft logo block only
- Bottom nav: hidden

### 2) Home

- Layout top-to-bottom:
  1. Profile mini-header + message icon
  2. Hero marketing card with CTA
  3. Filter/search card
  4. Quick chips row (region/type)
  5. Stats row
  6. Featured cars list
  7. Secondary action footer button
- Components: avatar, hero, chips, stats, list row cards, buttons
- Spacing: page 16dp; section gaps 14dp; card padding 14-18dp
- Radius: hero 20dp, cards 16dp, chips/controls pill
- Text hierarchy: hero display, title section labels, body metadata
- Buttons: primary CTA in hero, secondary utility action
- Card style: white bordered list cards + gradient hero
- Bottom nav: visible; `Home` selected

### 3) Explore

- Layout top-to-bottom:
  1. Search/sort/filter top row
  2. 2-column car grid
- Components: search row, sort chip, filter icon action, grid cards
- Spacing: 16dp outer, 12dp grid gutters
- Radius: row 14dp, cards 16dp, image region 14dp
- Text hierarchy: card title > location > price/meta
- Buttons: favorite floating icon on card image
- Card style: image block + metadata stack
- Bottom nav: visible; `Explore` selected

### 4) Trips

- Layout top-to-bottom:
  1. Payment notice card
  2. Upcoming section + booking cards
  3. Past section + booking cards
- Components: notice, status badges, progress chips, cost chips, action buttons
- Spacing: 16dp page, 14dp section/card gaps, 8dp chip grid spacing
- Radius: card 16dp, chips 10dp, status badges pill
- Text hierarchy: car title > secondary trip data > labels
- Buttons: secondary actions (`Message host`, `Open dispute`)
- Card style: structured info grid with status at top
- Bottom nav: visible; `Trips` selected

### 5) Saved / Favorites

- Layout top-to-bottom:
  1. Section header
  2. Favorite car rows
  3. Summary card (total favorites)
- Components: header, list row cards, favorite icon, summary metric
- Spacing: 16dp page, 14dp between rows
- Radius: row 14dp, cards 16dp
- Text hierarchy: title + concise metadata
- Buttons: icon-based save state
- Card style: same as Home list for parity
- Bottom nav: visible; `Saved` selected

### 6) More / Profile

- Layout top-to-bottom:
  1. Profile identity card
  2. Profile settings action card
  3. Hosting state card
  4. Support links card
  5. Sign out action
- Components: avatar, info rows, action rows, host toggle, links
- Spacing: 16dp page, 14dp section gaps
- Radius: cards 16dp, avatar circle, controls pill/input
- Text hierarchy: headline for name, body for contact/location
- Buttons: secondary `Edit profile`, secondary `Sign out`
- Card style: segmented rows with dividers
- Bottom nav: visible; `More` selected with optional unread badge

### 7) Car Detail Overview

- Layout top-to-bottom:
  1. Title/status summary card
  2. Main gallery area + thumbs
  3. Details card
  4. Description card
  5. Features chips card
  6. Reviews card
  7. Host card + verification + message action
- Components: badges, title/meta, favorite action, details rows, chips
- Spacing: page 16dp; stacked section spacing 14dp
- Radius: hero image 20dp, cards 16dp, chips 10dp
- Text hierarchy: headline car title, title section headers, body metadata
- Buttons: secondary host message action
- Card style: modular information blocks
- Bottom nav: visible when rooted in main scaffold; hidden if opened as modal route

### 8) Car Detail Booking Section

- Layout top-to-bottom:
  1. Trip price/policy block
  2. Verification and cancellation
  3. Date inputs
  4. Quick day chips
  5. Trip-use location inputs
  6. Cost breakdown rows
  7. Protection button
  8. Book Now button
- Components: info lines, mock inputs, quick chips, CTAs
- Spacing: 16dp page; 8-14dp inner spacing
- Radius: input 12dp, card 16dp, chips pill
- Text hierarchy: title rate, label sections, body value rows
- Buttons: secondary utility + primary booking CTA
- Card style: single large booking container with grouped subsections
- Bottom nav: visible if part of tab stack; hidden for full-screen detail route

## Compose Source Mapping

- Design tokens: `compose/HayameDesignSystem.kt`
- Shared components: `compose/HayameSharedComponents.kt`
- Screens: `compose/HayameReferenceScreens.kt`
- Data models/previews: `compose/HayameReferenceModels.kt`
