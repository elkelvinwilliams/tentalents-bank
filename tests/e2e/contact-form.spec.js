import { expect, test } from '@playwright/test';

test.describe('contact form', () => {
  test('blocks submission when required fields are empty', async ({ page }) => {
    await page.goto('/contact.html');
    const form = page.locator('form[data-demo]');

    await form.locator('[type="submit"]').click();

    await expect(form.locator('.form-success')).toBeHidden();
    await expect(page.locator('#fname:invalid')).toHaveCount(1);
  });

  test('blocks submission when the email is malformed', async ({ page }) => {
    await page.goto('/contact.html');
    const form = page.locator('form[data-demo]');

    await page.fill('#fname', 'Jane');
    await page.fill('#lname', 'Doe');
    await page.fill('#email', 'not-an-email');
    await page.selectOption('#interest', { label: 'Investment Advisory' });
    await page.fill('#message', 'Looking to discuss options.');
    await form.locator('[type="submit"]').click();

    await expect(form.locator('.form-success')).toBeHidden();
    await expect(page.locator('#email:invalid')).toHaveCount(1);
  });

  test('accepts a fully valid submission', async ({ page }) => {
    await page.goto('/contact.html');
    const form = page.locator('form[data-demo]');

    await page.fill('#fname', 'Jane');
    await page.fill('#lname', 'Doe');
    await page.fill('#email', 'jane@example.com');
    await page.selectOption('#interest', { label: 'Investment Advisory' });
    await page.fill('#message', 'Looking to discuss options.');
    await form.locator('[type="submit"]').click();

    await expect(form.locator('.form-success')).toBeVisible();
    await expect(form.locator('[type="submit"]')).toBeEnabled();
  });
});
