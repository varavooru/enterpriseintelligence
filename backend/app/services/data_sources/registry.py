from app.services.data_sources.base import DataSourceConnector
from app.services.data_sources.filesystem import FileSystemConnector
from app.services.data_sources.web_scraper import WebScraperConnector
from app.services.data_sources.api_connector import APIConnector
from app.services.data_sources.database_connector import DatabaseConnector

CONNECTOR_REGISTRY: dict[str, type[DataSourceConnector]] = {
    "filesystem": FileSystemConnector,
    "web_scraper": WebScraperConnector,
    "api": APIConnector,
    "database": DatabaseConnector,
}


def get_connector(source_type: str, config: dict) -> DataSourceConnector:
    connector_class = CONNECTOR_REGISTRY.get(source_type)
    if not connector_class:
        raise ValueError(f"Unknown data source type: {source_type}. Available: {list(CONNECTOR_REGISTRY.keys())}")
    return connector_class(config)
