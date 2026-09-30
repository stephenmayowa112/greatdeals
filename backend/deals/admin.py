from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Deal

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'get_deals_count', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')

    def get_deals_count(self, obj):
        return obj.deals.count()
    get_deals_count.short_description = 'Total Deals'


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'source_name',
        'category',
        'formatted_prices',
        'percentage_off',
        'status',
        'posted_at',
        'expires_at',
        'is_expired_badge',
    )
    list_filter = ('status', 'category', 'source_name', 'posted_at')
    search_fields = ('title', 'short_description', 'source_name')
    date_hierarchy = 'posted_at'
    list_editable = ('status',)
    actions = ['make_live', 'make_draft', 'make_expired']

    fieldsets = (
        ('Deal Info', {
            'fields': ('title', 'short_description', 'category', 'source_name', 'source_url')
        }),
        ('Visual Assets', {
            'fields': ('image', 'image_url')
        }),
        ('Pricing & Discounts', {
            'fields': ('original_price', 'discounted_price', 'percentage_off')
        }),
        ('Publication & Scheduling', {
            'fields': ('status', 'posted_at', 'expires_at')
        }),
    )

    def formatted_prices(self, obj):
        if obj.discounted_price and obj.original_price:
            return format_html(
                '<strong>${}</strong> <span style="text-decoration: line-through; color: #888;">${}</span>',
                obj.discounted_price,
                obj.original_price
            )
        elif obj.discounted_price:
            return f"${obj.discounted_price}"
        return "Promo"
    formatted_prices.short_description = 'Price'

    def is_expired_badge(self, obj):
        if obj.is_expired:
            return format_html('<span style="color: red; font-weight: bold;">Expired</span>')
        return format_html('<span style="color: green;">Active</span>')
    is_expired_badge.short_description = 'Validity'

    @admin.action(description='Mark selected deals as Live (Immediate feed display)')
    def make_live(self, request, queryset):
        queryset.update(status=Deal.Status.LIVE)

    @admin.action(description='Mark selected deals as Draft')
    def make_draft(self, request, queryset):
        queryset.update(status=Deal.Status.DRAFT)

    @admin.action(description='Mark selected deals as Expired')
    def make_expired(self, request, queryset):
        queryset.update(status=Deal.Status.EXPIRED)
