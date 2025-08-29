import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const TransactionList = ({ onEditTransaction, onDeleteTransaction }) => {
    //State for transactions
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    


    //Get token from cookies
    const getToken = () => {
        return Cookies.get('access_token');
    };

    const getRefreshToken = () => {
        return Cookies.get('refresh_token');
      };
      
      //Check if token is valid and refresh if needed
      const checkAndRefreshToken = async () => {
        const token = getToken();
        if (!token) {
          console.log('No token found in cookies');
          return false;
        }
        
        try {
          const testResponse = await fetch('http://localhost:8000/api/auth/profile/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (testResponse.status === 401) {
            console.log('Token expired, attempting refresh');
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              const refreshResponse = await fetch('http://localhost:8000/api/auth/token/refresh/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  refresh: refreshToken
                })
              });
              
              if (refreshResponse.ok) {
                const newTokens = await refreshResponse.json();
                Cookies.set('access_token', newTokens.access, { expires: 1 });
                return true;
              }
            }
            return false;
          }
          return true;
        } catch (error) {
          console.error('Error checking token:', error);
          return false;
        }
      };

    //Fetch transactions from API
    const fetchTransactions = async () => {
        try {
        setIsLoading(true);
        setError(null);
        
        //Check and refresh token first
        const tokenValid = await checkAndRefreshToken();
        if (!tokenValid) {
            setError('Authentication failed. Please log in again.');
            return;
        }
        
        const token = getToken();
        
        //Fetch transactions with pagination
        const response = await fetch(`http://localhost:8000/api/transactions/?page=${currentPage}`, {
            headers: {
            'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            setTransactions(data.results || data || []);
            //20 items per page
            setTotalPages(Math.ceil((data.count || 0) / 20)); 
            console.log('Transactions fetched:', data);
        } else {
            setError('Failed to fetch transactions. Please try again.');
            console.error('Failed to fetch transactions:', response.status);
        }
        } catch (error) {
        setError('Network error. Please check your connection.');
        console.error('Error fetching transactions:', error);
        } finally {
        setIsLoading(false);
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                const token = getToken();
                const response = await fetch(`http://localhost:8000/api/transactions/${transactionId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    // Remove the deleted transaction from state
                    setTransactions(prev => prev.filter(t => t.id !== transactionId));
                    console.log('Transaction deleted successfully');
                    

                } else {
                    console.error('Failed to delete transaction:', response.status);
                    alert('Failed to delete transaction. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Network error. Please check your connection.');
            }
        }
    };

    // Fetch transactions when component mounts or page changes
    useEffect(() => {
        fetchTransactions();
    }, [currentPage]);
    
    // In your refreshTransactions function
    const refreshTransactions = () => {
        fetchTransactions();
        // Also notify parent if needed
        if (onRefresh) {
            onRefresh();
        }
    };


    
        
    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };



    // Show loading state
    if (isLoading) {
        return (
            <div className="transaction-list-loading">
                <div className="loading-spinner">Loading transactions...</div>
            </div>
        );
    }
    
    // Show error state
    if (error) {
        return (
            <div className="transaction-list-error">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={refreshTransactions} className="btn-retry">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    
    // Show empty state
    if (transactions.length === 0) {
        return (
            <div className="transaction-list-empty">
                <div className="empty-message">
                    <p>No transactions found.</p>
                    <p>Create your first transaction to get started!</p>
                </div>
            </div>
        );
    }

    // Main transaction list display
    return (
        <div className="transaction-list">
            <h3>Your Transactions</h3>
            <div className="transaction-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Account</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(transaction => {
                            // console.log('Full transaction object:', transaction);
                            return (
                            <tr key={transaction.id}>
                                <td>{formatDate(transaction.date)}</td>
                                <td>{transaction.description}</td>
                                <td>{transaction.category_name}</td>
                                <td>{transaction.account_name}</td>
                                <td className={`type-${transaction.type}`}>
                                    {transaction.type}
                                </td>
                                <td className={`amount-${transaction.type}`}>
                                    {formatCurrency(transaction.amount)}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => onEditTransaction(transaction)}
                                        className="btn-edit"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                        className="btn-delete"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    

};

export default TransactionList;