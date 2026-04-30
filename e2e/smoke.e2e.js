describe('Smoke', () => {
  it('opens home screen', async () => {
    await expect(element(by.id('home.screen'))).toBeVisible();
  });
});
