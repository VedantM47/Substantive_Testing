from app.config import Settings


class MissingGoogleApiKeyError(RuntimeError):
    pass


def get_embeddings(settings: Settings):
    if not settings.google_api_key:
        raise MissingGoogleApiKeyError("GOOGLE_API_KEY is required for semantic search.")

    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    return GoogleGenerativeAIEmbeddings(
        model=settings.gemini_embedding_model,
        google_api_key=settings.google_api_key,
    )
