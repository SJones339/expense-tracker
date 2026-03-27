import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import Cookies from 'js-cookie';

// PlaidLink component - handles the Plaid Link flow
// This component uses the react-plaid-link library to open Plaid's secure connection flow
const PlaidLink = ({ onSuccess, onExit }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch link token from backend when component mounts
  // The link token is required to initialize Plaid Link
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const token = Cookies.get('access_token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Request a link token from our backend
        // This endpoint calls Plaid's API to generate a secure token
        const response = await fetch('http://localhost:8000/api/plaid/create-link-token/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create link token');
        }

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, []);

  // Callback when Plaid Link successfully connects an account
  // This receives the public_token and metadata from Plaid
  const onSuccessCallback = useCallback(
    async (publicToken, metadata) => {
      try {
        const token = Cookies.get('access_token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Exchange the public token for an access token
        // The public token is temporary and must be exchanged server-side
        const response = await fetch('http://localhost:8000/api/plaid/exchange-token/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_token: publicToken,
            institution_name: metadata.institution?.name || 'Unknown Bank',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange token');
        }

        const data = await response.json();
        
        // Call the parent's onSuccess callback with the result
        if (onSuccess) {
          onSuccess(data);
        }
      } catch (err) {
        setError(err.message);
        if (onExit) {
          onExit(err, null);
        }
      }
    },
    [onSuccess, onExit]
  );

  // Callback when user exits Plaid Link without connecting
  const onExitCallback = useCallback(
    (err, metadata) => {
      if (err) {
        setError(err.error_message || 'Connection cancelled');
      }
      if (onExit) {
        onExit(err, metadata);
      }
    },
    [onExit]
  );

  // Initialize Plaid Link with the link token
  // usePlaidLink is a hook from react-plaid-link that handles the Plaid UI
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: onExitCallback,
  });

  // Auto-open Plaid Link when ready
  useEffect(() => {
    if (ready && linkToken && !error) {
      open();
    }
  }, [ready, linkToken, open, error]);

  // Show loading state while fetching link token
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading Plaid Link...</div>
      </div>
    );
  }

  // Show error state if link token failed
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  // Component doesn't render anything visible - Plaid Link opens in a modal
  return null;
};

export default PlaidLink;

