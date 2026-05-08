import httpx
from typing import Optional
from utils.errors import DeepSeekAPIError
from utils.config import config

DEEPSEEK_API_BASE = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"
REQUEST_TIMEOUT = 60.0


async def analyze(
    prompt: str,
    api_key: str,
    temperature: float = 0.3,
    max_tokens: int = 4096,
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
            return data["choices"][0]["message"]["content"]

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
