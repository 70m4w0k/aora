import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('landing page shows app name and CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Tipi')).toBeVisible()
    await expect(page.getByRole('button', { name: /commencer/i })).toBeVisible()
  })

  test('navigates to register page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /commencer/i }).click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
  })

  test('navigates to login page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /j'ai déjà un compte/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('bad@email.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page.getByText(/invalide|incorrect/i)).toBeVisible({ timeout: 5000 })
  })
})
