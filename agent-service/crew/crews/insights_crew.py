from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.insights_reporter import create_insights_reporter
from schemas.responses import InsightReportResult


class InsightsCrew:
    def __init__(self):
        self.llm = get_llm()
        self.reporter = create_insights_reporter(self.llm)

    def run(self, campaign_stats: dict) -> dict:
        task = Task(
            description=(
                "You are the Campaign Performance Analyst for Xeno CRM.\n\n"
                "CAMPAIGN STATS (raw):\n"
                f"{campaign_stats}\n\n"
                "YOUR JOB:\n"
                "Read the stats above and produce a structured insights report that "
                "the frontend will render directly. Every field below is required.\n\n"
                "REQUIRED FIELDS:\n"
                "1. campaign_name — copy from the stats; if missing, use 'Untitled Campaign'.\n"
                "2. summary — 2–4 sentences. State what the campaign did, who it hit, "
                "and how it performed against expectation.\n"
                "3. metrics — list of {label, value, unit} objects covering at minimum: "
                "audience size, delivery rate, engagement rate (open or click), "
                "conversion rate, revenue (INR), and ROAS. Use only data present "
                "in the stats; if a metric is missing, omit it rather than guessing.\n"
                "4. top_finding — ONE sentence stating the single most important takeaway.\n"
                "5. recommendations — EXACTLY 3 objects, each {action, expected_impact, "
                "effort}. Actions must be specific and operational (e.g. "
                "'Re-target the 1.2k non-openers on WhatsApp Tue 11:00 IST'), not "
                "generic ('improve targeting').\n"
                "6. chart_data — list of {chart_type, title, series} the frontend can "
                "render. Use chart_type from: 'bar', 'line', 'pie', 'funnel'.\n"
                "7. overall_score — float in [0, 1] reflecting campaign quality vs. "
                "segment baseline.\n"
                "8. next_campaign_suggestion — ONE sentence proposing the natural "
                "follow-up campaign.\n\n"
                "RULES:\n"
                "- Ground every metric and finding in the stats provided. Never invent.\n"
                "- If a number is zero or missing, say so — do not inflate.\n\n"
                "OUTPUT:\n"
                "Return ONLY the structured JSON object. No markdown, no code fences, "
                "no prose."
            ),
            expected_output=(
                'A single JSON object with keys: campaign_name, summary, metrics, '
                'top_finding, recommendations (exactly 3), chart_data, overall_score '
                '(0..1), next_campaign_suggestion. No prose, no fences.'
            ),
            agent=self.reporter,
            output_pydantic=InsightReportResult,
        )
        crew = Crew(
            agents=[self.reporter],
            tasks=[task],
            process=Process.sequential,
            function_calling_llm=self.llm,
            verbose=False,
        )
        result = crew.kickoff()
        if result and result.pydantic:
            return result.pydantic.model_dump()
        return {"error": "Failed to generate insights"}
