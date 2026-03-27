from rest_framework import serializers
from .models import PlaidAccount, PlaidTransaction

class PlaidAccountSerializer(serializers.ModelSerializer):
    """Serializer for PlaidAccount - excludes access_token for security"""
    
    class Meta:
        model = PlaidAccount
        fields = [
            'id', 'account_id', 'institution_name', 'account_name', 
            'account_type', 'current_balance', 'available_balance',
            'is_active', 'created_at', 'last_synced'
        ]
        read_only_fields = [
            'id', 'account_id', 'created_at', 'last_synced'
        ]

