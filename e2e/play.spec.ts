import { test, expect } from '@playwright/test';

// Happy path: open -> build the champion by taking 7 attributes -> arena ->
// 1v1 duel -> fast-forward to the result -> advance. Deterministic (the "Pular"
// button resolves the duel synchronously, so there is no animation timing to flake on).
test('builds a champion and plays the first duel', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Poké Draft Cup' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();

  // 7 attribute picks: always take the first still-enabled attribute chip.
  await expect(page.getByRole('heading', { name: /Monte seu Campeão/ })).toBeVisible();
  for (let i = 0; i < 7; i++) {
    await page.locator('.chip-btn:enabled').first().click();
  }

  // Arena: both champions shown -> fight
  await expect(page.getByRole('heading', { name: /Rodada 1/ })).toBeVisible();
  await expect(page.getByText('Seu Campeão')).toBeVisible();
  await page.getByRole('button', { name: /Lutar/ }).click();

  // Duel: sprites render, then fast-forward to the end
  await expect(page.locator('img.sprite, .sprite.fallback').first()).toBeVisible();
  await page.getByRole('button', { name: /Pular/ }).click();

  await expect(page.locator('.battle-over')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Resolved: won -> next arena (Rodada 2), or lost -> result screen
  await expect(
    page
      .getByRole('heading', { name: /Rodada 2/ })
      .or(page.getByRole('heading', { name: /Eliminado|CAMPEÃO/ })),
  ).toBeVisible();
});
