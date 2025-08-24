import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

//Creating the context which will be used to store the authentication state
const AuthContext = createContext();

// Custom hook to use the auth context- makes it easier to access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

//Main provider component that wraps around app
export const AuthProvider = ({ children }) => {
  //User data (email, name, etc.)
  //Login status
  //Loading state while checking auth
  const [user, setUser] = useState(null);        
  const [isAuthenticated, setIsAuthenticated] = useState(false);  
  const [loading, setLoading] = useState(true);  

  //Check if user is already logged in when app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  //Function to check if user is already logged in
  const checkAuthStatus = async () => {
    try {
      //Get JWT token from cookies
      const token = Cookies.get('access_token');
      
      if (token) {
        // If the token exists, get user profile
        const response = await fetch('http://localhost:8000/api/auth/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // If token is invalid, clear it
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  //Function to log in user
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        //Store tokens in cookies to keep user logged in
        Cookies.set('access_token', data.access, { expires: 1 }); //1 day
        Cookies.set('refresh_token', data.refresh, { expires: 7 }); //7 days
        
        //Get user profile if they are logged in
        const profileResponse = await fetch('http://localhost:8000/api/auth/profile/', {
          headers: {
            'Authorization': `Bearer ${data.access}`
          }
        });
        //If user profile is found, set user data and login status
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setUser(userData);
          setIsAuthenticated(true);
          return { success: true };
        }
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  //Function to register user
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        
        //Store tokens in cookies to keep user logged in
        Cookies.set('access_token', data.tokens.access, { expires: 1 });
        Cookies.set('refresh_token', data.tokens.refresh, { expires: 7 });
        
        //set user data
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  //Function to log out user
  const logout = () => {
    //Clear tokens from cookies
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    
    //Clear user state
    setUser(null);
    setIsAuthenticated(false);
  };

  //Function to refresh access token
  const refreshToken = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      
      if (!refreshToken) {
        logout();
        return false;
      }

      const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        Cookies.set('access_token', data.access, { expires: 1 });
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  //Value object that will be shared across the app
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};