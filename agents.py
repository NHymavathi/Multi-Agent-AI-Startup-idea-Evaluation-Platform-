from dataclasses import dataclass


@dataclass
class AgentSpec:
    key: str
    name: str
    prompt_file: str
    avatar: str
    description: str
    score_key: str


AGENTS = [
    AgentSpec("innovation", "Innovation Agent", "innovation.txt", "🧠", "Originality and product differentiation", "innovation_score"),
    AgentSpec("market", "Market Research Agent", "market.txt", "📈", "Demand, target users, and growth potential", "market_score"),
    AgentSpec("business", "Business Strategy Agent", "business.txt", "💼", "Business model and go-to-market strategy", "business_score"),
    AgentSpec("technology", "Technology Agent", "technology.txt", "⚙️", "Architecture, feasibility, stack, and security", "technology_score"),
    AgentSpec("risk", "Risk Assessment Agent", "risk.txt", "🛡️", "Technical and market risks", "risk_score"),
    AgentSpec("investment", "Investment Agent", "investment.txt", "💰", "Funding quality and investor potential", "investment_score"),
    AgentSpec("competitor", "Competitor Analysis Agent", "competitor.txt", "🏁", "Competitive positioning and differentiation", "competition_score"),
    AgentSpec("coordinator", "Coordinator Agent", "coordinator.txt", "🧭", "Synthesizes all business signals into a complete report", "overall_score"),
]
   