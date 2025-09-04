import React, { useEffect } from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CheckoutCancel() {
  useEffect(() => {
    // Clean up the URL immediately
    const cleanUrl = window.location.origin + '/checkout/cancel';
    window.history.replaceState({}, document.title, cleanUrl);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Payment Cancelled</h1>
          
          <p className="text-white/70 mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>

          <div className="space-y-3">
            <p className="text-white/70 text-sm">
              You can try again anytime or contact us if you need assistance.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Home
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
