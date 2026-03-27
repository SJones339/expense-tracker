import React, { useState, useEffect } from 'react';
import PlaidLink from '../components/PlaidLink';
import Cookies from 'js-cookie';

// PlaidIntegration page - main page for managing Plaid bank connections
// This page allows users to connect their bank accounts via Plaid
const PlaidIntegration = () => {
  // State to track if Plaid Link modal should be shown
  const [showPlaidLink, setShowPlaidLink] = useState(false);
  
  // State to store connected Plaid accounts
  const [plaidAccounts, setPlaidAccounts] = useState([]);
  
  // Loading state for fetching accounts
  const [loading, setLoading] = useState(true);
  
  // State for sync operation
  const [syncing, setSyncing] = useState(false);
  
  // State for convert operation
  const [converting, setConverting] = useState(false);
  
  // Success/error messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch connected Plaid accounts when component mounts
  // This shows all bank accounts the user has connected via Plaid
  useEffect(() => {
    fetchPlaidAccounts();
  }, []);

  // Function to fetch all connected Plaid accounts from backend
  const fetchPlaidAccounts = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('access_token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Note: We'll need to create a GET endpoint for this
      // For now, we'll use a workaround or create the endpoint
      // Let's check if there's an endpoint first
      const response = await fetch('http://localhost:8000/api/plaid/accounts/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaidAccounts(data);
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet, that's okay
        setPlaidAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching Plaid accounts:', error);
      setPlaidAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Callback when Plaid Link successfully connects an account
  const handlePlaidSuccess = (data) => {
    setMessage({
      type: 'success',
      text: `Successfully connected ${data.accounts_count} account(s)!`,
    });
    setShowPlaidLink(false);
    // Refresh the accounts list
    fetchPlaidAccounts();
    
    // Clear message after 5 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Callback when user exits Plaid Link
  const handlePlaidExit = (err, metadata) => {
    setShowPlaidLink(false);
    if (err) {
      setMessage({
        type: 'error',
        text: err.error_message || 'Connection cancelled',
      });
    }
  };

  // Function to disconnect a Plaid account
  const handleDisconnectAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to disconnect this account? You can reconnect it later.')) {
      return;
    }

    try {
      const token = Cookies.get('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`http://localhost:8000/api/plaid/accounts/${accountId}/disconnect/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect account');
      }

      setMessage({
        type: 'success',
        text: 'Account disconnected successfully',
      });

      // Refresh the accounts list
      fetchPlaidAccounts();

      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to disconnect account',
      });
    }
  };

  // Function to convert Plaid transactions to app transactions
  const handleConvertTransactions = async () => {
    try {
      setConverting(true);
      setMessage({ type: '', text: '' });
      
      const token = Cookies.get('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8000/api/plaid/convert-transactions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert transactions');
      }

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `Successfully converted ${data.converted_count} transaction(s) to your account!`,
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to convert transactions',
      });
    } finally {
      setConverting(false);
    }
  };

  // Function to sync transactions from Plaid
  const handleSyncTransactions = async () => {
    try {
      setSyncing(true);
      setMessage({ type: '', text: '' });
      
      const token = Cookies.get('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Call the sync endpoint to fetch latest transactions
      // Use 730 days (2 years) for sandbox to catch test transactions
      const response = await fetch('http://localhost:8000/api/plaid/sync-transactions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 730 }), // 2 years for sandbox test data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync transactions');
      }

      const data = await response.json();
      
      // After syncing, automatically convert transactions
      const convertResponse = await fetch('http://localhost:8000/api/plaid/convert-transactions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (convertResponse.ok) {
        const convertData = await convertResponse.json();
        setMessage({
          type: 'success',
          text: `Synced ${data.new_transactions} new transactions and converted ${convertData.converted_count || 0} to your account!`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Synced ${data.new_transactions} new transactions! (Note: Some may need manual conversion)`,
        });
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to sync transactions',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Account Integration</h1>
        <p className="text-gray-600">
          Connect your bank accounts securely via Plaid to automatically import transactions
        </p>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Connect Bank Account Button */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Bank Account</h2>
        <p className="text-gray-600 mb-4">
          Securely connect your bank account using Plaid. Your credentials are never stored.
        </p>
        <button
          onClick={() => setShowPlaidLink(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors font-medium"
        >
          Connect Bank Account
        </button>
      </div>

      {/* Plaid Link Component - Opens when showPlaidLink is true */}
      {showPlaidLink && (
        <PlaidLink onSuccess={handlePlaidSuccess} onExit={handlePlaidExit} />
      )}

      {/* Connected Accounts Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
          <div className="flex gap-2">
            <button
              onClick={handleConvertTransactions}
              disabled={converting || plaidAccounts.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors text-sm"
              title="Convert synced Plaid transactions to your account"
            >
              {converting ? 'Converting...' : 'Convert Transactions'}
            </button>
            <button
              onClick={handleSyncTransactions}
              disabled={syncing || plaidAccounts.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              {syncing ? 'Syncing...' : 'Sync Transactions'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading accounts...</div>
        ) : plaidAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No connected accounts. Connect a bank account to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {plaidAccounts.map((account) => (
              <div
                key={account.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{account.account_name}</h3>
                    <p className="text-sm text-gray-600">{account.institution_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {account.account_type} • Last synced:{' '}
                      {new Date(account.last_synced).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(account.current_balance).toFixed(2)}
                      </p>
                      {account.available_balance && (
                        <p className="text-sm text-gray-600">
                          Available: ${parseFloat(account.available_balance).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDisconnectAccount(account.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      title="Disconnect this account"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">About Plaid Integration</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Your bank credentials are never stored on our servers</li>
          <li>All connections are secured through Plaid's bank-level encryption</li>
          <li>You can disconnect accounts at any time</li>
          <li>Transactions are synced automatically or manually on demand</li>
        </ul>
      </div>
    </div>
  );
};

export default PlaidIntegration;

