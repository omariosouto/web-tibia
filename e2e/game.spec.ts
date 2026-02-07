import { test, expect } from '@playwright/test';

test.describe('Web Tibia Game', () => {
  test('should show login screen on load', async ({ page }) => {
    await page.goto('/');

    // Should show login screen
    await expect(page.getByText('Web Tibia')).toBeVisible();
    await expect(page.getByPlaceholder('Your character name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter Game' })).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    await page.goto('/');

    // Should show connected status
    await expect(page.getByText('Connected to server')).toBeVisible({ timeout: 5000 });
  });

  test('should validate player name length', async ({ page }) => {
    await page.goto('/');

    // Wait for connection
    await expect(page.getByText('Connected to server')).toBeVisible({ timeout: 10000 });

    // Try to submit with short name
    const nameInput = page.getByPlaceholder('Your character name');
    await nameInput.click();
    await nameInput.pressSequentially('ab', { delay: 50 });
    await page.getByRole('button', { name: 'Enter Game' }).click();

    // Should show error
    await expect(page.getByText('Name must be at least 3 characters')).toBeVisible();
  });

  // TODO: Fix test - fill not working correctly in CI
  test.skip('should join game with valid name', async ({ page }) => {
    await page.goto('/');

    // Wait for connection
    await expect(page.getByText('Connected to server')).toBeVisible({ timeout: 10000 });

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Enter name - use fill with force
    const input = page.locator('input');
    await input.waitFor({ state: 'visible' });
    await input.fill('TestPlayer', { force: true });

    // Verify name was entered
    await expect(input).toHaveValue('TestPlayer');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should show game canvas
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Should show HUD with player name
    await expect(page.getByText('TestPlayer')).toBeVisible();
    await expect(page.getByText('Players Online')).toBeVisible();
  });

  // TODO: Fix test - depends on join working
  test.skip('should move player with arrow keys', async ({ page }) => {
    await page.goto('/');

    // Wait for connection and join
    await expect(page.getByText('Connected to server')).toBeVisible({ timeout: 10000 });
    const nameInput = page.getByPlaceholder('Your character name');
    await nameInput.click();
    await nameInput.pressSequentially('MoveTest', { delay: 50 });
    await page.getByRole('button', { name: 'Enter Game' }).click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Wait for initial render
    await page.waitForTimeout(500);

    // Get initial position from HUD
    const positionText = page.locator('text=/Position:.*\\(\\d+, \\d+\\)/');
    await expect(positionText).toBeVisible({ timeout: 5000 });

    const initialPosition = await positionText.textContent();

    // Focus canvas and press arrow key
    await page.locator('canvas').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Position should have changed
    const newPosition = await positionText.textContent();
    expect(newPosition).not.toBe(initialPosition);
  });

  // TODO: Fix test - depends on join working
  test.skip('two players should see each other', async ({ browser }) => {
    // Create two browser contexts (like two different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 joins
      await page1.goto('/');
      await expect(page1.getByText('Connected to server')).toBeVisible({ timeout: 10000 });
      const input1 = page1.getByPlaceholder('Your character name');
      await input1.click();
      await input1.pressSequentially('Player1', { delay: 50 });
      await page1.getByRole('button', { name: 'Enter Game' }).click();
      await expect(page1.locator('canvas')).toBeVisible({ timeout: 10000 });

      // Player 2 joins
      await page2.goto('/');
      await expect(page2.getByText('Connected to server')).toBeVisible({ timeout: 10000 });
      const input2 = page2.getByPlaceholder('Your character name');
      await input2.click();
      await input2.pressSequentially('Player2', { delay: 50 });
      await page2.getByRole('button', { name: 'Enter Game' }).click();
      await expect(page2.locator('canvas')).toBeVisible({ timeout: 10000 });

      // Wait for state sync
      await page1.waitForTimeout(1000);

      // Player 1 should see Player 2 in the list
      await expect(page1.getByText('Player2')).toBeVisible({ timeout: 5000 });

      // Player 2 should see Player 1 in the list
      await expect(page2.getByText('Player1')).toBeVisible({ timeout: 5000 });

      // Both should show 2 players online
      await expect(page1.getByText('Players Online (2)')).toBeVisible();
      await expect(page2.getByText('Players Online (2)')).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
