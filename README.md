# Runathon

A simple web app for generating personalized running training plans based on your race distance and pace goals.

## Features

- **Race Distance Selection**: Choose from 5K, 10K, Half Marathon, or Full Marathon
- **Pace Configuration**: Input your current pace and target pace (per kilometer)
- **Personalized Plans**: Generate week-by-week training schedules tailored to your goals
- **Training Phases**: Plans include Base Building, Build Phase, Peak Training, and Taper phases
- **Workout Variety**: Each week includes intervals, tempo runs, easy runs, long runs, and recovery days

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── DistanceSelector.tsx  # Race distance selection UI
│   ├── PaceInput.tsx         # Pace input component
│   └── TrainingPlanDisplay.tsx # Plan visualization
├── utils/
│   └── planGenerator.ts      # Training plan generation logic
├── types.ts                  # TypeScript type definitions
├── App.tsx                   # Main application component
└── index.css                 # Tailwind CSS imports
```

## How It Works

1. Select your target race distance (5K, 10K, Half Marathon, or Marathon)
2. Enter your current pace per kilometer
3. Enter your target race pace per kilometer
4. Click "Generate Training Plan" to create your personalized schedule

The app generates a multi-week plan with:
- Progressive pace improvements throughout the training cycle
- Varied workout types (intervals, tempo, easy, long runs)
- Appropriate taper period before race day
- Estimated time improvements based on your pace goals

## Training Plan Philosophy

The generated plans follow established running principles:
- **Base Building** (Weeks 1-25%): Build aerobic foundation
- **Build Phase** (Weeks 25-50%): Introduce more intensity
- **Peak Training** (Weeks 50-85%): Maximum training load
- **Taper** (Final weeks): Reduce volume to peak on race day

---

## Future Plans

### Phase 2: Enhanced Training Features
- [ ] Mile/kilometer pace toggle
- [ ] Export plan as PDF/calendar
- [ ] Customizable training days per week
- [ ] Heart rate zone recommendations
- [ ] Rest week insertion

### Phase 3: User Experience
- [ ] Save plans to local storage
- [ ] Dark mode support
- [ ] Mobile-optimized UI improvements
- [ ] Print-friendly view

### Phase 4: Advanced Features
- [ ] User accounts and saved history
- [ ] Integration with running apps (Strava, Garmin)
- [ ] Weather-based workout adjustments
- [ ] Injury prevention tips per workout
- [ ] Progress tracking and adjustments

### Phase 5: Community & Social
- [ ] Share plans with friends
- [ ] Community training groups
- [ ] Coach review options
- [ ] Race day countdown

---

## Contributing

Feel free to open issues or submit PRs for improvements.

## License

MIT
