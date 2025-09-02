# Create your models here.
# budgets/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class BudgetBucket(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=64)
    monthly_target = models.DecimalField(max_digits=12, decimal_places=2)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unallocated_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    color = models.CharField(max_length=16, default="#3b82f6")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user})"

class Paycheck(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    memo = models.CharField(max_length=128, blank=True)

class Allocation(models.Model):
    """
    One paycheck can allocate to many buckets.
    """
    paycheck = models.ForeignKey(Paycheck, on_delete=models.CASCADE, related_name="allocations")
    bucket = models.ForeignKey(BudgetBucket, on_delete=models.CASCADE, related_name="allocations")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
