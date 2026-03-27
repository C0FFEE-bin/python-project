import logging
import sqlite3

from django.db import DatabaseError
from django.http import HttpResponseServerError
from django.template.loader import render_to_string


logger = logging.getLogger(__name__)


class DatabaseErrorPageMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as exc:
            if not _contains_database_error(exc):
                raise
            return _build_database_error_response(exc)

    def process_exception(self, request, exception):
        if not _contains_database_error(exception):
            return None
        return _build_database_error_response(exception)


def _contains_database_error(exception):
    visited = set()
    current = exception

    while current is not None and id(current) not in visited:
        if isinstance(current, (DatabaseError, sqlite3.DatabaseError)):
            return True

        visited.add(id(current))
        current = current.__cause__ or current.__context__

    return False


def _build_database_error_response(exception):
    logger.exception("Database error while processing request: %s", exception)
    html = render_to_string("main/errors/database_error.html")
    response = HttpResponseServerError(html)
    response["Cache-Control"] = "no-store"
    response["X-Database-Error"] = "1"
    return response
