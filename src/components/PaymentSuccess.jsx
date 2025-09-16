import React from 'react';
import { CheckCircle, ArrowRight, Download, Mail, Phone } from 'lucide-react';

const PaymentSuccess = ({ transactionData, onClose, onBackToSite }) => {
  const { transaction_id, amount, method, customer_info, offer_id, timestamp } = transactionData || {};

  const formatAmount = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatMethod = (method) => {
    switch (method) {
      case 'card': return 'Credit/Debit Card';
      case 'ach': return 'Bank Account (ACH)';
      default: return method;
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-white/70">Your payment has been processed securely</p>
        </div>

        {/* Transaction Details */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Transaction ID:</span>
              <span className="text-white font-mono text-sm">{transaction_id || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/70">Amount:</span>
              <span className="text-white font-semibold">{formatAmount(amount || 0)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/70">Payment Method:</span>
              <span className="text-white">{formatMethod(method)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/70">Date:</span>
              <span className="text-white">{formatDate(timestamp || new Date().toISOString())}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/70">Customer:</span>
              <span className="text-white">{customer_info?.name || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/70">Email:</span>
              <span className="text-white">{customer_info?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-semibold text-blue-300 mb-3">What's Next?</h4>
          <ul className="space-y-2 text-blue-200">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span>You'll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span>Your account has been activated with full access</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span>You can start using all premium features immediately</span>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">Need Help?</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white/70">
              <Mail className="w-4 h-4" />
              <span>support@richhnick.org</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <Phone className="w-4 h-4" />
              <span>1-800-RICH-NICK</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onBackToSite}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white py-4 px-6 rounded-xl font-semibold hover:bg-white/20 transition-all"
          >
            Close
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            This transaction was processed securely using 256-bit SSL encryption. 
            Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
