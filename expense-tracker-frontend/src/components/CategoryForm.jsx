import React, { useState, useEffect } from 'react';
import './CategoryForm.css';
import { 
    Circle, 
    Utensils, 
    Car, 
    ShoppingBag, 
    Film, 
    Zap, 
    Heart, 
    Laptop, 
    TrendingUp, 
    Briefcase, 
    PlusCircle, 
    MoreHorizontal,
    Home,
    Coffee,
    Gift,
    BookOpen,
    Gamepad2,
    Plane,
    Bus,
    Train,
    Wifi,
    Phone,
    CreditCard,
    PiggyBank,
    DollarSign,
    Euro,
    PoundSterling
} from 'lucide-react';

const CategoryForm = ({ category = null, onSuccess, onCancel }) => {
    // State for form fields
    const [formData, setFormData] = useState({
        name: '',
        type: 'expense',
        color: '#3B82F6',
        icon: 'circle'
    });

    // State for form validation errors
    const [errors, setErrors] = useState({});
    
    // State for loading and submission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If editing an existing category, populate form
    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                type: category.type,
                color: category.color,
                icon: category.icon
            });
        }
    }, [category]);

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
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!formData.color) {
            newErrors.color = 'Color is required';
        }
        
        if (!formData.icon) {
            newErrors.icon = 'Icon is required';
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
            const url = category 
                ? `http://localhost:8000/api/categories/${category.id}/`
                : 'http://localhost:8000/api/categories/';
            
            const method = category ? 'PUT' : 'POST';
            
            // Get token from cookies
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('access_token='))
                ?.split('=')[1];
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    type: formData.type,
                    color: formData.color,
                    icon: formData.icon
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                onSuccess(result);
                // Reset form if creating new category
                if (!category) {
                    setFormData({
                        name: '',
                        type: 'expense',
                        color: '#3B82F6',
                        icon: 'circle'
                    });
                }
            } else {
                const errorData = await response.json();
                console.error('Category save failed:', errorData);
                setErrors({ submit: 'Failed to save category. Please try again.' });
            }
        } catch (error) {
            console.error('Error saving category:', error);
            setErrors({ submit: 'Network error. Please check your connection.' });
        } finally {
            setIsSubmitting(false);
        }
    };
      
    return (
        <div className="category-form">
            <h2 className="text-xl font-semibold mb-6">
                {category ? 'Edit Category' : 'Add New Category'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Category name"
                    />
                    {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                </div>

                {/* Type Field */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>

                {/* Color Field */}
                <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                        Color *
                    </label>
                    <input
                        type="color"
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full h-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Icon Field */}
                <div>
                    <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
                        Icon *
                    </label>
                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {[
                            { value: 'circle', icon: Circle, label: 'Circle' },
                            { value: 'utensils', icon: Utensils, label: 'Utensils' },
                            { value: 'car', icon: Car, label: 'Car' },
                            { value: 'shopping-bag', icon: ShoppingBag, label: 'Shopping' },
                            { value: 'film', icon: Film, label: 'Film' },
                            { value: 'zap', icon: Zap, label: 'Zap' },
                            { value: 'heart', icon: Heart, label: 'Heart' },
                            { value: 'laptop', icon: Laptop, label: 'Laptop' },
                            { value: 'trending-up', icon: TrendingUp, label: 'Trending' },
                            { value: 'briefcase', icon: Briefcase, label: 'Briefcase' },
                            { value: 'plus-circle', icon: PlusCircle, label: 'Plus' },
                            { value: 'more-horizontal', icon: MoreHorizontal, label: 'More' },
                            { value: 'home', icon: Home, label: 'Home' },
                            { value: 'coffee', icon: Coffee, label: 'Coffee' },
                            { value: 'gift', icon: Gift, label: 'Gift' },
                            { value: 'book-open', icon: BookOpen, label: 'Book' },
                            { value: 'gamepad', icon: Gamepad2, label: 'Game' },
                            { value: 'plane', icon: Plane, label: 'Plane' },
                            { value: 'bus', icon: Bus, label: 'Bus' },
                            { value: 'train', icon: Train, label: 'Train' },
                            { value: 'wifi', icon: Wifi, label: 'WiFi' },
                            { value: 'phone', icon: Phone, label: 'Phone' },
                            { value: 'credit-card', icon: CreditCard, label: 'Card' },
                            { value: 'piggy-bank', icon: PiggyBank, label: 'Piggy' },
                            { value: 'dollar-sign', icon: DollarSign, label: 'Dollar' },
                            { value: 'euro', icon: Euro, label: 'Euro' },
                            { value: 'pound-sterling', icon: PoundSterling, label: 'Pound' }
                        ].map(({ value, icon: IconComponent, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, icon: value }));
                                }}
                                className={`p-3 border rounded-lg flex flex-col items-center justify-center transition-colors ${
                                    formData.icon === value
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                                title={label}
                            >
                                <IconComponent size={20} />
                                <span className="text-xs mt-1 text-center">{label}</span>
                            </button>
                        ))}
                    </div>
                    {errors.icon && <span className="text-red-500 text-sm">{errors.icon}</span>}
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
                        {isSubmitting ? 'Saving...' : (category ? 'Update Category' : 'Add Category')}
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

export default CategoryForm;