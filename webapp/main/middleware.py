import logging

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
        except DatabaseError as exc:
            logger.warning("Database error while processing request: %s", exc)
            html = render_to_string("main/errors/database_error.html")
            response = HttpResponseServerError(html)
            response["Cache-Control"] = "no-store"
            return response
