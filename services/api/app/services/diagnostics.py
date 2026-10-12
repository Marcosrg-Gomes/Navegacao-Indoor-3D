from collections import defaultdict, deque
from datetime import datetime, timezone
from math import ceil
from threading import Lock
from time import monotonic

from app.models import Diagnostico


class SlidingWindowRateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)
        self.lock = Lock()

    def allow(self, client_key: str) -> bool:
        allowed, _ = self.check(client_key)
        return allowed

    def check(self, client_key: str) -> tuple[bool, int]:
        now = monotonic()
        threshold = now - self.window_seconds
        with self.lock:
            for key, timestamps in list(self.requests.items()):
                while timestamps and timestamps[0] <= threshold:
                    timestamps.popleft()
                if not timestamps:
                    del self.requests[key]
            requests = self.requests[client_key]
            if len(requests) >= self.limit:
                retry_after = max(1, ceil(requests[0] + self.window_seconds - now))
                return False, retry_after
            requests.append(now)
            return True, 0


def record_failure(db, tipo, codigo):
    """Bounded aggregate counters: no URL, token, IP, device, origin or destination."""
    values = {"tipo": tipo, "codigo": codigo, "ocorrencias": 1, "atualizado_em": datetime.now(timezone.utc)}
    if db.bind.dialect.name == "mysql":
        from sqlalchemy.dialects.mysql import insert
        statement = insert(Diagnostico).values(**values)
        statement = statement.on_duplicate_key_update(ocorrencias=Diagnostico.ocorrencias + 1, atualizado_em=values["atualizado_em"])
    else:
        from sqlalchemy.dialects.sqlite import insert
        statement = insert(Diagnostico).values(**values)
        statement = statement.on_conflict_do_update(index_elements=["tipo", "codigo"],
            set_={"ocorrencias": Diagnostico.ocorrencias + 1, "atualizado_em": values["atualizado_em"]})
    db.execute(statement)
    db.commit()
