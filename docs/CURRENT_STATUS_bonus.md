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
**Статус: ⏳ В ОЧЕРЕДИ**

API: `/v2/account/worldbosses`

### Что сделать:
- [ ] Backend: `get_worldbosses(api_key)` + endpoint `/api/account/world-bosses`
- [ ] Frontend: список боссов, таймеры, отметки убитых


## Этап 6: Account Value — стоимость аккаунта
**Статус: ⏳ В ОЧЕРЕДИ**

API: кошелёк + материалы + банк + цены TP

### Что сделать:
- [ ] Backend: `/api/account/value` — агрегирует всё в золото
- [ ] Frontend: дашборд с общей стоимостью и разбивкой


## Этап 7: Home Instance / Homestead
**Статус: ⏳ В ОЧЕРЕДИ**

API: `/v2/account/home/nodes` + `/v2/account/home/cats` + `/v2/account/homestead/*`

### Что сделать:
- [ ] Backend: `/api/account/home` — ноды, коты, украшения
- [ ] Frontend: страница домашней инстанции


## Этап 8: Гильдия (Guild)
**Статус: ⏳ В ОЧЕРЕДИ**

API: `/v2/guild/:id/stash`, `/treasury`, `/members`, `/log`

### Что сделать:
- [ ] Backend: `/api/guild/:id/*` — банк, казна, логи
- [ ] Frontend: страница гильдии


## Этап 9: PvP / WvW
**Статус: ⏳ В ОЧЕРЕДИ**

API: `/v2/pvp/stats`, `/pvp/games`, `/wvw/matches`

### Что сделать:
- [ ] Backend: `/api/pvp/*`, `/api/wvw/*`
- [ ] Frontend: дашборды PvP и WvW
