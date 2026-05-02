from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.data_source import DataSource
from app.schemas.data_source import DataSourceCreate, DataSourceUpdate, DataSourceResponse

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


@router.get("/", response_model=list[DataSourceResponse])
async def list_data_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DataSource)
        .where(DataSource.tenant_id == current_user.tenant_id)
        .order_by(DataSource.created_at.desc())
    )
    return [DataSourceResponse.model_validate(ds) for ds in result.scalars().all()]


@router.post("/", response_model=DataSourceResponse, status_code=201)
async def create_data_source(
    data: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    ds = DataSource(
        tenant_id=current_user.tenant_id,
        name=data.name,
        description=data.description,
        source_type=data.source_type,
        config=data.config,
        schedule=data.schedule,
        created_by=current_user.id,
    )
    db.add(ds)
    await db.flush()
    await db.refresh(ds)
    return DataSourceResponse.model_validate(ds)


@router.get("/{ds_id}", response_model=DataSourceResponse)
async def get_data_source(
    ds_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.tenant_id == current_user.tenant_id)
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")
    return DataSourceResponse.model_validate(ds)


@router.put("/{ds_id}", response_model=DataSourceResponse)
async def update_data_source(
    ds_id: int,
    data: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.tenant_id == current_user.tenant_id)
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ds, field, value)

    await db.flush()
    await db.refresh(ds)
    return DataSourceResponse.model_validate(ds)


@router.delete("/{ds_id}", status_code=204)
async def delete_data_source(
    ds_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.tenant_id == current_user.tenant_id)
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")
    await db.delete(ds)


@router.post("/{ds_id}/ingest")
async def trigger_ingestion(
    ds_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    result = await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.tenant_id == current_user.tenant_id)
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    from app.services.ingestion.pipeline import run_ingestion
    background_tasks.add_task(run_ingestion, ds_id, current_user.tenant_id)

    ds.status = "ingesting"
    await db.flush()

    return {"message": "Ingestion started", "data_source_id": ds_id}
