# transactions/serializers.py

from rest_framework import serializers
from .models import Transaction, Category, Account
from django.utils import timezone

class CategorySerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'color', 'icon', 'is_default', 'transaction_count', 'created_at']
        read_only_fields = ['id', 'is_default', 'created_at', 'transaction_count']
    
    def get_transaction_count(self, obj):
        return obj.transactions.filter(user=self.context['request'].user).count()
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class AccountSerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Account
        fields = ['id', 'name', 'type', 'balance', 'is_active', 'transaction_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at', 'transaction_count']
    
    def get_transaction_count(self, obj):
        return obj.transactions.filter(user=self.context['request'].user).count()
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TransactionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for transaction lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'description', 'type', 'date', 
            'category_name', 'category_color', 'account_name',
            'created_at'
        ]

class TransactionDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    account = AccountSerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    account_id = serializers.IntegerField(write_only=True)
    transfer_to_account_name = serializers.CharField(source='transfer_to_account.name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'description', 'type', 'date', 
            'category', 'category_id', 'account', 'account_id',
            'notes', 'receipt_image', 'tags',
            'transfer_to_account', 'transfer_to_account_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        user = self.context['request'].user
        
        # Validate category belongs to user and type matches
        category_id = data.get('category_id')
        if category_id:
            try:
                category = Category.objects.get(id=category_id, user=user)
                if data.get('type') != 'transfer' and category.type != data.get('type'):
                    raise serializers.ValidationError(
                        f"Category type '{category.type}' doesn't match transaction type '{data.get('type')}'"
                    )
            except Category.DoesNotExist:
                raise serializers.ValidationError("Category not found or doesn't belong to user")
        
        # Validate account belongs to user
        account_id = data.get('account_id')
        if account_id:
            if not Account.objects.filter(id=account_id, user=user).exists():
                raise serializers.ValidationError("Account not found or doesn't belong to user")
        
        # Validate transfer account if it's a transfer
        if data.get('type') == 'transfer':
            transfer_to_account = data.get('transfer_to_account')
            if not transfer_to_account:
                raise serializers.ValidationError("Transfer transactions require a destination account")
            if not Account.objects.filter(id=transfer_to_account.id, user=user).exists():
                raise serializers.ValidationError("Transfer destination account not found or doesn't belong to user")
        
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        category_id = validated_data.pop('category_id')
        account_id = validated_data.pop('account_id')
        
        validated_data['category'] = Category.objects.get(id=category_id)
        validated_data['account'] = Account.objects.get(id=account_id)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle category and account updates
        if 'category_id' in validated_data:
            category_id = validated_data.pop('category_id')
            instance.category = Category.objects.get(id=category_id)
        
        if 'account_id' in validated_data:
            account_id = validated_data.pop('account_id')
            instance.account = Account.objects.get(id=account_id)
        
        return super().update(instance, validated_data)

class TransactionCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating transactions quickly"""
    
    class Meta:
        model = Transaction
        fields = ['amount', 'description', 'type', 'date', 'category_id', 'account_id', 'notes']
    
    category_id = serializers.IntegerField()
    account_id = serializers.IntegerField()
    
    def validate(self, data):
        user = self.context['request'].user
        
        # Validate category
        try:
            category = Category.objects.get(id=data['category_id'], user=user)
            if data['type'] != 'transfer' and category.type != data['type']:
                raise serializers.ValidationError("Category type doesn't match transaction type")
        except Category.DoesNotExist:
            raise serializers.ValidationError("Invalid category")
        
        # Validate account
        if not Account.objects.filter(id=data['account_id'], user=user).exists():
            raise serializers.ValidationError("Invalid account")
        
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        category_id = validated_data.pop('category_id')
        account_id = validated_data.pop('account_id')
        
        validated_data['category'] = Category.objects.get(id=category_id)
        validated_data['account'] = Account.objects.get(id=account_id)
        
        return super().create(validated_data)