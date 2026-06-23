# Hayame — Screenshots

Generated from the live iOS app (DEBUG screenshot mode) running on the
**iPhone 17 Pro** simulator, pulling **real listings with real photos** from
production (`https://www.hayamegh.com`).

```
screenshots/
├── ios-mobile/
│   ├── light/   18 screens — full renter journey, light theme
│   └── dark/    18 screens — full renter journey, dark theme
└── app-store-6.5/   12 marketing images (1242×2688) for App Store Connect
```

## ios-mobile/ — in-app screens (light + dark)

The complete renter flow, splash → booking → account. Every listing image is a
real car photo (no empty placeholders).

| # | Screen | # | Screen |
|---|--------|---|--------|
| 01 | Splash | 10 | Booking · location |
| 02 | Sign in | 11 | Booking · review & price |
| 03 | Sign up | 12 | Booking · checkout |
| 04 | Home | 13 | Payment processing |
| 05 | Explore | 14 | Trips |
| 06 | Explore · filters | 15 | Saved / favourites |
| 07 | Car detail | 16 | Messages |
| 08 | Booking · trip details | 17 | Profile / more |
| 09 | Booking · calendar | 18 | Renter dashboard |

Regenerate: `./scripts/capture-ios-screenshots.sh`
(captures both themes; `THEMES="light"` to limit, `DEVICE_NAME=...` to change device.)

## app-store-6.5/ — App Store marketing images (1242 × 2688)

Brand-styled marketing screenshots: navy→blue gradient, white HAYAME logo,
bold headline with a cyan accent word, and the real in-app screenshot in a
premium device frame.

| File | Headline |
|------|----------|
| `00-cover` | Ghana's car-sharing **marketplace** (brand cover card) |
| `01-rent-across-ghana` | Rent cars across **Ghana** |
| `02-find-your-ride` | Find your perfect **ride** |
| `03-every-detail` | Every **detail**, before you book |
| `04-book-in-minutes` | Book in **minutes** |
| `05-transparent-pricing` | Transparent **pricing**, always |
| `06-pay-securely` | Pay **securely**, your way |
| `07-all-your-trips` | All your trips, **one** place |
| `08-save-cars-you-love` | Save the cars you **love** |
| `09-chat-with-hosts` | Chat with **hosts** instantly |
| `10-everything-in-one-hub` | Your rides, **organised** |
| `11-dark-mode` | Beautiful in the **dark** (dark-theme showcase) |

> **Note:** App Store Connect accepts **up to 10** screenshots per display size.
> This folder has 12 so you can pick the best 10 — e.g. use `00-cover` first,
> then any 9 feature/dark slides.

Regenerate: `python3 scripts/build-appstore-screenshots.py`
(or pass slugs, e.g. `python3 scripts/build-appstore-screenshots.py 00 11`).
Requires Pillow + Google Chrome.
