from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.query import Query, Conversation
from app.schemas.qa import (
    QuestionRequest,
    AnswerResponse,
    ConversationResponse,
    QueryHistoryItem,
)
import time

router = APIRouter(prefix="/qa", tags=["Q&A"])


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_time = time.time()
    tid = current_user.tenant_id

    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.tenant_id == tid,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            tenant_id=tid,
            user_id=current_user.id,
            title=request.question[:100],
        )
        db.add(conversation)
        await db.flush()
        await db.refresh(conversation)

    from app.services.rag.pipeline import rag_pipeline
    rag_result = await rag_pipeline.answer_question(
        question=request.question,
        conversation_id=conversation.id,
        user_id=current_user.id,
        tenant_id=tid,
        filters=request.filters,
    )

    processing_time = int((time.time() - start_time) * 1000)

    query = Query(
        tenant_id=tid,
        conversation_id=conversation.id,
        user_id=current_user.id,
        question=request.question,
        answer=rag_result["answer"],
        sources=rag_result["sources"],
        processing_time_ms=processing_time,
    )
    db.add(query)
    await db.flush()
    await db.refresh(query)

    return AnswerResponse(
        answer=rag_result["answer"],
        sources=rag_result["sources"],
        conversation_id=conversation.id,
        query_id=query.id,
        processing_time_ms=processing_time,
    )


@router.post("/ask/stream")
async def ask_question_stream(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tid = current_user.tenant_id

    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.tenant_id == tid,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(tenant_id=tid, user_id=current_user.id, title=request.question[:100])
        db.add(conversation)
        await db.flush()
        await db.refresh(conversation)

    from app.services.rag.pipeline import rag_pipeline

    return StreamingResponse(
        rag_pipeline.answer_question_stream(
            question=request.question,
            conversation_id=conversation.id,
            user_id=current_user.id,
            tenant_id=tid,
            filters=request.filters,
            db=db,
        ),
        media_type="text/event-stream",
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.tenant_id == current_user.tenant_id, Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return [ConversationResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/conversations/{conv_id}/history", response_model=list[QueryHistoryItem])
async def get_conversation_history(
    conv_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id,
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Query).where(Query.conversation_id == conv_id).order_by(Query.created_at.asc())
    )
    return [QueryHistoryItem.model_validate(q) for q in result.scalars().all()]
