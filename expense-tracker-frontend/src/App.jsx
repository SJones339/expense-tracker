import { useState } from 'react'
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <h1>Expense Tracker</h1>
        <p>Authentication system ready!</p>
      </div>
    </AuthProvider>
  );
}

export default App;
