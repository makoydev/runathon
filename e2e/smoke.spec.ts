import { test, expect, type Page } from '@playwright/test';

// Each test gets a fresh browser context, so localStorage starts empty.

async function generatePlan(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /5K, 5 kilometers/i }).click();
  await page.getByRole('button', { name: /generate your personalized training plan/i }).click();
  await expect(page.getByRole('heading', { name: '5K Training Plan' })).toBeVisible();
}

test('generates a plan from the form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Runathon' })).toBeVisible();
  await expect(page.getByText('Select a race distance to get started')).toBeVisible();

  await generatePlan(page);

  await expect(page.getByRole('region', { name: 'Week 1 schedule' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Week 1,/ })).toHaveAttribute('aria-pressed', 'true');
});

test('moves between weeks without scrolling the whole plan', async ({ page }) => {
  await generatePlan(page);

  // Only one week is on screen at a time; the plan opens on week 1.
  await expect(page.getByRole('region', { name: 'Week 1 schedule' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Week 2 schedule' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByRole('region', { name: 'Week 2 schedule' })).toBeVisible();

  // The overview chart doubles as a week picker.
  await page.getByRole('button', { name: /^Week 8,/ }).click();
  await expect(page.getByRole('region', { name: 'Week 8 schedule' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next week' })).toBeDisabled();

  // Arrow keys page through weeks while focus is inside the schedule.
  await page.getByRole('button', { name: 'Previous week' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('region', { name: 'Week 7 schedule' })).toBeVisible();
});

test('resets back to the form and keeps the saved plan', async ({ page }) => {
  await generatePlan(page);

  await page.getByRole('button', { name: 'Create a new training plan' }).click();

  await expect(page.getByText('Select a race distance to get started')).toBeVisible();
  await expect(page.getByText('Saved Plans')).toBeVisible();
  await expect(page.getByRole('button', { name: /^View 5K plan/i })).toBeVisible();
});

test('tracks a workout and shows the progress summary', async ({ page }) => {
  await generatePlan(page);

  await page
    .getByRole('button', { name: /mark week 1 .* as completed/i })
    .first()
    .click();

  await expect(page.getByText('Workouts Completed')).toBeVisible();
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible();
});

test('opens a shared plan link directly on the plan view', async ({ page }) => {
  await page.goto('/?d=10k&cp=360&tp=330&td=5&wm=30&lr=10');

  await expect(page.getByRole('heading', { name: '10K Training Plan' })).toBeVisible();
  // The share query is stripped after import.
  await expect(page).toHaveURL('http://localhost:4173/');
});

test('renders without horizontal overflow', async ({ page }) => {
  const noHorizontalScroll = async () => {
    // Compare against innerWidth, not clientWidth: on Linux the classic
    // vertical scrollbar shrinks clientWidth, which reads as false overflow.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  };

  await page.goto('/');
  await noHorizontalScroll();

  // The schedule comparison table scrolls inside its own container.
  await page.getByRole('button', { name: /10K, 10 kilometers/i }).click();
  await page.getByRole('button', { name: /compare 3 to 6 day schedules/i }).click();
  await expect(page.getByText('Total mileage')).toBeVisible();
  await noHorizontalScroll();

  await generatePlan(page);
  await noHorizontalScroll();
  await page.getByRole('button', { name: /^Week 8,/ }).click();
  await noHorizontalScroll();
});

test('switches to dark mode and remembers the choice', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(html).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Use dark theme' })).toHaveAttribute('aria-pressed', 'true');

  // The preference persists and is applied before the app renders.
  await page.reload();
  await expect(html).toHaveClass(/dark/);

  // It carries over to the plan view, and switching back clears it.
  await generatePlan(page);
  await expect(html).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Use light theme' }).click();
  await expect(html).not.toHaveClass(/dark/);
});
