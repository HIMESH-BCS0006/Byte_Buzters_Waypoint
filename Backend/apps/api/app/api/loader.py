from fastapi import APIRouter, Depends
from app.core.security import require_roles

router = APIRouter(tags=["loader"], dependencies=[Depends(require_roles(["loader"]))])

# Loader endpoints will be populated in subsequent slice tasks.
