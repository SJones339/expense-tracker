from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()

class Category(models.Model):
    CATEGORY_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    icon = models.CharField(max_length=50, default='circle')  # Icon name
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    is_default = models.BooleanField(default=False)  # For system default categories
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['name', 'user', 'type']
        ordering = ['type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class Account(models.Model):
    ACCOUNT_TYPES = [
        ('checking', 'Checking Account'),
        ('savings', 'Savings Account'),
        ('credit', 'Credit Card'),
        ('cash', 'Cash'),
        ('investment', 'Investment Account'),
    ]
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['name', 'user']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - ${self.balance}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
    ]
    
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    description = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    date = models.DateTimeField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    
    # Optional fields for advanced features
    notes = models.TextField(blank=True, null=True)
    receipt_image = models.ImageField(upload_to='receipts/', blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    
    # Transfer specific fields
    transfer_to_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_in')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'category']),
        ]
    
    def save(self, *args, **kwargs):
        # Ensure category type matches transaction type
        if self.category and self.category.type != self.type and self.type != 'transfer':
            raise ValueError(f"Category type '{self.category.type}' doesn't match transaction type '{self.type}'")
        
        super().save(*args, **kwargs)
        
        # Update account balance
        self.update_account_balance()
    
    def update_account_balance(self):
        """Update the account balance based on transaction type"""
        if self.type == 'income':
            self.account.balance += self.amount
        elif self.type == 'expense':
            self.account.balance -= self.amount
        elif self.type == 'transfer' and self.transfer_to_account:
            self.account.balance -= self.amount
            self.transfer_to_account.balance += self.amount
            self.transfer_to_account.save()
        
        self.account.save()
    
    def __str__(self):
        return f"{self.get_type_display()}: ${self.amount} - {self.description}"


# Create default categories for new users
def create_default_categories(user):
    """Create default categories for a new user"""
    default_expense_categories = [
        ('Food & Dining', '#EF4444', 'utensils'),
        ('Transportation', '#3B82F6', 'car'),
        ('Shopping', '#8B5CF6', 'shopping-bag'),
        ('Entertainment', '#F59E0B', 'film'),
        ('Bills & Utilities', '#10B981', 'zap'),
        ('Healthcare', '#F97316', 'heart'),
        ('Other', '#6B7280', 'more-horizontal'),
    ]
    
    default_income_categories = [
        ('Salary', '#059669', 'briefcase'),
        ('Freelance', '#DC2626', 'laptop'),
        ('Investment', '#7C3AED', 'trending-up'),
        ('Other Income', '#6B7280', 'plus-circle'),
    ]
    
    # Create expense categories
    for name, color, icon in default_expense_categories:
        Category.objects.get_or_create(
            name=name,
            user=user,
            type='expense',
            defaults={'color': color, 'icon': icon, 'is_default': True}
        )
    
    # Create income categories
    for name, color, icon in default_income_categories:
        Category.objects.get_or_create(
            name=name,
            user=user,
            type='income',
            defaults={'color': color, 'icon': icon, 'is_default': True}
        )


# Signal to create default categories when user is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_defaults(sender, instance, created, **kwargs):
    if created:
        create_default_categories(instance)