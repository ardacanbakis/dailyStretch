# DailyStretch

Two apps in one: a neck-first **mobility** routine system and a **workout** tracker,
switched from the header and sharing one install, one history and one set of preferences.

## Mobility

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

### Demonstrations

Every stretch is shown as an animated figure rather than a wall of text. The
figures are drawn from a small kinematic model (`src/figure`): each exercise is
a set of keyframes over joint angles, with side and front views and props for a
chair, wall, desk, mat, foam roller, massage ball and band. They are original
vector drawings, so they work offline, follow the light and dark theme, scale to
any size and respect `prefers-reduced-motion`. The session screen leads with the
animation, a large timer and a single movement cue; the written steps sit behind
a toggle.

## Workout

A strength-training side built on the open
[exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) project:
1,324 exercises with body part, equipment, target muscle and step-by-step
instructions.

- **Twelve workout types**: Full Body, Upper, Lower, Push, Pull, Legs, Posture &
  Upper Back, Core, Arms, Quick Bodyweight, Quick Core and Cardio.
- **Plan generator** that fills a time budget round-robin across the template's
  blocks, so a 20-minute and a 60-minute session are both balanced. It respects
  the equipment you have, avoids what you trained in the last few days, prefers
  favourites, and leaves out advanced calisthenics skills, partner drills and
  stretching entries (the mobility side covers those).
- **Neck-friendly mode**, on by default, which removes behind-the-neck presses,
  upright rows and similar loading.
- **Mobility warm-up and cool-down** drawn from the stretch library, so each
  workout opens with neck and upper-back work.
- **Session player** with per-set reps and weight logging, an automatic rest
  timer, swaps mid-session, and a summary with effort and notes.
- **History** with streak, weekly volume, a 14-day chart, volume by body area and
  best sets per exercise.

### Exercise media

Exercise text and metadata come from the dataset project and are MIT licensed, so
they are bundled here. The animations and thumbnails are **not** bundled: they are
© [Gym visual](https://gymvisual.com/) and are loaded at their original 180x180
size from the dataset repository's own CDN, with the attribution shown wherever
they appear. Lists use the small still image and only the player and detail view
load the animation, which keeps browsing light. If the media host cannot be
reached the app degrades to the exercise name rather than breaking.

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
