import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const AccountList = ({ onEditAccount, onDeleteAccount }) => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBalances, setShowBalances] = useState(true);

    const getToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
    };

    const fetchAccounts = async () => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('http://localhost:8000/api/accounts/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }

            const data = await response.json();
            setAccounts(data.results || data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleDeleteAccount = async (accountId) => {
        if (!window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`http://localhost:8000/api/accounts/${accountId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            // Remove from local state
            setAccounts(prev => prev.filter(account => account.id !== accountId));
            
            // Call parent callback if provided
            if (onDeleteAccount) {
                onDeleteAccount(accountId);
            }
        } catch (error) {
            alert(`Error deleting account: ${error.message}`);
        }
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getAccountTypeColor = (type) => {
        const colors = {
            'checking': 'bg-blue-100 text-blue-800',
            'savings': 'bg-green-100 text-green-800',
            'credit': 'bg-red-100 text-red-800',
            'investment': 'bg-purple-100 text-purple-800',
            'cash': 'bg-yellow-100 text-yellow-800',
            'other': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors.other;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button 
                    onClick={fetchAccounts}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 mb-4">No accounts found</div>
                <div className="text-sm text-gray-400">Create your first account to get started</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header with balance toggle */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Your Accounts</h3>
                <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                >
                    {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
                </button>
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {account.name}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {showBalances ? (
                                    formatCurrency(account.balance, account.currency)
                                ) : (
                                    <span className="text-gray-400">••••••</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {account.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {account.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {account.transaction_count || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onEditAccount(account)}
                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                    >
                                        <Edit size={16} />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAccount(account.id)}
                                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
};

export default AccountList;