import React, { useState } from 'react';
import { 
  CreditCard, 
  Building2, 
  Apple, 
  Smartphone, 
  DollarSign,
  Bitcoin,
  Wallet,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PaymentMethods = ({ onSelectMethod, selectedMethod, isProcessing }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express, Discover',
      icon: CreditCard,
      color: 'from-blue-600 to-blue-700',
      popular: true
    },
    {
      id: 'ach',
      name: 'Bank Account (ACH)',
      description: 'Direct bank transfer - 1-3 business days',
      icon: Building2,
      color: 'from-green-600 to-green-700',
      popular: true
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      description: 'Pay with Touch ID or Face ID',
      icon: Apple,
      color: 'from-gray-800 to-gray-900',
      popular: true,
      requiresDevice: true
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      description: 'Quick and secure mobile payments',
      icon: Smartphone,
      color: 'from-blue-500 to-blue-600',
      popular: true,
      requiresDevice: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: () => (
        <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
          <span className="text-black font-bold text-xs">P</span>
        </div>
      ),
      color: 'from-yellow-500 to-yellow-600',
      popular: true
    }
  ];

  const advancedMethods = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Bitcoin, Ethereum, and other crypto',
      icon: Bitcoin,
      color: 'from-orange-500 to-orange-600',
      comingSoon: true
    },
    {
      id: 'wallet',
      name: 'Digital Wallets',
      description: 'Venmo, Cash App, and more',
      icon: Wallet,
      color: 'from-purple-500 to-purple-600',
      comingSoon: true
    }
  ];

  const checkDeviceSupport = (method) => {
    if (method.id === 'apple_pay') {
      return window.ApplePaySession && ApplePaySession.canMakePayments();
    }
    if (method.id === 'google_pay') {
      return window.google && window.google.payments;
    }
    return true;
  };

  const handleMethodSelect = (method) => {
    if (method.comingSoon) {
      return; // Don't allow selection of coming soon methods
    }
    
    if (method.requiresDevice && !checkDeviceSupport(method)) {
      return; // Don't allow selection if device doesn't support it
    }
    
    onSelectMethod(method.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Choose Payment Method</h3>
        <p className="text-white/70">Select your preferred payment option</p>
      </div>

      {/* Popular Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isSupported = checkDeviceSupport(method);
          const isDisabled = isProcessing || method.comingSoon || (!isSupported && method.requiresDevice);

          return (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method)}
              disabled={isDisabled}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-white/20 bg-black/50 hover:border-white/40 hover:bg-white/5'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${method.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{method.name}</h4>
                    {method.popular && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Popular
                      </span>
                    )}
                    {method.comingSoon && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Coming Soon
                      </span>
                    )}
                    {!isSupported && method.requiresDevice && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Not Available
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70">{method.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-indigo-400" />
                  )}
                  <Lock className="w-4 h-4 text-white/50" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Advanced Payment Methods */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-white/70 hover:text-white text-sm flex items-center gap-2 mb-3"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Payment Options
          <span className="text-xs">({advancedMethods.length})</span>
        </button>

        {showAdvanced && (
          <div className="space-y-3">
            {advancedMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              const isDisabled = isProcessing || method.comingSoon;

              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-white/20 bg-black/50 hover:border-white/40 hover:bg-white/5'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${method.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{method.name}</h4>
                        {method.comingSoon && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/70">{method.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-indigo-400" />
                      )}
                      <Lock className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
