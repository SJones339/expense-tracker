import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions'; 
import Categories from './pages/Categories';
import Accounts from './pages/Accounts';
import Analytics from './pages/Analytics';
import './App.css';
import Navbar from './components/Navbar';
import BudgetAllocator from './pages/BudgetAllocator';



function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App pt-16">
        <Routes>
            {/* Public routes - anyone can access */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with Navbar */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Dashboard />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Transactions />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Categories />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Accounts />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <Analytics />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/budgets" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <BudgetAllocator />
                </div>
              </ProtectedRoute>
            } />
            
            {/* Redirect root to dashboard if logged in, otherwise to login */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Protected Route component - moved INSIDE the App component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default App;