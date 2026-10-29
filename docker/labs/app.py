"""Small, observable application for the Docker course labs."""

import argparse
from contextlib import closing
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import os
from pathlib import Path
import signal
import sqlite3
import threading
import time
from urllib.parse import parse_qs, urlsplit


DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
DB_FILE = DATA_DIR / "orders.db"
VERSION = (Path(__file__).parent / "version.txt").read_text().strip()


def event(name, **values):
    print(json.dumps({"event": name, **values}, ensure_ascii=False), flush=True)


def connect():
    connection = sqlite3.connect(DB_FILE, timeout=5)
    connection.row_factory = sqlite3.Row
    return connection


def migrate():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with closing(connect()) as connection, connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS orders ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL, "
            "quantity INTEGER NOT NULL CHECK(quantity > 0), created_at TEXT NOT NULL)"
        )


def backup(target):
    target = Path(target)
    if target.resolve() == DB_FILE.resolve():
        raise ValueError("backup destination must differ from orders.db")
    target.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(DB_FILE.resolve().as_uri() + "?mode=ro", uri=True)) as source:
        with closing(sqlite3.connect(target)) as destination:
            source.backup(destination)
    event("BACKUP_COMPLETE", destination=str(target))


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        payload = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        request = urlsplit(self.path)
        if request.path == "/health":
            self.send_json(200, {"ok": True})
        elif request.path == "/version":
            self.send_json(200, {"version": VERSION})
        elif request.path in ("/ready", "/orders"):
            try:
                with closing(connect()) as connection:
                    if request.path == "/ready":
                        connection.execute("SELECT id FROM orders LIMIT 1").fetchone()
                        result = {"ok": True}
                    else:
                        result = {"orders": [dict(row) for row in connection.execute(
                            "SELECT id, item, quantity, created_at FROM orders ORDER BY id"
                        )]}
                self.send_json(200, result)
            except sqlite3.Error as error:
                event("DATABASE_ERROR", detail=str(error))
                self.send_json(503, {"ok": False, "error": "database unavailable"})
        elif request.path == "/slow":
            try:
                seconds = float(parse_qs(request.query).get("seconds", ["3"])[0])
                if not math.isfinite(seconds) or not 0 <= seconds <= 20:
                    raise ValueError
            except (ValueError, IndexError):
                self.send_json(400, {"error": "seconds must be between 0 and 20"})
                return
            event("REQUEST_STARTED", seconds=seconds)
            time.sleep(seconds)
            self.send_json(200, {"ok": True, "seconds": seconds})
            event("REQUEST_FINISHED", seconds=seconds)
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if urlsplit(self.path).path != "/orders":
            self.send_json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 65536:
                raise ValueError("request body must be 1–65536 bytes")
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError("expected a JSON object")
            item, quantity = body.get("item"), body.get("quantity")
            if not isinstance(item, str) or not 1 <= len(item.strip()) <= 200:
                raise ValueError("item must contain 1–200 characters")
            if type(quantity) is not int or not 1 <= quantity <= 10000:
                raise ValueError("quantity must be an integer between 1 and 10000")
            order = {"item": item.strip(), "quantity": quantity,
                     "created_at": datetime.now(timezone.utc).isoformat()}
            with closing(connect()) as connection, connection:
                cursor = connection.execute(
                    "INSERT INTO orders (item, quantity, created_at) VALUES (?, ?, ?)",
                    (order["item"], quantity, order["created_at"]),
                )
                order["id"] = cursor.lastrowid
            event("ORDER_CREATED", id=order["id"])
            self.send_json(201, order)
        except (ValueError, UnicodeDecodeError) as error:
            self.send_json(400, {"error": str(error)})
        except sqlite3.Error as error:
            event("DATABASE_ERROR", detail=str(error))
            self.send_json(503, {"error": "database unavailable"})

    def log_message(self, format, *args):
        event("HTTP", message=format % args)


class Server(ThreadingHTTPServer):
    # server_close waits for existing requests, making graceful shutdown observable.
    daemon_threads = False
    block_on_close = True


def serve():
    migrate()
    server = Server((os.environ.get("BIND_HOST", "0.0.0.0"),
                     int(os.environ.get("PORT", "8000"))), Handler)
    stopping = threading.Event()

    def stop(signum, _frame):
        if stopping.is_set():
            return
        stopping.set()
        event("SHUTDOWN_REQUESTED", signal=signum)
        # shutdown must run outside the thread executing serve_forever.
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    event("READY", host=server.server_address[0], port=server.server_address[1],
          version=VERSION, database=str(DB_FILE))
    try:
        server.serve_forever(poll_interval=0.1)
    finally:
        server.server_close()
        event("SHUTDOWN_COMPLETE")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command")
    commands.add_parser("serve")
    commands.add_parser("migrate")
    command = commands.add_parser("backup")
    command.add_argument("destination")
    args = parser.parse_args()
    if args.command == "backup":
        backup(args.destination)
    elif args.command == "migrate":
        migrate()
        event("MIGRATION_COMPLETE")
    else:
        serve()
