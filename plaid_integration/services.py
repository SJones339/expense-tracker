import os
from datetime import date
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid import Environment
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from dotenv import load_dotenv

load_dotenv()

class PlaidService:
    def __init__(self):
        # Map environment string to Plaid Environment enum
        env = os.getenv('PLAID_ENV', 'sandbox').lower()
        if env == 'sandbox':
            plaid_host = Environment.Sandbox
        elif env == 'development':
            plaid_host = Environment.Development
        else:  # production
            plaid_host = Environment.Production
        
        configuration = Configuration(
            host=plaid_host,
            api_key={
                'clientId': os.getenv('PLAID_CLIENT_ID'),
                'secret': os.getenv('PLAID_SECRET')
            }
        )
        self.client = plaid_api.PlaidApi(plaid_api.ApiClient(configuration))
    
    def create_link_token(self, user_id):
        """Create a link token for Plaid Link frontend"""
        request = LinkTokenCreateRequest(
            products=[Products('transactions'), Products('auth'), Products('identity')],
            client_name="Expense Tracker",
            country_codes=[CountryCode('US')],
            language='en',
            user=LinkTokenCreateRequestUser(client_user_id=str(user_id))
        )
        response = self.client.link_token_create(request)
        # Plaid SDK v9 returns response objects with attributes
        return response['link_token'] if isinstance(response, dict) else response.link_token
    
    def exchange_public_token(self, public_token):
        """Exchange public token for access token"""
        request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = self.client.item_public_token_exchange(request)
        # Plaid SDK v9 returns response objects with attributes
        return response['access_token'] if isinstance(response, dict) else response.access_token
    
    def get_accounts(self, access_token):
        """Get all accounts for an access token"""
        request = AccountsGetRequest(access_token=access_token)
        response = self.client.accounts_get(request)
        # Plaid SDK v9 returns response objects with attributes
        return response['accounts'] if isinstance(response, dict) else response.accounts
    
    def get_transactions(self, access_token, start_date, end_date):
        """Get transactions for date range
        Args:
            access_token: Plaid access token
            start_date: date object or string in YYYY-MM-DD format
            end_date: date object or string in YYYY-MM-DD format
        """
        # Convert strings to date objects if needed
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)
        if isinstance(end_date, str):
            end_date = date.fromisoformat(end_date)
        
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date,
            end_date=end_date
        )
        response = self.client.transactions_get(request)
        # Plaid SDK v9 returns response objects with attributes
        return response['transactions'] if isinstance(response, dict) else response.transactions