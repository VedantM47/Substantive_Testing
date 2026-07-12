from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from app.api.document import router as document_router
from app.api.parser import router as parser_router
from app.config import get_settings


settings = get_settings()

app = FastAPI(title="Audit Automation API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(document_router)
app.include_router(parser_router)


def custom_openapi() -> dict:
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation.get("responses", {}).pop("422", None)

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(RequestValidationError)
def validation_error_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": exc.errors()})


@app.exception_handler(Exception)
def unexpected_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Unexpected error."})
