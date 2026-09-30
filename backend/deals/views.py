from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from .models import Category, Deal
from .serializers import CategorySerializer, DealSerializer
from .pagination import DealCursorPagination
from .filters import DealFilter

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        now = timezone.now()
        # Annotate category with live, unexpired deals count
        return Category.objects.annotate(
            deals_count=Count(
                'deals',
                filter=Q(
                    deals__status=Deal.Status.LIVE,
                ) & (Q(deals__expires_at__isnull=True) | Q(deals__expires_at__gt=now))
            )
        ).order_by('name')


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    pagination_class = DealCursorPagination
    filterset_class = DealFilter
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Deal.objects.select_related('category').all()
        now = timezone.now()

        # Admin users can pass include_all=true to view drafts and expired deals
        include_all = self.request.query_params.get('include_all', 'false').lower() in ('true', '1')

        if not (self.request.user.is_authenticated and include_all):
            # Public deals feed: strictly live and non-expired
            queryset = queryset.filter(
                status=Deal.Status.LIVE
            ).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=now)
            )

        return queryset.order_by('-posted_at', '-id')
