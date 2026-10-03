from fastapi import APIRouter, Depends
from app.core.security import require_roles

router = APIRouter(tags=["store_manager"], dependencies=[Depends(require_roles(["store_manager"]))])

# Store Manager endpoints will be populated in subsequent slice tasks.
