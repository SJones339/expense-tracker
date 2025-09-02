# budgets/serializers.py
from rest_framework import serializers
from .models import BudgetBucket, Paycheck, Allocation

class BudgetBucketSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetBucket
        fields = ["id", "name", "monthly_target", "current_balance", "unallocated_balance","color", "created_at"]

class AllocationSerializer(serializers.ModelSerializer):
    bucket = BudgetBucketSerializer(read_only=True)
    bucket_id = serializers.PrimaryKeyRelatedField(
        queryset=BudgetBucket.objects.all(), source="bucket", write_only=True
    )
    class Meta:
        model = Allocation
        fields = ["id", "bucket", "bucket_id", "amount", "created_at"]

class PaycheckSerializer(serializers.ModelSerializer):
    allocations = AllocationSerializer(many=True, read_only=True)
    class Meta:
        model = Paycheck
        fields = ["id", "amount", "date", "memo", "allocations"]
