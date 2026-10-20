"""留言板接口，跟 js/guestbook.js 对齐。

GET  /api/messages          -> [{name, content, created_at}, ...]
POST /api/messages          JSON {name, content}
"""

import sqlite3
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request

DB_PATH = Path(__file__).with_name("messages.db")
MAX_NAME = 40
MAX_CONTENT = 1000
LIST_LIMIT = 200
RATE_LIMIT = 8
GET_RATE_LIMIT = 60
RATE_WINDOW = 60
GET_CACHE_TTL = 5

ALLOWED_ORIGINS = {
    "https://seraphinadong.github.io",
    "http://127.0.0.1:8765",
    "http://localhost:8765",
}

app = Flask(__name__)
app.json.ensure_ascii = False
lock = threading.Lock()
post_hits = {}
get_hits = {}
list_cache = {"at": 0.0, "rows": None}


def connect():
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    with lock:
        conn = connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()


def allow(resp):
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Max-Age"] = "600"
    return resp


@app.after_request
def add_security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    resp.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    resp.headers["Strict-Transport-Security"] = "max-age=15552000"
    return resp


def client_ip():
    remote = request.remote_addr or ""
    if remote in ("127.0.0.1", "::1"):
        forwarded = request.headers.get("X-Forwarded-For", "")
        hops = [part.strip() for part in forwarded.split(",") if part.strip()]
        if hops:
            return hops[-1]
    return remote or "unknown"


def too_fast(bucket, limit):
    now = time.monotonic()
    ip = client_ip()
    with lock:
        recent = [stamp for stamp in bucket.get(ip, []) if now - stamp < RATE_WINDOW]
        if len(recent) >= limit:
            bucket[ip] = recent
            return True
        recent.append(now)
        bucket[ip] = recent
    return False


def cached_messages():
    now = time.monotonic()
    with lock:
        rows = list_cache["rows"]
        if rows is not None and now - list_cache["at"] < GET_CACHE_TTL:
            return rows
        conn = connect()
        try:
            fetched = conn.execute(
                """
                SELECT name, content, created_at
                FROM messages
                ORDER BY id DESC
                LIMIT ?
                """,
                (LIST_LIMIT,),
            ).fetchall()
        finally:
            conn.close()
        rows = [dict(row) for row in fetched]
        list_cache["at"] = now
        list_cache["rows"] = rows
        return rows


@app.route("/api/messages", methods=["GET", "POST", "OPTIONS"])
def messages():
    if request.method == "OPTIONS":
        return allow(app.response_class(status=204))

    if request.method == "GET":
        if too_fast(get_hits, GET_RATE_LIMIT):
            return allow(jsonify({"error": "刷新太频繁，请稍后再试"})), 429
        resp = allow(jsonify(cached_messages()))
        resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
        return resp

    if too_fast(post_hits, RATE_LIMIT):
        return allow(jsonify({"error": "留言太频繁，请稍后再试"})), 429

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return allow(jsonify({"error": "需要 JSON"})), 400
    name = str(data.get("name") or "").strip() or "匿名"
    content = str(data.get("content") or "").strip()
    if not content:
        return allow(jsonify({"error": "请填写留言内容"})), 400
    if len(name) > MAX_NAME or len(content) > MAX_CONTENT:
        return allow(jsonify({"error": "留言太长了"})), 400

    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with lock:
        conn = connect()
        try:
            conn.execute(
                "INSERT INTO messages (name, content, created_at) VALUES (?, ?, ?)",
                (name, content, created_at),
            )
            conn.commit()
            list_cache["at"] = 0.0
            list_cache["rows"] = None
        finally:
            conn.close()
    return allow(jsonify({"name": name, "content": content, "created_at": created_at}))


init_db()

from yuji import register as register_yuji

register_yuji(app, allow, client_ip, ALLOWED_ORIGINS)
