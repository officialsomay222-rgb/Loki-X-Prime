const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Bypass welcome screen
  await context.addInitScript(() => {
    localStorage.setItem('loki_hasSeenWelcome', 'true');
    localStorage.setItem('loki_commanderName', 'TestUser');
  });

  const page = await context.newPage();

  // Go to dev server
  await page.goto('http://localhost:3000/?settings=true');
  await page.waitForTimeout(4000); // Wait for the "Initializing System" loader

  // Close Settings
  await page.locator('button', { has: page.locator('.lucide-x') }).first().click();
  await page.waitForTimeout(1000);

  // Click on "TRY OUR APPS" text in the sidebar
  await page.getByText('TRY OUR APPS', { exact: true }).click();
  await page.waitForTimeout(1000);

  // Take screenshot of Apps Modal
  await page.screenshot({ path: '/home/jules/verification/apps_modal.png' });

  await browser.close();
})();
