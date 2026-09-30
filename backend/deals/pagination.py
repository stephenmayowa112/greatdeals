from rest_framework.pagination import CursorPagination
from rest_framework.response import Response

class DealCursorPagination(CursorPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 50
    ordering = '-posted_at'  # Newest first

    def get_paginated_response(self, data):
        return Response({
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'items': data,
            'has_more': self.get_next_link() is not None,
        })
