describe('Navigation', () => {
  it('opens home screen on launch', async () => {
    await expect(element(by.id('home.screen'))).toBeVisible();
  });

  it('opens create character screen from home', async () => {
    await element(by.id('home.createCharacterButton')).tap();
    await expect(element(by.id('createCharacter.screen'))).toBeVisible();
  });

  it('opens DM screen from home', async () => {
    await element(by.id('home.openDMButton')).tap();
    await expect(element(by.id('dm.screen'))).toBeVisible();
  });

  it('opens spellbook screen from home', async () => {
    await element(by.id('home.openSpellbookButton')).tap();
    await expect(element(by.id('spellbook.screen'))).toBeVisible();
  });

  it('opens bestiary screen from home', async () => {
    await element(by.id('home.openBestiaryButton')).tap();
    await expect(element(by.id('bestiary.screen'))).toBeVisible();
  });

  it('opens bestiary screen from references tab', async () => {
    await element(by.text('Герої')).tap();
    await element(by.text('Довідки')).tap();
    await expect(element(by.id('references.screen'))).toBeVisible();
    await element(by.id('references.openBestiaryButton')).tap();
    await expect(element(by.id('bestiary.screen'))).toBeVisible();
  });

  it('opens spellbook screen from references tab', async () => {
    await element(by.text('Герої')).tap();
    await element(by.text('Довідки')).tap();
    await expect(element(by.id('references.screen'))).toBeVisible();
    await element(by.id('references.openSpellbookButton')).tap();
    await expect(element(by.id('spellbook.screen'))).toBeVisible();
  });

  it('opens dice roller screen from home', async () => {
    await element(by.text('Герої')).tap();
    await element(by.id('home.openDiceButton')).tap();
    await expect(element(by.id('diceRoller.screen'))).toBeVisible();
  });
});
