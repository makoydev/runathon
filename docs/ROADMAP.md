# Runathon Roadmap

This roadmap focuses on improvements that make Runathon more useful for runners while keeping the app simple enough to maintain. The order favors features that improve trust in the generated plan before adding account, social, or integration complexity.

## Guiding Principles

- Keep the first-run experience fast: users should be able to generate a useful plan without creating an account.
- Make recommendations explainable: show enough reasoning that runners understand why a workout or mileage target appears.
- Prefer local-first features before backend features: save, print, export, and compare plans can work without accounts.
- Treat training logic as product logic: changes to mileage, taper, or workout distribution should have tests.

## Priority 1: Plan Quality And Trust

- [x] Add experience-level input: beginner, intermediate, advanced.
  - Why: a 5-day plan should look different for a new runner versus a high-mileage runner.
  - Notes: use this to scale mileage, long-run percentage, and intensity frequency.

- [x] Add current weekly mileage input.
  - Why: race distance and pace are not enough to create a safe progression.
  - Notes: cap weekly increases and warn when the goal requires aggressive volume growth.

- [x] Add longest recent run input.
  - Why: long-run progression is one of the biggest safety constraints for half and full marathon plans.
  - Notes: use this to set the opening long run and ramp toward race-specific distance.

- [x] Add cutback/rest weeks.
  - Why: the current plan progresses too smoothly and would benefit from periodic reduced-volume weeks.
  - Notes: every 3-4 weeks, reduce total mileage and quality load while preserving routine.

- [x] Add goal feasibility feedback.
  - Why: users need to know when a target pace or race date looks unrealistic.
  - Notes: classify goals as conservative, moderate, aggressive, or high-risk based on pace delta, timeline, and mileage.

- [x] Improve workout descriptions with warmup/cooldown detail.
  - Why: "5 km tempo" is less actionable than explaining warmup, work segment, and cooldown.
  - Notes: keep `distanceKm` as the source of truth and split display text into workout sections if needed.

## Priority 2: Usability And Retention

- [x] Save generated plans in local storage.
  - Why: users should not lose a plan after refreshing or closing the browser.
  - Notes: include create date, race distance, target pace, and training-days setting.

- [x] Add plan comparison.
  - Why: runners often want to compare 3-day, 4-day, and 5-day schedules before choosing.
  - Notes: compare total mileage, number of quality days, longest run, and race-week structure.

- [x] Add editable plan assumptions.
  - Why: users may need to move long runs or avoid specific weekdays.
  - Notes: start with preferred long-run day and unavailable weekdays before supporting full drag-and-drop editing.

- [x] Add print-friendly view.
  - Why: a training plan is often shared, printed, or saved as a PDF.
  - Notes: create a CSS print layout before adding generated PDFs.

- [x] Add calendar export.
  - Why: calendar integration makes the plan easier to follow.
  - Notes: generate `.ics` client-side with workout title, distance, pace, and notes.

- [x] Add mile/kilometer unit toggle.
  - Why: users in different regions expect different pace units.
  - Notes: store canonical kilometers internally and convert display values at the edge.

## Priority 3: Progress Tracking

- [x] Add workout completion tracking.
  - Why: users need a lightweight way to mark completed, skipped, or modified workouts.
  - Notes: store locally first; track completion status per week/day.

- [x] Add weekly adjustment prompts.
  - Why: plans become more useful when they react to missed workouts or excessive fatigue.
  - Notes: ask simple questions at week boundaries and adjust the next week conservatively.

- [x] Add perceived effort and notes.
  - Why: pace alone misses fatigue, terrain, heat, and recovery status.
  - Notes: record RPE 1-10 and optional notes per workout.

- [x] Add progress summary.
  - Why: users should see whether they are following the plan.
  - Notes: show completion rate, mileage completed, longest run completed, and upcoming key sessions.

## Priority 4: Accessibility And Interface Polish

- [x] Add responsive schedule controls for mobile.
  - Why: expanded week cards can become dense on small screens.
  - Notes: the plan shows one week at a time as day cards that stack on narrow viewports; the overview chart doubles as the week picker.

- [x] Add keyboard navigation checks for week navigation.
  - Why: moving between weeks should work cleanly without a mouse.
  - Notes: accordions were replaced by a week pager; arrow keys and the chart's bar buttons are covered by the e2e smoke test.

- [x] Add high-contrast/dark mode.
  - Why: training plans are often reviewed at night or outdoors.
  - Notes: implement with CSS variables or Tailwind theme tokens.

- [ ] Add clearer empty and warning states.
  - Why: invalid pace or feasibility warnings should be hard to miss but not disruptive.
  - Notes: avoid blocking generation except for invalid input; warn for risky goals.

## Priority 5: Sharing And Integrations

- [x] Add shareable plan links.
  - Why: users may want to send a plan to a coach or friend.
  - Notes: start with URL-encoded plan inputs before introducing server-side storage.

- [ ] Add image or PDF export.
  - Why: shareable artifacts are useful before full social features.
  - Notes: print CSS can be the first version; generated PDF can follow.

- [ ] Add Strava/Garmin import research.
  - Why: current mileage and recent long runs could be imported instead of manually entered.
  - Notes: treat this as a later feature because OAuth, API limits, and privacy add real complexity.

- [ ] Add optional account-based saved history.
  - Why: cross-device persistence becomes useful once local plan saving and progress tracking exist.
  - Notes: defer until there is enough state worth syncing.

## Technical Improvements

- [ ] Separate plan generation into smaller pure functions.
  - Why: mileage, phase selection, workout assignment, trimming, and summary generation are currently close together.
  - Notes: split functions around stable business concepts and keep unit tests focused.

- [ ] Add component tests for core screens.
  - Why: current coverage now includes pace input, but distance selection, training-days changes, and plan display should be covered too.
  - Notes: test user-visible behavior rather than implementation details.

- [x] Add Playwright smoke tests.
  - Why: a browser-level test can catch layout and interaction regressions that unit tests miss.
  - Notes: cover generate, expand/collapse weeks, reset, and mobile viewport rendering.

- [x] Add CI checks.
  - Why: lint, test, and build should run before merges.
  - Notes: use GitHub Actions with Node 22.12.0 from `.nvmrc`.

- [ ] Add release checklist.
  - Why: production changes should verify build, browser smoke test, accessibility basics, and docs updates.
  - Notes: keep this lightweight until deployment exists.

## Suggested Build Order

1. Current weekly mileage and longest recent run inputs.
2. Experience-level scaling and goal feasibility feedback.
3. Cutback weeks and better workout details.
4. Local saved plans.
5. Print-friendly view and calendar export.
6. Unit toggle.
7. Progress tracking.
8. Browser smoke tests and CI.
9. Shareable links.
10. Account or third-party integrations.
