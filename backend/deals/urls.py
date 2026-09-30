from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, DealViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'deals', DealViewSet, basename='deal')

urlpatterns = [
    path('', include(router.urls)),
]
