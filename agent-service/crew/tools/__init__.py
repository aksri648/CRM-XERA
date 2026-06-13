from .http import set_http_tool, get_http_tool, pending_actions, clear_pending, add_pending, tool_events, clear_events, record_tool_call, record_tool_result
from .customers import list_customers, get_customer, get_customer_distributions, create_customer, delete_customer
from .campaigns import list_campaigns, get_campaign, get_campaign_stats, create_campaign, update_campaign, launch_campaign, stop_campaign, delete_campaign
from .segments import list_segments, get_segment, get_segment_customers, preview_segment, create_segment, delete_segment
from .opportunities import list_opportunities, dismiss_opportunity, generate_campaign_from_opportunity
from .proposals import list_proposals, get_proposal, approve_proposal, reject_proposal, update_proposal
from .analytics import get_analytics_overview, get_channels_analytics, get_top_campaigns, get_funnel
from .pipeline import get_pipeline_status
from .settings import get_settings, update_settings
from .orders import list_orders

ALL_TOOLS = [
    list_customers, get_customer, get_customer_distributions, create_customer, delete_customer,
    list_campaigns, get_campaign, get_campaign_stats, create_campaign, update_campaign,
    launch_campaign, stop_campaign, delete_campaign,
    list_segments, get_segment, get_segment_customers, preview_segment, create_segment, delete_segment,
    list_opportunities, dismiss_opportunity, generate_campaign_from_opportunity,
    list_proposals, get_proposal, approve_proposal, reject_proposal, update_proposal,
    get_analytics_overview, get_channels_analytics, get_top_campaigns, get_funnel,
    get_pipeline_status,
    get_settings, update_settings,
    list_orders,
]
