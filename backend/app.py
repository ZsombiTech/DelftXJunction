import logging

from src.db.database import init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import auth

log = logging.getLogger(__name__)

def create_application() -> FastAPI:
    application = FastAPI()
    application.include_router(auth.router)
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



@app.on_event("startup")
async def startup_event():
    print("Starting up...")
    init_db(app)


@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down...")


@app.get("/ping")
def pong():
    return {"ping": "pong!"}
