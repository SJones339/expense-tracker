from django.db import models
from django.conf import settings

class PlaidAccount(models.Model):
    """Cached bank account data from Plaid"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    account_id = models.CharField(max_length=255, unique=True)  # Plaid's unique ID
    institution_name = models.CharField(max_length=255)  # Bank name (e.g., "Chase")
    account_name = models.CharField(max_length=255)  # User-friendly name
    account_type = models.CharField(max_length=50)  # checking, savings, etc.
    current_balance = models.DecimalField(max_digits=12, decimal_places=2)
    available_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    access_token = models.CharField(max_length=500, null=True, blank=True)  # Plaid access token (should be encrypted in production)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_synced = models.DateTimeField(auto_now=True)

class PlaidTransaction(models.Model):
    """Cached transaction data from Plaid"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plaid_account = models.ForeignKey(PlaidAccount, on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=255, unique=True)  # Plaid's unique ID
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    merchant_name = models.CharField(max_length=255, blank=True)
    category = models.JSONField(default=list)  # Plaid categories array
    pending = models.BooleanField(default=False)
    processed = models.BooleanField(default=False)  # Whether we've created a Transaction
    created_at = models.DateTimeField(auto_now_add=True)