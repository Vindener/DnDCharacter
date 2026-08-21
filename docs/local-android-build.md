# Локальний Android release-білд (без квоти EAS Build)

Проблема: безкоштовний план EAS витратив ліміт cloud-білдів на місяць
(скидання 1 вересня 2026). `android/` уже закомічений у репо (bare-проєкт,
gradle build не потребує prebuild) — тож AAB/APK можна зібрати локально
`gradlew`-ом, підписавши тим самим production upload-ключем, яким керує EAS.

Скрипт: `scripts/build-android-local.sh` (`npm run build:android:local` для
AAB, `npm run build:android:local:apk` для APK).

## Одноразове налаштування (виконати самому, вручну)

Крок навмисно не автоматизований: `eas credentials` — інтерактивне меню, і
пароль keystore одноразово друкується в термінал. Це має зробити людина у
своєму терміналі, а не агент.

1. `npx eas-cli credentials -p android`
2. Обрати проєкт → **Build Credentials jG13IYY78i (Default)** (той самий,
   що й у `production`-профілі — видно на сторінці
   `expo.dev/accounts/vindener/projects/DnDCharacter/credentials/android/com.vind.MythgateDND`).
3. Обрати **Download keystore** (не «Download credentials.json» — той варіант
   теж працює, але схема нижче розрахована на голий `.jks` + gradle-properties).
4. Скрипт/меню виведе `Keystore password`, `Key alias`, `Key password` — скопіювати
   одразу, вдруге це не показується.
5. Перемістити завантажений файл у `android/app/upload-keystore.jks`
   (вже покрито `*.jks` у `.gitignore` — в git не потрапить).
6. Дописати (не в проєктний `android/gradle.properties`, а в **глобальний**
   `~/.gradle/gradle.properties` — так секрет фізично не може потрапити в
   комміт):

   ```properties
   MYAPP_UPLOAD_STORE_FILE=upload-keystore.jks
   MYAPP_UPLOAD_STORE_PASSWORD=<пароль з кроку 4>
   MYAPP_UPLOAD_KEY_ALIAS=<alias з кроку 4>
   MYAPP_UPLOAD_KEY_PASSWORD=<пароль ключа з кроку 4>
   ```

   Ці 4 імені властивостей уже очікує `android/app/build.gradle:123-137` —
   без них `signingConfigs.release` мовчки відкочується на debug-keystore.

## Використання

```bash
npm run build:android:local
```

Що робить скрипт (`scripts/build-android-local.sh`):

1. Перевіряє, що `~/.gradle/gradle.properties` і `.env` налаштовані.
2. Питає в EAS поточний **remote versionCode** (`eas build:version:get`,
   тільки читання) і рахує `+1` — щоб не зіткнутися з уже використаним кодом
   (нагадування: `1.0.0 (4)` cloud-спроба вже підняла лічильник до 12 навіть
   при провалі білда через квоту).
3. Тимчасово підставляє цей `versionCode` в `android/app/build.gradle`,
   збирає `bundleRelease`/`assembleRelease`, і **завжди** (навіть при помилці)
   відновлює файл назад — робоче дерево лишається чистим, версія в git
   не «дрейфує» вручну (правило CLAUDE.md §4: versionCode не чіпати руками).
4. Копіює готовий AAB/APK у `.builds/` (вже в `.gitignore`) з іменем на кшталт
   `mythgate-v13-20260821-101500.aab` — до будь-якого можливого `gradlew clean`.
5. Питає підтвердження й пушить використаний versionCode назад у EAS
   (`eas build:version:set`), щоб наступний cloud/local білд не повторив те
   саме число.

## Що це НЕ вирішує

- Не рахується проти квоти EAS Build minutes/cloud queue — тільки локальні
  ресурси й час.
- Все ще потребує мережі до EAS API для кроку 2 (читання/запис versionCode) —
  `--skip-version-sync` дає офлайн-шлях, але тоді синхронізацію з remote-
  лічильником потрібно робити руками перед наступним cloud-білдом.
- Не замінює `eas submit` — готовий `.aab` з `.builds/` усе одно треба
  завантажити в Play Console вручну (Closed testing track) або через
  `eas submit --path .builds/<file>.aab`.
- Підпис перевіряй сам після першого разу: `keytool -printcert -jarfile
  .builds/<file>.aab` → SHA-1 має збігатися з тим, що зареєстрований у
  Play App Signing (Google Play Console → Setup → App integrity).

## Best practices, застосовані в скрипті (і чому)

- **Секрети — тільки в `~/.gradle/gradle.properties`, ніколи в проєкті.**
  Навіть `.jks`/`credentials.json` у `.gitignore` — це страховка на випадок
  помилки, а не основний бар'єр; основний бар'єр — секрет фізично поза
  робочою копією репо.
- **`versionCode` — джерело істини лишається remote (EAS), локальний
  `build.gradle` — тимчасовий артефакт збірки**, що узгоджується з
  `appVersionSource: "remote"` в `eas.json` і з правилом CLAUDE.md §4
  «versionCode не чіпай руками».
- **Артефакт копіюється з `android/app/build/outputs/...` до будь-якого
  `gradlew clean`.** Локальна release-збірка засмічує `node_modules/**/android/
  {build,.cxx}` (CLAUDE.md §8.5) — після білда варто прибрати:
  `cd android && ./gradlew clean`, це не займе AAB у `.builds/`.
- **Версію не інкрементують «наосліп» до успішного білда** — на відміну від
  EAS cloud (яка підняла лічильник до 12 ще ДО провалу білда через квоту),
  цей скрипт пушить новий versionCode в remote тільки ПІСЛЯ успішного
  `gradlew`, щоб не спалювати номери на невдалих спробах.
