from abc import ABC, abstractmethod
from typing import AsyncGenerator


class DataSourceConnector(ABC):
    def __init__(self, config: dict):
        self.config = config

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test that the data source is reachable."""
        pass

    @abstractmethod
    async def fetch_documents(self) -> AsyncGenerator[dict, None]:
        """Yield documents from the source. Each doc: {title, content, content_type, metadata, source_url}"""
        pass

    @abstractmethod
    def get_source_type(self) -> str:
        pass
