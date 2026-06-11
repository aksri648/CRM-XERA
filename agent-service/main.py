import json
import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from crew.crews.campaign_crew import CampaignCrew
from crew.crews.opportunity_crew import OpportunityCrew
from crew.crews.insights_crew import InsightsCrew

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


class OpportunityScanRequest(BaseModel):
    context: dict = {}


class InsightsRequest(BaseModel):
    campaign_stats: dict = {}


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


@app.post("/crew/opportunities")
async def scan_opportunities(body: OpportunityScanRequest):
    try:
        crew = OpportunityCrew()
        result = await asyncio.to_thread(crew.run, body.context)
        return result
    except Exception as e:
        return {"error": str(e), "opportunities": []}


@app.post("/crew/insights")
async def get_insights(body: InsightsRequest):
    try:
        crew = InsightsCrew()
        result = await asyncio.to_thread(crew.run, body.campaign_stats)
        return result
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
def health():
    return {"status": "ok", "service": "agent-service"}
