from src.db.database import init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import auth
from src.routers import merchants
from src.routers import info
from src.routers import timeslots
from src.routers import predictions
from src.routers import heatmap
from src.utils.logger import logger
from src.routers import admin


def create_application() -> FastAPI:
    application = FastAPI()
    application.include_router(auth.router)
    application.include_router(merchants.router)
    application.include_router(info.router)
    application.include_router(timeslots.router)
    application.include_router(predictions.router)
    application.include_router(heatmap.router)
    return application


app = create_application()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:3000",
    "https://delftxjunction.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db(app)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")


@app.get("/ping")
def pong():
    logger.info("Ping endpoint called")
    return {"ping": "pong!"}
