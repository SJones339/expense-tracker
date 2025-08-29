import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { 
    Circle, Utensils, Car, ShoppingBag, Film, Zap, Heart, 
    Laptop, TrendingUp, Briefcase, PlusCircle, MoreHorizontal,
    Home, Coffee, Gift, BookOpen, Gamepad2,Plane, Wifi, Phone, 
    CreditCard, DollarSign, Euro
} from 'lucide-react';

const CategoryList = ({ onEditCategory, onDeleteCategory }) => {
    // State for categories
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get token from cookies
    const getToken = () => {
        return Cookies.get('access_token');
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const token = getToken();
            const response = await fetch('http://localhost:8000/api/categories/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCategories(data.results || data || []);
                console.log('Categories fetched:', data);
            } else {
                setError('Failed to fetch categories. Please try again.');
                console.error('Failed to fetch categories:', response.status);
            }
        } catch (error) {
            setError('Network error. Please check your connection.');
            console.error('Error fetching categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch categories when component mounts
    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle delete category
    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const token = getToken();
                const response = await fetch(`http://localhost:8000/api/categories/${categoryId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    // Remove the deleted category from state
                    setCategories(prev => prev.filter(c => c.id !== categoryId));
                    console.log('Category deleted successfully');
                } else {
                    console.error('Failed to delete category:', response.status);
                    alert('Failed to delete category. Please try again.');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Network error. Please check your connection.');
            }
        }
    };

    const getIconComponent = (iconName) => {
        const iconMap = {
            'circle': Circle,
            'utensils': Utensils,
            'car': Car,
            'shopping-bag': ShoppingBag,
            'film': Film,
            'zap': Zap,
            'heart': Heart,
            'laptop': Laptop,
            'trending-up': TrendingUp,
            'briefcase': Briefcase,
            'plus-circle': PlusCircle,
            'more-horizontal': MoreHorizontal,
            'home': Home,
            'coffee': Coffee,
            'gift': Gift,
            'book-open': BookOpen,
            'gamepad': Gamepad2,
            'plane': Plane,
            'wifi': Wifi,
            'phone': Phone,
            'credit-card': CreditCard,
            'dollar-sign': DollarSign,
            'euro': Euro
        };
        
        const IconComponent = iconMap[iconName] || Circle;
        return IconComponent;
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500">Loading categories...</div>
            </div>
        );
    }
    
    // Show error state
    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-4">{error}</div>
                <button onClick={fetchCategories} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Try Again
                </button>
            </div>
        );
    }
    
    // Show empty state
    if (categories.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500">
                    <p>No categories found.</p>
                    <p>Create your first category to get started!</p>
                </div>
            </div>
        );
    }

    // Main categories list display
    return (
        <div className="category-list">
            <h3 className="text-lg font-semibold mb-4">Your Categories</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map(category => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {category.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        category.type === 'income' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {category.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <div 
                                            className="w-4 h-4 rounded-full mr-2"
                                            style={{ backgroundColor: category.color }}
                                        ></div>
                                        {category.color}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                        const IconComponent = getIconComponent(category.icon);
                                        return <IconComponent size={20} className="inline-block" />;
                                    })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {category.transaction_count || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button 
                                        onClick={() => onEditCategory(category)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryList;