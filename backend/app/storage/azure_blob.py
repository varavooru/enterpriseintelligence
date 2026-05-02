from typing import Optional
from app.storage.base import StorageBackend
from app.core.config import settings


class AzureBlobStorage(StorageBackend):
    """Azure Blob Storage (ADLS) backend. Requires azure-storage-blob package."""

    def __init__(self):
        from azure.storage.blob.aio import BlobServiceClient
        self.client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
        self.container_name = settings.AZURE_STORAGE_CONTAINER

    async def _get_container(self):
        return self.client.get_container_client(self.container_name)

    async def save(self, path: str, content: bytes, content_type: Optional[str] = None) -> str:
        container = await self._get_container()
        blob = container.get_blob_client(path)
        await blob.upload_blob(content, overwrite=True, content_type=content_type)
        return path

    async def load(self, path: str) -> bytes:
        container = await self._get_container()
        blob = container.get_blob_client(path)
        download = await blob.download_blob()
        return await download.readall()

    async def delete(self, path: str) -> bool:
        container = await self._get_container()
        blob = container.get_blob_client(path)
        try:
            await blob.delete_blob()
            return True
        except Exception:
            return False

    async def exists(self, path: str) -> bool:
        container = await self._get_container()
        blob = container.get_blob_client(path)
        try:
            await blob.get_blob_properties()
            return True
        except Exception:
            return False

    async def list_files(self, prefix: str = "") -> list[str]:
        container = await self._get_container()
        blobs = []
        async for blob in container.list_blobs(name_starts_with=prefix):
            blobs.append(blob.name)
        return blobs
