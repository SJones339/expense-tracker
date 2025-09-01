import React, { useState } from 'react';
import Header from '../components/Header';
import AccountForm from '../components/AccountForm';
import AccountList from '../components/AccountList';

const Accounts = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const handleAddAccount = () => {
        setEditingAccount(null);
        setShowForm(true);
    };

    const handleEditAccount = (account) => {
        setEditingAccount(account);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingAccount(null);
        // Force refresh of account list
        window.location.reload();
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingAccount(null);
    };

    const handleDeleteAccount = (accountId) => {
        // AccountList handles the deletion, just refresh the page
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="flex">
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
                            <button
                                onClick={handleAddAccount}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                + Add Account
                            </button>
                        </div>

                        {showForm ? (
                            <div className="mb-6">
                                <AccountForm
                                    account={editingAccount}
                                    onSuccess={handleFormSuccess}
                                    onCancel={handleFormCancel}
                                />
                            </div>
                        ) : (
                            <AccountList
                                onEditAccount={handleEditAccount}
                                onDeleteAccount={handleDeleteAccount}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Accounts;