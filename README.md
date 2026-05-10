# GW2 Assist

**Веб-ассистент для Guild Wars 2.** Просматривайте персонажей, экипировку, инвентарь, банк, получайте AI-анализ билда и торговой площадки с помощью DeepSeek AI.

---

## Содержание

- [Варианты использования](#варианты-использования)
  - [Windows: портабельная версия](#windows-портабельная-версия)
  - [Ubuntu: установка на сервер](#ubuntu-установка-на-сервер)
- [Получение API-ключей](#получение-api-ключей)
- [Сборка проекта из исходников](#сборка-проекта-из-исходников)
- [Обновление версии](#обновление-версии)
- [Структура проекта](#структура-проекта)

---

## Варианты использования

### Windows: портабельная версия

Готовый к запуску пакет. Ничего устанавливать не нужно.

**Системные требования:**
- Windows 10 или 11 (64-bit)
- 500 MB свободного места
- Интернет для обращения к API Guild Wars 2 и DeepSeek

**Запуск:**

1. Скачайте последний релиз: [Releases](https://github.com/Niju-aka-Olmer/GW2_Assistent/releases)
2. Распакуйте ZIP-архив в любую папку
3. Запустите `start.bat`
4. Браузер откроется сам. Если нет — перейдите по адресу `http://IP_ВАШЕГО_КОМПЬЮТЕРА:8000`

**Что делает `start.bat`:**
- Определяет локальный IP вашего компьютера
- Запускает `backend.exe` (веб-сервер)
- Создаёт ярлык на рабочем столе
- Открывает браузер с приложением

**Чтобы остановить** — закройте окно `backend.exe` или нажмите любую клавишу в окне `start.bat`.

---

### Ubuntu: установка на сервер

Развёртывание полноценного сервера из исходников. Подходит для постоянного доступа по сети.

#### 1. Установка зависимостей

```bash
sudo apt update
sudo apt install -y git python3 python3-pip python3-venv nodejs npm curl
```

#### 2. Клонирование репозитория

```bash
git clone https://github.com/Niju-aka-Olmer/GW2_Assistent.git
cd GW2_Assistent
```

#### 3. Настройка бэкенда

```bash
# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей Python
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install sentry-sdk httpx

# Создание файла конфигурации
cp .env.example .env
nano .env
```

В файле `.env` укажите ваши ключи:

```
GW2_API_KEY=ВАШ_GW2_КЛЮЧ
DEEPSEEK_API_KEY=ВАШ_DEEPSEEK_КЛЮЧ
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

#### 4. Сборка фронтенда

```bash
cd frontend
npm install
npm run build
cd ..
```

#### 5. Запуск сервера

```bash
# Активируем venv (если ещё не активирован)
source venv/bin/activate

# Запуск
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Или через screen / tmux для работы в фоне:

```bash
screen -S gw2
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
# Ctrl+A, D — отключиться от screen
```

#### 6. Настройка автозапуска (systemd, опционально)

```bash
sudo nano /etc/systemd/system/gw2-assist.service
```

```ini
[Unit]
Description=GW2 Assist Server
After=network.target

[Service]
User=ваш_пользователь
WorkingDirectory=/home/ваш_пользователь/GW2_Assistent
ExecStart=/home/ваш_пользователь/GW2_Assistent/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gw2-assist.service
```

Сервер будет доступен по адресу: `http://IP_СЕРВЕРА:8000`

#### 7. Настройка фаервола

```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

---

## Получение API-ключей

### Guild Wars 2 API Key

1. Перейдите на https://account.arena.net/applications
2. Создайте новый ключ
3. Включите разрешения: `account`, `characters`, `inventories`, `builds`, `unlocks`, `tradingpost`
4. Скопируйте ключ

### DeepSeek API Key (опционально, для AI-анализа)

1. Зарегистрируйтесь на https://platform.deepseek.com/
2. Пополните баланс (5-10 юаней хватит надолго)
3. Создайте API key в разделе "API Keys"
4. Скопируйте ключ

---

## Сборка проекта из исходников

### Сборка портабельной Windows-версии

```bash
# Бэкенд (Python → .exe)
# Установите Python 3.10+ на Windows

python -m venv build_venv
build_venv\Scripts\pip install -r backend\requirements.txt
build_venv\Scripts\pip install pyinstaller sentry-sdk httpx
build_venv\Scripts\pip install cachetools pydantic_settings

build_venv\Scripts\pyinstaller ^
  --distpath dist\GW2-Assist-Portable ^
  --workpath build_temp ^
  --add-data "backend\version.json;." ^
  --hidden-import uvicorn.logging ^
  --hidden-import uvicorn.loops.auto ^
  --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import uvicorn.protocols.websockets.auto ^
  --hidden-import httpx ^
  --hidden-import cachetools ^
  --hidden-import pydantic_settings ^
  --collect-all uvicorn ^
  --collect-all fastapi ^
  --collect-all sentry_sdk ^
  --onefile --console --name backend backend\main.py

# Фронтенд (React → статика)
cd frontend
npm install
npm run build
cd ..

# Скопировать фронтенд в дистрибутив
xcopy /E frontend\dist dist\GW2-Assist-Portable\frontend\

# Скопировать updater
build_venv\Scripts\pyinstaller ^
  --distpath dist\GW2-Assist-Portable ^
  --workpath build_temp_updater ^
  --onefile --console --name updater backend\updater.py
```

### Сборка через Docker (Ubuntu)

```bash
docker build -t gw2-assist -f backend/Dockerfile .
docker run -d -p 8000:8000 --env-file .env gw2-assist
```

---

## Обновление версии

### Для пользователей Windows (автоматическое)

При запуске `updater.exe` (или через `start.bat`) программа проверяет GitHub API на наличие нового релиза. Если версия выше — появляется окно с предложением обновления.

### Для разработчика (публикация новой версии)

1. Обновите версию в `backend/version.json`
2. Соберите новую портабельную версию (см. инструкцию выше)
3. Создайте ZIP-архив папки `dist\GW2-Assist-Portable`
4. Создайте новый релиз на GitHub:
   - Зайдите в https://github.com/Niju-aka-Olmer/GW2_Assistent/releases/new
   - Tag: `v1.12` (следующая версия)
   - Название: `v1.12`
   - Прикрепите ZIP-архив
   - Опубликуйте
5. Обновите `version.json` в корне проекта и сделайте commit

---

## Структура проекта

```
GW2_Assistent/
├── backend/                    # Python-бэкенд (FastAPI)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── endpoints.py        # API endpoints
│   │   ├── deepseek_client.py  # Клиент DeepSeek AI
│   │   └── gw2_client.py       # Клиент GW2 API
│   ├── cache/
│   │   ├── __init__.py
│   │   └── memory_cache.py     # Кэш с TTL
│   ├── models/
│   │   ├── __init__.py
│   │   ├── character.py        # Модели персонажа
│   │   ├── item.py             # Модели предметов
│   │   └── price.py            # Модели цен
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── build_analyzer.py
│   │   ├── inventory_analyzer.py
│   │   └── trading_post_analyzer.py
│   ├── utils/
│   │   └── config.py
│   ├── main.py                 # Точка входа сервера
│   ├── requirements.txt        # Python-зависимости
│   ├── version.json            # Конфиг версии и GitHub
│   ├── updater.py              # Скрипт авто-обновления
│   └── Dockerfile              # Docker-образ
├── frontend/                   # React-фронтенд (Vite + TypeScript)
│   ├── src/
│   │   ├── app/
│   │   ├── pages/
│   │   ├── shared/
│   │   └── widgets/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   └── USER_GUIDE.md           # Подробное руководство пользователя
├── dist/
│   └── GW2-Assist-Portable/    # Готовая портабельная версия
├── .env.example                # Пример конфигурации
├── .gitignore
└── README.md
```
