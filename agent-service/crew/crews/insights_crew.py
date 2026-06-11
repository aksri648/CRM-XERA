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
            description=f"Analyze these campaign stats and produce an insights report: {campaign_stats}",
            expected_output='JSON object with campaign_name, summary, metrics, top_finding, recommendations, chart_data, overall_score, next_campaign_suggestion',
            agent=self.reporter,
            output_pydantic=InsightReportResult,
        )
        crew = Crew(
            agents=[self.reporter],
            tasks=[task],
            process=Process.sequential,
            verbose=False,
        )
        result = crew.kickoff()
        if result and result.pydantic:
            return result.pydantic.model_dump()
        return {"error": "Failed to generate insights"}
