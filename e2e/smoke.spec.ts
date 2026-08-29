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

  await expect(page.getByText('Weekly Schedule')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Week 1,/ })).toBeVisible();
});

test('expands and collapses weeks', async ({ page }) => {
  await generatePlan(page);

  // Week 1 starts expanded; week 2 starts collapsed.
  await expect(page.getByRole('region', { name: 'Week 1 schedule' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Week 2 schedule' })).toBeHidden();

  await page.getByRole('button', { name: /^Week 2,/ }).click();
  await expect(page.getByRole('region', { name: 'Week 2 schedule' })).toBeVisible();

  await page.getByRole('button', { name: 'Collapse all weeks' }).click();
  await expect(page.getByRole('region', { name: 'Week 1 schedule' })).toBeHidden();
  await expect(page.getByRole('region', { name: 'Week 2 schedule' })).toBeHidden();

  await page.getByRole('button', { name: 'Expand all weeks' }).click();
  await expect(page.getByRole('region', { name: 'Week 8 schedule' })).toBeVisible();
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

  await generatePlan(page);
  await page.getByRole('button', { name: 'Expand all weeks' }).click();
  await noHorizontalScroll();
});
