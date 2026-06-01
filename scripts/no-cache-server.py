from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sqlite3
import sys
from urllib.parse import unquote, urlparse

from sqlite_store import FinanceStore, StoreError


PROJECT_ROOT = Path(__file__).resolve().parents[1]


class NoCacheHandler(SimpleHTTPRequestHandler):
    store = None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self._is_api_request():
            self._handle_api("GET")
            return
        super().do_GET()

    def do_POST(self):
        self._handle_api("POST")

    def do_PUT(self):
        self._handle_api("PUT")

    def do_PATCH(self):
        self._handle_api("PATCH")

    def do_DELETE(self):
        self._handle_api("DELETE")

    def _is_api_request(self):
        return urlparse(self.path).path.startswith("/api/")

    def _handle_api(self, method):
        try:
            parts = self._path_parts()
            if not parts or parts[0] != "api":
                self._send_error("not_found", "Rota inexistente.", 404)
                return

            data = self._dispatch_api(method, parts)
            self._send_json({"ok": True, "data": data})
        except StoreError as error:
            self._send_error(error.code, error.message, error.status)
        except json.JSONDecodeError:
            self._send_error("invalid_json", "JSON invalido.", 400)
        except sqlite3.OperationalError as error:
            message = str(error).lower()
            if "locked" in message or "busy" in message:
                self._send_error("database_busy", "Banco SQLite ocupado. Tente novamente em instantes.", 503)
            else:
                self._send_error("database_error", "Falha ao acessar o banco SQLite.", 500)
        except Exception:
            self._send_error("internal_error", "Falha interna do servidor local.", 500)

    def _dispatch_api(self, method, parts):
        if method == "GET" and parts == ["api", "health"]:
            return self.store.health()

        if method == "GET" and parts == ["api", "data"]:
            return self.store.get_all()

        if method == "PUT" and parts == ["api", "data"]:
            payload = self._read_json()
            return self.store.replace_many(payload.get("data", payload) if isinstance(payload, dict) else payload)

        if len(parts) < 3 or parts[1] != "collections":
            raise StoreError("not_found", "Rota inexistente.", 404)

        collection = parts[2]

        if method == "GET" and len(parts) == 3:
            return self.store.get_collection(collection)

        if method == "POST" and len(parts) == 3:
            payload = self._read_json()
            row = payload.get("row", payload) if isinstance(payload, dict) else payload
            return self.store.insert(collection, row)

        if method == "POST" and len(parts) == 4 and parts[3] == "bulk":
            payload = self._read_json()
            rows = payload.get("rows", payload) if isinstance(payload, dict) else payload
            return self.store.insert_many(collection, rows)

        if method == "PUT" and len(parts) == 3:
            payload = self._read_json()
            rows = payload.get("rows", payload) if isinstance(payload, dict) else payload
            return self.store.replace(collection, rows)

        if method == "PATCH" and len(parts) == 4:
            return self.store.update(collection, parts[3], self._read_json())

        if method == "DELETE" and len(parts) == 4:
            self.store.delete(collection, parts[3])
            return {"deleted": True}

        raise StoreError("not_found", "Rota inexistente.", 404)

    def _path_parts(self):
        path = urlparse(self.path).path
        return [unquote(part) for part in path.split("/") if part]

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw)

    def _send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, code, message, status):
        self._send_json({"ok": False, "error": {"code": code, "message": message}}, status)


def main():
    port = int(sys.argv[1])
    store = FinanceStore(PROJECT_ROOT)
    store.initialize()

    NoCacheHandler.store = store
    handler = partial(NoCacheHandler, directory=str(PROJECT_ROOT))
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()


if __name__ == "__main__":
    main()
