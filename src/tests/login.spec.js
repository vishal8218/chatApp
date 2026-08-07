import { test, expect } from '@playwright/test';

test('login chat-app', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.getByPlaceholder('Enter your email').fill('vk368065@gmail.com');
    await page.getByPlaceholder('Enter your password').fill('96320');
    await page.getByRole('button', { name: 'Login' }).click();

});