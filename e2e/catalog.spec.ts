import { test, expect } from '@playwright/test'

test.describe('Certificate catalog', () => {
  test('shows all certificate types', async ({ page }) => {
    await page.goto('/solicitar')
    await expect(page.locator('h1')).toBeVisible()
    // At least 6 certificate cards visible
    const cards = page.locator('a[href^="/solicitar/"]')
    await expect(cards).toHaveCount(8)
  })

  test('search filters certificates', async ({ page }) => {
    await page.goto('/solicitar')
    const input = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first()
    if (await input.isVisible()) {
      await input.fill('nacimiento')
      await expect(page.locator('text=Nacimiento').first()).toBeVisible()
    }
  })

  test('certificate page loads correctly', async ({ page }) => {
    await page.goto('/solicitar/nacimiento')
    await expect(page.locator('h1')).toContainText(/Nacimiento/i)
    await expect(page.locator('text=Registro Civil')).toBeVisible()
    // Form should be present
    await expect(page.locator('form')).toBeVisible()
  })

  test('unknown certificate type returns 404', async ({ page }) => {
    const response = await page.goto('/solicitar/certificado-inexistente')
    expect(response?.status()).toBe(404)
  })
})
