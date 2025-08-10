import React, { JSX, useMemo, useState } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { getStyles } from '@/screens/CreateCharacter/style';
import useThemeStore from '@/context/Theme-store';
import useCharacterStore from '@/context/Character-store';
import { createEmptyCharacter } from '@/shared/helpers/createEmptyCharacter';
import { CLASS_OPTIONS, CLASS_TRANSLATIONS } from '@/shared/const/CharacterClass';
import { SUBCLASSES } from '@/shared/const/Subclasses';
import { RACES, RACE_OPTIONS, SUBRACE_OPTIONS, AbilityKey, RaceDefinition } from '@/shared/const/Races';
import { CLASS_PRESETS } from '@/shared/const/ClassPresets';
import { BACKGROUNDS, BACKGROUND_OPTIONS } from '@/shared/const/Backgrounds';
import { SUBCLASS_DETAILS } from '@/shared/const/SubclassDetails';
import { CLASS_GEAR } from '@/shared/const/ClassStartingGear';

type Mode = 'standard' | 'quick';
type StatMethod = 'array' | 'pointbuy';

const STANDARD_ARRAY: Record<AbilityKey, number> = {
  strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8,
};

const POINT_BUY_MIN = 8;
const POINT_BUY_MAX = 15;
const POINT_BUY_BUDGET = 27;

const COST: Record<number, number> = { 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 };

const ABILITY_NAMES_UA: Record<AbilityKey, string> = {
  strength: 'Сила', dexterity: 'Спритність', constitution: 'Статура',
  intelligence: 'Інтелект', wisdom: 'Мудрість', charisma: 'Харизма',
};

const CreateCharacter = (): JSX.Element => {
  const navigation = useNavigation<any>();
  const c = useThemeStore((s) => s.colors);
  const styles = getStyles(c);
  const addCharacter = useCharacterStore((s) => s.addCharacter);

  const [mode, setMode] = useState<Mode>('standard');
  const [step, setStep] = useState<number>(1);

  // Basics
  const [name, setName] = useState('');
  const [level, setLevel] = useState('1');

  // Race + subrace
  const [raceKey, setRaceKey] = useState<string>(RACE_OPTIONS[0]);
  const [subraceKey, setSubraceKey] = useState<string>('');
  const [customRace, setCustomRace] = useState<string>('');
  const [customSubrace, setCustomSubrace] = useState<string>('');
  const [useCustomRace, setUseCustomRace] = useState<boolean>(false);

  // Class + subclass
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [customClassName, setCustomClassName] = useState('');
  const [subclass, setSubclass] = useState<string>('');
  const [customSubclass, setCustomSubclass] = useState<string>('');

  // Gear choices per class
  const gearDef = selectedClass !== 'custom' ? CLASS_GEAR[selectedClass] : undefined;
  const [gearSelections, setGearSelections] = useState<number[]>([]);


  // Background
  const [backgroundKey, setBackgroundKey] = useState<string>(BACKGROUND_OPTIONS[0]);
  const [customBackground, setCustomBackground] = useState<string>('');

  // Stats
  const [statMethod, setStatMethod] = useState<StatMethod>('array');
  const [stats, setStats] = useState<Record<AbilityKey, number>>({ ...STANDARD_ARRAY });
  const [pbStats, setPbStats] = useState<Record<AbilityKey, number>>({
    strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8,
  });

  // Flexible +1/+1 picks (e.g., Half-Elf / Variant Human)
  const [flexPick1, setFlexPick1] = useState<AbilityKey>('strength');
  const [flexPick2, setFlexPick2] = useState<AbilityKey>('dexterity');

  const isCustomRace = useCustomRace;

  const raceDef: RaceDefinition | undefined = !isCustomRace ? RACES[raceKey] : undefined;
  const subraceDef = !isCustomRace && subraceKey ? raceDef?.subraces?.[subraceKey] : undefined;
  const availableSubclasses = selectedClass === 'custom' ? [] : (SUBCLASSES[selectedClass] || []);

  const localizedClassName = useMemo(() => {
    if (selectedClass === 'custom') return customClassName || 'Custom';
    return CLASS_TRANSLATIONS[selectedClass] || selectedClass;
  }, [selectedClass, customClassName]);

  const baseStats = useMemo(() => {
    if (mode === 'standard') {
      return statMethod === 'array' ? stats : pbStats;
    }
    return { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
  }, [mode, stats, pbStats, statMethod]);

  // Racial bonuses, including flexible picks
  const racialBonus = useMemo(() => {
    const b: Record<AbilityKey, number> = { strength:0,dexterity:0,constitution:0,intelligence:0,wisdom:0,charisma:0 };
    if (raceDef?.asi) Object.entries(raceDef.asi).forEach(([k,v]) => (b as any)[k]+=v as number);
    if (subraceDef?.asi) Object.entries(subraceDef.asi).forEach(([k,v]) => (b as any)[k]+=v as number);
    const flex = subraceDef?.flexible || raceDef?.flexible;
    if (flex?.count === 2) {
      // enforce distinct + not excluded
      const exclude = new Set(flex.exclude || []);
      if (flexPick1 && !exclude.has(flexPick1)) (b as any)[flexPick1] += 1;
      if (flexPick2 && flexPick2 !== flexPick1 && !exclude.has(flexPick2)) (b as any)[flexPick2] += 1;
    }
    return b;
  }, [raceDef, subraceDef, flexPick1, flexPick2]);

  const finalStats = useMemo(() => {
    const out: Record<AbilityKey, number> = { strength:0,dexterity:0,constitution:0,intelligence:0,wisdom:0,charisma:0 };
    (Object.keys(out) as AbilityKey[]).forEach((k) => { out[k] = (baseStats as any)[k] + (racialBonus as any)[k]; });
    return out;
  }, [baseStats, racialBonus]);

  const validateStep1 = () => {
    if (!name.trim()) { Alert.alert('Помилка','Введіть ім’я героя'); return false; }
    const lvl = Number(level);
    if (!Number.isFinite(lvl) || lvl < 1 || lvl > 20) { Alert.alert('Помилка','Рівень 1–20'); return false; }
    if (isCustomRace && !customRace.trim()) { Alert.alert('Помилка','Вкажіть назву своєї раси'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (selectedClass === 'custom' && !customClassName.trim()) {
      Alert.alert('Помилка', 'Введіть назву свого класу'); return false;
    }
    return true;
  };

  const pointBuySpent = useMemo(() => {
    return (Object.values(pbStats) as number[]).reduce((sum, v) => sum + COST[v], 0);
  }, [pbStats]);

  const pointBuyValid = pointBuySpent <= POINT_BUY_BUDGET;

  // Coins by background (PHB typical)
  const BG_COINS: Record<string, number> = {
    acolyte: 15, criminal: 15, soldier: 10, entertainer: 15, folkhero: 10,
    guildartisan: 15, hermit: 5, noble: 25, outlander: 10, sage: 10, sailor: 10, urchin: 10,
  };
  const finalCoins = useMemo(() => {
    const gp = BG_COINS[backgroundKey] || 0;
    return { gold: gp, silver: 0, copper: 0 };
  }, [backgroundKey]);

  const chosenInventory: string[] = useMemo(() => {
    if (selectedClass === 'custom') {
      return ['Проста зброя', 'Рюкзак мандрівника'];
    }
    if (!gearDef) return [];
    const picks = gearDef.choices.map((ch, i) => ch.options[gearSelections[i] ?? 0] || ch.options[0]);
    return [...gearDef.base, ...picks];
  }, [selectedClass, gearDef, gearSelections]);


  const onCreate = () => {
    // final validation
    if (!validateStep1() || !validateStep2()) return;
    if (mode === 'standard' && statMethod === 'pointbuy' && pointBuySpent > POINT_BUY_BUDGET) {
      Alert.alert('Помилка', 'Перевищено ліміт 27 очок'); return;
    }
    const lvl = Number(level);
    const resolvedRace = isCustomRace ? customRace.trim() : (raceDef?.name || raceKey);
    const resolvedSubrace = isCustomRace ? (customSubrace.trim() || undefined) : (subraceKey || undefined);

    const char = createEmptyCharacter({
      name: name.trim(),
      class: selectedClass === 'custom' ? customClassName.trim() : selectedClass,
      subclass: selectedClass === 'custom' ? (customSubclass || undefined) : (subclass || undefined),
      race: resolvedRace,
      subrace: resolvedSubrace,
      level: lvl,
      stats: finalStats,
      // Here we could map backgrounds, proficiencies etc. into your schema later if needed
    });
    // attach gear and coins
    (char as any).inventory = chosenInventory;
    (char as any).coins = finalCoins;
    addCharacter(char);
    Alert.alert('Готово', 'Персонажа створено');
    navigation.goBack();
  };

  // UI helpers
  const Header = ({ title }:{title:string}) => (
    <Text style={[styles.label, { fontSize: 18, fontWeight: '700', marginBottom: 8 }]}>{title}</Text>
  );

  const ModeSwitcher = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      {(['standard','quick'] as Mode[]).map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => setMode(m)}
          style={{ flex:1, paddingVertical:10, borderRadius:10, backgroundColor: mode===m? c.text:c.card, alignItems:'center' }}
        >
          <Text style={{ color: mode===m? c.background:c.text, fontWeight:'600' }}>{m==='standard'?'Стандартний':'Швидкий'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const RacePicker = () => (
    <>
      <Text style={styles.label}>Раса:</Text>
      <Picker selectedValue={isCustomRace ? 'custom' : raceKey} style={styles.picker}
        onValueChange={(v) => {
          if (v==='custom') { setUseCustomRace(true); return; }
          setUseCustomRace(false);
          setRaceKey(v); setSubraceKey('');
        }}
      >
        {RACE_OPTIONS.map((rk) => (
          <Picker.Item key={rk} label={RACES[rk].name} value={rk} />
        ))}
        <Picker.Item label="Своя раса…" value="custom" />
      </Picker>

      {isCustomRace ? (
        <>
          <Text style={styles.label}>Назва своєї раси:</Text>
          <TextInput style={styles.input} value={customRace} onChangeText={setCustomRace} />
          <Text style={styles.label}>Підраса (необов’язково):</Text>
          <TextInput style={styles.input} value={customSubrace} onChangeText={setCustomSubrace} />
        </>
      ) : (
        <>
          {!!SUBRACE_OPTIONS(raceKey).length && (
            <>
              <Text style={styles.label}>Підраса:</Text>
              <Picker selectedValue={subraceKey} style={styles.picker} onValueChange={setSubraceKey}>
                <Picker.Item label="(без підраси)" value="" />
                {SUBRACE_OPTIONS(raceKey).map((sr) => (
                  <Picker.Item key={sr} label={sr} value={sr} />
                ))}
              </Picker>
            </>
          )}
          {!!(raceDef?.description || subraceDef?.description) && (
            <View style={{ backgroundColor: c.card, padding: 10, borderRadius: 8, marginTop: 8 }}>
              <Text style={{ color: c.text }}>{subraceDef?.description || raceDef?.description}</Text>
            </View>
          )}
        </>
      )}

      {/* Flexible +1/+1 */}
      {(!isCustomRace) && ((subraceDef?.flexible || raceDef?.flexible)) && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.label, { fontWeight:'600' }]}>Гнучкі бонуси: {subraceDef?.flexible?.note || raceDef?.flexible?.note}</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ flex:1 }}>
              <Text style={styles.label}>+1 до</Text>
              <Picker selectedValue={flexPick1} style={styles.picker} onValueChange={(v)=>setFlexPick1(v)}>
                {(Object.keys(ABILITY_NAMES_UA) as AbilityKey[]).map((k)=>(
                  <Picker.Item key={k} label={ABILITY_NAMES_UA[k]} value={k} />
                ))}
              </Picker>
            </View>
            <View style={{ flex:1 }}>
              <Text style={styles.label}>+1 до (іншої)</Text>
              <Picker selectedValue={flexPick2} style={styles.picker} onValueChange={(v)=>setFlexPick2(v)}>
                {(Object.keys(ABILITY_NAMES_UA) as AbilityKey[]).map((k)=>(
                  <Picker.Item key={k} label={ABILITY_NAMES_UA[k]} value={k} />
                ))}
              </Picker>
            </View>
          </View>
          {!!raceDef?.flexible?.exclude?.length && (
            <Text style={{ color: c.textSecondary, marginTop: 4 }}>Обмеження: не можна обирати {raceDef?.flexible?.exclude?.map(k=>ABILITY_NAMES_UA[k]).join(', ')}</Text>
          )}
        </View>
      )}
    </>
  );

  const ClassPicker = () => (
    <>
      <Text style={styles.label}>Клас:</Text>
      <Picker
        selectedValue={selectedClass}
        style={styles.picker}
        onValueChange={(v) => { setSelectedClass(v); setSubclass(''); setCustomSubclass(''); setGearSelections([]); }}
      >
        {CLASS_OPTIONS.map((opt) => (
          <Picker.Item key={opt} label={CLASS_TRANSLATIONS[opt] || opt} value={opt} />
        ))}
      </Picker>

      {selectedClass === 'custom' ? (
        <>
          <Text style={styles.label}>Назва свого класу:</Text>
          <TextInput style={styles.input} value={customClassName} onChangeText={setCustomClassName} />
          <Text style={styles.label}>Підклас (необов’язково):</Text>
          <TextInput style={styles.input} value={customSubclass} onChangeText={setCustomSubclass} placeholder="Напр.: Shadow Dancer" />
        </>
      ) : (
        <>
          <Text style={styles.label}>Підклас:</Text>
          <Picker selectedValue={subclass} style={styles.picker} onValueChange={(v)=>setSubclass(v)}>
            <Picker.Item label="(без підкласу)" value="" />
            {availableSubclasses.map((s) => (<Picker.Item key={s} label={s} value={s} />))}
          </Picker>

          {/* Class details */}
          {!!CLASS_PRESETS[selectedClass] && (
            <View style={{ backgroundColor: c.card, padding: 10, borderRadius: 8, marginTop: 8 }}>
              <Text style={{ color: c.text }}>
                <Text style={{ fontWeight:'700' }}>Хіт-дайс:</Text> d{CLASS_PRESETS[selectedClass].hitDie}{'\n'}
                <Text style={{ fontWeight:'700' }}>Сейви:</Text> {CLASS_PRESETS[selectedClass].savingThrows.map(st=>ABILITY_NAMES_UA[st as AbilityKey]).join(', ')}{'\n'}
                <Text style={{ fontWeight:'700' }}>Основні характеристики:</Text> {CLASS_PRESETS[selectedClass].primaryAbilities.map(st=>ABILITY_NAMES_UA[st as AbilityKey]).join(', ')}{'\n'}
                {!!CLASS_PRESETS[selectedClass].spellcastingAbility && (<Text><Text style={{ fontWeight:'700' }}>Маг. характеристика:</Text> {ABILITY_NAMES_UA[CLASS_PRESETS[selectedClass].spellcastingAbility as AbilityKey]}</Text>)}
              </Text>
              <Text style={{ color: c.text, marginTop: 6 }}>
                <Text style={{ fontWeight:'700' }}>Профіцієнсі:</Text> {CLASS_PRESETS[selectedClass].proficiencies.join(', ')}
              </Text>
            </View>
          )}

          {/* Subclass details */}
          {!!(subclass && SUBCLASS_DETAILS[selectedClass]?.[subclass]) && (
            <View style={{ backgroundColor: c.card, padding: 10, borderRadius: 8, marginTop: 8 }}>
              <Text style={{ color: c.text }}>{SUBCLASS_DETAILS[selectedClass][subclass]}</Text>
            </View>
          )}
        </>
      )}
    </>
  );

  const StatMethodSwitcher = () => (
    <View style={{ flexDirection:'row', gap:8, marginBottom: 12 }}>
      {(['array','pointbuy'] as StatMethod[]).map((m) => (
        <TouchableOpacity key={m} onPress={() => { setStatMethod(m); if (m==='array') setStats({ ...STANDARD_ARRAY }); }}
          style={{ flex:1, paddingVertical:10, borderRadius:10, backgroundColor: statMethod===m? c.text:c.card, alignItems:'center' }}>
          <Text style={{ color: statMethod===m? c.background:c.text, fontWeight:'600' }}>{m==='array'?'Стандартний масив':'Point Buy (27)'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const ArrayEditor = () => (
    <View>
      {(Object.keys(ABILITY_NAMES_UA) as AbilityKey[]).map((k) => (
        <View key={k} style={{ marginTop: 8 }}>
          <Text style={styles.label}>{ABILITY_NAMES_UA[k]}</Text>
          <TextInput
            style={styles.input}
            value={String(stats[k])}
            onChangeText={(t)=>{
              const n = parseInt(t||'0',10);
              setStats(s=>({ ...s, [k]: Number.isFinite(n)? n: 8 }));
            }}
            keyboardType="numeric"
          />
        </View>
      ))}
    </View>
  );

  const PbRow = ({ k }: { k: AbilityKey }) => {
    const val = pbStats[k];
    const spent = (Object.values(pbStats) as number[]).reduce((sum, v) => sum + COST[v], 0);
    const remaining = POINT_BUY_BUDGET - spent;
    const canInc = val < POINT_BUY_MAX && remaining >= (COST[val+1] - COST[val]);
    const canDec = val > POINT_BUY_MIN;
    return (
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop: 10 }}>
        <Text style={{ color: c.text, width: 120 }}>{ABILITY_NAMES_UA[k]}</Text>
        <TouchableOpacity onPress={()=> canDec && setPbStats(s=>({ ...s, [k]: s[k]-1 }))} style={{ padding:8, backgroundColor:c.card, borderRadius:8 }}>
          <Text style={{ color: c.text }}>-</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, minWidth: 32, textAlign:'center' }}>{val}</Text>
        <TouchableOpacity onPress={()=> canInc && setPbStats(s=>({ ...s, [k]: s[k]+1 }))} style={{ padding:8, backgroundColor:c.card, borderRadius:8 }}>
          <Text style={{ color: c.text }}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const PointBuyEditor = () => {
    const spent = pointBuySpent;
    const over = spent > POINT_BUY_BUDGET;
    return (
      <View>
        {(Object.keys(ABILITY_NAMES_UA) as AbilityKey[]).map((k) => (<PbRow key={k} k={k} />))}
        <Text style={{ color: over ? 'tomato' : c.textSecondary, marginTop: 12 }}>
          Використано очок: {spent}/{POINT_BUY_BUDGET}{over?' — Перевищено ліміт 27 очок':''}
        </Text>
      </View>
    );
  };

  // Background picker
  const bg = BACKGROUNDS.find(b => b.key === backgroundKey);
  const BackgroundPicker = () => (
    <>
      <Text style={styles.label}>Фон:</Text>
      <Picker selectedValue={backgroundKey} style={styles.picker} onValueChange={setBackgroundKey}>
        {BACKGROUNDS.map(b => (<Picker.Item key={b.key} label={b.name} value={b.key} />))}
        <Picker.Item label="Свій фон…" value="custom" />
      </Picker>
      {backgroundKey === 'custom' ? (
        <>
          <Text style={styles.label}>Назва свого фону:</Text>
          <TextInput style={styles.input} value={customBackground} onChangeText={setCustomBackground} />
        </>
      ) : (
        bg && (
          <View style={{ backgroundColor: c.card, padding: 10, borderRadius: 8, marginTop: 8 }}>
            <Text style={{ color: c.text }}>
              <Text style={{ fontWeight:'700' }}>Навички:</Text> {bg.skills.join(', ')}{'\n'}
              {!!bg.tools?.length && (<Text><Text style={{ fontWeight:'700' }}>Інструменти:</Text> {bg.tools.join(', ')}{'\n'}</Text>)}
              {!!bg.languages && (<Text><Text style={{ fontWeight:'700' }}>Мови:</Text> +{bg.languages}{'\n'}</Text>)}
              <Text style={{ fontWeight:'700' }}>{bg.featureName}:</Text> {bg.featureDescription}
            </Text>
          </View>
        )
      )}
    </>
  );


  const GearPicker = () => {
    if (selectedClass === 'custom') {
      return (
        <View style={{ marginTop: 12 }}>
          <Header title="Стартове спорядження (кастом)" />
          <Text style={{ color: c.text }}>Проста зброя, Рюкзак мандрівника</Text>
        </View>
      );
    }
    if (!gearDef) return null;
    // ensure selections length
    const ensure = (idx: number) => {
      if (gearSelections.length !== gearDef.choices.length) {
        const init = gearDef.choices.map((_, i) => (gearSelections[i] ?? 0));
        setGearSelections(init);
      }
    };
    return (
      <View style={{ marginTop: 12 }}>
        <Header title="Стартове спорядження" />
        {!!gearDef.base.length && (
          <Text style={{ color: c.text, marginBottom: 6 }}>
            <Text style={{ fontWeight: '700' }}>Базово:</Text> {gearDef.base.join(', ')}
          </Text>
        )}
        {gearDef.choices.map((ch, idx) => {
          ensure(idx);
          const selectedIdx = gearSelections[idx] ?? 0;
          return (
            <View key={idx} style={{ marginTop: 8 }}>
              <Text style={styles.label}>{ch.label}:</Text>
              <Picker
                selectedValue={String(selectedIdx)}
                style={styles.picker}
                onValueChange={(v) => {
                  const i = parseInt(String(v), 10) || 0;
                  setGearSelections((arr) => {
                    const next = [...(arr.length ? arr : gearDef.choices.map(()=>0))];
                    next[idx] = i;
                    return next;
                  });
                }}
              >
                {ch.options.map((opt, i) => (
                  <Picker.Item key={i} label={opt} value={String(i)} />
                ))}
              </Picker>
            </View>
          );
        })}
      </View>
    );
  };


  // Summary blocks
  const FeaturesRace = () => (
    <View style={{ marginTop: 8 }}>
      <Header title="Фічі раси" />
      <Text style={{ color: c.text }}>
        <Text style={{ fontWeight:'700' }}>Бонуси до характеристик:</Text>{' '}
        {(Object.keys(racialBonus) as AbilityKey[]).filter(k=>(racialBonus as any)[k]!==0).map(k=>`${ABILITY_NAMES_UA[k]} +${(racialBonus as any)[k]}`).join(', ') || '—'}
      </Text>
      {!!(raceDef?.description || subraceDef?.description) && (
        <Text style={{ color: c.text, marginTop: 6 }}>{subraceDef?.description || raceDef?.description}</Text>
      )}
      {!!(raceDef?.traits?.length || subraceDef?.traits?.length) && (
        <Text style={{ color: c.text, marginTop: 6 }}>
          <Text style={{ fontWeight:'700' }}>Риси:</Text> {[...(raceDef?.traits||[]), ...(subraceDef?.traits||[])].join(', ')}
        </Text>
      )}
    </View>
  );

  const classPreset = selectedClass==='custom' ? undefined : CLASS_PRESETS[selectedClass];
  const subDesc = subclass && selectedClass!=='custom' ? SUBCLASS_DETAILS[selectedClass]?.[subclass] : undefined;
  const FeaturesClass = () => (
    <View style={{ marginTop: 8 }}>
      <Header title="Фічі класу" />
      {!!classPreset && (
        <Text style={{ color: c.text }}>
          <Text style={{ fontWeight:'700' }}>Хіт-дайс:</Text> d{classPreset.hitDie}{'\n'}
          <Text style={{ fontWeight:'700' }}>Сейви:</Text> {classPreset.savingThrows.map(st=>ABILITY_NAMES_UA[st as AbilityKey]).join(', ')}{'\n'}
          <Text style={{ fontWeight:'700' }}>Основні:</Text> {classPreset.primaryAbilities.map(st=>ABILITY_NAMES_UA[st as AbilityKey]).join(', ')}{'\n'}
          {!!classPreset.spellcastingAbility && (<Text><Text style={{ fontWeight:'700' }}>Маг. характеристика:</Text> {ABILITY_NAMES_UA[classPreset.spellcastingAbility as AbilityKey]}{'\n'}</Text>)}
          <Text style={{ fontWeight:'700' }}>Профіцієнсі:</Text> {classPreset.proficiencies.join(', ')}
        </Text>
      )}
      {!!subDesc && (
        <Text style={{ color: c.text, marginTop: 6 }}>{subDesc}</Text>
      )}
    </View>
  );

  const FeaturesBackground = () => (
    <View style={{ marginTop: 8 }}>
      <Header title="Фічі фону" />
      {backgroundKey === 'custom' ? (
        <Text style={{ color: c.text }}>{customBackground || 'Свій фон'}</Text>
      ) : bg ? (
        <Text style={{ color: c.text }}>
          <Text style={{ fontWeight:'700' }}>{bg.name} — {bg.featureName}</Text>{'\n'}
          {bg.featureDescription}{'\n'}
          <Text style={{ fontWeight:'700' }}>Навички:</Text> {bg.skills.join(', ')}{'\n'}
          {!!bg.tools?.length && (<Text><Text style={{ fontWeight:'700' }}>Інструменти:</Text> {bg.tools.join(', ')}{'\n'}</Text>)}
          {!!bg.languages && (<Text><Text style={{ fontWeight:'700' }}>Мови:</Text> +{bg.languages}{'\n'}</Text>)}
        </Text>
      ) : null}
    </View>
  );

  const StepNav = ({ backTo, nextTo, nextEnabled=true, nextLabel='Далі' }:{ backTo?:number; nextTo?:number; nextEnabled?:boolean; nextLabel?:string }) => (
    <View style={{ flexDirection:'row', gap:12, marginTop: 20 }}>
      {backTo ? <View style={{ flex:1 }}><Button title="Назад" onPress={()=>setStep(backTo)} /></View> : <View style={{ flex:1 }} />}
      {nextTo ? <View style={{ flex:1 }}><Button title={nextLabel} onPress={()=>setStep(nextTo)} disabled={!nextEnabled} /></View> : <View style={{ flex:1 }} />}
    </View>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <ModeSwitcher />

      {mode === 'standard' ? (
        <>
          {step === 1 && (
            <>
              <Header title="Крок 1: Ім’я, рівень, раса" />
              <Text style={styles.label}>Ім’я:</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
              <Text style={styles.label}>Рівень:</Text>
              <TextInput style={styles.input} value={level} onChangeText={setLevel} keyboardType="numeric" />
              <RacePicker />
              <StepNav nextTo={2} nextEnabled={validateStep1()} />
            </>
          )}

          {step === 2 && (
            <>
              <Header title="Крок 2: Клас і підклас" />
              <ClassPicker />
              <StepNav backTo={1} nextTo={3} nextEnabled={validateStep2()} />
            </>
          )}

          {step === 3 && (
            <>
              <Header title="Крок 3: Характеристики" />
              <StatMethodSwitcher />
              {statMethod === 'array' ? <ArrayEditor /> : <PointBuyEditor />}
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: c.text, fontWeight:'600', marginBottom: 4 }}>Попередні характеристики (із расовими бонусами):</Text>
                {(Object.keys(finalStats) as AbilityKey[]).map((k)=>(
                  <Text key={k} style={styles.label}>{ABILITY_NAMES_UA[k]}: <Text style={{ fontWeight:'700' }}>{finalStats[k]}</Text></Text>
                ))}
              </View>
              <StepNav backTo={2} nextTo={4} nextEnabled={statMethod==='array' || pointBuyValid} />
            </>
          )}

          {step === 4 && (
            <>
              <Header title="Крок 4: Фон" />
              <BackgroundPicker />
              <GearPicker />
              <StepNav backTo={3} nextTo={5} />
            </>
          )}

          {step === 5 && (
            <>
              <Header title="Крок 5: Підтвердження" />
              <Text style={styles.label}>Ім’я: <Text style={{ fontWeight:'600' }}>{name || '—'}</Text></Text>
              <Text style={styles.label}>Рівень: <Text style={{ fontWeight:'600' }}>{level}</Text></Text>
              <Text style={styles.label}>Раса: <Text style={{ fontWeight:'600' }}>{isCustomRace ? (customRace||'—') : (raceDef?.name || raceKey)}</Text></Text>
              {!!(isCustomRace ? customSubrace : subraceKey) && (
                <Text style={styles.label}>Підраса: <Text style={{ fontWeight:'600' }}>{isCustomRace ? customSubrace : subraceKey}</Text></Text>
              )}
              <Text style={styles.label}>Клас: <Text style={{ fontWeight:'600' }}>{localizedClassName}</Text></Text>
              <Text style={styles.label}>Підклас: <Text style={{ fontWeight:'600' }}>{selectedClass === 'custom' ? (customSubclass||'—') : (subclass||'—')}</Text></Text>

              <View style={{ marginTop: 12 }}>
                <Text style={{ color: c.text, fontWeight:'700', marginBottom: 4 }}>Характеристики (фінальні):</Text>
                {(Object.keys(finalStats) as AbilityKey[]).map((k)=>(
                  <Text key={k} style={styles.label}>{ABILITY_NAMES_UA[k]}: <Text style={{ fontWeight:'700' }}>{finalStats[k]}</Text></Text>
                ))}
              </View>

              {/* Grouped features */}
              <FeaturesRace />
              <FeaturesClass />
              <FeaturesBackground />

              <View style={{ marginTop: 12 }}>
                <Header title="Спорядження" />
                <Text style={{ color: c.text }}>
                  {selectedClass === 'custom' ? 'Проста зброя, Рюкзак мандрівника' : (gearDef ? (gearDef.base.concat(gearDef.choices.map((ch,i)=>ch.options[gearSelections[i]||0] || ch.options[0])).join(', ') ) : '—')}
                </Text>
              </View>

              <View style={{ marginTop: 12 }}>
                <Header title="Монети" />
                <Text style={{ color: c.text }}>{finalCoins.gold} золотих, {finalCoins.silver} срібних, {finalCoins.copper} мідних</Text>
              </View>

              <View style={{ flexDirection:'row', gap:8, marginTop:16 }}>
                <View style={{ flex:1 }}><Button title="Редагувати расу" onPress={()=>setStep(1)} /></View>
                <View style={{ flex:1 }}><Button title="Редагувати клас" onPress={()=>setStep(2)} /></View>
              </View>
              <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
                <View style={{ flex:1 }}><Button title="Редагувати стати" onPress={()=>setStep(3)} /></View>
                <View style={{ flex:1 }}><Button title="Редагувати фон" onPress={()=>setStep(4)} /></View>
              </View>

              <View style={{ marginTop: 20 }}>
                <Button title="Створити" onPress={onCreate} disabled={mode==='standard' && statMethod==='pointbuy' && !pointBuyValid} />
              </View>
            </>
          )}
        </>
      ) : (
        <>
          <Header title="Швидке створення" />
          <Text style={styles.label}>Ім’я:</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Рівень:</Text>
          <TextInput style={styles.input} value={level} onChangeText={setLevel} keyboardType="numeric" />
          <RacePicker />
          <ClassPicker />
          <BackgroundPicker />
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: c.text, fontWeight:'600', marginBottom: 4 }}>Характеристики (із расовими бонусами):</Text>
            {(Object.keys(finalStats) as AbilityKey[]).map((k)=>(
              <Text key={k} style={styles.label}>{ABILITY_NAMES_UA[k]}: <Text style={{ fontWeight:'700' }}>{finalStats[k]}</Text></Text>
            ))}
          </View>
          <View style={{ marginTop: 20 }}>
            <Button title="Створити" onPress={onCreate} />
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default CreateCharacter;
