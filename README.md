# Runathon

A simple web app for generating personalized running training plans based on your race distance and pace goals.

## Features

- **Race Distance Selection**: Choose from 5K, 10K, Half Marathon, or Full Marathon
- **Pace Configuration**: Input your current pace and target pace (per kilometer)
- **Current Training Load**: Add weekly mileage and longest recent run so plans start from your actual baseline
- **Personalized Plans**: Generate week-by-week training schedules tailored to your goals
- **Run-Walk (Galloway) Plans**: Walk breaks from the first minute with a chosen run/walk ratio, plus a 24-week option for half and full marathons
- **Training Phases**: Plans include Base Building, Build Phase, Peak Training, and Taper phases
- **Workout Variety**: Each week includes intervals, tempo runs, easy runs, long runs, and recovery days

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Vitest (testing)

## Getting Started

### Requirements

- Node.js 22.12.0 or newer

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── components/
│   ├── DistanceSelector.tsx    # Race distance selection UI
│   ├── CurrentLoadInputs.tsx   # Current weekly mileage and long-run inputs
│   ├── PaceInput.tsx           # Pace input component
│   ├── TrainingDaysSelector.tsx # Training days per week selector
│   └── TrainingPlanDisplay.tsx # Plan visualization
├── utils/
│   ├── planGenerator.ts        # Training plan generation logic
│   └── planGenerator.test.ts   # Unit tests for plan generator
├── test/
│   └── setup.ts                # Test configuration
├── types.ts                    # TypeScript type definitions
├── App.tsx                     # Main application component
└── index.css                   # Tailwind CSS imports
```

## How It Works

1. Select your target race distance (5K, 10K, Half Marathon, or Marathon)
2. Enter your current pace per kilometer
3. Enter your target race pace per kilometer
4. Enter your current weekly mileage and longest recent run
5. Click "Generate Training Plan" to create your personalized schedule

The app generates a multi-week plan with:
- Progressive pace improvements throughout the training cycle
- Varied workout types (intervals, tempo, easy, long runs)
- Appropriate taper period before race day
- Estimated time improvements based on your pace goals
- Early mileage and long-run progression shaped by your current training load

## Implementation Notes

- Weekly mileage is calculated from the workouts that remain after the selected training-days-per-week adjustment. Rest-day trimming happens before totals are displayed.
- Each scheduled workout stores a numeric `distanceKm` value alongside its display text, so tests and summaries do not need to parse UI strings.
- Pace inputs are controlled by app state. Clearing a pace field commits `0`, preventing hidden stale values from being used when generating a plan.
- Current weekly mileage caps early week-to-week growth, and longest recent run caps early long-run growth.
- Summary copy is generated from the actual workout types in the plan, so lower-frequency plans do not claim interval sessions when those sessions have been removed.

## Quality Checks

```bash
npm run lint
npm run test:run
npm run build
```

## Training Plan Philosophy

The generated plans follow established running principles:
- **Base Building** (Weeks 1-25%): Build aerobic foundation
- **Build Phase** (Weeks 25-50%): Introduce more intensity
- **Peak Training** (Weeks 50-85%): Maximum training load
- **Taper** (Final weeks): Reduce volume to peak on race day

---

## Future Plans

See [docs/ROADMAP.md](docs/ROADMAP.md) for the prioritized improvement plan. The roadmap focuses first on plan quality and trust, then local-first usability features, progress tracking, interface polish, and later sharing/integration work.

---

## Contributing

Feel free to open issues or submit PRs for improvements.

## License

MIT
