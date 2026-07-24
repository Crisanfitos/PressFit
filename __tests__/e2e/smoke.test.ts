describe('Smoke Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, launchTimeout: 120000 });
  }, 120000);

  afterAll(async () => {
    await device.terminateApp();
  });

  it('WelcomeScreen should be visible', async () => {
    await expect(element(by.id('welcome-screen'))).toBeVisible().withTimeout(30000);
  }, 30000);

  it('LoginScreen should open when login button is pressed', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible().withTimeout(30000);
  }, 30000);
});
