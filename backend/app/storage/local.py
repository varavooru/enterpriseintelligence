import os
import aiofiles
from pathlib import Path
from typing import Optional
from app.storage.base import StorageBackend
from app.core.config import settings


class LocalFileStorage(StorageBackend):
    def __init__(self):
        self.base_path = Path(settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _resolve(self, path: str) -> Path:
        return self.base_path / path

    async def save(self, path: str, content: bytes, content_type: Optional[str] = None) -> str:
        full_path = self._resolve(path)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(content)
        return str(full_path)

    async def load(self, path: str) -> bytes:
        full_path = self._resolve(path)
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete(self, path: str) -> bool:
        full_path = self._resolve(path)
        if full_path.exists():
            os.remove(full_path)
            return True
        return False

    async def exists(self, path: str) -> bool:
        return self._resolve(path).exists()

    async def list_files(self, prefix: str = "") -> list[str]:
        target = self._resolve(prefix)
        if not target.exists():
            return []
        files = []
        for item in target.rglob("*"):
            if item.is_file():
                files.append(str(item.relative_to(self.base_path)))
        return files


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "azure":
        from app.storage.azure_blob import AzureBlobStorage
        return AzureBlobStorage()
    return LocalFileStorage()
