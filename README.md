# Prime Enterprise Intelligence

AI-powered platform that transforms internal and external data — regulations, laws, news, policies, and more — into actionable enterprise intelligence. Built by [SecureAI LLC](https://secureaillc.com).

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Database**: PostgreSQL 16
- **Vector DB**: Qdrant (open-source, scalable)
- **AI**: Anthropic Claude Opus 4.6 (RAG + Agentic)
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **Storage**: Local filesystem / Azure Blob (ADLS)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL and Qdrant.

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173 and proxies API requests to the backend.

### 4. Configuration

Copy `.env.example` to `.env` and configure:

- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude Opus 4.6
- `SECRET_KEY`: Random secret for JWT token signing
- Database and Qdrant settings (defaults work with Docker Compose)

## Features

### Data Sources
Configure and connect internal and external data sources:
- **File System / ADLS**: Local documents, PDFs, DOCX, HTML
- **Web Scraper**: Regulatory websites, news sources
- **REST API**: External data feeds, regulatory databases
- **Database**: Internal SQL databases

### RAG-Powered Q&A
Ask natural language questions across all connected data with:
- Vector similarity search via Qdrant
- Knowledge graph context enrichment
- Claude Opus 4.6 answer generation with citations
- Streaming responses
- Conversation history

### Knowledge Graph
JSON-based tribal knowledge management:
- Business units, regulations, products, processes, policies
- Relationships with impact weights
- Business rules for automated impact detection
- Visual graph editor

### Impact Analysis
Agentic AI-powered analysis of how changes affect your enterprise:
- Multi-step reasoning with tool-use
- Cross-reference across documents and knowledge graph
- Impact scoring by business unit
- Actionable recommendations

### Reports
Automated intelligence report generation:
- Regulatory impact analysis
- Policy analysis
- Executive summaries
- Custom reports

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
EnterpriseIntelligence/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/    # REST API endpoints
│   │   ├── core/      # Config, auth, database
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   │   ├── rag/           # RAG pipeline
│   │   │   ├── agents/        # Agentic AI
│   │   │   ├── knowledge_graph/
│   │   │   ├── data_sources/  # Connectors
│   │   │   ├── intelligence/  # Impact analysis
│   │   │   ├── ingestion/     # Document processing
│   │   │   └── reports/       # Report generation
│   │   └── storage/   # File storage abstraction
│   └── alembic/       # Database migrations
├── data/              # Local storage (dev)
├── docker-compose.yml
└── .env
```
