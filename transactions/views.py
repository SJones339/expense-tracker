from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Transaction, Category, Account
from .serializers import (
    TransactionDetailSerializer, 
    TransactionListSerializer,
    TransactionCreateSerializer,
    CategorySerializer, 
    AccountSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['type']
    
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get categories grouped by type"""
        income_categories = self.get_queryset().filter(type='income')
        expense_categories = self.get_queryset().filter(type='expense')
        
        return Response({
            'income': CategorySerializer(income_categories, many=True, context={'request': request}).data,
            'expense': CategorySerializer(expense_categories, many=True, context={'request': request}).data,
        })

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['type', 'is_active']
    
    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def adjust_balance(self, request, pk=None):
        """Manually adjust account balance"""
        account = self.get_object()
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Manual adjustment')
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = float(amount)
            account.balance += amount
            account.save()
            
            # Create a transaction record for the adjustment
            adjustment_category = Category.objects.filter(
                user=request.user, 
                name='Balance Adjustment',
                type='income' if amount > 0 else 'expense'
            ).first()
            
            if not adjustment_category:
                adjustment_category = Category.objects.create(
                    name='Balance Adjustment',
                    type='income' if amount > 0 else 'expense',
                    color='#6B7280',
                    icon='settings',
                    user=request.user
                )
            
            Transaction.objects.create(
                amount=abs(amount),
                description=reason,
                type='income' if amount > 0 else 'expense',
                date=timezone.now(),
                category=adjustment_category,
                account=account,
                user=request.user,
                notes='Manual balance adjustment'
            )
            
            return Response({'message': 'Balance adjusted successfully', 'new_balance': account.balance})
        except ValueError:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['description', 'notes']
    filterset_fields = ['type', 'category__name', 'account__name']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TransactionListSerializer
        elif self.action == 'create':
            return TransactionCreateSerializer
        return TransactionDetailSerializer
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get transaction summary statistics"""
        queryset = self.get_queryset()
        
        # Current month data
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        current_month = queryset.filter(date__gte=start_of_month)
        
        # Calculate totals
        income_total = current_month.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense_total = current_month.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0
        
        # Top categories this month
        top_expense_categories = (
            current_month.filter(type='expense')
            .values('category__name', 'category__color')
            .annotate(total=Sum('amount'), count=Count('id'))
            .order_by('-total')[:5]
        )
        
        # Recent transactions
        recent_transactions = TransactionListSerializer(
            queryset[:10], 
            many=True, 
            context={'request': request}
        ).data
        
        return Response({
            'current_month': {
                'income': float(income_total),
                'expenses': float(expense_total),
                'net': float(income_total - expense_total),
                'transaction_count': current_month.count(),
            },
            'top_categories': list(top_expense_categories),
            'recent_transactions': recent_transactions,
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get detailed analytics data"""
        queryset = self.get_queryset()
        
        # Last 12 months data
        now = timezone.now()
        twelve_months_ago = now - timedelta(days=365)
        
        monthly_data = []
        for i in range(12):
            month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
            month_end = (month_start.replace(month=month_start.month % 12 + 1) - timedelta(days=1)) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
            
            month_transactions = queryset.filter(date__gte=month_start, date__lte=month_end)
            income = month_transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
            expenses = month_transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
            
            monthly_data.insert(0, {
                'month': month_start.strftime('%Y-%m'),
                'income': float(income),
                'expenses': float(expenses),
                'net': float(income - expenses)
            })
        
        # Category breakdown
        category_breakdown = (
            queryset.filter(type='expense')
            .values('category__name', 'category__color')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        
        return Response({
            'monthly_trends': monthly_data,
            'category_breakdown': list(category_breakdown),
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple transactions at once"""
        transactions_data = request.data.get('transactions', [])
        
        if not transactions_data:
            return Response({'error': 'No transactions provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_transactions = []
        errors = []
        
        for i, transaction_data in enumerate(transactions_data):
            serializer = TransactionCreateSerializer(data=transaction_data, context={'request': request})
            if serializer.is_valid():
                transaction = serializer.save()
                created_transactions.append(TransactionListSerializer(transaction, context={'request': request}).data)
            else:
                errors.append({'index': i, 'errors': serializer.errors})
        
        return Response({
            'created': created_transactions,
            'errors': errors,
            'success_count': len(created_transactions),
            'error_count': len(errors)
        }, status=status.HTTP_201_CREATED if created_transactions else status.HTTP_400_BAD_REQUEST)