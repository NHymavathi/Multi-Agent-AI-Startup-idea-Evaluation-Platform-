from flask import Flask, jsonify, render_template, request

from services import generate_content, run_multi_agent_analysis


def register_routes(app: Flask) -> None:
    @app.route("/")
    def index() -> str:
        return render_template("index.html")

    @app.route("/api/health")
    def health() -> tuple:
        return jsonify({"status": "ok"}), 200

    @app.route("/api/analyze", methods=["POST"])
    def analyze() -> tuple:
        payload = request.get_json(silent=True) or {}
        idea = (payload.get("idea") or "").strip()
        if not idea:
            return jsonify({"error": "Please describe your startup idea first."}), 400

        result = run_multi_agent_analysis(idea)
        return jsonify(result), 200

    @app.route("/api/generate", methods=["POST"])
    def generate() -> tuple:
        payload = request.get_json(silent=True) or {}
        kind = (payload.get("kind") or "").strip()
        idea = (payload.get("idea") or "").strip()
        context = payload.get("context") or {}
        if not idea or not kind:
            return jsonify({"error": "Incomplete generation request."}), 400

        value = generate_content(kind, idea, context)
        return jsonify({"value": value}), 200
