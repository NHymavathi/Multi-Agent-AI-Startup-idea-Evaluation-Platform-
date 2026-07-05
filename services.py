import json
import re
from pathlib import Path
from typing import Any, Dict, List

import requests

from agents import AGENTS
from config import Config
from utils import build_markdown_report, build_swot, clean_text, extract_json, read_prompt, score_to_label


BASE_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = BASE_DIR / "prompts"


def call_groq(prompt: str) -> str | None:
    if not Config.GROQ_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {Config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": Config.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a senior startup analyst. Return compact JSON only when requested."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.6,
        "max_tokens": 1400,
    }
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


def fallback_agent_result(agent: Any, idea: str) -> Dict[str, Any]:
    score = 70 + (sum(ord(char) for char in idea) % 21)
    summary = f"{agent.name} sees a strong foundation with clear differentiation potential."
    details = {
        "innovation_score": score if agent.key == "innovation" else 72 + (sum(ord(char) for char in agent.name) % 15),
        "market_score": score if agent.key == "market" else 68 + (sum(ord(char) for char in agent.name) % 17),
        "business_score": score if agent.key == "business" else 71 + (sum(ord(char) for char in agent.name) % 13),
        "technology_score": score if agent.key == "technology" else 69 + (sum(ord(char) for char in agent.name) % 16),
        "risk_score": 100 - score if agent.key == "risk" else 74 + (sum(ord(char) for char in agent.name) % 12),
        "investment_score": score if agent.key == "investment" else 77 + (sum(ord(char) for char in agent.name) % 14),
        "competition_score": score if agent.key == "competitor" else 70 + (sum(ord(char) for char in agent.name) % 15),
    }

    if agent.key == "innovation":
        details = {
            "innovation_score": score,
            "originality": "The idea has strong novelty potential and a distinctive angle.",
            "usp": "A compelling reason to choose this product over existing alternatives.",
            "creativity": "The concept combines practical utility with fresh positioning.",
            "suggestions": [
                "Focus the story around a single painful user problem.",
                "Add a memorable brand layer to increase recall.",
            ],
        }
    elif agent.key == "market":
        details = {
            "industry": "Emerging digital services market",
            "market_size": "Large and expanding with favorable adoption trends",
            "growth": "High growth potential across SMB and enterprise workflows",
            "target_customers": "Founders, operators, and modern teams",
            "demand": "Sustained demand driven by productivity and automation needs",
            "market_opportunity": "Strong whitespace exists for mission-driven positioning",
        }
    elif agent.key == "business":
        details = {
            "revenue_model": "Subscription, usage-based membership, and premium add-ons",
            "pricing": "Tiered pricing optimized for early adopters and scaling teams",
            "scalability": "High scalability through software-led operations and automation",
            "business_model": "B2B SaaS with strong retention and upsell potential",
            "customer_acquisition": "Content-led growth, partnerships, and founder-led sales",
        }
    elif agent.key == "technology":
        details = {
            "recommended_tech_stack": "Python, Flask, PostgreSQL, React-inspired UI patterns, and cloud APIs",
            "ai_feasibility": "Strong feasibility given the current foundational AI service ecosystem",
            "apis": "Groq, OpenAI, Stripe, Twilio, and cloud storage integrations",
            "cloud": "AWS or Azure with managed containers and serverless services",
            "architecture": "Modular backend services with event-driven workflows and observability",
            "security": "OAuth, role-based access, encryption, and audit logging",
        }
    elif agent.key == "risk":
        details = {
            "technical_risks": "Execution complexity can increase with rapid feature scope",
            "financial_risks": "Customer acquisition costs can be volatile in early traction phases",
            "operational_risks": "Delivery speed may be constrained without strong product discipline",
            "legal_risks": "Data handling and regulatory requirements must be planned early",
            "ethical_risks": "AI behavior must remain transparent, fair, and explainable",
        }
    elif agent.key == "investment":
        details = {
            "investment_score": score,
            "funding_recommendation": "Seek seed support with a focused milestone plan",
            "startup_valuation": "$2M-$6M depending on traction and team quality",
            "roi": "Attractive if customer retention and gross margin stay high",
            "investor_feedback": "The concept is promising but needs proof of product-market fit.",
        }
    elif agent.key == "competitor":
        details = {
            "top_competitors": ["Established incumbents", "Specialized niche tools", "Open-source alternatives"],
            "comparison_table": "Positioning may win through speed, usability, and vertical depth",
            "competitive_advantages": ["Better user experience", "Focused niche value", "Faster iteration"],
            "weaknesses": ["Brand recognition", "Initial distribution", "Limited early resources"],
        }

    return {
        "agent": agent.key,
        "name": agent.name,
        "avatar": agent.avatar,
        "score": score,
        "summary": summary,
        "details": details,
        "status": "completed",
    }


def parse_agent_response(raw: str | None, agent: Any, idea: str) -> Dict[str, Any]:
    if not raw:
        return fallback_agent_result(agent, idea)

    candidate = extract_json(raw)
    if candidate:
        payload = candidate
    else:
        payload = {"summary": clean_text(raw[:500]), "score": 72}

    score = 72
    if agent.key == "innovation":
        score = int(payload.get("innovation_score", payload.get("score", 72)))
    elif agent.key == "market":
        score = int(payload.get("market_score", payload.get("score", 72)))
    elif agent.key == "business":
        score = int(payload.get("business_score", payload.get("score", 72)))
    elif agent.key == "technology":
        score = int(payload.get("technology_score", payload.get("score", 72)))
    elif agent.key == "risk":
        score = int(payload.get("risk_score", payload.get("score", 72)))
    elif agent.key == "investment":
        score = int(payload.get("investment_score", payload.get("score", 72)))
    elif agent.key == "competitor":
        score = int(payload.get("competition_score", payload.get("score", 72)))

    summary = payload.get("summary") or payload.get("market_opportunity") or payload.get("funding_recommendation") or "The agent sees meaningful potential in the concept."
    return {
        "agent": agent.key,
        "name": agent.name,
        "avatar": agent.avatar,
        "score": max(50, min(99, score)),
        "summary": clean_text(str(summary)),
        "details": payload,
        "status": "completed",
    }


def run_multi_agent_analysis(idea: str) -> Dict[str, Any]:
    agent_results: List[Dict[str, Any]] = []
    for agent in AGENTS:
        prompt = read_prompt(agent.prompt_file).format(idea=idea)
        raw = call_groq(prompt)
        result = parse_agent_response(raw, agent, idea)
        agent_results.append(result)

    score_breakdown = {
        "overall": int(sum(item["score"] for item in agent_results) / len(agent_results)),
        "innovation": int(next(item["score"] for item in agent_results if item["agent"] == "innovation")),
        "market": int(next(item["score"] for item in agent_results if item["agent"] == "market")),
        "business": int(next(item["score"] for item in agent_results if item["agent"] == "business")),
        "technology": int(next(item["score"] for item in agent_results if item["agent"] == "technology")),
        "investment": int(next(item["score"] for item in agent_results if item["agent"] == "investment")),
        "risk": int(next(item["score"] for item in agent_results if item["agent"] == "risk")),
    }

    swot = build_swot(score_breakdown)
    startup_name = generate_startup_name(idea)
    tagline = generate_tagline(idea)
    elevator_pitch = generate_elevator_pitch(idea)
    mission = generate_mission(idea)
    vision = generate_vision(idea)
    business_model = generate_business_model(idea)
    revenue_streams = generate_revenue_streams(idea)
    pricing_strategy = generate_pricing_strategy(idea)
    investor_pitch = generate_investor_pitch(idea)
    roadmap = generate_roadmap(idea)
    persona = generate_persona(idea)
    lean_canvas = generate_lean_canvas(idea)
    business_model_canvas = generate_business_model_canvas(idea)

    report = {
        "idea": idea,
        "startup_name": startup_name,
        "tagline": tagline,
        "elevator_pitch": elevator_pitch,
        "mission_statement": mission,
        "vision_statement": vision,
        "executive_summary": f"{startup_name} is positioned as a strong venture with an overall readiness score of {score_breakdown['overall']}/100. The concept combines practical utility, differentiated positioning, and a credible path to adoption.",
        "problem_statement": f"The market needs a better way to solve the core problem behind '{idea}'.",
        "solution": f"{startup_name} offers a focused solution that turns this insight into a compelling product experience.",
        "market_analysis": next(item["details"].get("market_opportunity") or item["details"].get("industry") for item in agent_results if item["agent"] == "market"),
        "competitor_analysis": next(item["details"].get("top_competitors") or item["details"].get("comparison_table") for item in agent_results if item["agent"] == "competitor"),
        "swot": swot,
        "business_model": business_model,
        "revenue_streams": revenue_streams,
        "pricing_strategy": pricing_strategy,
        "risk_analysis": next(item["details"] for item in agent_results if item["agent"] == "risk"),
        "investment_recommendation": next(item["details"].get("funding_recommendation") or item["details"].get("investment_score") for item in agent_results if item["agent"] == "investment"),
        "roadmap": roadmap,
        "final_verdict": f"Proceed with a disciplined pilot and validation sprint. Score: {score_breakdown['overall']}/100 ({score_to_label(score_breakdown['overall'])}).",
        "startup_score": score_breakdown["overall"],
        "metrics": score_breakdown,
        "agents": agent_results,
        "markdown": build_markdown_report(startup_name, idea, score_breakdown, swot, business_model, pricing_strategy, roadmap),
        "extra": {
            "business_model_canvas": business_model_canvas,
            "lean_canvas": lean_canvas,
            "target_customer_persona": persona,
            "investor_pitch": investor_pitch,
        },
    }
    return report


def generate_content(kind: str, idea: str, context: Dict[str, Any]) -> str:
    key = kind.lower()
    if key == "startup_name":
        return generate_startup_name(idea)
    if key == "tagline":
        return generate_tagline(idea)
    if key == "elevator_pitch":
        return generate_elevator_pitch(idea)
    if key == "mission_statement":
        return generate_mission(idea)
    if key == "vision_statement":
        return generate_vision(idea)
    if key == "business_model_canvas":
        return generate_business_model_canvas(idea)
    if key == "lean_canvas":
        return generate_lean_canvas(idea)
    if key == "target_customer_persona":
        return generate_persona(idea)
    if key == "investor_pitch":
        return generate_investor_pitch(idea)
    if key == "launch_roadmap":
        return generate_roadmap(idea)
    return "Content generation is available for the requested startup outputs."


def generate_startup_name(idea: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", idea).strip().split()[0:3]
    base = " ".join(cleaned).title() if cleaned else "Nova"
    return f"{base} Labs"


def generate_tagline(idea: str) -> str:
    return f"Turning {idea[:45]} into a category-defining growth engine."


def generate_elevator_pitch(idea: str) -> str:
    return f"We build a smart platform that transforms {idea.lower()} into a seamless, measurable experience for modern teams."


def generate_mission(idea: str) -> str:
    return f"To make {idea[:60]} more accessible, efficient, and valuable for everyday users."


def generate_vision(idea: str) -> str:
    return f"To shape the future of how people discover, adopt, and scale ambitious ideas through intelligent software."


def generate_business_model(idea: str) -> str:
    return "A premium subscription model with enterprise add-ons, onboarding packages, and usage-based expansion."


def generate_revenue_streams(idea: str) -> List[str]:
    return ["Monthly subscriptions", "Premium add-ons", "Enterprise licensing", "Implementation services"]


def generate_pricing_strategy(idea: str) -> str:
    return "Start with a freemium entry tier, then move to value-based pricing as adoption rises and workflow impact becomes clear."


def generate_business_model_canvas(idea: str) -> str:
    return "Customer Segments: founders, teams, operators. Value Proposition: speed, clarity, automation. Channels: content, communities, referrals. Revenue Streams: subscriptions, add-ons."


def generate_lean_canvas(idea: str) -> str:
    return "Problem: fragmented workflows. Solution: focused platform. Key Metrics: activation, retention, expansion. Unfair Advantage: deep product focus and network effects."


def generate_persona(idea: str) -> str:
    return "A growth-minded operator who needs clarity, speed, and measurable impact from a product they rely on every week."


def generate_investor_pitch(idea: str) -> str:
    return "This venture presents a strong wedge into a large market, with a clear growth engine and a differentiated product story."


def generate_roadmap(idea: str) -> List[str]:
    return [
        "Week 1-2: Validate core problem and talk to early adopters",
        "Week 3-4: Build a lean prototype and test onboarding",
        "Month 2: Launch pilot, collect retention feedback, and refine messaging",
        "Month 3+: Expand features and prepare for seed fundraising",
    ]
