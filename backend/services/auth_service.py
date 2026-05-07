from api.gw2_client import validate_token
from utils.errors import AuthError

REQUIRED_PERMISSIONS = ["account", "characters", "inventories", "builds"]


async def verify_api_key(api_key: str) -> dict:
    if not api_key or not api_key.strip():
        raise AuthError(detail="API key is required")

    token_info = await validate_token(api_key)
    permissions = token_info.get("permissions", [])

    missing = [p for p in REQUIRED_PERMISSIONS if p not in permissions]
    if missing:
        raise AuthError(
            detail=f"Missing required permissions: {', '.join(missing)}. "
            f"Please create a new API key with these permissions."
        )

    return {
        "valid": True,
        "name": token_info.get("name", ""),
        "permissions": permissions,
    }
