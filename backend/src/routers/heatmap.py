from fastapi import APIRouter, status, Depends
from src.models.cities import Cities
import numpy as np

from src.utils.logger import logger

router = APIRouter(prefix="/heatmap", tags=["heatmap"])


@router.get("/zones", status_code=status.HTTP_200_OK)
async def get_heatmap_zones():
    zones = await Cities.all().values("name", "zones")
    
    return zones
