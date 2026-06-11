from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class IntentResult(BaseModel):
    intent: str
    confidence: float
    extracted_params: dict
    routing_reason: str


class DataAnalysisResult(BaseModel):
    summary: str
    key_metrics: dict
    customer_segments_found: list
    recommended_channels: list
    data_quality_notes: list
    raw_context_used: dict


class SegmentBuildResult(BaseModel):
    segment_name: str
    description: str
    filter_rules: list[dict]
    logic: str
    estimated_count: int
    confidence: float
    caveats: list[str]
    filter_rules_summary: str


class MessageComposerResult(BaseModel):
    channel: str
    segment_context: str
    variant_a: dict
    variant_b: dict
    recommended_variant: str
    send_time_suggestion: str
    personalization_vars: list


class CampaignDispatchResult(BaseModel):
    valid: bool
    validation_errors: list[str]
    campaign_manifest: dict
    estimated_audience: int
    estimated_cost_inr: float
    estimated_revenue_inr: float
    confidence_score: float
    ai_reasoning: str
    ready_to_launch: bool


class InsightReportResult(BaseModel):
    campaign_name: str
    summary: str
    metrics: list[dict]
    top_finding: str
    recommendations: list[dict]
    chart_data: list[dict]
    overall_score: float
    next_campaign_suggestion: str


class OpportunityItem(BaseModel):
    title: str
    description: str
    audience_description: str
    audience_size_estimate: int
    expected_revenue_inr: float
    recommended_channel: str
    message_angle: str
    ai_reasoning: str


class OpportunityScanResult(BaseModel):
    opportunities: list[OpportunityItem]
    total_revenue_potential_inr: float
    scan_summary: str
    data_analyzed: dict
    scan_timestamp: str


class CampaignDetails(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    campaign_title: str = Field(alias="Campaign Title")
    target_audience: str = Field(alias="Target Audience")
    description: str = Field(alias="Description")
    product_category: str = Field(alias="ProductCategory")


class CampaignDetailsResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    campaign_details: CampaignDetails = Field(alias="CampaignDetails")
