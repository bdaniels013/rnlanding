import React from 'react';
import { 
  CreditCard, 
  Lock,
  CheckCircle
} from 'lucide-react';

const PaymentMethods = ({ onSelectMethod, selectedMethod, isProcessing }) => {
  const paymentMethod = {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express, Discover',
    icon: CreditCard,
    color: 'from-blue-600 to-blue-700'
  };

  const handleMethodSelect = () => {
    onSelectMethod(paymentMethod.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Payment Method</h3>
        <p className="text-white/70">Secure credit card payment</p>
      </div>

      {/* Credit Card Payment Method */}
      <div className="space-y-3">
        <button
          onClick={handleMethodSelect}
          disabled={isProcessing}
          className={`w-full p-4 rounded-xl border-2 transition-all ${
            selectedMethod === paymentMethod.id
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-white/20 bg-black/50 hover:border-white/40 hover:bg-white/5'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${paymentMethod.color}`}>
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">{paymentMethod.name}</h4>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Available
                </span>
              </div>
              <p className="text-sm text-white/70">{paymentMethod.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {selectedMethod === paymentMethod.id && (
                <CheckCircle className="w-5 h-5 text-indigo-400" />
              )}
              <Lock className="w-4 h-4 text-white/50" />
            </div>
          </div>
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-300 mb-1">Secure Payment Processing</h4>
            <p className="text-sm text-blue-200">
              All payments are processed securely using 256-bit SSL encryption. 
              Your payment information is never stored on our servers and is handled 
              by our PCI-compliant payment processor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
