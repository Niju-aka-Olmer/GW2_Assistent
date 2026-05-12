# GW2 Assist — План развития (Бонусные фичи)

## Этап 1: Wizard's Vault — дейлики, недельки, награды
**Статус: ✅ ГОТОВО (v1.12)**

### API эндпоинты GW2:
- `/v2/account/wizardsvault/daily` — ежедневные задания и прогресс
- `/v2/account/wizardsvault/weekly` — недельные задания и прогресс
- `/v2/account/wizardsvault/special` — спец-задания (сезонные)
- `/v2/account/wizardsvault/listings` — доступные награды (астральные очки)
- `/v2/wizardsvault` — инфо о текущем сезоне
- `/v2/wizardsvault/listings` — все возможные награды
- `/v2/wizardsvault/objectives` — все возможные задачи

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функции:
  - `get_wizardsvault_daily(api_key)`
  - `get_wizardsvault_weekly(api_key)`
  - `get_wizardsvault_special(api_key)`
  - `get_wizardsvault_listings(api_key)`
  - `get_wizardsvault_season()`
  - `get_wizardsvault_all_objectives()`
  - `get_wizardsvault_all_listings()`
- [x] `endpoints.py` — эндпоинты:
  - `GET /api/wizardsvault/daily`
  - `GET /api/wizardsvault/weekly`
  - `GET /api/wizardsvault/special`
  - `GET /api/wizardsvault/listings` (с обогащением: имена, цены, сезон)
  - `GET /api/wizardsvault/objectives`

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — методы:
  - `getWizardsVaultDaily()`
  - `getWizardsVaultWeekly()`
  - `getWizardsVaultSpecial()`
  - `getWizardsVaultListings()`
- [x] Создана страница `WizardVaultPage.tsx`:
  - Вкладки: Ежедневно / Еженедельно / Спец. задания / Награды
  - Прогресс-бары по каждому заданию
  - Иконки треков (ПвЕ/ПвП/ПвП-Мист)
  - Счётчик астральных очков
  - Список купленных наград
  - Адаптивная вёрстка
- [x] Роут `/wizards-vault` в `routes.tsx`
- [x] Кнопка "Wizard's Vault" в `Header.tsx` (переименовано с "Хранилище")

**Локализация (русский):**
- [x] `_TRANSLATE_PATTERNS` — ~93 regex-паттерна для перевода названий заданий Wizard's Vault
- [x] `_translate_title()` — функция перевода названий на бэкенде
- [x] `_enrich_wizardsvault()` — обогащение заданий переведёнными названиями
- [x] Метки режимов: PvE → ПвЕ, PvP → ПвП, WvW → ПвП-Мист, Free → Бесплатно
- [x] Google Translate интеграция для перевода названий и описаний достижений
- [x] Кеширование переводов (24ч) через `MemoryCache`
- [x] Защита от 502: лимит 15 текстов за раз, 3 одновременных запроса, try-except

**Сборка и деплой:**
- [x] Пересобран фронтенд
- [x] Скопирован frontend/dist в дистрибутив
- [x] Пересобран backend.exe с новыми эндпоинтами
- [x] Задеплоено на сервер Ubuntu (192.168.1.180)
- [x] Протестировано — API работает, переводы отображаются


## Этап 2: Material Storage — склад материалов
**Статус: ✅ ГОТОВО (v1.13)**

API: `/v2/account/materials` — список всех материалов с количеством

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функция `get_materials(api_key)` + `get_material_categories()`
- [x] `endpoints.py` — эндпоинт `GET /api/account/materials`:
  - Обогащение: имена предметов, иконки, редкость, уровень
  - Цены TP (покупка/продажа) на каждый материал
  - Категории материалов (Metal, Leather, Cloth и т.д.)
  - Сортировка по категориям + имени
  - Кеширование списка категорий

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — метод `getMaterials()` + типы `MaterialItem`, `MaterialsResponse`
- [x] Создана страница `MaterialsPage.tsx`:
  - Группировка по категориям (сворачиваемые блоки)
  - Поиск по названию материала
  - Сортировка: по имени / количеству / цене TP / редкости
  - Иконки предметов, редкость (цветовая маркировка), уровень
  - Цены TP: продажа (зелёная) и покупка (оранжевая)
  - Общая стоимость каждой категории и всех материалов
  - Кеширование через React Query (60s)
  - Загрузчик Skeleton
- [x] Роут `/materials/:name` в `routes.tsx`
- [x] Вкладка "Материалы" в `CharacterTabs.tsx`

**Сборка и деплой:**
- [x] Пересобран фронтенд (npm run build)
- [x] Скопированы файлы на сервер (pscp):
  - `frontend/dist/*` — статика (index.html, assets/)
  - `backend/api/endpoints.py` — новый эндпоинт
  - `backend/api/gw2_client.py` — функции материалов
  - `backend/main.py` — поддержка статики
- [x] Сервер перезапущен — всё работает

**Исправления и доработки:**
- [x] Исправлена `get_material_categories()` — теперь правильно получает объекты категорий через `?ids=...`, а не просто список ID
- [x] Исправлена обработка 404 от GW2 API для предметов без TP цен (появляются в логах как 206 Partial Content)
- [x] Google Translate интеграция для перевода названий и описаний достижений (кеш 24ч, защита от 502)
- [x] Инвентарь и Банк объединены в одну страницу InventoryPage с подтабами "Сумки" и "Банк"
- [x] Удалена отдельная страница BankPage.tsx, маршрут `/bank/:name` удалён
- [x] Добавлен SPA 404 handler в main.py — корректная обработка роутов Vue Router
- [x] Поправлен `base: '/'` в `vite.config.ts` — ассеты теперь загружаются с правильного пути


## Этап 3: Legendary Armory — легендарное хранилище
**Статус: ✅ ГОТОВО (v1.14)**

API: `/v2/account/legendaryarmory` + `/v2/legendaryarmory`

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функция `get_legendary_armory(api_key)`
- [x] `endpoints.py` — эндпоинт `GET /api/account/legendary-armory`:
  - Обогащение: имена предметов, иконка, тип, подтип, редкость
  - Сортировка по типу → подтипу → имени

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — метод `getLegendaryArmory()` + интерфейсы `LegendaryArmoryItem`, `LegendaryArmoryResponse`
- [x] Создана страница `LegendaryArmoryPage.tsx`:
  - Группировка по типам: Оружие, Броня, Аксессуары, Спина, Улучшения
  - Поиск по названию
  - Сворачиваемые/разворачиваемые блоки категорий
  - Иконки предметов, счётчик общего количества
  - Кеширование через React Query (60s)
  - Загрузчик Skeleton
- [x] Роут `/legendary-armory/:name` в `routes.tsx`
- [x] Вкладка "Легендарки" в `CharacterTabs.tsx`

**Исправления:**
- [x] Исправлен баг с `characterName` → `name` в `LegendaryArmoryPage.tsx` — при переходе с Легендарок на другие вкладки терялось имя персонажа (подставлялся `undefined` в URL)

**Сборка и деплой:**
- [x] Пересобран фронтенд (npm run build)
- [x] Скопированы файлы на сервер:
  - `frontend/dist/*` — статика
  - `backend/api/endpoints.py` — новый эндпоинт
  - `backend/api/gw2_client.py` — функция armory
  - `frontend/src/pages/LegendaryArmoryPage.tsx` — фикс бага
- [x] Сервер перезапущен — эндпоинт отвечает 200


## Этап 4: Dungeon / Daily Crafting трекер
**Статус: ✅ ГОТОВО (v1.15)**

API: `/v2/account/dungeons` + `/v2/account/dailycrafting`

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функции:
  - `get_dungeons()` — список всех подземелий с путями
  - `get_account_dungeons(api_key)` — пройденные пути за неделю
  - `get_dailycrafting()` — все виды ежедневного крафта
  - `get_account_dailycrafting(api_key)` — сделанный ежедневный крафт
- [x] `endpoints.py` — эндпоинты:
  - `GET /api/account/dungeons` — обогащение: имена (RU), иконки, статус прохождения путей, прогресс (completed_count/total_count)
  - `GET /api/account/dailycrafting` — обогащение: имена (RU), статус выполнения
- [x] Словари `DUNGEON_NAMES`, `DUNGEON_PATH_NAMES`, `DUNGEON_ICONS` — русские названия и иконки для всех 8 подземелий и их путей
- [x] Словари `DAILYCRAFTING_NAMES`, `DAILYCRAFTING_ICONS` — русские названия для всех 5 предметов крафта

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — методы `getDungeons()`, `getDailyCrafting()` + типы `DungeonPath`, `Dungeon`, `DungeonsResponse`, `DailyCraftingItem`, `DailyCraftingResponse`
- [x] Создана страница `DungeonsPage.tsx`:
  - Список всех 8 подземелий с иконками и прогресс-барами
  - Каждый путь с чекбоксом (зелёный — пройден, серый — не пройден)
  - Прогресс прохождения: `completed_count/total_count`
  - Секция "Ежедневный крафт" — 5 предметов с отметками выполнения
  - Поиск/фильтр по названию данжа или пути
  - Типы путей: Story / Explorable (с пометкой "Сюжет")
  - Кеширование через React Query (60s)
  - Загрузчик Skeleton
- [x] Роут `/dungeons/:name` в `routes.tsx`
- [x] Вкладка "Данжи" в `CharacterTabs.tsx`

**Исправления:**
- [x] Исправлен `restart.sh` на сервере — теперь корректно убивает `uvicorn main:app` вместо `python main.py`

**Сборка и деплой:**
- [x] Пересобран фронтенд (npm run build) — ошибок нет
- [x] Скопированы файлы на сервер:
  - `frontend/dist/*` — статика
  - `frontend/src/pages/DungeonsPage.tsx`
  - `frontend/src/shared/api/gw2Client.ts`
  - `frontend/src/app/routes.tsx`
  - `frontend/src/widgets/CharacterTabs/ui/CharacterTabs.tsx`
  - `backend/api/gw2_client.py`
  - `backend/api/endpoints.py`
- [x] Сервер перезапущен — эндпоинты отвечают 200


## Этап 5: World Boss трекер
**Статус: ✅ ГОТОВО (v1.19)**

API: `/v2/account/worldbosses`

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функция `get_worldbosses(api_key)` — список убитых боссов
- [x] `endpoints.py` — эндпоинт `GET /api/account/world-bosses`:
  - Список всех мировых боссов с расписанием
  - Обогащение: имена (RU), иконки, статус убит/не убит
  - Таймеры до следующего появления
  - Фильтрация по региону (Central Tyria / Maguuma / PoF / EoD / Janthir)

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — метод `getWorldBosses()` + интерфейс `WorldBossInfo`
- [x] Создана страница `WorldBossesPage.tsx`:
  - Список боссов с иконками, именами (RU), уровнями
  - Статус убит/не убит за неделю (галками)
  - Разбивка по регионам (сворачиваемые блоки)
  - Поиск по названию
  - Кеширование 60s
- [x] Роут `/world-bosses/:name` в `routes.tsx`
- [x] Вкладка "Боссы" в `CharacterTabs.tsx`

**Исправления:**
- [x] Словарь `WORLD_BOSS_NAMES` с русскими названиями для всех боссов
- [x] Словарь `WORLD_BOSS_ICONS` с иконками


## Этап 6: Account Value — стоимость аккаунта
**Статус: ✅ ГОТОВО (v1.20)**

API: кошелёк + материалы + банк + цены TP

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функции:
  - `get_account_value(api_key)` — агрегирует всё в золото
- [x] `endpoints.py` — эндпоинт `GET /api/account/value`:
  - Кошелёк (wallet)
  - Материалы (materials)
  - Банк (bank)
  - Инвентарь (inventory)
  - Итоговая сумма в золоте

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — метод `getAccountValue()` + интерфейс `AccountValueResponse`
- [x] Создана страница `AccountValuePage.tsx`:
  - Дашборд с общей стоимостью и разбивкой по категориям
  - Иконки монет (з/с/м) вместо текста
  - Цветовая индикация сумм
  - Кеширование 60s
- [x] Роут `/account-value/:name` в `routes.tsx`
- [x] Вкладка "Ценность" в `CharacterTabs.tsx`
- [x] Общий компонент `formatGold` с иконками монет

**Исправления:**
- [x] Исправлены названия предметов
- [x] Иконки монет вместо текста «з/с/м»


## Этап 7: Home Instance / Homestead
**Статус: ✅ ГОТОВО (v1.22)**

API: `/v2/account/home/nodes` + `/v2/account/home/cats` + `/v2/account/homestead/*`

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функции:
  - `get_home_nodes(api_key)` — список узлов домашней инстанции
  - `get_home_cats(api_key)` — список кошек
  - `get_homestead_decorations(api_key)` — украшения из усадьбы
  - `get_homestead_glyphs(api_key)` — глифы из усадьбы
- [x] `endpoints.py` — эндпоинт `GET /api/account/home`:
  - Обогащение узлов: русские названия и иконки (словарь HOME_NODE_NAMES на ~80+ узлов)
  - Обогащение кошек: русские имена (словарь CAT_NAMES на 70 пород), hint
  - Обогащение украшений: имена/иконки/редкость через IDs предметов
  - Обогащение глифов: имена/иконки/редкость через IDs предметов
  - Сортировка каждого раздела по имени

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — метод `getHomeData()` + интерфейсы `HomeNode`, `HomeCat`, `HomesteadDecoration`, `HomesteadGlyph`, `HomeResponse`
- [x] Создана страница `HomePage.tsx`:
  - 4 секции: Узлы, Кошки, Украшения усадьбы, Глифы усадьбы
  - Иконки узлов/предметов
  - Счётчики количества в каждом разделе
  - Отображение редкости (цветовая маркировка)
  - Обработка пустых секций (уведомление)
  - Загрузчик Skeleton
  - Кеширование 60s через React Query
- [x] Роут `/home/:name` в `routes.tsx`
- [x] Вкладка "Дом" в `CharacterTabs.tsx`


## Этап 8: Гильдия (Guild)
**Статус: ✅ ГОТОВО (v1.23)**

API: `/v2/guild/:id/stash`, `/treasury`, `/members`, `/log`, `/upgrades`

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функции:
  - `get_account_guilds(api_key)` — список ID гильдий
  - `get_guild(guild_id, api_key)` — детали гильдии (название, тег, эмблема, MOTD)
  - `get_guild_stash(guild_id, api_key)` — банк гильдии
  - `get_guild_treasury(guild_id, api_key)` — казна гильдии
  - `get_guild_members(guild_id, api_key)` — участники с ролями
  - `get_guild_log(guild_id, api_key)` — лог событий
  - `get_guild_upgrades(guild_id, api_key)` — ID улучшений
- [x] `endpoints.py` — эндпоинты:
  - `GET /api/account/guilds` — список гильдий с названием, тегом, уровнем, MOTD, эмблемой (использует `/v2/account` для списка)
  - `GET /api/guild/{guild_id}` — полная информация:
    - Банк: обогащение предметов (имена, иконки, редкость)
    - Казна: обогащение предметов (количество, needed_by)
    - Участники: роли на русском (Лидер/Oфицер/Участник)
    - Лог: последние 50 записей с типом, пользователем, MOTD
    - Улучшения: названия (~30+ улучшений в словаре)

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — метод `getGuilds()`, `getGuildDetail(guildId)` + интерфейсы `GuildInfo`, `GuildEmblem`, `GuildStashItem`, `GuildTreasuryItem`, `GuildMember`, `GuildLogEntry`, `GuildUpgrade`, `AccountGuildsResponse`, `GuildDetailResponse`
- [x] Создана страница `GuildPage.tsx`:
  - Заголовок гильдии: эмблема, название, тег, уровень, участники, MOTD
  - 5 вкладок: Банк, Казна, Участники, Лог, Улучшения
  - Банк: иконки предметов, количество, монеты
  - Казна: предметы с количеством
  - Участники: таблица с ролью (цветовая маркировка), датой вступления, рангом
  - Лог: хронология событий с типом и пользователем
  - Улучшения: сетка названий улучшений
  - Обработка пустых секций
  - Кеширование 120s через React Query
- [x] Роут `/guild/:name` в `routes.tsx`
- [x] Вкладка "Гильдия" в `CharacterTabs.tsx`


## Этап 9: PvP / WvW
**Статус: ✅ ГОТОВО (v1.23)**

API: `/v2/pvp/stats`, `/pvp/games`, `/wvw/matches`

### Что сделано:

**Backend (Python):**
- [x] `gw2_client.py` — функции:
  - `get_pvp_stats(api_key)` — статистика PvP (победы/поражения/рейтинг)
  - `get_pvp_games(api_key)` — история матчей
  - `get_pvp_heroes(api_key)` — разблокированные герои
  - `get_wvw_match(world_id)` — текущий WvW матч по миру
  - `get_wvw_objectives()` — все цели WvW с деталями
  - `get_wvw_ranks()` — ранги WvW
- [x] `endpoints.py` — эндпоинты:
  - `GET /api/pvp/stats` — статистика:
    - Общая: победы/поражения/winrate/ранг/очки
    - По режимам (лесенки): победы/поражения/рейтинг/дивизион/тир
    - По классам: победы/поражения/всего игр
  - `GET /api/pvp/games` — последние 20 игр с результатом, рейтингом, длительностью
  - `GET /api/wvw/matches` — полная картина матча:
    - Очки миров (1-3 место)
    - Очки по картам (4 карты: Центр, Альпы, Пустоши, Эко-Карта)
    - Список целей с владельцем, названием, claimed_by
    - Скирмиши с очками

**Frontend (React/TypeScript):**
- [x] `gw2Client.ts` — методы `getPvPStats()`, `getPvPGames()`, `getWvWMatch()` + интерфейсы `PvPStatsResponse`, `PvPGame`, `PvPLadder`, `PvPProfessionStats`, `WvWMatchResponse`, `WvWMap`, `WvWObjective` и др.
- [x] Создана страница `PvPPage.tsx`:
  - Общая статистика: игры/победы(зелёные)/поражения(красные)/winrate/ранг
  - 2 вкладки: "По режимам и классам" и "Последние игры"
  - Лесенки по режимам с рейтингом/дивизионом/тиром
  - Статистика по классам с иконками и сортировкой
  - История игр с цветовой маркировкой (победа/поражение)
- [x] Создана страница `WvWPage.tsx`:
  - Общие очки миров с медалями (🥇🥈🥉) и цветами команд
  - Карты с очками и целями
  - Цели с цветовой маркировкой владельца (красный/зелёный/синий)
  - Информация о захватившем (claimed_by)
  - Скирмиши с очками
  - Кеширование 120s через React Query
- [x] Роуты `/pvp/:name`, `/wvw/:name` в `routes.tsx`
- [x] Вкладки "PvP" и "WvW" в `CharacterTabs.tsx`


## Этап 10: Объединение вкладок — оптимизация навигации
**Статус: ✅ ГОТОВО (v1.21)**

4 группы вкладок объединены в одну для освобождения места в CharacterTabs.

### Что сделано:

**Frontend (React/TypeScript):**

**1. Инвентарь — 4 подтаба (Сумки, Банк, Материалы, Легендарки)**
- [x] `InventoryPage.tsx` — расширен с 2 до 4 подтабов
- [x] `MaterialsTabContent` — поиск, сортировка (имя/кол-во/TP/редкость), группировка по категориям, общая стоимость с CoinBadge
- [x] `LegendaryTabContent` — поиск, группировка по типам (Weapon/Armor/Trinket/Back/UpgradeComponent), статус разблокировки
- [x] AnalyseButton только для подтабов Сумки/Банк

**2. PvE — 2 подтаба (Данжи, Боссы)**
- [x] Создана `PvEPage.tsx` — объединяет DungeonsPageContent + WorldBossesPageContent
- [x] Подтаб "Данжи": все 8 подземелий с прогресс-барами, пути, ежедневный крафт, поиск
- [x] Подтаб "Боссы": мировые боссы с иконками, статус убит/не убит, фильтр, поиск
- [x] Кеширование 60s через React Query

**3. Дом+Гильдия — 2 подтаба (Дом, Гильдия)**
- [x] Создана `HomeGuildPage.tsx` — объединяет HomePageContent + GuildContent
- [x] Подтаб "Дом": узлы, кошки, украшения усадьбы, глифы
- [x] Подтаб "Гильдия": банк, казна, участники, лог, улучшения (5 вкладок)
- [x] ID гильдии берётся из `/v2/account` автоматически

**4. PvP+WvW — 2 подтаба (PvP, WvW)**
- [x] Создана `CompetitivePage.tsx` — объединяет PvPContent + WvWContent
- [x] Подтаб "PvP": общая статистика, лесенки, классы, история игр
- [x] Подтаб "WvW": очки миров, карты, цели, скирмиши
- [x] Кеширование 120s через React Query

**Навигация:**
- [x] `CharacterTabs.tsx` — сокращён с 16 до 11 вкладок:
  - Удалены: Материалы, Легендарки, Данжи, Боссы, Дом, Гильдия, PvP, WvW
  - Добавлены: PvE, Дом+Гильдия, PvP+WvW
- [x] `routes.tsx` — новые маршруты:
  - `/pve/:name` (вместо `/dungeons/:name` + `/world-bosses/:name`)
  - `/home-guild/:name` (вместо `/home/:name` + `/guild/:name`)
  - `/competitive/:name` (вместо `/pvp/:name` + `/wvw/:name`)
- [x] Старые маршруты удалены, старые страницы-источники сохранены
- [x] TypeScript build: 0 ошибок
