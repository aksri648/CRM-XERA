import os
import json
import httpx
from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.command_judge import create_command_judge, set_http_tool, fetch_customers_query, fetch_campaigns_query, fetch_segments_query, fetch_pipeline_status, fetch_system_status, fetch_opportunities_query
from schemas.responses import CommandResult


class CommandCrew:
    def __init__(self):
        self.llm = get_llm()
        self.judge = create_command_judge(self.llm)

    def run(self, user_message: str, context: dict) -> list[dict]:
        base_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        token = context.get('token', '')

        set_http_tool(base_url, token)

        task = Task(
            description=f"""You are the Xeno CRM Command Judge. The user asked:

"{user_message}"

Decide the best response. You have these tools available:
- fetch_customers_query(query, sort, limit) — search customers by name/email, sort by ltv/createdAt/lastOrderAt
- fetch_campaigns_query(limit, status) — list campaigns, optionally filter by status
- fetch_segments_query() — list all segments
- fetch_pipeline_status() — real-time worker and queue status
- fetch_system_status() — agent service health and active campaigns
- fetch_opportunities_query(limit) — active AI-discovered opportunities

Guidelines:
- If the user asks about specific customers, use fetch_customers_query
- If the user asks about campaigns, use fetch_campaigns_query
- If the user asks about system status / health / workers, use fetch_pipeline_status or fetch_system_status
- If the user describes a marketing goal (e.g. "create a campaign for VIP customers", "win back lapsing buyers"), use fetch_customers_query first to understand the segment, then return action=generate_campaign with the segment context in data
- If the user asks a general knowledge question, answer directly without tools
- If you're unsure, prefer fetching data over guessing

Return ONLY a JSON object with no markdown or commentary:
{{"answer": "...", "action": "answer_only|fetch_customers|fetch_campaigns|fetch_segments|fetch_pipeline_status|fetch_system_status|fetch_opportunities|generate_campaign", "data": {{...}}, "next_step_suggestion": "..."}}

Example for "show me top customers":
{{"answer": "Here are your top customers by LTV:", "action": "fetch_customers", "data": {{"sort": "ltv", "limit": 10}}, "next_step_suggestion": "You can segment these customers for targeted campaigns."}}

Example for "what is the system status":
{{"answer": "Here is the current system status:", "action": "fetch_pipeline_status", "data": {{}}, "next_step_suggestion": ""}}

Example for "create a campaign for Active Buyers":
{{"answer": "I'll prepare a campaign for Active Buyers. Let me fetch their details first.", "action": "fetch_customers", "data": {{"tag": "active", "limit": 5}}, "next_step_suggestion": ""}}

Output ONLY raw JSON. No explanation.""",
            expected_output='A single JSON object with answer (string), action (one of the allowed values), data (object), and next_step_suggestion (string). No markdown, no code fences.',
            agent=self.judge,
            output_pydantic=CommandResult,
        )

        crew = Crew(
            agents=[self.judge],
            tasks=[task],
            process=Process.sequential,
            function_calling_llm=self.llm,
            verbose=False,
        )

        result = crew.kickoff()
        return self._parse_to_events(result, user_message)

    def _parse_to_events(self, result, user_message: str) -> list[dict]:
        events = []

        answer_text = None
        action = 'answer_only'
        data = {}
        next_step = ''

        if result and getattr(result, 'pydantic', None):
            answer_text = result.pydantic.answer
            action = result.pydantic.action
            data = result.pydantic.data
            next_step = result.pydantic.next_step_suggestion

        events.append({'type': 'text', 'content': answer_text or f"I received: {user_message}"})

        if action == 'fetch_customers':
            sort = data.get('sort', 'ltv')
            limit = data.get('limit', 10)
            tag = data.get('tag', '')
            query_str = data.get('query', '')
            params = {'sort': sort, 'limit': limit}
            if tag:
                params['tag'] = tag
            if query_str:
                params['search'] = query_str
            events.append({'type': 'command_result', 'data': {'action': 'fetch_customers', 'params': params}})
        elif action == 'fetch_campaigns':
            limit = data.get('limit', 10)
            status = data.get('status', '')
            params = {'limit': limit}
            if status:
                params['status'] = status
            events.append({'type': 'command_result', 'data': {'action': 'fetch_campaigns', 'params': params}})
        elif action == 'fetch_segments':
            events.append({'type': 'command_result', 'data': {'action': 'fetch_segments', 'params': {}}})
        elif action == 'fetch_pipeline_status':
            events.append({'type': 'command_result', 'data': {'action': 'fetch_pipeline_status', 'params': {}}})
        elif action == 'fetch_system_status':
            events.append({'type': 'command_result', 'data': {'action': 'fetch_system_status', 'params': {}}})
        elif action == 'fetch_opportunities':
            limit = data.get('limit', 5)
            events.append({'type': 'command_result', 'data': {'action': 'fetch_opportunities', 'params': {'limit': limit}}})
        elif action == 'generate_campaign':
            events.append({'type': 'command_result', 'data': {'action': 'generate_campaign', 'params': data}})

        if next_step:
            events.append({'type': 'text', 'content': next_step})

        events.append({'type': 'done'})
        return events