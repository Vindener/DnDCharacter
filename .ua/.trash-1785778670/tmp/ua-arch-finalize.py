import json

UA_DIR = "/home/vindener/Files/Projects/DnDCharacter/.ua"
assign = json.load(open(f"{UA_DIR}/tmp/ua-arch-layer-assignment.json"))

META = {
    "layer:ui": {
        "name": "UI-шар (екрани та навігація)",
        "description": "Екрани застосунку (Character, DM, Bestiary, Spellbook, Home, Initiative, CreateCharacter тощо), навігаційний граф React Navigation і спільна бібліотека UI-компонентів/стилів (`shared/components`, `shared/ui`, `shared/styles`), що разом формують презентаційний шар Mythgate 5e Companion.",
    },
    "layer:state": {
        "name": "Шар стану (Zustand stores)",
        "description": "Zustand-стори (`src/stores`) і сумісні re-export барели (`src/context`) для аркуша персонажа, бестіарію, спелбука, теми та синку — центральний клієнтський стан, з яким взаємодіють екрани й сервіси.",
    },
    "layer:service": {
        "name": "Сервісний шар",
        "description": "Бізнес-оркестрація та доступ до даних поза DM-модулем: `src/services` і `src/shared/services` (Firebase Auth/Firestore, телеметрія, видалення акаунта) та `src/repositories` (локальне збереження персонажа й чернеток через AsyncStorage/Firestore).",
    },
    "layer:dm-domain": {
        "name": "DM / Campaign Management модуль",
        "description": "Ізольований пакет для GM Workspace (`src/dm`) — доменна логіка кампаній, ініціативи, нотаток та енкаунтерів разом із власними репозиторіями й хуками; свідомо виділений виняток release-hardening фази.",
    },
    "layer:domain": {
        "name": "Доменні типи, схеми та мапери",
        "description": "Основна модель персонажа: Zod-схеми валідації, мапери між Firestore-документами й доменними типами (`src/domain`) та наскрізні TypeScript-типи (`src/types`) для статів, заклять, спорядження й бойових даних.",
    },
    "layer:data": {
        "name": "Шар даних (SRD-контент і правила безпеки)",
        "description": "Статичний D&D 5e SRD-датасет і його локалізації (`src/data/srd`, `src/data/locales`), похідні ігрові константи (`src/shared/const`: класи, раси, зброя, шаблони персонажа) та `firestore.rules` як визначення схеми безпеки хмарних даних.",
    },
    "layer:utility": {
        "name": "Утиліти та локалізація",
        "description": "Чисті допоміжні функції (`src/shared/helpers`: бойові розрахунки, побудова порожнього персонажа) та інфраструктура i18next (`src/i18n`) з українською й англійською локалізацією інтерфейсу.",
    },
    "layer:functions": {
        "name": "Firebase Cloud Functions (functions/)",
        "description": "Окремий бекенд-воркспейс із власним package.json/tsconfig — серверні функції видалення акаунта (каскадне видалення) та обміну запрошеннями кампанії (createCampaignInvite/redeemCampaignInvite).",
    },
    "layer:infrastructure": {
        "name": "Інфраструктура, білд і тулінг",
        "description": "Закомічений bare-проєкт `android/` (Gradle/Kotlin/res), кореневі конфіги білда й рантайму (app.json, eas.json, package.json, metro.config.js тощо), допоміжні скрипти (`scripts/`), налаштування Claude Code/Codex-тулінгу (.claude, .agents/openai.yaml, .ua) та тестова інфраструктура (`src/test/mocks`, `src/shared/mock`, `firestore-tests`).",
    },
    "layer:documentation": {
        "name": "Документація проєкту",
        "description": "Продуктова й процесна документація (`docs/`: план релізу, аудит, модель спільного редагування, UI-kit), інструкції для Codex-агента (`.agents/`), стандарти коду для RN (`.github/instructions`) та кореневі README.md/CLAUDE.md.",
    },
}

order = ["layer:ui", "layer:state", "layer:service", "layer:dm-domain", "layer:domain",
         "layer:data", "layer:utility", "layer:functions", "layer:infrastructure", "layer:documentation"]

result = []
total = 0
for lid in order:
    ids = assign[lid]
    result.append({
        "id": lid,
        "name": META[lid]["name"],
        "description": META[lid]["description"],
        "nodeIds": ids,
    })
    total += len(ids)

print("Layers:", len(result))
print("Total nodeIds:", total)

out_path = "/home/vindener/Files/Projects/DnDCharacter/.ua/intermediate/layers.json"
json.dump(result, open(out_path, "w"), ensure_ascii=False, indent=2)
print("Written to", out_path)
