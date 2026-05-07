# GW2 Assistant — Architecture Document

## Общая архитектура системы

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Клиентская часть (Браузер)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + Tailwind CSS + React Query                   │
├──────────────┬──────────────┬──────────────┬─────────────────────────────────┤
│   Страница   │   Страница   │   Страница   │     Общие компоненты            │
│   Персонажи  │    Билд      │  Инвентарь   │  - ItemCard + Tooltip           │
│              │              │    и Банк    │  - PriceBadge                   │
└──────────────┴──────────────┴──────────────┴─────────────────────────────────┘
                                      │
                              HTTP (REST API)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Серверная часть (Backend)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  FastAPI + uvicorn + httpx + cachetools                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  GW2 API     │  │  DeepSeek    │  │  Кэш         │  │  Session         │  │
│  │  Client      │  │  Client      │  │  (in-memory) │  │  Manager         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Внешние API                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  • https://api.guildwars2.com/v2/    — GW2 API                              │
│  • https://api.deepseek.com/v1/     — DeepSeek API                          │
│  • https://render.guildwars2.com/   — CDN иконок                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Полная структура файлов и папок (FSD)

```
GW2_Assist/
│
├── docs/                                   # Документация проекта
│   ├── PROJECT_OVERVIEW.md                 # Описание проекта
│   ├── ARCHITECTURE.md                     # Архитектура (текущий файл)
│   ├── TECH_STACK.md                       # Технологический стек
│   ├── CURRENT_STATUS.md                   # Текущий статус
│   ├── COLOR_PALETTE.md                    # Цветовые схемы
│   └── IMPLEMENTATION_PLAN.md              # План реализации
│
├── backend/                                # Серверная часть
│   ├── main.py                             # Точка входа FastAPI
│   ├── requirements.txt                    # Python зависимости
│   ├── Dockerfile                          # Docker для бэкенда
│   │
│   ├── api/                                # Слой API клиентов
│   │   ├── __init__.py
│   │   ├── gw2_client.py                   # HTTP клиент для GW2 API
│   │   ├── deepseek_client.py              # HTTP клиент для DeepSeek API
│   │   └── endpoints.py                    # REST эндпоинты
│   │
│   ├── models/                             # Pydantic модели
│   │   ├── __init__.py
│   │   ├── character.py                    # Модель персонажа
│   │   ├── item.py                         # Модель предмета
│   │   └── price.py                        # Модель цены
│   │
│   ├── services/                           # Бизнес-логика
│   │   ├── __init__.py
│   │   ├── auth_service.py                 # Аутентификация через GW2 API
│   │   ├── build_analyzer.py               # Анализ билда
│   │   ├── inventory_analyzer.py           # Анализ инвентаря
│   │   └── localization.py                 # Русская локализация
│   │
│   ├── cache/                              # Слой кэширования
│   │   ├── __init__.py
│   │   ├── memory_cache.py                 # In-memory кэш (TTLCache)
│   │   └── redis_client.py                 # Redis кэш (опционально)
│   │
│   └── utils/                              # Утилиты
│       ├── __init__.py
│       ├── config.py                       # Конфигурация (env variables)
│       └── errors.py                       # Кастомные error handlers
│
├── frontend/                               # Клиентская часть
│   ├── index.html                          # HTML entry point
│   ├── package.json                        # Зависимости
│   ├── vite.config.ts                      # Vite конфигурация
│   ├── tailwind.config.ts                  # Tailwind CSS конфигурация
│   ├── tsconfig.json                       # TypeScript конфигурация
│   ├── Dockerfile                          # Docker для фронтенда
│   │
│   └── src/                                # Исходный код (FSD)
│       │
│       ├── app/                            # Слой инициализации
│       │   ├── main.tsx                    # Точка входа React
│       │   ├── App.tsx                     # Корневой компонент с роутингом
│       │   ├── providers/
│       │   │   ├── QueryProvider.tsx        # React Query провайдер
│       │   │   ├── ThemeProvider.tsx        # Провайдер темы (тёмная/светлая)
│       │   │   └── AuthProvider.tsx         # Провайдер аутентификации
│       │   └── routes.tsx                  # Конфигурация маршрутов
│       │
│       ├── pages/                          # Страницы
│       │   ├── CharacterSelectPage/        # Страница выбора персонажа
│       │   │   ├── ui/CharacterSelectPage.tsx
│       │   │   ├── components/CharacterCard.tsx
│       │   │   └── model/useCharacters.ts
│       │   │
│       │   ├── BuildPage/                  # Страница билда
│       │   │   ├── ui/BuildPage.tsx
│       │   │   ├── components/
│       │   │   │   ├── SpecializationsPanel.tsx
│       │   │   │   ├── SkillsGrid.tsx
│       │   │   │   └── EquipmentGrid.tsx
│       │   │   └── model/useBuildData.ts
│       │   │
│       │   ├── InventoryPage/              # Страница инвентаря
│       │   │   ├── ui/InventoryPage.tsx
│       │   │   ├── components/
│       │   │   │   ├── InventoryGrid.tsx
│       │   │   │   └── BankGrid.tsx
│       │   │   └── model/useInventoryData.ts
│       │   │
│       │   └── RecommendationsPage/        # Страница AI-рекомендаций
│       │       ├── ui/RecommendationsPage.tsx
│       │       ├── components/
│       │       │   ├── InsightCard.tsx
│       │       │   └── ActionButton.tsx
│       │       └── model/useRecommendations.ts
│       │
│       ├── widgets/                        # Переиспользуемые виджеты
│       │   ├── ItemTooltip/               # Тултип предмета
│       │   │   ├── ui/ItemTooltip.tsx
│       │   │   ├── lib/
│       │   │   │   ├── formatStats.ts      # Форматирование статов
│       │   │   │   └── rusAttributes.ts    # Перевод атрибутов
│       │   │   └── model/useTooltipPosition.ts
│       │   │
│       │   ├── PriceBadge/                # Значок цены
│       │   │   ├── ui/PriceBadge.tsx
│       │   │   └── lib/formatCoin.ts       # Форматирование монет
│       │   │
│       │   ├── ThemeToggle/               # Переключатель темы
│       │   │   └── ui/ThemeToggle.tsx
│       │   │
│       │   └── Header/                    # Шапка приложения
│       │       └── ui/Header.tsx
│       │
│       ├── features/                       # Фичи (сценарии использования)
│       │   ├── analyzeBuild/              # Анализ билда через DeepSeek
│       │   │   ├── api/sendToDeepSeek.ts
│       │   │   └── lib/buildPrompt.ts      # Формирование промпта
│       │   │
│       │   ├── analyzeInventory/           # Анализ инвентаря
│       │   │   ├── api/sendInventoryToDeepSeek.ts
│       │   │   └── lib/buildInventoryPrompt.ts
│       │   │
│       │   └── filterItems/               # Фильтрация предметов
│       │       ├── lib/filterFunctions.ts
│       │       └── ui/FilterBar.tsx
│       │
│       ├── entities/                       # Бизнес-сущности
│       │   ├── character/
│       │   │   ├── model/types.ts          # Типы персонажа
│       │   │   ├── lib/getProfessionIcon.ts
│       │   │   └── api/getCharacters.ts
│       │   │
│       │   ├── item/
│       │   │   ├── model/types.ts          # Типы предмета
│       │   │   ├── lib/
│       │   │   │   ├── getRarityColor.ts   # Цвет по редкости
│       │   │   │   ├── formatDescription.ts
│       │   │   │   └── getItemIconUrl.ts
│       │   │   └── api/getItemDetails.ts
│       │   │
│       │   ├── build/
│       │   │   ├── model/types.ts
│       │   │   └── api/getBuildData.ts
│       │   │
│       │   └── price/
│       │       ├── model/types.ts
│       │       └── api/getItemPrices.ts
│       │
│       ├── shared/                         # Общий слой
│       │   ├── api/
│       │   │   ├── gw2Client.ts            # HTTP клиент GW2
│       │   │   ├── deepseekClient.ts       # HTTP клиент DeepSeek
│       │   │   └── apiClient.ts            # Базовый HTTP клиент
│       │   │
│       │   ├── config/
│       │   │   └── constants.ts            # Константы
│       │   │
│       │   ├── lib/
│       │   │   ├── formatDate.ts
│       │   │   ├── debounce.ts
│       │   │   └── storage.ts              # LocalStorage helpers
│       │   │
│       │   ├── hooks/
│       │   │   ├── useTheme.ts             # Хук темы
│       │   │   └── useLocalStorage.ts      # Хук LocalStorage
│       │   │
│       │   └── ui/                         # UI-kit
│       │       ├── Layout.tsx              # Основной лейаут
│       │       ├── Spinner.tsx             # Индикатор загрузки
│       │       ├── ErrorBoundary.tsx       # Граница ошибок
│       │       ├── ErrorFallback.tsx       # UI ошибки
│       │       ├── Tabs.tsx                # Табы
│       │       ├── Button.tsx              # Кнопка
│       │       ├── Input.tsx               # Поле ввода
│       │       └── Card.tsx                # Карточка-контейнер
│       │
│       └── styles/
│           └── globals.css                 # Глобальные стили + Tailwind
│
├── docker-compose.yml                      # Docker Compose для всего проекта
├── .env.example                            # Пример переменных окружения
├── .gitignore                              # Git ignore
└── README.md                               # Инструкция по запуску
```

## Описание всех компонентов

### Слой app (инициализация)

| Компонент | Ответственность |
|-----------|----------------|
| **App.tsx** | Корневой компонент. Подключает провайдеры (Query, Theme, Auth), рендерит Layout с роутингом |
| **QueryProvider.tsx** | Настраивает React Query (TanStack Query) — кэширование запросов, retry, stale time |
| **ThemeProvider.tsx** | Управляет тёмной/светлой темой, сохраняет выбор в localStorage, применяет CSS-класс к `body` |
| **AuthProvider.tsx** | Хранит API-ключ GW2 в sessionStorage, предоставляет контекст аутентификации |
| **routes.tsx** | Конфигурация маршрутов: `/` — выбор персонажа, `/build/:name` — билд, `/inventory/:name` — инвентарь, `/recommendations` — AI |

### Слой pages (страницы)

| Компонент | Ответственность |
|-----------|----------------|
| **CharacterSelectPage** | Отображает список персонажей аккаунта. Карточки с иконкой профессии, именем, уровнем |
| **CharacterCard** | Карточка персонажа: иконка профессии, имя, уровень, раса. Клик ведёт на страницу билда |
| **BuildPage** | Детальная страница билда: специализации, навыки, экипировка + кнопка AI-анализа |
| **SpecializationsPanel** | Отображает 3 выбранные специализации с их трейтами |
| **SkillsGrid** | Сетка 5 слотов навыков (исцеление, утилиты, элитный) |
| **EquipmentGrid** | Сетка экипировки: броня, аксессуары, оружие. Каждый слот — ItemCard |
| **InventoryPage** | Страница инвентаря и банка с фильтрацией |
| **InventoryGrid** | Сетка предметов в сумках персонажа |
| **BankGrid** | Сетка предметов в банке |
| **RecommendationsPage** | Страница с AI-рекомендациями от DeepSeek |
| **InsightCard** | Карточка с одним советом/инсайтом от AI |
| **ActionButton** | Кнопка действия (запросить анализ) с состоянием загрузки |

### Слой widgets (виджеты)

| Компонент | Ответственность |
|-----------|----------------|
| **ItemTooltip** | Всплывающая подсказка при наведении на предмет: имя, тип, статы, описание, цена |
| **PriceBadge** | Значок цены предмета: цена покупки/продажи на торговой площадке |
| **ThemeToggle** | Кнопка-переключатель между тёмной и светлой темой |
| **Header** | Шапка: лого, навигация, переключатель темы, статус API-ключа |

### Слой features (фичи)

| Компонент | Ответственность |
|-----------|----------------|
| **analyzeBuild** | Собирает данные билда, формирует промпт, отправляет в DeepSeek, отображает результат |
| **analyzeInventory** | Анализирует инвентарь, находит ценные предметы для продажи |
| **filterItems** | Фильтрует предметы по типу, редкости, цене, названию |

### Слой entities (сущности)

| Компонент | Ответственность |
|-----------|----------------|
| **character/model/types.ts** | TypeScript типы: Character, Profession, Race |
| **character/api/getCharacters.ts** | Запрос к бэкенду за списком персонажей |
| **item/model/types.ts** | TypeScript типы: Item, ItemRarity, ItemType, ItemStats |
| **item/lib/getRarityColor.ts** | Возвращает CSS-цвет рамки по редкости предмета |
| **item/lib/formatDescription.ts** | Форматирует описание предмета (clean HTML) |
| **build/model/types.ts** | TypeScript типы: Build, Specialization, Trait, Skill, Equipment |
| **price/model/types.ts** | TypeScript типы: PriceData, CoinValue |

### Слой shared (общее)

| Компонент | Ответственность |
|-----------|----------------|
| **api/gw2Client.ts** | HTTP-клиент для прокси-запросов к GW2 API через бэкенд |
| **api/deepseekClient.ts** | HTTP-клиент для запросов к DeepSeek API через бэкенд |
| **api/apiClient.ts** | Базовый axios-клиент с перехватчиками ошибок |
| **ui/Layout** | Основной каркас страницы: Header + main content + footer |
| **ui/Spinner** | Анимированный индикатор загрузки |
| **ui/ErrorBoundary** | React Error Boundary для отлова ошибок |
| **ui/ErrorFallback** | UI отображения ошибки с кнопкой повтора |
| **ui/Tabs** | Компонент вкладок для переключения между разделами |
| **ui/Button** | Переиспользуемая кнопка с variant (primary/secondary/ghost) и size |
| **ui/Input** | Поле ввода с лейблом и ошибкой |
| **ui/Card** | Контейнер-карточка с тенью и скруглениями |

### Серверные компоненты (backend)

| Компонент | Ответственность |
|-----------|----------------|
| **main.py** | FastAPI приложение, CORS, middleware, подключение роутов |
| **api/gw2_client.py** | Асинхронный клиент для GW2 API: персонажи, предметы, цены |
| **api/deepseek_client.py** | Асинхронный клиент для DeepSeek API: отправка промптов, получение ответов |
| **api/endpoints.py** | REST эндпоинты: /auth, /characters, /build, /inventory, /bank, /deepseek |
| **models/character.py** | Pydantic модели: Character, CharacterBuild |
| **models/item.py** | Pydantic модели: Item, ItemDetails |
| **models/price.py** | Pydantic модели: PriceData, CoinValue |
| **services/auth_service.py** | Валидация GW2 API-ключа, проверка permissions |
| **services/build_analyzer.py** | Формирование данных билда для DeepSeek |
| **services/inventory_analyzer.py** | Анализ предметов: ценные, для продажи, для крафта |
| **services/localization.py** | Словари для перевода на русский |
| **cache/memory_cache.py** | In-memory кэш с TTL (cachetools.TTLCache) |
| **cache/redis_client.py** | Опциональный Redis-кэш для масштабирования |

## Рекомендации по организации кода

### 1. Feature-Sliced Design (FSD)
Проект следует методологии FSD с 7 слоями:
- `app` — инициализация (провайдеры, роутинг)
- `pages` — страницы приложения
- `widgets` — переиспользуемые составные блоки
- `features` — пользовательские сценарии
- `entities` — бизнес-сущности
- `shared` — переиспользуемые утилиты и UI-kit
- `styles` — глобальные стили

### 2. Правила импортов
- Слой может импортировать только себя и слои ниже
- `pages` → `widgets` → `features` → `entities` → `shared`
- `shared` — самый нижний слой, не импортирует ничего из проекта
- Запрещены циклические импорты

### 3. Типизация
- Все модели данных имеют TypeScript/Pydantic типы
- API ответы оборачиваются в строго типизированные интерфейсы
- Используются discriminated unions для вариантов состояния (loading, error, success)

### 4. Обработка ошибок
- На фронтенде: ErrorBoundary + fallback UI + retry-логика
- На бэкенде: кастомные исключения → HTTP-статусы + JSON error body
- API клиенты: перехватчики для логирования ошибок

### 5. Стилизация
- Tailwind CSS для утилитарной стилизации
- CSS-переменные для темизации
- `data-theme="dark|light"` на корневом элементе
- Все цвета — из палитры (см. COLOR_PALETTE.md)
