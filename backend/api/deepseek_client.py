import httpx
from typing import Optional
from utils.errors import DeepSeekAPIError
from utils.config import config
import re

DEEPSEEK_API_BASE = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"
REQUEST_TIMEOUT = 120.0


def _clean_ai_markdown(text: str) -> str:
    """Fix AI markdown mistakes: backtick-wrapped URLs, broken image syntax."""

    # Phase 1: strip backticks from inside markdown syntax
    # ![`text`](`url`) → ![text](url)
    text = re.sub(r'!\[`([^`]*)`\]\(`([^`]*)`\)', r'![\1](\2)', text)
    # [`text`](`url`) → [text](url)
    text = re.sub(r'\[`([^`]*)`\]\(`([^`]*)`\)', r'[\1](\2)', text)

    # Phase 2: fix per-line broken images of form: ! `icon_url` ...rest...
    def _fix_line(line: str) -> str:
        m = re.match(r'! `(https?://[^`]+)`\s+(.*)', line)
        if not m:
            return line
        icon = m.group(1)
        rest = m.group(2)

        # Try: `wiki_url` tail
        wm = re.match(r'`(https?://wiki\.guildwars2\.com/wiki/([^`]+))`\s*(.*)', rest)
        if wm:
            wiki_url = wm.group(1)
            name = wm.group(2).replace('_', ' ')
            tail = wm.group(3)
            return f'![{name}]({icon}) [{name}]({wiki_url}) {tail}'

        # Try: [Name](wiki_url) tail (standard markdown)
        wm = re.match(r'\[([^\]]+)\]\((https?://wiki\.guildwars2\.com/wiki/[^)]+)\)\s*(.*)', rest)
        if wm:
            name = wm.group(1)
            wiki_url = wm.group(2)
            tail = wm.group(3)
            return f'![{name}]({icon}) [{name}]({wiki_url}) {tail}'

        # Fallback: keep icon + rest intact
        return f'![item]({icon}) {rest}'

    lines = [_fix_line(line) for line in text.split('\n')]
    return '\n'.join(lines)


async def analyze(
    prompt: str,
    api_key: str,
    temperature: float = 0.3,
    max_tokens: int = 10000,
) -> str:
    if not api_key:
        api_key = config.deepseek_api_key or ""

    if not api_key:
        raise DeepSeekAPIError(detail="DeepSeek API key not configured")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Ты — эксперт по игре Guild Wars 2. "
                    "Ты помогаешь игрокам анализировать билды персонажей, "
                    "экипировку и инвентарь. Отвечай на русском языке, "
                    "давай конкретные советы и рекомендации. "
                    "Будь краток и по делу."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{DEEPSEEK_API_BASE}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            result = data["choices"][0]["message"]["content"]
            return _clean_ai_markdown(result)

        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            detail = f"DeepSeek API error: {e.response.text}"
            if status == 401:
                detail = "Invalid DeepSeek API key"
            elif status == 429:
                detail = "DeepSeek rate limit exceeded"
            elif status == 402:
                detail = "Insufficient DeepSeek balance"
            raise DeepSeekAPIError(detail=detail, status_code=status)
        except httpx.RequestError as e:
            raise DeepSeekAPIError(detail=f"DeepSeek connection error: {str(e)}")
