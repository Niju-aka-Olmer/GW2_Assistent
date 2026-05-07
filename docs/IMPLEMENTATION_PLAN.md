# GW2 Assistant — Implementation Plan

## Общая стратегия

Проект строится **снизу вверх**:
1. Сначала инфраструктура (репозиторий, настройка проектов)
2. Бэкенд (API клиенты, кэш, эндпоинты)
3. Фронтенд (общие компоненты, сущности, страницы)
4. AI-интеграция (DeepSeek)
5. Полировка и деплой

Каждый этап даёт работающий инкремент, который можно протестировать.

---

## Этап 1: Инфраструктура проекта

**Цель:** Создать каркас проекта, который можно запустить.

### Шаги:

1. Инициализировать Git-репозиторий
2. Создать `.gitignore` (Node, Python, env, cache)
3. Создать `.env.example` (переменные: GW2_API_KEY, DEEPSEEK_API_KEY)
4. Создать `docker-compose.yml` (пока без Redis)
5. Инициализировать backend:
   - `mkdir backend && cd backend`
   - Создать `main.py` с минимальным FastAPI приложением
   - Создать `requirements.txt`
   - Проверить: `uvicorn main:app --reload --port 8000` → Swagger на `/docs`
6. Инициализировать frontend:
   - `npm create vite@latest frontend -- --template react-ts`
   - Установить зависимости: `react-router-dom`, `@tanstack/react-query`, `axios`, `tailwindcss`, `clsx`
   - Настроить `tailwind.config.ts` (цветовые переменные)
   - Настроить `vite.config.ts` (proxy на backend :8000)
   - Проверить: `npm run dev` → страница React на `:3000`

**Результат:** Два запускаемых проекта, связанные через proxy Vite.

---

## Этап 2: Бэкенд — ядро (GW2 API)

**Цель:** Реализовать REST API для получения данных из GW2.

### Шаги:

1. Создать `backend/models/character.py`, `item.py`, `price.py` — Pydantic модели
2. Создать `backend/cache/memory_cache.py` — TTLCache обёртка
3. Создать `backend/api/gw2_client.py`:
   - Асинхронные методы: `get_characters()`, `get_character_build()`, `get_character_inventory()`, `get_bank()`
   - Массовые запросы (batch по 200 ID)
   - Кэширование результатов
4. Создать `backend/services/auth_service.py`:
   - Валидация API-ключа через `/v2/tokeninfo`
   - Проверка permissions (account, characters, inventories, builds)
5. Создать `backend/api/endpoints.py`:
   - `POST /api/auth` — сохранить ключ
   - `GET /api/characters` — список персонажей
   - `GET /api/characters/{name}/build` — билд
   - `GET /api/characters/{name}/inventory` — инвентарь
   - `GET /api/account/bank` — банк
6. Создать `backend/utils/config.py` — переменные окружения
7. Создать `backend/utils/errors.py` — кастомные error handlers

**Результат:** Полноценный бэкенд с кэшированием. Можно тестировать через Swagger.

---

## Этап 3: Бэкенд — DeepSeek API

**Цель:** Добавить AI-анализ билдов и инвентаря.

### Шаги:

1. Создать `backend/api/deepseek_client.py`:
   - Асинхронный метод `analyze(prompt, api_key)`
   - Настройка параметров: temperature 0.3, max_tokens 800
2. Создать `backend/services/build_analyzer.py`:
   - Формирование промпта для анализа билда
   - Парсинг ответа DeepSeek
3. Создать `backend/services/inventory_analyzer.py`:
   - Формирование промпта для анализа инвентаря
   - Определение ценных предметов для продажи
4. Добавить эндпоинты:
   - `POST /api/deepseek/analyze-build`
   - `POST /api/deepseek/analyze-inventory`

**Результат:** AI-функциональность готова на бэкенде.

---

## Этап 4: Фронтенд — общие компоненты и инфраструктура

**Цель:** Создать фундамент фронтенда.

### Шаги:

1. Создать `src/app/providers/`:
   - `ThemeProvider.tsx` — темная/светлая тема через CSS-переменные
   - `QueryProvider.tsx` — TanStack Query с дефолтными настройками
   - `AuthProvider.tsx` — хранение и проверка API-ключа
2. Создать `src/app/routes.tsx`:
   - `/` → CharacterSelectPage
   - `/build/:name` → BuildPage
   - `/inventory/:name` → InventoryPage
   - `/recommendations` → RecommendationsPage
3. Создать `src/app/App.tsx` — корневой компонент с Layout
4. Создать `src/shared/ui/`:
   - `Layout.tsx` — Header + main + footer
   - `Button.tsx` — variants: primary, secondary, ghost, danger
   - `Input.tsx` — с лейблом, ошибкой, иконкой
   - `Card.tsx` — контейнер-карточка
   - `Spinner.tsx` — анимированный loader
   - `ErrorBoundary.tsx` — граница ошибок
   - `ErrorFallback.tsx` — UI ошибки с retry
   - `Tabs.tsx` — переключение вкладок
5. Создать `src/shared/api/apiClient.ts` — axios instance с baseURL
6. Создать `src/widgets/Header/` — шапка с лого, навигацией, ThemeToggle
7. Создать `src/widgets/ThemeToggle/` — переключатель темы

**Результат:** Каркас фронтенда с навигацией, темой, UI-kit.

---

## Этап 5: Фронтенд — сущности, API, виджеты

**Цель:** Создать бизнес-сущности и связь с бэкендом.

### Шаги:

1. Создать `src/entities/character/model/types.ts` — Character, Profession
2. Создать `src/entities/item/model/types.ts` — Item, ItemRarity, ItemStats
3. Создать `src/entities/build/model/types.ts` — Build, Specialization, Skill
4. Создать `src/entities/price/model/types.ts` — PriceData
5. Создать `src/shared/api/gw2Client.ts` — вызовы бэкенд-эндпоинтов
6. Создать `src/shared/api/deepseekClient.ts` — вызов AI-эндпоинтов
7. Создать API-функции для каждой сущности:
   - `entities/character/api/getCharacters.ts`
   - `entities/item/api/getItemDetails.ts`
   - `entities/build/api/getBuildData.ts`
   - `entities/price/api/getItemPrices.ts`
8. Создать `entities/item/lib/`:
   - `getRarityColor.ts` — CSS-класс по редкости
   - `formatDescription.ts` — очистка HTML
   - `getItemIconUrl.ts` — формирование URL иконки
9. Создать `widgets/ItemTooltip/`:
   - `ui/ItemTooltip.tsx` — всплывающая подсказка
   - `lib/formatStats.ts` — форматирование статов
   - `lib/rusAttributes.ts` — перевод атрибутов на русский
10. Создать `widgets/PriceBadge/`:
    - `ui/PriceBadge.tsx` — значок цены
    - `lib/formatCoin.ts` — форматирование монет

**Результат:** Полный слой данных и переиспользуемые виджеты.

---

## Этап 6: Фронтенд — страницы

**Цель:** Реализовать все страницы приложения.

### Шаги:

1. **CharacterSelectPage:**
   - `useCharacters` — хук для загрузки списка персонажей
   - `CharacterCard` — карточка с иконкой профессии, именем, уровнем
   - Поле ввода API-ключа (если не аутентифицирован)

2. **BuildPage:**
   - `useBuildData` — хук для загрузки билда
   - `SpecializationsPanel` — 3 специализации с трейтами
   - `SkillsGrid` — 5 слотов навыков
   - `EquipmentGrid` — все слоты экипировки (14 слотов)
   - Кнопка "AI-анализ" → открывает RecommendationsPage

3. **InventoryPage:**
   - `useInventoryData` — хук для загрузки инвентаря и банка
   - `InventoryGrid` — сумки персонажа
   - `BankGrid` — банк
   - `FilterBar` — фильтр по типу, редкости, цене
   - Подсчёт ценных предметов и потенциала продажи

4. **RecommendationsPage:**
   - `useRecommendations` — хук для AI-анализа
   - `InsightCard` — карточка с рекомендацией
   - Состояния: загрузка, результат, ошибка

**Результат:** Все страницы работают, данные отображаются, тултипы показываются.

---

## Этап 7: Фичи и доработки

**Цель:** Добавить сценарии использования и отполировать UI.

### Шаги:

1. **Фича analyzeBuild:**
   - `buildPrompt.ts` — формирование промпта из данных билда
   - Отправка в DeepSeek, отображение результата

2. **Фича analyzeInventory:**
   - `buildInventoryPrompt.ts` — промпт для анализа инвентаря
   - Определение предметов для продажи/крафта/хранения

3. **Фича filterItems:**
   - `filterFunctions.ts` — фильтрация по типу, редкости, цене
   - `FilterBar.tsx` — UI фильтров

4. **Полировка:**
   - Анимации: появление тултипов, переходы между страницами
   - Skeleton loaders для загрузки данных
   - Состояния пустых списков (empty state)
   - Адаптивность под мобильные устройства

---

## Этап 8: Деплой

**Цель:** Подготовить проект к production.

### Шаги:

1. Dockerfile для бэкенда (multi-stage, python slim)
2. Dockerfile для фронтенда (nginx serve static)
3. docker-compose.yml (backend + frontend)
4. Настройка production-переменных
5. Проверка сборки: `docker-compose up --build`
6. Документация по деплою

---

## Timeline (оценка)

| Этап | Описание | Примерное время |
|------|---------|-----------------|
| 1 | Инфраструктура | 1 день |
| 2 | Бэкенд ядро | 2-3 дня |
| 3 | DeepSeek API | 1 день |
| 4 | Фронтенд инфраструктура | 2 дня |
| 5 | Сущности и виджеты | 2 дня |
| 6 | Страницы | 3-4 дня |
| 7 | Фичи и полировка | 2-3 дня |
| 8 | Деплой | 1 день |
| **Итого** | | **~14-17 дней** |

## Приоритеты при реализации

1. **Критично (Must have):** бэкенд API, выбор персонажа, просмотр билда
2. **Важно (Should have):** инвентарь и банк, тултипы, цены
3. **Хорошо бы (Nice to have):** AI-анализ, фильтрация, анимации
4. **Опционально (Could have):** Redis-кэш, мобильная версия, PWA
