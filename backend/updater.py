import json
import sys
import urllib.request
import urllib.error
import zipfile
import io
import os
import tempfile
import shutil
from pathlib import Path


def get_base_dir() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent


def read_local_version(base_dir: Path) -> dict | None:
    version_path = base_dir / "version.json"
    if not version_path.exists():
        return None
    with open(version_path, encoding="utf-8") as f:
        return json.load(f)


def fetch_latest_release(owner: str, repo: str) -> dict | None:
    url = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"
    req = urllib.request.Request(url, headers={"User-Agent": "GW2-Assist-Updater/1.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except (urllib.error.HTTPError, urllib.error.URLError, OSError):
        return None


def ask_user(message: str) -> bool:
    try:
        import ctypes
        result = ctypes.windll.user32.MessageBoxW(0, message, "GW2 Assist — Обновление", 4 | 32)
        return result == 6
    except Exception:
        reply = input(f"{message} (y/n): ").strip().lower()
        return reply == "y"


def download_and_extract(download_url: str, target_dir: Path) -> bool:
    try:
        print(f"Загрузка {download_url}...")
        req = urllib.request.Request(download_url, headers={"User-Agent": "GW2-Assist-Updater/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()

        temp_dir = Path(tempfile.mkdtemp())
        update_dir = temp_dir / "update"
        update_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            zf.extractall(str(update_dir))

        items = list(update_dir.iterdir())
        if len(items) == 1 and items[0].is_dir():
            source = items[0]
        else:
            source = update_dir

        update_temp = Path(tempfile.mkdtemp())
        for item in source.iterdir():
            dest = update_temp / item.name
            if item.is_dir():
                shutil.copytree(item, dest)
            else:
                shutil.copy2(item, dest)

        bat_path = target_dir / "_update.bat"
        bat_content = f"""@echo off
chcp 65001 >nul
title GW2 Assist — Обновление
echo Ожидание завершения обновления...
ping -n 3 127.0.0.1 >nul
echo Копирование файлов...
xcopy /E /Y /Q "{update_temp}\\*.*" "{target_dir}\\"
echo Очистка временных файлов...
rmdir /S /Q "{update_temp}" 2>nul
rmdir /S /Q "{temp_dir}" 2>nul
echo Обновление завершено!
if exist "{target_dir}\\backend.exe" (
    start "" "{target_dir}\\backend.exe"
)
del "%~f0"
"""
        with open(bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)

        print("Запуск процесса обновления...")
        os.startfile(str(bat_path))
        return True
    except Exception as e:
        print(f"Ошибка обновления: {e}")
        return False


def main():
    base_dir = get_base_dir()
    local = read_local_version(base_dir)

    if not local:
        print("version.json не найден. Пропуск проверки.")
        return 0

    owner = local.get("github_owner", "")
    repo = local.get("github_repo", "")

    if not owner or not repo or owner == "YOUR_GITHUB_USERNAME":
        print("GitHub репозиторий не настроен в version.json. Пропуск проверки.")
        return 0

    print(f"Проверка обновлений: {owner}/{repo} ...")
    release = fetch_latest_release(owner, repo)

    if not release:
        print("Не удалось проверить обновления.")
        return 0

    latest_tag = release.get("tag_name", "").lstrip("v")
    current_ver = local.get("version", "")

    print(f"Текущая версия: v{current_ver}")
    print(f"Последняя версия: v{latest_tag}")

    if latest_tag <= current_ver:
        print("У вас актуальная версия.")
        return 0

    if not ask_user(f"Доступна новая версия v{latest_tag}. Обновить сейчас?"):
        print("Обновление отложено.")
        return 0

    zip_url = None
    for asset in release.get("assets", []):
        name = asset.get("name", "")
        if name.endswith(".zip") and "Portable" in name:
            zip_url = asset.get("browser_download_url")
            break

    if not zip_url:
        zip_url = release.get("zipball_url")
        if not zip_url:
            print("Не найден архив для скачивания.")
            return 1

    if download_and_extract(zip_url, base_dir):
        print("Обновление будет применено после закрытия программы.")
        os._exit(0)
    return 0


if __name__ == "__main__":
    sys.exit(main())
