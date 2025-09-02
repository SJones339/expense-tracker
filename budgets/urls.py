# budgets/urls.py
from rest_framework.routers import DefaultRouter
from .views import BucketViewSet, PaycheckViewSet

router = DefaultRouter()
router.register(r"buckets", BucketViewSet, basename="bucket")
router.register(r"paychecks", PaycheckViewSet, basename="paycheck")
urlpatterns = router.urls
