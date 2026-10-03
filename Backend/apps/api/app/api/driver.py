from fastapi import APIRouter, Depends
from app.core.security import require_roles

router = APIRouter(tags=["driver"], dependencies=[Depends(require_roles(["driver"]))])

# Driver endpoints will be populated in subsequent slice tasks.
