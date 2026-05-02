import os
from pathlib import Path
from typing import AsyncGenerator
from app.services.data_sources.base import DataSourceConnector


class FileSystemConnector(DataSourceConnector):
    """Reads documents from a local directory or ADLS-mapped path."""

    SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".docx", ".html", ".htm", ".json", ".csv", ".md"}

    async def test_connection(self) -> bool:
        path = self.config.get("path", "")
        return os.path.isdir(path)

    async def fetch_documents(self) -> AsyncGenerator[dict, None]:
        base_path = Path(self.config.get("path", ""))
        if not base_path.exists():
            return

        for file_path in base_path.rglob("*"):
            if not file_path.is_file():
                continue
            if file_path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                continue

            content = await self._extract_content(file_path)
            if content:
                yield {
                    "title": file_path.name,
                    "content": content,
                    "content_type": file_path.suffix.lstrip("."),
                    "metadata": {
                        "file_path": str(file_path),
                        "file_size": file_path.stat().st_size,
                    },
                    "source_url": f"file://{file_path}",
                }

    async def _extract_content(self, file_path: Path) -> str:
        ext = file_path.suffix.lower()

        if ext == ".pdf":
            return self._extract_pdf(file_path)
        elif ext == ".docx":
            return self._extract_docx(file_path)
        elif ext in {".html", ".htm"}:
            return self._extract_html(file_path)
        else:
            try:
                return file_path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                return ""

    def _extract_pdf(self, path: Path) -> str:
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(path))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            return ""

    def _extract_docx(self, path: Path) -> str:
        try:
            from docx import Document
            doc = Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return ""

    def _extract_html(self, path: Path) -> str:
        try:
            from bs4 import BeautifulSoup
            html = path.read_text(encoding="utf-8", errors="replace")
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()
            return soup.get_text(separator="\n", strip=True)
        except Exception:
            return ""

    def get_source_type(self) -> str:
        return "filesystem"
