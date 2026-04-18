import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CertiDocs/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('shows pricing section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Básico').first()).toBeVisible()
    await expect(page.locator('text=Profesional').first()).toBeVisible()
  })

  test('nav link to catalog works', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/solicitar"]')
    await expect(page).toHaveURL('/solicitar')
    await expect(page.locator('h1')).toBeVisible()
  })
})
