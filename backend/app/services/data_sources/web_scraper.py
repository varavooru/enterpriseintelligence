from typing import AsyncGenerator
import httpx
from app.services.data_sources.base import DataSourceConnector


class WebScraperConnector(DataSourceConnector):
    """Scrapes web pages for content (regulatory sites, news, etc.)."""

    async def test_connection(self) -> bool:
        urls = self.config.get("urls", [])
        if not urls:
            return False
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.head(urls[0])
                return resp.status_code < 400
        except Exception:
            return False

    async def fetch_documents(self) -> AsyncGenerator[dict, None]:
        urls = self.config.get("urls", [])
        selectors = self.config.get("selectors", {})

        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            for url in urls:
                try:
                    resp = await client.get(url)
                    if resp.status_code >= 400:
                        continue

                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(resp.text, "html.parser")

                    for tag in soup(["script", "style", "nav", "footer", "header"]):
                        tag.decompose()

                    content_selector = selectors.get("content")
                    if content_selector:
                        element = soup.select_one(content_selector)
                        text = element.get_text(separator="\n", strip=True) if element else ""
                    else:
                        text = soup.get_text(separator="\n", strip=True)

                    title = soup.title.string if soup.title else url

                    if text:
                        yield {
                            "title": title,
                            "content": text,
                            "content_type": "html",
                            "metadata": {"url": url, "status_code": resp.status_code},
                            "source_url": url,
                        }
                except Exception:
                    continue

    def get_source_type(self) -> str:
        return "web_scraper"
