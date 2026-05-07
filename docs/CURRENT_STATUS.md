# GW2 Assistant — Current Status

## Текущий статус проекта: Страницы с реальными данными готовы

Реализован полный бэкенд (GW2 API + DeepSeek AI) и фронтенд (UI-kit, роутинг, сущности, API-интеграция, виджеты, все страницы).
Развёрнуто на ВМ: http://192.168.1.180:3000 (фронтенд + API прокси через один порт).

## Что сделано

### Инфраструктура (Этап 1)
- [x] Анализ требований (файл 123.txt)
- [x] Выбор технологического стека
- [x] Архитектурная документация (FSD)
- [x] Структура файлов и папок
- [x] Документация Trae (текущие файлы docs/)
- [x] Инициализирован Git-репозиторий + push на GitHub
- [x] Создан backend-проект: main.py, requirements.txt, Dockerfile
- [x] Создан frontend-проект: Vite + React + TypeScript
- [x] Настроен Tailwind CSS (тёмная/светлая тема через CSS-переменные)
- [x] Настроен Docker Compose
- [x] Деплой на ВМ (192.168.1.180): бэкенд :8000, фронтенд :3000
- [x] Установлен Docker на ВМ
- [x] Настроен UFW: открыты порты 22 (SSH) и 3000 (фронтенд)
- [x] Фронтенд и API через один порт 3000 (Vite proxy → localhost:8000)

### Бэкенд — ядро GW2 API (Этап 2)
- [x] Pydantic модели: Character, Item, Price, Build, Equipment, Inventory
- [x] In-memory кэш (TTLCache): character_cache (10 мин), item_cache (1 час), price_cache (5 мин), token_cache (1 мин)
- [x] Асинхронный GW2 API клиент (gw2_client.py) с батчингом по 200 ID
- [x] Сервис аутентификации (auth_service.py): валидация API-ключа через /v2/tokeninfo
- [x] Эндпоинт POST /api/auth — проверка ключа и permissions
- [x] Эндпоинт GET /api/characters — список персонажей с core-данными
- [x] Эндпоинт GET /api/characters/{name}/build — билд, специализации, экипировка
- [x] Эндпоинт GET /api/characters/{name}/inventory — инвентарь персонажа
- [x] Эндпоинт GET /api/account/bank — банк аккаунта
- [x] Эндпоинт GET /api/items/prices — цены предметов (batch)
- [x] Эндпоинт GET /api/items/details — детали предметов (batch)
- [x] Эндпоинт POST /api/cache/clear — сброс кэша
- [x] Эндпоинт GET /api/health — health check
- [x] Обработка ошибок: 401, 403, 404, 429, 502

### Бэкенд — DeepSeek AI (Этап 3)
- [x] Асинхронный DeepSeek API клиент (deepseek_client.py)
- [x] Эндпоинт POST /api/deepseek/analyze-build — анализ билда через AI
- [x] Эндпоинт POST /api/deepseek/analyze-inventory — анализ инвентаря/банка через AI
- [x] Промпты для анализа билда (build_analyzer.py) — русский язык, структурированный вывод
- [x] Промпты для анализа инвентаря/банка (inventory_analyzer.py)
- [x] System prompt: эксперт GW2 на русском
- [x] Настраиваемый DeepSeek API ключ (из запроса или .env)
- [x] Обработка ошибок: 401, 402, 429 DeepSeek

### Фронтенд — общие компоненты (Этап 4)
- [x] Layout (Header + main + max-w-7xl контейнер)
- [x] Header с навигацией (Персонажи, Рекомендации, выход, переключатель темы)
- [x] UI-kit: Button (variants/sizes), Card, Spinner, Input (label/error/icon), Tabs
- [x] ErrorBoundary + ErrorFallback (с деталями ошибки и retry)
- [x] ThemeProvider (localStorage, data-theme атрибут)
- [x] AuthProvider (API-ключ в sessionStorage)
- [x] QueryProvider (React Query, staleTime 5 мин)
- [x] apiClient (axios instance с Bearer token)
- [x] React Router (страницы: /, /build/:name, /inventory/:name, /recommendations)
- [x] Страницы-заглушки: CharacterSelectPage (ввод ключа), BuildPage, InventoryPage, RecommendationsPage
- [x] Тёмная тема по умолчанию

### Фронтенд — сущности и API (Этап 5)
- [x] Типы персонажа: CharacterSummary, CharacterListResponse, Specialization, Skill, BuildResponse, EquipmentItem, EquipmentResponse, InventoryItem, InventoryResponse
- [x] Типы предмета: ItemDetails, ItemDetailsListResponse
- [x] Типы билда: DeepSeekResponse (result + cached)
- [x] Типы цен: PriceData (id, buys, sells), PriceResponse
- [x] gw2Client.ts: методы auth(), getCharacters(), getCharacterBuild(), getCharacterInventory(), getBank(), getItemPrices(), getItemDetails(), clearCache()
- [x] deepseekClient.ts: методы analyzeBuild(), analyzeInventory() с опциональным DeepSeek API ключом
- [x] useCharacters() — список персонажей (staleTime 5 мин)
- [x] useCharacterBuild(name) — билд персонажа (staleTime 5 мин, enabled: !!name)
- [x] useCharacterInventory(name) — инвентарь (staleTime 5 мин, enabled: !!name)
- [x] useItemDetails(itemIds) — детали предметов (staleTime 1 час, enabled: length > 0)
- [x] useItemPrices(itemIds) — цены предметов (staleTime 5 мин, enabled: length > 0)
- [x] useBank() — банк аккаунта (staleTime 2 мин, 2 retries)
- [x] getRarityColor() + getRarityBorderClass() — цвета редкости (Junk → Legendary)
- [x] getItemIconUrl() — URL иконки предмета с размером
- [x] PriceBadge + formatCoin — отображение цен (золото/серебро/медь)
- [x] ItemTooltip + rusAttributes + formatStats — подсказка с русскими атрибутами

### Фронтенд — страницы (Этап 6)
- [x] CharacterSelectPage — интеграция с useCharacters(), ввод API-ключа, список персонажей с иконками профессий
- [x] BuildPage — билд персонажа: специализации (иконки + траиты), экипировка (редкость, иконки, ItemTooltip), атрибуты
- [x] InventoryPage — инвентарь персонажа + банк (табы), ItemTooltip, PriceBadge, batch item details
- [x] RecommendationsPage — выбор персонажа, табы (анализ билда/инвентаря), DeepSeek AI через useMutation

## Что нужно сделать

### Этап 7: Фичи и доработки
- [ ] Фича analyzeBuild (AI-анализ билда)
- [ ] Фича analyzeInventory (AI-анализ инвентаря)
- [ ] Фича filterItems (фильтрация предметов)
- [ ] Оптимизация кэширования
- [ ] Dark/Light theme polish

### Этап 8: Деплой
- [x] Dockerfile для бэкенда — создан
- [x] Dockerfile для фронтенда — создан
- [x] docker-compose.yml — создан
- [ ] Документация по деплою
- [ ] Настройка production-сборки

## Известные риски

1. **Rate limits GW2 API** — максимально 600 запросов/мин. Решается кэшированием и батчингом запросов (до 200 ID за запрос)
2. **Стоимость DeepSeek API** — токены для анализа билдов. Решается кэшированием результатов и ограничением частоты запросов
3. **Русская локализация** — GW2 API поддерживает `?lang=ru`, но не все предметы переведены полностью. Fallback на английский
4. **Актуальность данных** — билды и цены меняются каждый патч. TTL кэша должен быть разумным (1 час для предметов, 5 мин для цен)
