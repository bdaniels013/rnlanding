import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';

export default function CheckoutSuccess() {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up the URL immediately
    const cleanUrl = window.location.origin + '/checkout/success';
    window.history.replaceState({}, document.title, cleanUrl);

    // Get order details from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const payerId = urlParams.get('PayerID');

    if (token) {
      // Process the successful payment
      processPaymentSuccess(token, payerId);
    } else {
      setLoading(false);
    }
  }, []);

  const processPaymentSuccess = async (token, payerId) => {
    try {
      const response = await fetch(`/api/paypal/success?token=${token}&PayerID=${payerId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrderDetails(data);
        // Clear any stored customer info since payment is complete
        localStorage.removeItem('richnick_customer_info');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Processing Payment...</h2>
          <p className="text-white/70">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Payment Successful!</h1>
          
          <p className="text-white/70 mb-6">
            Thank you for your purchase! Your payment has been processed successfully.
          </p>

          {orderDetails && (
            <div className="bg-white/10 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Order Details
              </h3>
              <div className="text-sm text-white/70 space-y-1">
                <div>Order ID: {orderDetails.order_id?.slice(0, 8)}...</div>
                <div>Status: {orderDetails.status}</div>
                {orderDetails.capture_id && (
                  <div>Transaction ID: {orderDetails.capture_id?.slice(0, 8)}...</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-white/70 text-sm">
              You will receive a confirmation email shortly with your receipt and next steps.
            </p>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Return to Home
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
