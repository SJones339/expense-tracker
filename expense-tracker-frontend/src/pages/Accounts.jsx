import React, { useState } from 'react';
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
        <div className="min-h-screen bg-gray-50">
            <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
                <div className="pt-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">Accounts</h1>
                            <p className="mt-2 text-gray-600">Manage your financial accounts</p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={handleAddAccount}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors font-medium"
                            >
                                + Add Account
                            </button>
                        )}
                    </div>
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
            </main>
        </div>
    );
};

export default Accounts;