"""Conservative display of explicitly zoned daily opening hours."""
import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def open_now(status: str, schedule: str | None) -> bool | None:
    if status != "aberto":
        return False
    summary = opening_summary(status, schedule)
    return None if summary is None else not summary.startswith("Horário cadastrado:")


def opening_summary(status: str, schedule: str | None, now: datetime | None = None) -> str | None:
    if status == "manutencao":
        return "Em manutenção"
    # Free text (weekends, exceptions, holidays) must never be guessed.
    match = re.fullmatch(r"Diariamente (\d{2}):(\d{2})-(\d{2}):(\d{2}) \[([A-Za-z_/:+\d-]+)\]", schedule or "", re.I)
    if not match:
        return None
    hour, minute, end_hour, end_minute = map(int, match.groups()[:4])
    if max(hour, end_hour) > 23 or max(minute, end_minute) > 59:
        return None
    try:
        zone_name = match[5]
        offset = re.fullmatch(r"UTC([+-])(\d{2}):(\d{2})", zone_name)
        if offset:
            if int(offset[2]) > 23 or int(offset[3]) > 59:
                return None
            zone = timezone(timedelta(minutes=(int(offset[2]) * 60 + int(offset[3])) * (1 if offset[1] == "+" else -1)))
        else:
            zone = timezone.utc if zone_name == "UTC" else ZoneInfo(zone_name)
        local = (now or datetime.now(timezone.utc)).astimezone(zone)
    except (ZoneInfoNotFoundError, ValueError):
        return None
    start, end, current = hour * 60 + minute, end_hour * 60 + end_minute, local.hour * 60 + local.minute
    if start == end:
        return None
    is_open = start <= current < end if start < end else current >= start or current < end
    if status == "fechado":
        return "Fechado pelo estabelecimento"
    if not is_open:
        return f"Horário cadastrado: abre às {hour:02d}:{minute:02d}"
    remaining = (end - current) % 1440
    return f"Fecha em {remaining} min" if remaining <= 30 else f"Aberto até {end_hour:02d}:{end_minute:02d}"
