from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import PlaidService
from .models import PlaidAccount, PlaidTransaction
from transactions.models import Transaction, Category, Account
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .serializers import PlaidAccountSerializer

def get_or_create_plaid_account(plaid_account, user):
    """Get or create an Account model for a PlaidAccount"""
    # Try to find existing account by name
    account, created = Account.objects.get_or_create(
        name=f"{plaid_account.institution_name} - {plaid_account.account_name}",
        user=user,
        defaults={
            'type': 'checking' if 'checking' in plaid_account.account_type.lower() else 
                    'savings' if 'savings' in plaid_account.account_type.lower() else
                    'credit' if 'credit' in plaid_account.account_type.lower() else 'checking',
            'balance': plaid_account.current_balance,
            'currency': 'USD',
            'description': f"Synced from Plaid - {plaid_account.institution_name}",
        }
    )
    
    # Update balance if account already existed
    if not created:
        account.balance = plaid_account.current_balance
        account.save()
    
    return account

def map_plaid_category_to_user_category(plaid_categories, user, transaction_type):
    """Map Plaid category array to user's Category model"""
    if not plaid_categories:
        plaid_categories = []
    
    # Plaid category mapping (first item is usually the primary category)
    plaid_category_name = plaid_categories[0] if plaid_categories else "Other"
    
    # Map common Plaid categories to our categories
    category_mapping = {
        'Food and Drink': ('Food & Dining', 'expense'),
        'Restaurants': ('Food & Dining', 'expense'),
        'Transportation': ('Transportation', 'expense'),
        'Travel': ('Transportation', 'expense'),
        'Shops': ('Shopping', 'expense'),
        'General Merchandise': ('Shopping', 'expense'),
        'Entertainment': ('Entertainment', 'expense'),
        'Recreation': ('Entertainment', 'expense'),
        'Service': ('Bills & Utilities', 'expense'),
        'Gas Stations': ('Transportation', 'expense'),
        'Healthcare': ('Healthcare', 'expense'),
        'Medical': ('Healthcare', 'expense'),
        'Deposit': ('Salary', 'income'),
        'Payroll': ('Salary', 'income'),
        'Interest': ('Investment', 'income'),
    }
    
    # Try to find mapped category
    mapped_name, mapped_type = category_mapping.get(plaid_category_name, (None, transaction_type))
    
    # Use mapped name or try to find by Plaid category name
    category_name = mapped_name or plaid_category_name
    
    # Get or create category
    category, _ = Category.objects.get_or_create(
        name=category_name,
        user=user,
        type=transaction_type,
        defaults={
            'color': '#6B7280',
            'icon': 'circle',
            'is_default': False
        }
    )
    
    return category

def convert_plaid_transaction_to_transaction(plaid_tx, user, original_amount=None):
    """Convert a PlaidTransaction to a Transaction model
    Args:
        plaid_tx: PlaidTransaction instance
        user: User instance
        original_amount: Original amount from Plaid (negative for expenses, positive for income)
    """
    # Skip if already processed
    if plaid_tx.processed:
        return None
    
    # Get or create account for this Plaid account
    account = get_or_create_plaid_account(plaid_tx.plaid_account, user)
    
    # Determine transaction type
    # Plaid returns negative amounts for expenses, positive for income
    # If we have original_amount, use it directly
    # Otherwise, use category and merchant name heuristics
    plaid_categories = plaid_tx.category if isinstance(plaid_tx.category, list) else []
    category_str = ' '.join([str(c).lower() for c in plaid_categories])
    merchant_lower = (plaid_tx.merchant_name or '').lower()
    
    if original_amount is not None:
        # Plaid returns negative for expenses, positive for income
        transaction_type = 'income' if original_amount > 0 else 'expense'
    else:
        # Use heuristics: check for income indicators
        income_indicators = [
            'deposit', 'payroll', 'interest', 'dividend', 'salary', 
            'income', 'credit', 'refund', 'reimbursement'
        ]
        is_income = (
            any(indicator in category_str for indicator in income_indicators) or
            any(indicator in merchant_lower for indicator in income_indicators)
        )
        transaction_type = 'income' if is_income else 'expense'
    
    # Get or create category
    category = map_plaid_category_to_user_category(plaid_categories, user, transaction_type)
    
    # Create description from merchant name
    description = plaid_tx.merchant_name or 'Plaid Transaction'
    if not description or description.strip() == '':
        description = f"Transaction from {plaid_tx.plaid_account.institution_name}"
    
    # Convert date to datetime (Transaction model uses DateTimeField)
    # Use timezone-aware datetime
    from django.utils import timezone as tz
    transaction_date = tz.make_aware(datetime.combine(plaid_tx.date, datetime.min.time()))
    
    # Create Transaction
    transaction = Transaction.objects.create(
        amount=plaid_tx.amount,
        description=description,
        type=transaction_type,
        date=transaction_date,
        category=category,
        account=account,
        user=user,
        notes=f"Imported from Plaid - {plaid_tx.plaid_account.institution_name}" if not plaid_tx.pending else f"Pending - Imported from Plaid"
    )
    
    # Mark as processed
    plaid_tx.processed = True
    plaid_tx.save()
    
    return transaction

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_plaid_accounts(request):
    """Get all Plaid accounts for the authenticated user"""
    try:
        accounts = PlaidAccount.objects.filter(user=request.user, is_active=True)
        serializer = PlaidAccountSerializer(accounts, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_link_token(request):
    """Create Plaid Link token for frontend"""
    try:
        plaid_service = PlaidService()
        link_token = plaid_service.create_link_token(request.user.id)
        return Response({'link_token': link_token})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_token(request):
    """Exchange public token for access token and save accounts"""
    try:
        public_token = request.data.get('public_token')
        institution_name = request.data.get('institution_name', 'Unknown Bank')
        
        if not public_token:
            return Response({'error': 'public_token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        plaid_service = PlaidService()
        access_token = plaid_service.exchange_public_token(public_token)
        accounts = plaid_service.get_accounts(access_token)
        
        # Save accounts to database (update if exists, create if new)
        saved_count = 0
        for account_data in accounts:
            # Handle both dict and object responses from Plaid SDK
            account_id = account_data['account_id'] if isinstance(account_data, dict) else account_data.account_id
            account_name = account_data['name'] if isinstance(account_data, dict) else account_data.name
            account_type = account_data['type'] if isinstance(account_data, dict) else account_data.type
            balances = account_data['balances'] if isinstance(account_data, dict) else account_data.balances
            current_balance = balances['current'] if isinstance(balances, dict) else balances.current
            available_balance = balances.get('available') if isinstance(balances, dict) else getattr(balances, 'available', None)
            
            PlaidAccount.objects.update_or_create(
                account_id=account_id,
                user=request.user,
                defaults={
                    'institution_name': institution_name,
                    'account_name': account_name,
                    'account_type': account_type,
                    'current_balance': current_balance,
                    'available_balance': available_balance,
                    'access_token': access_token,
                    'is_active': True
                }
            )
            saved_count += 1
        
        return Response({
            'success': True, 
            'accounts_count': saved_count,
            'message': f'Successfully linked {saved_count} account(s)'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def disconnect_account(request, account_id):
    """Disconnect a Plaid account (set is_active=False)"""
    try:
        plaid_account = PlaidAccount.objects.get(id=account_id, user=request.user)
        plaid_account.is_active = False
        plaid_account.save()
        
        return Response({
            'success': True,
            'message': 'Account disconnected successfully'
        })
    except PlaidAccount.DoesNotExist:
        return Response({
            'error': 'Account not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_transactions(request):
    """Manual sync - fetch transactions from Plaid"""
    try:
        # Get all active Plaid accounts for this user
        plaid_accounts = PlaidAccount.objects.filter(user=request.user, is_active=True)
        
        if not plaid_accounts.exists():
            return Response({
                'error': 'No linked accounts found. Please link a bank account first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        plaid_service = PlaidService()
        
        # Get transactions from last 30 days (or custom range if provided)
        # For sandbox, use a wider date range to catch test transactions
        days = request.data.get('days', 730)  # Default to 2 years for sandbox
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        total_new = 0
        total_updated = 0
        
        for plaid_account in plaid_accounts:
            # Skip accounts without access tokens
            if not plaid_account.access_token:
                continue
                
            try:
                # Fetch transactions from Plaid (pass date objects directly)
                transactions = plaid_service.get_transactions(
                    plaid_account.access_token,
                    start_date,
                    end_date
                )
                
                # Process each transaction
                for tx_data in transactions:
                    # Handle both dict and object responses
                    tx_id = tx_data['transaction_id'] if isinstance(tx_data, dict) else tx_data.transaction_id
                    amount = tx_data['amount'] if isinstance(tx_data, dict) else tx_data.amount
                    tx_date = tx_data['date'] if isinstance(tx_data, dict) else tx_data.date
                    merchant = tx_data.get('merchant_name', '') if isinstance(tx_data, dict) else getattr(tx_data, 'merchant_name', '')
                    category = tx_data.get('category', []) if isinstance(tx_data, dict) else getattr(tx_data, 'category', [])
                    pending = tx_data.get('pending', False) if isinstance(tx_data, dict) else getattr(tx_data, 'pending', False)
                    
                    # Convert date string to date object if needed
                    if isinstance(tx_date, str):
                        from datetime import datetime as dt
                        tx_date = dt.strptime(tx_date, '%Y-%m-%d').date()
                    
                    # Store original amount to determine transaction type
                    # Plaid returns negative for expenses, positive for income
                    original_amount = Decimal(str(amount))
                    is_expense = original_amount < 0
                    
                    # Create or update PlaidTransaction
                    plaid_tx, created = PlaidTransaction.objects.update_or_create(
                        transaction_id=tx_id,
                        user=request.user,
                        defaults={
                            'plaid_account': plaid_account,
                            'amount': abs(original_amount),  # Store absolute value
                            'date': tx_date,
                            'merchant_name': merchant or '',
                            'category': category if isinstance(category, list) else list(category) if category else [],
                            'pending': pending,
                            'processed': False  # Not yet converted to Transaction model
                        }
                    )
                    
                    if created:
                        total_new += 1
                    else:
                        total_updated += 1
                    
                    # Convert to Transaction if not already processed and not pending
                    if not plaid_tx.processed and not pending:
                        try:
                            convert_plaid_transaction_to_transaction(plaid_tx, request.user, original_amount)
                        except Exception as e:
                            print(f"Error converting transaction {tx_id}: {str(e)}")
                            # Continue processing other transactions
                            continue
                
                # Update last_synced timestamp
                plaid_account.last_synced = timezone.now()
                plaid_account.save()
                
            except Exception as e:
                # Log error but continue with other accounts
                print(f"Error syncing account {plaid_account.account_id}: {str(e)}")
                continue
        
        return Response({
            'success': True,
            'message': f'Synced transactions from {plaid_accounts.count()} account(s)',
            'new_transactions': total_new,
            'updated_transactions': total_updated,
            'total_processed': total_new + total_updated
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_plaid_transactions(request):
    """Convert unprocessed PlaidTransactions to Transaction model"""
    try:
        # Get all unprocessed PlaidTransactions for this user
        unprocessed = PlaidTransaction.objects.filter(
            user=request.user,
            processed=False,
            pending=False
        )
        
        converted_count = 0
        errors = []
        
        for plaid_tx in unprocessed:
            try:
                # We don't have original amount, so use category heuristics
                convert_plaid_transaction_to_transaction(plaid_tx, request.user, original_amount=None)
                converted_count += 1
            except Exception as e:
                errors.append(f"Transaction {plaid_tx.transaction_id}: {str(e)}")
                continue
        
        return Response({
            'success': True,
            'message': f'Converted {converted_count} transaction(s)',
            'converted_count': converted_count,
            'errors': errors if errors else None
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)