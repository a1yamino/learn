"""Verify the lab API and print evidence; creates one clearly named test order."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4


def verify(base):
    checks = []

    def request(path, body=None):
        payload = None if body is None else json.dumps(body).encode()
        req = Request(base.rstrip("/") + path, data=payload,
                      headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=10) as response:
            return response.status, json.load(response)

    def check(name, condition):
        checks.append({"check": name, "passed": bool(condition)})
        if not condition:
            raise ValueError(name + " failed")

    result = {"time": datetime.now(timezone.utc).isoformat(), "url": base, "checks": checks}
    try:
        status, health = request("/health")
        check("process health", status == 200 and health.get("ok") is True)
        status, ready = request("/ready")
        check("database readiness", status == 200 and ready.get("ok") is True)
        status, version = request("/version")
        check("version reported", status == 200 and bool(version.get("version")))
        result["version"] = version["version"]
        item = "verify-" + uuid4().hex[:12]
        status, order = request("/orders", {"item": item, "quantity": 2})
        check("order created", status == 201 and order.get("item") == item and order.get("quantity") == 2)
        status, listing = request("/orders")
        check("order persisted", status == 200 and any(
            x.get("id") == order["id"] and x.get("item") == item and x.get("quantity") == 2
            for x in listing.get("orders", [])))
        result["created_order"] = order
        result["passed"] = True
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, TypeError) as error:
        result.update(passed=False, error=str(error))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", nargs="?", default="http://127.0.0.1:8080")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    evidence = verify(args.url)
    text = json.dumps(evidence, ensure_ascii=False, indent=2)
    print(text)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n")
    sys.exit(0 if evidence["passed"] else 1)
