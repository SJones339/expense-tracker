from django.shortcuts import render

# Create your views here.
# budgets/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import BudgetBucket, Paycheck, Allocation
from .serializers import BudgetBucketSerializer, PaycheckSerializer, AllocationSerializer

class BucketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BudgetBucketSerializer

    def get_queryset(self):
        return BudgetBucket.objects.filter(user=self.request.user).order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=["get"])
    def income_transactions(self, request):
        """Get all income transactions from the transactions app"""
        from transactions.models import Transaction
        from transactions.serializers import TransactionListSerializer
        
        # Get income transactions (filter by type='income')
        income_transactions = Transaction.objects.filter(
            user=request.user,
            type='income'
        ).order_by('-date')
        
        serializer = TransactionListSerializer(income_transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["post"])
    def allocate_money(self, request, pk=None):
        """
        Add or remove money from a specific bucket
        Body: { amount: number, transaction_type: "add" or "remove" }
        """
        bucket = self.get_object()
        amount = request.data.get("amount", 0)
        transaction_type = request.data.get("transaction_type", "add")
        
        if not amount or amount <= 0:
            return Response({"error": "Amount must be positive"}, status=status.HTTP_400_BAD_REQUEST)
        
        if transaction_type not in ["add", "remove"]:
            return Response({"error": "Transaction type must be 'add' or 'remove'"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if removing more than available
        if transaction_type == "remove" and amount > bucket.current_balance:
            return Response({"error": "Cannot remove more than current balance"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update bucket balance
        if transaction_type == "add":
            bucket.current_balance += amount
        else:
            bucket.current_balance -= amount
        
        bucket.save()
        
        return Response({
            "success": True,
            "new_balance": bucket.current_balance,
            "message": f"Successfully added ${amount} to {bucket.name}" if transaction_type == "add" else f"Successfully removed ${amount} from {bucket.name}"
        })

    @action(detail=True, methods=["delete"])
    def delete_bucket(self, request, pk=None):
        """
        Delete a specific bucket and return any money to unallocated
        """
        bucket = self.get_object()
        bucket_name = bucket.name
        money_in_bucket = bucket.current_balance
        
        # Delete the bucket (this will automatically handle the money)
        bucket.delete()
        
        # Create a message based on whether there was money in the bucket
        if money_in_bucket > 0:
            message = f"Bucket '{bucket_name}' deleted successfully. ${money_in_bucket} returned to unallocated money."
        else:
            message = f"Bucket '{bucket_name}' deleted successfully."
        
        return Response({
            "success": True,
            "message": message,
            "money_returned": float(money_in_bucket)
        })

class PaycheckViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaycheckSerializer

    def get_queryset(self):
        return Paycheck.objects.filter(user=self.request.user).order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def allocate(self, request, pk=None):
        """
        Body: { allocations: [{bucket_id, amount}, ...] }
        Updates bucket current_balance and creates Allocation rows.
        """
        paycheck = self.get_object()
        allocations = request.data.get("allocations", [])
        total = 0
        created = []

        for row in allocations:
            bucket_id = row.get("bucket_id")
            amount = row.get("amount", 0)
            if amount <= 0: 
                continue
            total += float(amount)

        if total > float(paycheck.amount):
            return Response({"detail": "Allocations exceed paycheck amount"},
                            status=status.HTTP_400_BAD_REQUEST)

        for row in allocations:
            bucket = BudgetBucket.objects.get(id=row["bucket_id"], user=request.user)
            amt = row["amount"]
            Allocation.objects.create(paycheck=paycheck, bucket=bucket, amount=amt)
            bucket.current_balance = (bucket.current_balance or 0) + amt
            bucket.save(update_fields=["current_balance"])
            created.append({"bucket_id": bucket.id, "amount": amt})

        return Response({"ok": True, "applied": created})
