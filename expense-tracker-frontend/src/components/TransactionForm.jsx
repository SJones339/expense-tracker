/*Handles creating and editing transactions using form validation*/
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './TransactionForm.css';
import Cookies from 'js-cookie';

const TransactionForm = ({ transaction = null, onSuccess, onCancel }) => {
      // State for form fields
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: '',
        //Today's date as default
        date: new Date().toISOString().split('T')[0], 
        //Default to expense
        type: 'expense', 
        account: ''
    });

    //State for form validation errors
    const [errors, setErrors] = useState({});
    
    //State for loading and submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    //Get auth context
    const { user } = useAuth();
    
    //State for categories and accounts
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Get tokens from cookies
    const getToken = () => {
        return Cookies.get('access_token');
    };
    
    const getRefreshToken = () => {
        return Cookies.get('refresh_token');
    };

     // Check if token is valid and refresh if needed
    const checkAndRefreshToken = async () => {
        const token = getToken(); // Use cookies instead of localStorage
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
            const refreshToken = getRefreshToken(); // Use cookies
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
                Cookies.set('access_token', newTokens.access, { expires: 1 }); // Store in cookies
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

    //Fetch categories and accounts when component mounts
    useEffect(() => {
        const fetchData = async () => {
        try {
            //Check and refresh token first
            const tokenValid = await checkAndRefreshToken();
            if (!tokenValid) {
            console.log('Token validation failed');
            return;
            }
            //Use cookies
            const token = getToken(); 
            
            console.log('Current user from context:', user);
            console.log('User ID:', user?.id);
            
            
            //Fetch categories
            const categoriesResponse = await fetch('http://localhost:8000/api/categories/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
            });
            
            if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData.results || categoriesData || []);
            console.log('Categories fetched:', categoriesData);
            } else {
            console.error('Failed to fetch categories:', categoriesResponse.status);
            }
            
            //Fetch accounts
            const accountsResponse = await fetch('http://localhost:8000/api/accounts/', {
                headers: {
                'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Accounts response status:', accountsResponse.status);
            console.log('Accounts response headers:', accountsResponse.headers);
            
            if (accountsResponse.ok) {
                const accountsData = await accountsResponse.json();
                console.log('Raw accounts data:', accountsData);
                setAccounts(accountsData.results || accountsData || []);
            } else {
                console.error('Failed to fetch accounts:', accountsResponse.status);
                const errorText = await accountsResponse.text();
                console.error('Accounts error details:', errorText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoadingData(false);
        }
        };
        
        fetchData();
    }, []);
    
    //If editing an existing transaction, populate form
    useEffect(() => {
        if (transaction) {
        setFormData({
            amount: transaction.amount.toString(),
            description: transaction.description,
            category: transaction.category?.id?.toString() || '',
            date: transaction.date,
            type: transaction.type,
            account: transaction.account?.id?.toString() || ''
        });
        }
    }, [transaction]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
        setErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        }
        
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        }
        
        if (!formData.category) {
          newErrors.category = 'Category is required';
        }
        
        if (!formData.date) {
          newErrors.date = 'Date is required';
        }
        
        if (!formData.account) {
          newErrors.account = 'Account is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
          return;
        }
        
        setIsSubmitting(true);
        
        try {
          const url = transaction 
            ? `http://localhost:8000/api/transactions/${transaction.id}/`
            : 'http://localhost:8000/api/transactions/';
          
          const method = transaction ? 'PUT' : 'POST';
          
          const response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                amount: parseFloat(formData.amount),
                description: formData.description.trim(),
                category_id: parseInt(formData.category),
                date: formData.date,
                type: formData.type,
                account_id: parseInt(formData.account)
              })
          });
          
          if (response.ok) {
            const result = await response.json();
            onSuccess(result);
            //Reset form if creating new transaction
            if (!transaction) {
              setFormData({
                amount: '',
                description: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                account: ''
              });
            }
          } else {
            const errorData = await response.json();
            console.error('Transaction save failed:', errorData);
            setErrors({ submit: 'Failed to save transaction. Please try again.' });
          }
        } catch (error) {
          console.error('Error saving transaction:', error);
          setErrors({ submit: 'Network error. Please check your connection.' });
        } finally {
          setIsSubmitting(false);
        }
      };
      
      return (
        <div className="transaction-form">
          <h2>{transaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Amount Field */}
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className={errors.amount ? 'error' : ''}
                placeholder="0.00"
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>
    
            {/* Description Field */}
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={errors.description ? 'error' : ''}
                placeholder="What was this transaction for?"
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>
    
            {/* Type Field */}
            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
    
            {/* Category Field */}
            <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={errors.category ? 'error' : ''}
                disabled={isLoadingData}
            >
                <option value="">{isLoadingData ? 'Loading categories...' : 'Select a category'}</option>
                {categories.map(category => (
                <option key={category.id} value={category.id}>
                    {category.name}
                </option>
                ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
            </div>
    
            {/* Account Field */}
            <div className="form-group">
            <label htmlFor="account">Account *</label>
            <select
                id="account"
                name="account"
                value={formData.account}
                onChange={handleChange}
                className={errors.account ? 'error' : ''}
                disabled={isLoadingData}
            >
                <option value="">{isLoadingData ? 'Loading accounts...' : 'Select an account'}</option>
                {accounts.map(account => (
                <option key={account.id} value={account.id}>
                    {account.name} (${account.balance})
                </option>
                ))}
            </select>
            {errors.account && <span className="error-text">{errors.account}</span>}
            </div>
    
            {/* Date Field */}
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'error' : ''}
              />
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>
    
            {/* Submit Error */}
            {errors.submit && (
              <div className="error-message">
                {errors.submit}
              </div>
            )}
    
            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Saving...' : (transaction ? 'Update Transaction' : 'Add Transaction')}
              </button>
              
              <button 
                type="button" 
                onClick={onCancel}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        
      );

    };
export default TransactionForm;