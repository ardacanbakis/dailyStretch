# DailyStretch

A personal, neck-first mobility and stretching routine system built for remote work.
It behaves like a routine generator rather than a static list of stretches: every
session is assembled from a large exercise library using your daily check-in, your
feedback history, the time you have and where you are (desk, floor, standing).

Runs entirely in the browser. All data is stored on the device (localStorage) and can
be exported or imported as JSON.

## Features

- **Exercise library** of 116 movements covering neck, upper trapezius, levator
  scapulae, shoulders, shoulder blades, chest, thoracic spine, wrists, forearms,
  lower back, hips, hip flexors, glutes, hamstrings, quadriceps, adductors, calves
  and ankles. Each exercise has a demonstration sequence, target areas, instructions,
  duration and repetitions, breathing guidance, common mistakes, an easier version,
  an alternative variation and caution notes. Every movement category has several
  variants (three chin tucks, five thoracic rotations, four pec stretches, and so on).
- **Routine generation engine** (`src/engine`) that:
  1. plans time blocks per body area from a template and the requested duration,
  2. filters the library by safety constraints, equipment, position and desk mode,
  3. scores candidates by favourites, "works well", "don't show often", recent use,
     recent pain reports, today's check-in and template flavour,
  4. fills blocks with weighted selection so routines vary without being random,
  5. never places two variants of the same movement next to each other, caps volume
     per category and area, orders gentle work first and floor work last,
  6. compares against recent routines and retries when a result is too similar.
- **Neck-first prioritisation**: full-body and upper-body templates always include a
  short neck block unless neck work is disabled, advised against, marked "avoid
  today" or reported as symptom-increasing. Cervical exercises are never above
  "gentle" intensity and "sore" restricts them to small-range movements.
- **Routine categories**: six Neck Focus variants, five rotating Quick Desk Resets,
  Upper Body, Lower Body, and four Full Body lengths (5 / 10 / 15-20 / 20-30 min),
  plus custom routines from filters (time, focus, intensity, position, equipment).
- **Surprise Me** picks a category and template from body status, time, recent
  history and neck priority, then generates with all the usual rules.
- **Daily check-in** per region (Good / Tight / Sore / Avoid today) that reshapes
  the session: tight areas get more time, sore areas get conservative work, avoided
  areas are skipped and the neck block is replaced by thoracic, shoulder and chest work.
- **Feedback and personalisation**: Favorite, Works well for me, Don't show often,
  Exclude, Painful (paused for a configurable number of days), plus per-session
  "helpful / painful" ratings that feed future selection.
- **Swapping** before and during a session with 2-4 alternatives that target the
  same area and respect symptoms, exclusions, equipment, position and duration.
- **Session player** with per-exercise timer, demonstration cues, breathing and
  caution notes, pause, skip, back, swap and remove, then a summary where each
  exercise can be rated and the day can be flagged if neck exercises made things worse.
- **History** with streak, weekly totals, 14-day chart, session type breakdown
  (micro / short / full / deep), minutes by body area, most practised exercises and a
  browsable log of every session and the stretches in it.

## Development

```bash
npm install
npm run dev        # start the Vite dev server
npm test           # run the engine test-suite (Vitest)
npm run typecheck  # TypeScript
npm run build      # production build in dist/
```

The app is a static site: deploy the `dist/` folder anywhere. The `base` is relative so
it works from a sub-path too.

## Project layout

```
src/
  types.ts                  domain types and label maps
  data/exercises/           the exercise library, one file per body region
  data/templates.ts         routine templates and custom-focus builder
  engine/                   constraints, scoring, generation, swap, surprise
  engine/__tests__/         Vitest suite for the library and the engine
  state/store.ts            persisted app state and actions
  state/stats.ts            history statistics
  components/               React screens (Home, Preview, Session, Library, ...)
```

## Safety note

DailyStretch offers general mobility guidance and is not medical advice. Keep neck
movements small and comfortable, stop anything that causes sharp pain, dizziness,
numbness or tingling, and follow your clinician's advice for persistent symptoms.
