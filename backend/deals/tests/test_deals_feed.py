from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from deals.models import Category, Deal

class DealsFeedTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test categories
        self.cat_electronics = Category.objects.create(name='Electronics', slug='electronics')
        self.cat_audio = Category.objects.create(name='Audio', slug='audio')
        self.cat_gaming = Category.objects.create(name='Gaming', slug='gaming')

        now = timezone.now()

        # Create a series of live deals
        for i in range(1, 15):
            Deal.objects.create(
                title=f'Live Deal {i} - Mechanical Keyboard' if i == 3 else f'Live Deal {i}',
                short_description=f'Description for live deal {i}',
                original_price=Decimal('100.00'),
                discounted_price=Decimal('80.00'),
                percentage_off=20,
                category=self.cat_audio if i % 2 == 0 else self.cat_electronics,
                source_name='Amazon',
                source_url=f'https://amazon.com/deal-{i}',
                status=Deal.Status.LIVE,
                posted_at=now - timedelta(minutes=i * 10),
                expires_at=now + timedelta(days=5),
            )

        # Create expired deal by status
        self.expired_by_status = Deal.objects.create(
            title='Expired Deal Status',
            short_description='This deal status is expired',
            original_price=Decimal('50.00'),
            discounted_price=Decimal('25.00'),
            category=self.cat_electronics,
            source_name='Best Buy',
            source_url='https://bestbuy.com/expired1',
            status=Deal.Status.EXPIRED,
            posted_at=now - timedelta(days=2),
            expires_at=now + timedelta(days=1),
        )

        # Create expired deal by past expiry timestamp
        self.expired_by_time = Deal.objects.create(
            title='Expired Deal Timestamp',
            short_description='This deal timestamp is in past',
            original_price=Decimal('70.00'),
            discounted_price=Decimal('35.00'),
            category=self.cat_audio,
            source_name='Target',
            source_url='https://target.com/expired2',
            status=Deal.Status.LIVE,
            posted_at=now - timedelta(days=5),
            expires_at=now - timedelta(hours=2), # Expired 2 hours ago
        )

        # Create draft deal
        self.draft_deal = Deal.objects.create(
            title='Admin Draft Deal',
            short_description='Draft not yet approved for public viewing',
            original_price=Decimal('200.00'),
            discounted_price=Decimal('150.00'),
            category=self.cat_gaming,
            source_name='GameStop',
            source_url='https://gamestop.com/draft',
            status=Deal.Status.DRAFT,
            posted_at=now - timedelta(minutes=5),
        )

    def test_cursor_pagination(self):
        """
        Verify cursor-based pagination works correctly without item duplication.
        """
        url = reverse('deal-list')
        response = self.client.get(url, {'limit': 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)
        self.assertIn('next', response.data)
        self.assertEqual(len(response.data['items']), 5)
        self.assertTrue(response.data['has_more'])

        page1_ids = {item['id'] for item in response.data['items']}
        next_url = response.data['next']
        self.assertIsNotNone(next_url)

        # Fetch page 2 using the next cursor link
        response_page2 = self.client.get(next_url)
        self.assertEqual(response_page2.status_code, status.HTTP_200_OK)
        page2_ids = {item['id'] for item in response_page2.data['items']}

        # Verify no overlapping items across cursor pages
        self.assertEqual(len(page1_ids.intersection(page2_ids)), 0)

    def test_category_filter(self):
        """
        Verify filtering by category slug returns only deals in that category.
        """
        url = reverse('deal-list')
        response = self.client.get(url, {'category': 'audio', 'limit': 20})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = response.data['items']
        self.assertGreater(len(items), 0)

        for item in items:
            self.assertEqual(item['category']['slug'], 'audio')

    def test_search_filter(self):
        """
        Verify search matches across deal title or short_description.
        """
        url = reverse('deal-list')
        response = self.client.get(url, {'q': 'Keyboard'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = response.data['items']
        self.assertEqual(len(items), 1)
        self.assertIn('Mechanical Keyboard', items[0]['title'])

    def test_expired_and_draft_deals_exclusion(self):
        """
        Verify expired deals and drafts are completely excluded from the public feed.
        """
        url = reverse('deal-list')
        response = self.client.get(url, {'limit': 50})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = response.data['items']
        feed_ids = [item['id'] for item in items]

        # Must not contain expired by status
        self.assertNotIn(self.expired_by_status.id, feed_ids)
        # Must not contain expired by timestamp
        self.assertNotIn(self.expired_by_time.id, feed_ids)
        # Must not contain draft
        self.assertNotIn(self.draft_deal.id, feed_ids)

        # All returned items must have status 'live'
        for item in items:
            self.assertEqual(item['status'], 'live')

    def test_percentage_off_auto_calculation(self):
        """
        Verify percentage_off is automatically calculated when prices are provided.
        """
        deal = Deal.objects.create(
            title='Auto Calc Discount Deal',
            short_description='Tests automatic discount percent computation',
            original_price=Decimal('200.00'),
            discounted_price=Decimal('100.00'),
            category=self.cat_electronics,
            source_name='Amazon',
            source_url='https://amazon.com/autocalc',
        )
        self.assertEqual(deal.percentage_off, 50)
