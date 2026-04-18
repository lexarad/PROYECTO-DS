import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'noexiste@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error or stay on login page
    await expect(page).toHaveURL(/login/)
  })

  test('register page renders', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('protected dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('protected admin redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/login|unauthorized/)
  })
})
