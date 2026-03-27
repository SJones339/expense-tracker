import os
from dotenv import load_dotenv
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid import Environment

# Load environment variables
load_dotenv()

# Test Plaid connection
def test_plaid_connection():
    try:
        configuration = Configuration(
            host=Environment.Sandbox if os.getenv('PLAID_ENV') == 'sandbox' else Environment.Production,
            api_key={
                'clientId': os.getenv('PLAID_CLIENT_ID'),
                'secret': os.getenv('PLAID_SECRET')
            }
        )
        client = plaid_api.PlaidApi(plaid_api.ApiClient(configuration))
        print("✅ Plaid connection successful!")
        return True
    except Exception as e:
        print(f"❌ Plaid connection failed: {e}")
        return False

if __name__ == "__main__":
    test_plaid_connection()