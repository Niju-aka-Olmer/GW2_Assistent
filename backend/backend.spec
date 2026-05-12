# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

block_cipher = None

frontend_dist = Path.cwd() / "frontend" / "dist"

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (str(frontend_dist / "index.html"), "frontend"),
        (str(frontend_dist / "assets"), "frontend/assets"),
        ('version.json', '.'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.middleware',
        'uvicorn.middleware.asgi2',
        'uvicorn.middleware.wsgi',
        'uvicorn.middleware.proxy_headers',
        'httpx',
        'httpx._config',
        'certifi',
        'sniffio',
        'idna',
        'httpcore',
        'httpcore._async',
        'httpcore._async.connection',
        'httpcore._async.http11',
        'hpack',
        'h2',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'unittest',
        'http.server',
        'pydoc',
        'doctest',
        'test',
        'distutils',
        'lib2to3',
        'curses',
        'turtle',
        'asyncio.test_utils',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
