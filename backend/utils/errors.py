from fastapi import HTTPException


class GW2APIError(HTTPException):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(status_code=status_code, detail=f"GW2 API: {detail}")


class DeepSeekAPIError(HTTPException):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(status_code=status_code, detail=f"DeepSeek API: {detail}")


class AuthError(HTTPException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status_code=401, detail=detail)
