from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Deal(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        LIVE = 'live', 'Live'
        EXPIRED = 'expired', 'Expired'

    title = models.CharField(max_length=255, db_index=True)
    short_description = models.TextField()
    image = models.ImageField(upload_to='deals/%Y/%m/', null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True, null=True, help_text='External image CDN or backup URL')
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    percentage_off = models.PositiveIntegerField(null=True, blank=True, help_text='Discount percentage off')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='deals')
    source_name = models.CharField(max_length=100, help_text='E.g. Amazon, Best Buy, Nike')
    source_url = models.URLField(max_length=1000, help_text='Outbound link to retailer checkout/product page')
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.LIVE,
        db_index=True,
    )
    posted_at = models.DateTimeField(default=timezone.now, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-posted_at', '-id']
        indexes = [
            models.Index(fields=['status', '-posted_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['expires_at']),
        ]

    def save(self, *args, **kwargs):
        # Calculate discount percentage automatically if missing
        if self.original_price and self.discounted_price:
            if self.original_price > Decimal('0') and self.discounted_price < self.original_price:
                computed = round(((self.original_price - self.discounted_price) / self.original_price) * 100)
                if not self.percentage_off:
                    self.percentage_off = int(computed)

        # Flip status to expired if expires_at is past
        if self.expires_at and self.expires_at <= timezone.now() and self.status == self.Status.LIVE:
            self.status = self.Status.EXPIRED

        super().save(*args, **kwargs)

    @property
    def is_expired(self) -> bool:
        if self.status == self.Status.EXPIRED:
            return True
        if self.expires_at and self.expires_at <= timezone.now():
            return True
        return False

    @property
    def effective_image_url(self) -> str | None:
        if self.image:
            return self.image.url
        return self.image_url

    def __str__(self):
        return f"{self.title} ({self.source_name}) - {self.status}"
