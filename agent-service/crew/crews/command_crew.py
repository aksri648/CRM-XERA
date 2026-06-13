import os
import json
import re
from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.command_judge import create_command_agent
from crew.tools import set_http_tool, clear_pending, pending_actions, tool_events, clear_events


class CommandCrew:
    def __init__(self):
        self.llm = get_llm()
        self.agent = create_command_agent(self.llm)

    def run(self, user_message: str, context: dict) -> list[dict]:
        base_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        token = context.get('token', '') if isinstance(context, dict) else ''

        set_http_tool(base_url, token)
        clear_pending()
        clear_events()

        task = Task(
            description=(
                f"User request: \"{user_message}\"\n\n"
                "Decide whether to answer directly or to use one or more tools. "
                "If you need ids to act, list/search first. For any mutating action, the "
                "corresponding tool will queue it for human approval — call the tool with "
                "the right parameters and the system will handle the rest. After tool use, "
                "write a short, clear final answer for the user. Do not output JSON or "
                "markdown code fences in your final answer."
            ),
            expected_output="A short, clear natural-language answer to the user's request.",
            agent=self.agent,
        )

        crew = Crew(
            agents=[self.agent],
            tasks=[task],
            process=Process.sequential,
            function_calling_llm=self.llm,
            verbose=False,
        )

        try:
            result = crew.kickoff()
            final_text = self._extract_final_text(result, user_message)
        except Exception as e:
            return [
                *list(tool_events),
                {'type': 'error', 'message': f'Agent error: {e}'},
                {'type': 'done'},
            ]

        events: list[dict] = []
        events.extend(tool_events)
        if final_text:
            events.append({'type': 'text', 'content': final_text})
        for pa in pending_actions:
            events.append({
                'type': 'pending_action',
                'tool': pa['tool'],
                'params': pa['params'],
                'description': pa.get('description', pa['tool']),
            })
        suggestions = self._suggest_followups(user_message, final_text)
        if suggestions:
            events.append({'type': 'suggestions', 'items': suggestions})
        events.append({'type': 'done'})
        return events

    def _extract_final_text(self, result, fallback: str) -> str:
        if result is None:
            return f"I received: {fallback}"
        raw = getattr(result, 'raw', None) or getattr(result, 'output', None) or str(result)
        return (raw or '').strip() or f"I received: {fallback}"

    def _suggest_followups(self, user_message: str, answer: str) -> list[str]:
        prompt = (
            "You are suggesting 3 short follow-up prompts a user might send next to a CRM "
            "assistant that can search customers, campaigns, segments, opportunities, "
            "analytics, and propose write actions (create/update/delete campaigns, segments, "
            "customers, settings).\n\n"
            f"User asked: {user_message}\n"
            f"Assistant answered: {answer}\n\n"
            "Return ONLY a JSON array of 3 short prompt strings (each under 60 chars), no "
            "commentary, no markdown. Example: "
            '["Show me the funnel", "Top campaigns this month", "Stop the running campaign"]'
        )
        try:
            raw = self.llm.call([{'role': 'user', 'content': prompt}])
        except Exception:
            return []
        return self._parse_suggestions(raw)

    def _parse_suggestions(self, raw: str) -> list[str]:
        if not raw:
            return []
        match = re.search(r'\[.*?\]', raw, re.DOTALL)
        if not match:
            return []
        try:
            items = json.loads(match.group(0))
        except Exception:
            return []
        return [str(x).strip() for x in items if isinstance(x, (str, int, float)) and str(x).strip()][:4]

