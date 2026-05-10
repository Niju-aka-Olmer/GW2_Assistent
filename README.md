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

> **Что такое Ubuntu?** — это операционная система для серверов. Все команды ниже нужно вводить по очереди в терминал (чёрное окно с текстом). Каждая команда — это инструкция для компьютера, что делать дальше.

---

#### Шаг 1. Подключиться к серверу (если он удалённый)

Если сервер стоит у тебя дома — просто открой терминал (Ctrl+Alt+T).

Если сервер удалённый (например, арендован в облаке) — подключись по SSH:

```bash
ssh username@IP_АДРЕС_СЕРВЕРА
```

Где `username` — имя пользователя (обычно `root` или `ubuntu`), а `IP_АДРЕС_СЕРВЕРА` — цифровой адрес сервера.

---

#### Шаг 2. Установка зависимостей

Это как установка инструментов, чтобы проект заработал:

```bash
sudo apt update
```

> **Что делает:** проверяет, какие обновления пакетов доступны для системы.

```bash
sudo apt install -y git python3 python3-pip python3-venv nodejs npm curl
```

> **Что делает:** устанавливает программы, которые нужны для работы проекта:
> - `git` — чтобы скачать код из GitHub
> - `python3`, `pip`, `venv` — чтобы запускать Python-бэкенд
> - `nodejs`, `npm` — чтобы собирать фронтенд
> - `curl` — чтобы проверять, работает ли сервер

---

#### Шаг 3. Скачать код из GitHub

```bash
git clone https://github.com/Niju-aka-Olmer/GW2_Assistent.git
```

> **Что делает:** создаёт папку `GW2_Assistent` и скачивает в неё весь код проекта.

```bash
cd GW2_Assistent
```

> **Что делает:** заходит в эту папку (cd = change directory).

Проверь, что ты внутри:

```bash
pwd
```

> Должно показать: `/home/твой_пользователь/GW2_Assistent`

Посмотри список файлов:

```bash
ls -la
```

> Ты должен увидеть папки: `backend/`, `frontend/`, `docs/`, файлы `README.md`, `.env.example`, `.gitignore`

---

#### Шаг 4. Настройка бэкенда

**4.1. Создать виртуальное окружение**

Это изолированная среда для Python, чтобы библиотеки не мешали другим программам:

```bash
python3 -m venv venv
```

> **Что делает:** создаёт папку `venv/`, внутри которой будет отдельный Python со своими библиотеками.

**4.2. Активировать виртуальное окружение**

```bash
source venv/bin/activate
```

> **Что делает:** включает эту изолированную среду. Теперь все команды `pip install` будут ставить библиотеки только внутрь папки `venv/`.
>
> Если видишь `(venv)` в начале строки терминала — значит, активация прошла успешно.

**4.3. Установить Python-библиотеки**

```bash
pip install --upgrade pip
```

> **Что делает:** обновляет сам установщик пакетов `pip` до последней версии.

```bash
pip install -r backend/requirements.txt
```

> **Что делает:** читает файл `backend/requirements.txt` и устанавливает все нужные библиотеки:
> - `fastapi` — веб-фреймворк (сам сервер)
> - `uvicorn` — программа, которая запускает FastAPI
> - `httpx` — библиотека для запросов к GW2 API
> - `cachetools` — для кэширования данных
> - `pydantic`, `pydantic-settings` — для работы с настройками

```bash
pip install sentry-sdk
```

> **Что делает:** устанавливает библиотеку для отслеживания ошибок (можно пропустить, но лучше установить).

```bash
pip install httpx
```

> **Что делает:** на всякий случай доустанавливает httpx, если ещё не поставился.

**4.4. Создать файл с настройками**

Скопируй пример файла настроек:

```bash
cp .env.example .env
```

> **Что делает:** создаёт файл `.env` (в нём будут храниться твои ключи). Файл `.env.example` — это просто образец.

Теперь открой файл для редактирования:

```bash
nano .env
```

> **Что делает:** открывает редактор `nano` внутри терминала. Управление стрелочками, выход — Ctrl+X.

Внутри файла ты увидишь:

```
GW2_API_KEY=
DEEPSEEK_API_KEY=
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

Тебе нужно вписать свои ключи **после знака `=`**:

```
GW2_API_KEY=ТВОЙ_GW2_КЛЮЧ
DEEPSEEK_API_KEY=ТВОЙ_DEEPSEEK_КЛЮЧ
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

- `GW2_API_KEY` — ключ от Guild Wars 2 (как получить — в разделе ниже)
- `DEEPSEEK_API_KEY` — ключ для AI-анализа из DeepSeek (можно оставить пустым, AI не будет работать, но всё остальное — будет)
- `HOST=0.0.0.0` — чтобы сервер был доступен не только на этом компьютере, но и по сети
- `PORT=8000` — порт, на котором будет работать сервер
- `DEBUG=false` — выключить режим отладки

**Как сохранить и выйти из nano:**
1. Нажми `Ctrl+X` (выйти)
2. Нажми `Y` (подтвердить сохранение)
3. Нажми `Enter` (сохранить с тем же именем)

---

#### Шаг 5. Сборка фронтенда

Фронтенд — это веб-страница, которую ты будешь видеть в браузере. Его нужно собрать из исходников.

```bash
cd frontend
```

> **Что делает:** заходит в папку `frontend/`

```bash
npm install
```

> **Что делает:** скачивает все JavaScript-библиотеки, необходимые для фронтенда.
>
> **Если ошибка** — попробуй:
> ```bash
> npm install --legacy-peer-deps
> ```

```bash
npm run build
```

> **Что делает:** собирает готовую веб-страницу из исходников. Результат будет в папке `frontend/dist/`.
>
> **Жди завершения.** Если всё хорошо — увидишь что-то вроде `✓ built in 15.23s`

```bash
cd ..
```

> **Что делает:** возвращается обратно в корневую папку проекта.

---

#### Шаг 6. Запуск сервера

**Простой запуск (терминал будет занят):**

```bash
source venv/bin/activate
```

> Включаем виртуальное окружение (если ещё не включено).

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

> **Что делает:** запускает сервер.
>
> `backend.main:app` — указывает, какой файл запускать (`backend/main.py`, внутри объект `app`)
> `--host 0.0.0.0` — слушать все сетевые интерфейсы
> `--port 8000` — работать на порту 8000

**Результат:** ты увидишь:

```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**⚠️ Важно:** пока этот терминал открыт — сервер работает. Если закроешь терминал — сервер остановится.

Открой браузер и перейди по адресу: `http://IP_СЕРВЕРА:8000`

---

#### Шаг 7. Запуск в фоне (чтобы сервер работал после закрытия терминала)

Есть два способа:

**Способ A: screen (проще)**

```bash
screen -S gw2
```

> **Что делает:** создаёт новое окно внутри терминала, которое останется висеть, даже если ты отключишься.

```bash
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

> Запускаешь сервер внутри этого окна.

Теперь нажми `Ctrl+A`, затем отпусти и нажми `D`.

> **Что делает:** отсоединяет тебя от окна screen. Сервер остаётся работать в фоне.
>
> Чтобы вернуться к нему позже: `screen -r gw2`

**Способ B: nohup (ещё проще)**

```bash
source venv/bin/activate
nohup uvicorn backend.main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

> **Что делает:** запускает сервер в фоне и записывает все сообщения в файл `server.log`

Чтобы остановить:

```bash
pkill uvicorn
```

---

#### Шаг 8. Автозапуск при старте системы (чтобы сервер сам включался после перезагрузки)

Это настройка для тех, кто хочет, чтобы сервер запускался автоматически при включении Ubuntu.

**8.1. Создать файл службы**

```bash
sudo nano /etc/systemd/system/gw2-assist.service
```

Откроется пустой редактор. Скопируй туда этот текст:

```ini
[Unit]
Description=GW2 Assist Server
After=network.target

[Service]
User=твой_пользователь
WorkingDirectory=/home/твой_пользователь/GW2_Assistent
ExecStart=/home/твой_пользователь/GW2_Assistent/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Что нужно заменить:**
- `твой_пользователь` — на имя твоего пользователя в Ubuntu. Узнать можно командой `whoami`

**Пример** для пользователя `ubuntu`:

```ini
[Unit]
Description=GW2 Assist Server
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/GW2_Assistent
ExecStart=/home/ubuntu/GW2_Assistent/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Сохрани и выйди: `Ctrl+X` → `Y` → `Enter`

**8.2. Включить службу**

```bash
sudo systemctl daemon-reload
```

> Обновить список служб.

```bash
sudo systemctl enable --now gw2-assist.service
```

> Включить автозапуск И запустить прямо сейчас.

**8.3. Проверить, работает ли**

```bash
sudo systemctl status gw2-assist.service
```

> Должен показать `active (running)`

Если нужно остановить:

```bash
sudo systemctl stop gw2-assist.service
```

Если нужно перезапустить:

```bash
sudo systemctl restart gw2-assist.service
```

**8.4. Посмотреть логи (если что-то пошло не так)**

```bash
sudo journalctl -u gw2-assist.service -n 50
```

> Покажет последние 50 строк сообщений от сервера.

---

#### Шаг 9. Открыть порт в фаерволе

Чтобы к серверу можно было обратиться с других компьютеров:

```bash
sudo ufw allow 8000/tcp
```

```bash
sudo ufw reload
```

> **Что делает:** разрешает входящие соединения на порт 8000 (там работает наш сервер).

---

#### Шаг 10. Проверка

В браузере на любом компьютере в той же сети открой:

```
http://IP_СЕРВЕРА:8000
```

Где `IP_СЕРВЕРА` — IP-адрес твоего Ubuntu-сервера. Узнать его можно командой:

```bash
hostname -I
```

Должна открыться страница с предложением ввести GW2 API Key — это значит, что всё работает!

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
