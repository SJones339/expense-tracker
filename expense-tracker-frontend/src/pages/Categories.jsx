import React, { useState } from 'react';
import Header from '../components/Header';
import CategoryForm from '../components/CategoryForm';
import CategoryList from '../components/CategoryList';

const Categories = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowForm(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleFormSuccess = (result) => {
        console.log('Category saved:', result);
        setShowForm(false);
        setEditingCategory(null);
        // TODO: Refresh category list
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingCategory(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex">
                <main className="flex-1 p-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
                            <button 
                                onClick={handleAddCategory}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                + Add Category
                            </button>
                        </div>

                        {showForm ? (
                            <CategoryForm
                                category={editingCategory}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        ) : (
                            <CategoryList
                                onEditCategory={handleEditCategory}
                                onDeleteCategory={(categoryId) => {
                                    console.log('Delete category:', categoryId);
                                    // TODO: Implement delete functionality
                                }}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Categories;