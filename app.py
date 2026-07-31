from flask import Flask, render_template, jsonify, request, send_from_directory
from pathlib import Path
import os
import subprocess
import sys

BASE_DIR = Path(__file__).resolve().parent
ASSET_DIR = BASE_DIR / "assets"

app = Flask(__name__)

VIDEO_EXT = {".mp4", ".webm", ".mov", ".mkv", ".avi"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
AUDIO_EXT = {".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"}
FONT_EXT = {".ttf", ".otf", ".woff", ".woff2"}

def file_type(path):
    ext = path.suffix.lower()
    if ext in VIDEO_EXT:
        return "video"
    if ext in IMAGE_EXT:
        return "image"
    if ext in AUDIO_EXT:
        return "audio"
    if ext in FONT_EXT:
        return "font"
    return "file"

def scan_assets():
    assets = []
    if not ASSET_DIR.exists():
        return assets

    for path in ASSET_DIR.rglob("*"):
        if not path.is_file():
            continue
        if path.name.startswith(".") or path.name.endswith(".txt"):
            continue

        rel = path.relative_to(ASSET_DIR)
        parts = rel.parts
        category = parts[0] if len(parts) > 1 else "Other"
        subcategory = parts[1] if len(parts) > 2 else ""

        assets.append({
            "name": path.name,
            "type": file_type(path),
            "category": category,
            "subcategory": subcategory,
            "path": str(rel).replace("\\", "/"),
            "size": path.stat().st_size,
            "extension": path.suffix.lower()
        })

    return sorted(assets, key=lambda x: x["name"].lower())

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/assets")
def api_assets():
    return jsonify(scan_assets())

@app.route("/api/open-location", methods=["POST"])
def open_location():
    data = request.get_json(silent=True) or {}
    relative = data.get("path", "")

    target = (ASSET_DIR / relative).resolve()

    try:
        target.relative_to(ASSET_DIR.resolve())
    except ValueError:
        return jsonify({"ok": False, "error": "Invalid path"}), 400

    if not target.exists():
        return jsonify({"ok": False, "error": "File not found"}), 404

    try:
        if sys.platform.startswith("win"):
            subprocess.Popen(["explorer", "/select,", str(target)])
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", str(target)])
        else:
            subprocess.Popen(["xdg-open", str(target.parent)])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/file/<path:relative_path>")
def serve_file(relative_path):
    target = (ASSET_DIR / relative_path).resolve()
    try:
        target.relative_to(ASSET_DIR.resolve())
    except ValueError:
        return "Invalid path", 400
    return send_from_directory(ASSET_DIR, relative_path)

@app.route("/api/stats")
def stats():
    assets = scan_assets()
    counts = {}
    for item in assets:
        counts[item["category"]] = counts.get(item["category"], 0) + 1
    return jsonify({
        "total": len(assets),
        "categories": counts
    })

if __name__ == "__main__":
    print("Blade Asset Library v1")
    print("Open: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
