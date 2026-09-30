from rest_framework import serializers
from .models import Category, Deal

class CategorySerializer(serializers.ModelSerializer):
    deals_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'deals_count']


class DealSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    category = CategorySerializer(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    effective_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Deal
        fields = [
            'id',
            'title',
            'short_description',
            'image',
            'image_url',
            'effective_image_url',
            'original_price',
            'discounted_price',
            'percentage_off',
            'category_id',
            'category',
            'source_name',
            'source_url',
            'status',
            'posted_at',
            'expires_at',
            'is_expired',
        ]
        read_only_fields = ['is_expired', 'effective_image_url']

    def validate(self, attrs):
        orig = attrs.get('original_price')
        disc = attrs.get('discounted_price')
        if orig and disc and disc > orig:
            raise serializers.ValidationError({
                'discounted_price': 'Discounted price cannot be greater than original price.'
            })
        return attrs
