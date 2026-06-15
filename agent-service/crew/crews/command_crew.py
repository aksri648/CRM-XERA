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
                "Decide whether to answer directly or to use one or more tools.\n"
                "- If you need an entity id to act, call the matching list/search "
                "tool FIRST and use the id it returns.\n"
                "- For any mutating action (create / update / delete / launch / "
                "stop / approve / reject), call the corresponding tool — it will "
                "prepare the action for human approval. Do not claim the action "
                "is done; say it is awaiting approval.\n"
                "- Never invent ids, names, counts, or metrics. If you do not have "
                "the data, say so.\n\n"
                "FINAL ANSWER FORMAT:\n"
                "- Plain natural language. Short, clear, and directly answering "
                "the request.\n"
                "- No JSON, no markdown headings, no code fences.\n"
                "- If you returned a list, summarize the top items inline."
            ),
            expected_output=(
                "A short, clear natural-language answer to the user's request. "
                "No JSON, no markdown code fences."
            ),
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
        return events

    def _extract_final_text(self, result, fallback: str) -> str:
        if result is None:
            return f"I received: {fallback}"
        raw = getattr(result, 'raw', None) or getattr(result, 'output', None) or str(result)
        text = (raw or '').strip()
        if not text:
            return f"I received: {fallback}"
        # Strip stray markdown code fences the LLM occasionally emits.
        fence_match = re.match(r'^```(?:[a-zA-Z]+)?\s*\n?(.*?)\n?```\s*$', text, re.DOTALL)
        if fence_match:
            text = fence_match.group(1).strip()
        # Strip surrounding triple backticks left over from partial fences.
        text = re.sub(r'^```[a-zA-Z]*\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        return text.strip() or f"I received: {fallback}"

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
        match = re.search(r'\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*\]', raw)
        if not match:
            return []
        try:
            items = json.loads(match.group(0))
        except Exception:
            return []
        return [str(x).strip() for x in items if isinstance(x, (str, int, float)) and str(x).strip()][:4]

