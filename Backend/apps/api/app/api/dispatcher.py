from fastapi import APIRouter, Depends
from app.core.security import require_roles

router = APIRouter(tags=["dispatcher"], dependencies=[Depends(require_roles(["dispatcher"]))])

# Dispatcher endpoints will be populated in subsequent slice tasks.
