from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.models.search_models import ParsedPage


def chunk_pages(pages: list[ParsedPage]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    documents: list[Document] = []

    for page in pages:
        for index, text in enumerate(splitter.split_text(page.text)):
            chunk_id = f"page-{page.page}-chunk-{index}"
            documents.append(
                Document(
                    page_content=text,
                    metadata={"chunk_id": chunk_id, "page": page.page, "text": text},
                )
            )

    return documents


if __name__ == "__main__":
    chunks = chunk_pages([ParsedPage(page=87, text="A" * 1200)])
    assert chunks
    assert chunks[0].metadata["page"] == 87
    assert chunks[0].metadata["chunk_id"] == "page-87-chunk-0"
