from abc import ABC, abstractmethod
from typing import Optional


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, path: str, content: bytes, content_type: Optional[str] = None) -> str:
        """Save content and return the storage path."""
        pass

    @abstractmethod
    async def load(self, path: str) -> bytes:
        """Load content from storage."""
        pass

    @abstractmethod
    async def delete(self, path: str) -> bool:
        """Delete content from storage."""
        pass

    @abstractmethod
    async def exists(self, path: str) -> bool:
        """Check if a path exists in storage."""
        pass

    @abstractmethod
    async def list_files(self, prefix: str = "") -> list[str]:
        """List files under a prefix."""
        pass
