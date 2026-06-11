from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.intent_classifier import create_intent_classifier
from crew.agents.data_analyst import create_data_analyst
from crew.agents.segment_builder import create_segment_builder
from crew.agents.message_composer import create_message_composer
from crew.agents.campaign_dispatcher import create_campaign_dispatcher
from schemas.responses import (
    IntentResult, DataAnalysisResult, SegmentBuildResult,
    MessageComposerResult, CampaignDispatchResult,
)
import json


class CampaignCrew:
    def __init__(self):
        self.llm = get_llm()
        self.intent_classifier = create_intent_classifier(self.llm)
        self.data_analyst = create_data_analyst(self.llm)
        self.segment_builder = create_segment_builder(self.llm)
        self.message_composer = create_message_composer(self.llm)
        self.campaign_dispatcher = create_campaign_dispatcher(self.llm)

    def run(self, user_message: str, context: dict) -> list[dict]:
        events = []

        intent_task = Task(
            description=f"Classify this user message: '{user_message}'. Return ONLY valid JSON matching the IntentResult schema.",
            expected_output='JSON object with intent, confidence, extracted_params, routing_reason',
            agent=self.intent_classifier,
            output_pydantic=IntentResult,
        )

        data_task = Task(
            description=f"Analyze this CRM context data and provide a structured summary: {json.dumps(context)}",
            expected_output='JSON object with summary, key_metrics, customer_segments_found, recommended_channels, data_quality_notes, raw_context_used',
            agent=self.data_analyst,
            output_pydantic=DataAnalysisResult,
        )

        segment_task = Task(
            description=f"Based on the user message '{user_message}', create segment filter rules. Return ONLY valid JSON matching SegmentBuildResult.",
            expected_output='JSON object with segment_name, description, filter_rules, logic, estimated_count, confidence, caveats, filter_rules_summary',
            agent=self.segment_builder,
            output_pydantic=SegmentBuildResult,
        )

        compose_task = Task(
            description=f"Write campaign message variants for this request: '{user_message}'. Return ONLY valid JSON matching MessageComposerResult.",
            expected_output='JSON object with channel, segment_context, variant_a, variant_b, recommended_variant, send_time_suggestion, personalization_vars',
            agent=self.message_composer,
            output_pydantic=MessageComposerResult,
        )

        dispatch_task = Task(
            description=f"Validate and produce campaign launch manifest for: '{user_message}'. Return ONLY valid JSON matching CampaignDispatchResult.",
            expected_output='JSON object with valid, validation_errors, campaign_manifest, estimated_audience, estimated_cost_inr, estimated_revenue_inr, confidence_score, ai_reasoning, ready_to_launch',
            agent=self.campaign_dispatcher,
            output_pydantic=CampaignDispatchResult,
        )

        crew = Crew(
            agents=[self.intent_classifier, self.data_analyst, self.segment_builder, self.message_composer, self.campaign_dispatcher],
            tasks=[intent_task, data_task, segment_task, compose_task, dispatch_task],
            process=Process.sequential,
            verbose=False,
        )

        result = crew.kickoff()
        return self._parse_to_events(result, user_message)

    def _parse_to_events(self, result, user_message) -> list[dict]:
        events = []
        events.append({"type": "text", "content": f"Analyzing your request: '{user_message}'..."})
        events.append({"type": "text", "content": "I've analyzed your request and prepared the following proposals."})

        if result and result.pydantic:
            dispatch = result.pydantic
            if hasattr(dispatch, 'campaign_manifest') and dispatch.campaign_manifest:
                events.append({
                    "type": "campaign_proposal",
                    "data": {
                        "campaign_manifest": dispatch.campaign_manifest,
                        "estimated_audience": dispatch.estimated_audience,
                        "confidence_score": dispatch.confidence_score,
                        "ai_reasoning": dispatch.ai_reasoning,
                        "ready_to_launch": dispatch.ready_to_launch,
                    },
                })

        events.append({"type": "done"})
        return events
