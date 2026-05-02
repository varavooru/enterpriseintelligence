from typing import AsyncGenerator
from app.services.data_sources.base import DataSourceConnector


class DatabaseConnector(DataSourceConnector):
    """Fetches data from external SQL databases."""

    async def test_connection(self) -> bool:
        connection_string = self.config.get("connection_string", "")
        if not connection_string:
            return False
        try:
            from sqlalchemy import create_engine, text
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    async def fetch_documents(self) -> AsyncGenerator[dict, None]:
        connection_string = self.config.get("connection_string", "")
        query = self.config.get("query", "")
        title_column = self.config.get("title_column", "title")
        content_column = self.config.get("content_column", "content")

        if not connection_string or not query:
            return

        try:
            from sqlalchemy import create_engine, text
            import json

            engine = create_engine(connection_string)
            with engine.connect() as conn:
                result = conn.execute(text(query))
                columns = list(result.keys())

                for row in result:
                    row_dict = dict(zip(columns, row))
                    title = str(row_dict.get(title_column, "Database Record"))
                    content = str(row_dict.get(content_column, json.dumps(row_dict, default=str)))

                    yield {
                        "title": title,
                        "content": content,
                        "content_type": "database",
                        "metadata": {"source_db": connection_string.split("@")[-1] if "@" in connection_string else "database"},
                        "source_url": None,
                    }
        except Exception:
            return

    def get_source_type(self) -> str:
        return "database"
