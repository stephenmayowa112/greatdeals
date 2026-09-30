import django_filters
from django.db.models import Q
from django.utils import timezone
from .models import Deal

class DealFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filter_category')
    q = django_filters.CharFilter(method='filter_search')
    status = django_filters.ChoiceFilter(choices=Deal.Status.choices)
    is_live_only = django_filters.BooleanFilter(method='filter_live_only')

    class Meta:
        model = Deal
        fields = ['category', 'q', 'status', 'is_live_only']

    def filter_category(self, queryset, name, value):
        if not value or value == 'all':
            return queryset
        return queryset.filter(Q(category__slug=value) | Q(category__id__iexact=value))

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(title__icontains=value) |
            Q(short_description__icontains=value) |
            Q(source_name__icontains=value)
        )

    def filter_live_only(self, queryset, name, value):
        if value is True:
            now = timezone.now()
            return queryset.filter(
                status=Deal.Status.LIVE
            ).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=now)
            )
        return queryset
