from typing import AsyncGenerator
import httpx
import json
from app.services.data_sources.base import DataSourceConnector


class APIConnector(DataSourceConnector):
    """Fetches data from REST APIs (news feeds, regulatory databases, etc.)."""

    async def test_connection(self) -> bool:
        url = self.config.get("base_url", "")
        if not url:
            return False
        try:
            headers = self.config.get("headers", {})
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, headers=headers)
                return resp.status_code < 400
        except Exception:
            return False

    async def fetch_documents(self) -> AsyncGenerator[dict, None]:
        base_url = self.config.get("base_url", "")
        endpoints = self.config.get("endpoints", ["/"])
        headers = self.config.get("headers", {})
        params = self.config.get("params", {})
        data_path = self.config.get("data_path", "")  # JSON path to array of items
        title_field = self.config.get("title_field", "title")
        content_field = self.config.get("content_field", "content")
        url_field = self.config.get("url_field", "url")

        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            for endpoint in endpoints:
                try:
                    url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
                    resp = await client.get(url, headers=headers, params=params)
                    if resp.status_code >= 400:
                        continue

                    data = resp.json()

                    if data_path:
                        for key in data_path.split("."):
                            data = data[key] if isinstance(data, dict) else data
                    items = data if isinstance(data, list) else [data]

                    for item in items:
                        title = item.get(title_field, "Untitled")
                        content = item.get(content_field, "")
                        if isinstance(content, dict):
                            content = json.dumps(content, indent=2)

                        if content:
                            yield {
                                "title": str(title),
                                "content": str(content),
                                "content_type": "json",
                                "metadata": {"api_url": url, "raw_item": item},
                                "source_url": item.get(url_field, url),
                            }
                except Exception:
                    continue

    def get_source_type(self) -> str:
        return "api"
