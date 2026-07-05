import json
import re
from pathlib import Path
from typing import Any, Dict, List

BASE_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = BASE_DIR / "prompts"


def read_prompt(name: str) -> str:
    path = PROMPTS_DIR / name
    if not path.exists():
        return "Analyze the startup idea thoroughly and return a structured response."
    return path.read_text(encoding="utf-8")


def clean_text(text: str) -> str:
    if not text:
        return ""
    value = re.sub(r"\s+", " ", text).strip()
    return value[:500]


def extract_json(text: str) -> Dict[str, Any] | None:
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    candidate = match.group(0)
    try:
        return json.loads(candidate)
    except Exception:
        return None


def score_to_label(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Strong"
    if score >= 55:
        return "Promising"
    return "Needs Work"


def build_swot(metrics: Dict[str, Any]) -> Dict[str, List[str]]:
    return {
        "strengths": [
            "Clear user value and strong differentiation potential",
            "A credible business model with growth opportunity",
        ],
        "weaknesses": [
            "Validation and traction are still unproven",
            "Market education may be needed for adoption",
        ],
        "opportunities": [
            "Expand into adjacent workflows and higher-value segments",
            "Leverage AI and automation for premium efficiency gains",
        ],
        "threats": [
            "Competitive saturation and distribution challenges",
            "Budget constraints and changing customer priorities",
        ],
    }


def build_markdown_report(startup_name: str, idea: str, metrics: Dict[str, Any], swot: Dict[str, List[str]], business_model: str, pricing_strategy: str, roadmap: List[str]) -> str:
    lines = [
        f"# {startup_name} Evaluation Report",
        "",
        f"**Idea:** {idea}",
        "",
        "## Executive Summary",
        f"This startup concept scored {metrics.get('overall', 0)}/100 and shows strong potential for a disciplined launch.",
        "",
        "## SWOT",
        f"- Strengths: {', '.join(swot.get('strengths', []))}",
        f"- Weaknesses: {', '.join(swot.get('weaknesses', []))}",
        f"- Opportunities: {', '.join(swot.get('opportunities', []))}",
        f"- Threats: {', '.join(swot.get('threats', []))}",
        "",
        "## Business Model",
        business_model,
        "",
        "## Pricing Strategy",
        pricing_strategy,
        "",
        "## Roadmap",
    ]
    for step in roadmap:
        lines.append(f"- {step}")
    return "\n".join(lines)
