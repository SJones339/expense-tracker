import React, { useState, useEffect } from 'react';
import './AccountForm.css';

const AccountForm = ({ account = null, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'checking',
        balance: '0.00',
        currency: 'USD',
        description: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name,
                type: account.type,
                balance: account.balance || '0.00',
                currency: account.currency || 'USD',
                description: account.description || ''
            });
        }
    }, [account]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!formData.type) {
            newErrors.type = 'Type is required';
        }
        
        if (isNaN(parseFloat(formData.balance))) {
            newErrors.balance = 'Balance must be a valid number';
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
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('access_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('No authentication token found');
            }

            const url = account 
                ? `http://localhost:8000/api/accounts/${account.id}/`
                : 'http://localhost:8000/api/accounts/';

            const method = account ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    type: formData.type,
                    balance: parseFloat(formData.balance),
                    currency: formData.currency,
                    description: formData.description.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save account');
            }

            onSuccess();
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {account ? 'Edit Account' : 'Add New Account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Account Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Chase Checking, Savings Account"
                    />
                    {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                </div>

                {/* Type Field */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type *
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="credit">Credit Card</option>
                        <option value="investment">Investment</option>
                        <option value="cash">Cash</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.type && <span className="text-red-500 text-sm">{errors.type}</span>}
                </div>

                {/* Balance Field */}
                <div>
                    <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Balance *
                    </label>
                    <input
                        type="number"
                        id="balance"
                        name="balance"
                        value={formData.balance}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                    />
                    {errors.balance && <span className="text-red-500 text-sm">{errors.balance}</span>}
                </div>

                {/* Currency Field */}
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                    </label>
                    <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                    </select>
                </div>

                {/* Description Field */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional description of this account"
                    />
                </div>

                {/* Submit Error */}
                {errors.submit && (
                    <div className="text-red-500 text-sm">
                        {errors.submit}
                    </div>
                )}

                {/* Form Actions */}
                <div className="flex space-x-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : (account ? 'Update Account' : 'Add Account')}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AccountForm;