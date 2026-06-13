import json
import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from crew.crews.campaign_crew import CampaignCrew
from crew.crews.opportunity_crew import OpportunityCrew
from crew.crews.insights_crew import InsightsCrew
from crew.crews.command_crew import CommandCrew
from crew.crews.segment_crew import SegmentCrew

app = FastAPI(title="Xeno AI Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    context: dict = {}


class CommandRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    token: str = ""
    context: dict = {}


class OpportunityScanRequest(BaseModel):
    context: dict = {}


class InsightsRequest(BaseModel):
    campaign_stats: dict = {}


class SegmentGenerateRequest(BaseModel):
    token: str = Field(..., min_length=1)


@app.post("/crew/chat")
async def chat(body: ChatRequest):
    async def generate():
        try:
            crew = CampaignCrew()
            events = await asyncio.to_thread(crew.run, body.message, body.context)
            for event in events:
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.05)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/crew/command")
async def command(body: CommandRequest):
    async def generate():
        try:
            crew = CommandCrew()
            context = {**body.context, 'token': body.token}
            events = await asyncio.to_thread(crew.run, body.message, context)
            for event in events:
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.05)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/crew/opportunities")
async def scan_opportunities(body: OpportunityScanRequest):
    try:
        crew = OpportunityCrew()
        result = await asyncio.to_thread(crew.run, body.context)
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "opportunities": []})


@app.post("/crew/insights")
async def get_insights(body: InsightsRequest):
    try:
        crew = InsightsCrew()
        result = await asyncio.to_thread(crew.run, body.campaign_stats)
        return result
    except Exception as e:
        return {"error": str(e)}


@app.post("/crew/segment")
async def generate_segments(body: SegmentGenerateRequest):
    try:
        crew = SegmentCrew()
        result = await asyncio.to_thread(crew.run, {'token': body.token})
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "segments": []})


@app.get("/health")
def health():
    return {"status": "ok", "service": "agent-service"}
