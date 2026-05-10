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


## Этап 3: Legendary Armory — легендарное хранилище
**Статус: ⏳ В ОЧЕРЕДИ**

API: `/v2/account/legendaryarmory` + `/v2/legendaryarmory`

### Что сделать:
- [ ] Backend: `get_legendary_armory(api_key)` + endpoint `/api/account/legendary-armory`
- [ ] Frontend: список легендарок, прогресс крафта, AI-анализ (через DeepSeek)


## Этап 4: Dungeon / Daily Crafting трекер
**Статус: ⏳ В ОЧЕРЕДИ**

API: `/v2/account/dungeons` + `/v2/account/dailycrafting`

### Что сделать:
- [ ] Backend: `get_dungeons(api_key)` + `get_dailycrafting(api_key)`
- [ ] Frontend: чеклист данжей + ежедневный крафт


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
