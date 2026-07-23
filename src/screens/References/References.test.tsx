import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { initReactI18next } from 'react-i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n, { resources } from '@/i18n';
import References from './References';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  navigation: {
    navigate: vi.fn(),
  },
}));

vi.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
}));

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => mocks.navigation,
}));

vi.mock('@/context/Theme-store', async () => {
  const { darkColors } = await import('@/shared/styles/theme');
  return {
    default: <T,>(selector: (state: { colors: typeof darkColors }) => T): T => selector({ colors: darkColors }),
  };
});

beforeAll(async () => {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      lng: 'uk',
      fallbackLng: 'en',
      defaultNS: 'references',
      interpolation: { escapeValue: false },
    });
  }
  i18n.addResourceBundle('uk', 'references', resources.uk.references, true, true);
  i18n.addResourceBundle('en', 'references', resources.en.references, true, true);
});

beforeEach(async () => {
  mocks.navigation.navigate.mockClear();
  await i18n.changeLanguage('uk');
});

function renderReferences(): ReactTestRenderer {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(<References />);
  });
  return tree!;
}

describe('References screen', () => {
  it('renders references catalog', () => {
    const tree = renderReferences();

    expect(tree.root.findByProps({ testID: 'references.screen' })).toBeTruthy();

    act(() => tree.unmount());
  });

  it('opens bestiary and spellbook entries', () => {
    const tree = renderReferences();

    act(() => {
      tree.root.findByProps({ testID: 'references.openBestiaryButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('List');

    act(() => {
      tree.root.findByProps({ testID: 'references.openSpellbookButton' }).props.onPress();
    });
    expect(mocks.navigation.navigate).toHaveBeenCalledWith('Spellbook');

    act(() => tree.unmount());
  });

  it('renders every localized rules reference without source badges', () => {
    const tree = renderReferences();

    expect(tree.root.findByProps({ testID: 'references.srd.conditions' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.actions-in-combat' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.resting' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.ability-checks' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.saving-throws' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.equipment' }).props.disabled).toBeFalsy();
    expect(tree.root.findByProps({ testID: 'references.srd.spellcasting-basics' }).props.disabled).toBeFalsy();

    const rendered = JSON.stringify(tree.toJSON());
    expect(rendered).toContain('Стани');
    expect(rendered).toContain('Дії в бою');
    expect(rendered).toContain('Короткий відпочинок');
    expect(rendered).toContain('Перевірки характеристик');
    expect(rendered).toContain('Рятівні кидки');
    expect(rendered).toContain('Дубина');
    expect(rendered).toContain('Основи накладання заклять');
    expect(rendered).not.toContain('SRD 5.1');
    expect(tree.root.findAllByProps({ testID: 'references.sourceBadge.conditions' })).toHaveLength(0);
    [
      'conditions',
      'actions-in-combat',
      'resting',
      'ability-checks',
      'saving-throws',
      'equipment',
      'spellcasting-basics',
    ].forEach((entryId) => {
      expect(
        tree.root
          .findByProps({ testID: `references.srd.${entryId}` })
          .findAllByProps({ name: 'chevron-forward-outline' }),
      ).toHaveLength(0);
    });

    act(() => tree.unmount());
  });

  it('updates visible reference text when the language changes', async () => {
    const tree = renderReferences();
    expect(JSON.stringify(tree.toJSON())).toContain('Перевірки характеристик');

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Ability Checks');
    expect(JSON.stringify(tree.toJSON())).toContain('Short rest');

    await act(async () => {
      await i18n.changeLanguage('uk');
    });
    expect(JSON.stringify(tree.toJSON())).toContain('Перевірки характеристик');

    act(() => tree.unmount());
  });
});
