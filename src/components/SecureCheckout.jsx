import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Check, 
  ArrowRight, 
  Shield, 
  Lock, 
  Apple, 
  Smartphone, 
  Building2, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const SecureCheckout = ({ selectedOffer, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [achInfo, setAchInfo] = useState({
    routing: '',
    account: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showAchDetails, setShowAchDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment Cloud SDK refs
  const collectJsRef = useRef(null);

  useEffect(() => {
    // Load Payment Cloud Collect.js SDK
    if (!window.CollectJS) {
      const script = document.createElement('script');
      script.src = 'https://secure.networkmerchants.com/token/Collect.js';
      script.async = true;
      script.onload = () => {
        initializePaymentCloud();
      };
      document.head.appendChild(script);
    } else {
      initializePaymentCloud();
    }

    // Load saved customer info
    const savedInfo = localStorage.getItem('richnick_customer_info');
    if (savedInfo) {
      setCustomerInfo(JSON.parse(savedInfo));
    }
  }, []);

  const initializePaymentCloud = async () => {
    if (window.CollectJS) {
      collectJsRef.current = window.CollectJS;
      
      try {
        // Fetch the public key from the server
        const response = await fetch('/api/payment-cloud/public-key');
        const data = await response.json();
        const publicKey = data.publicKey || '4wK5E5-h49T6h-32TQf9-844vbe';
        
        console.log('Initializing Payment Cloud with public key:', publicKey);
        
        collectJsRef.current.configure({
          tokenizationKey: publicKey,
          fields: {
            number: {
              selector: '#card-number',
              title: 'Card Number',
              placeholder: '1234 5678 9012 3456'
            },
            cvv: {
              selector: '#card-cvv',
              title: 'CVV',
              placeholder: '123'
            },
            exp: {
              selector: '#card-expiry',
              title: 'Expiry',
              placeholder: 'MM/YY'
            }
          },
          callback: function(response) {
            console.log('Payment Cloud callback:', response);
            if (response.token) {
              processPayment('card', { token: response.token });
            } else {
              setError(response.error || 'Card tokenization failed');
            }
          }
        });
      } catch (error) {
        console.error('Failed to initialize Payment Cloud:', error);
        setError('Payment system initialization failed');
      }
    }
  };

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email) {
      setError('Name and email are required');
      return;
    }
    
    // Save customer info
    localStorage.setItem('richnick_customer_info', JSON.stringify(customerInfo));
    setStep(2);
  };

  const processPayment = async (method, paymentData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payment-cloud/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          customer_info: customerInfo,
          payment_data: paymentData,
          amount: selectedOffer?.priceCents || 100000, // Default to $1000
          offer_id: selectedOffer?.id || 'monthly-creator-pass'
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear saved customer info
        localStorage.removeItem('richnick_customer_info');
        onSuccess?.(result);
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvv || !cardInfo.name) {
      setError('Please fill in all card details');
      return;
    }
    
    if (collectJsRef.current) {
      collectJsRef.current.tokenize();
    } else {
      setError('Payment system not ready. Please try again.');
    }
  };

  const handleAchSubmit = (e) => {
    e.preventDefault();
    if (!achInfo.routing || !achInfo.account || !achInfo.name) {
      setError('Please fill in all ACH details');
      return;
    }
    
    processPayment('ach', achInfo);
  };

  const handleApplePay = () => {
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      // Apple Pay implementation would go here
      setError('Apple Pay integration coming soon');
    } else {
      setError('Apple Pay not available on this device');
    }
  };

  const handleGooglePay = () => {
    if (window.google && window.google.payments) {
      // Google Pay implementation would go here
      setError('Google Pay integration coming soon');
    } else {
      setError('Google Pay not available');
    }
  };

  const handlePayPal = () => {
    // Redirect to existing PayPal flow
    window.location.href = `/api/checkout/create?offer=${selectedOffer?.id || 'monthly-creator-pass'}`;
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/15">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Secure Checkout</h2>
              <p className="text-sm text-white/70">256-bit SSL encryption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl hover:bg-white/10 rounded-full p-2 transition-all"
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 1 ? 'border-indigo-400 bg-indigo-400/20' : 'border-white/30'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="ml-3 text-sm font-medium">Information</span>
          </div>
          <div className="flex-1 h-px bg-white/20 mx-4"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-400' : 'text-white/50'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 2 ? 'border-indigo-400 bg-indigo-400/20' : 'border-white/30'
            }`}>
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className="ml-3 text-sm font-medium">Payment</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <form onSubmit={handleCustomerInfoSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={customerInfo.zip}
                  onChange={(e) => setCustomerInfo({...customerInfo, zip: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                  placeholder="12345"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              Continue to Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Payment Methods */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-white">Order Summary</h3>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <div className="font-medium text-white">{selectedOffer?.name || 'Monthly Creator Pass'}</div>
                  <div className="text-sm text-white/70">Secure payment processing</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">${((selectedOffer?.priceCents || 100000) / 100).toFixed(2)}</div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span>${((selectedOffer?.priceCents || 100000) / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Choose Payment Method</h3>
              
              {/* Apple Pay */}
              <button
                onClick={handleApplePay}
                className="w-full p-4 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <Apple className="w-6 h-6" />
                <span className="font-medium text-white">Apple Pay</span>
                <div className="ml-auto">
                  <Lock className="w-4 h-4 text-white/50" />
                </div>
              </button>

              {/* Google Pay */}
              <button
                onClick={handleGooglePay}
                className="w-full p-4 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <Smartphone className="w-6 h-6" />
                <span className="font-medium text-white">Google Pay</span>
                <div className="ml-auto">
                  <Lock className="w-4 h-4 text-white/50" />
                </div>
              </button>

              {/* Credit/Debit Card */}
              <button
                onClick={() => setPaymentMethod('card')}
                className="w-full p-4 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <CreditCard className="w-6 h-6" />
                <span className="font-medium text-white">Credit/Debit Card</span>
                <div className="ml-auto">
                  <Lock className="w-4 h-4 text-white/50" />
                </div>
              </button>

              {/* ACH Bank Transfer */}
              <button
                onClick={() => setPaymentMethod('ach')}
                className="w-full p-4 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <Building2 className="w-6 h-6" />
                <span className="font-medium text-white">Bank Account (ACH)</span>
                <div className="ml-auto">
                  <Lock className="w-4 h-4 text-white/50" />
                </div>
              </button>

              {/* PayPal */}
              <button
                onClick={handlePayPal}
                className="w-full p-4 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
                  <span className="text-black font-bold text-xs">P</span>
                </div>
                <span className="font-medium text-white">PayPal</span>
                <div className="ml-auto">
                  <Lock className="w-4 h-4 text-white/50" />
                </div>
              </button>
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Card Details</h4>
                  <button
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    className="text-white/50 hover:text-white"
                  >
                    {showCardDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Card Number
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      value={cardInfo.number}
                      onChange={(e) => setCardInfo({...cardInfo, number: formatCardNumber(e.target.value)})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Expiry Date
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        value={cardInfo.expiry}
                        onChange={(e) => setCardInfo({...cardInfo, expiry: formatExpiry(e.target.value)})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        CVV
                      </label>
                      <input
                        id="card-cvv"
                        type="text"
                        value={cardInfo.cvv}
                        onChange={(e) => setCardInfo({...cardInfo, cvv: e.target.value.replace(/\D/g, '')})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                        placeholder="123"
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardInfo.name}
                      onChange={(e) => setCardInfo({...cardInfo, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Pay Securely
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ACH Payment Form */}
            {paymentMethod === 'ach' && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Bank Account Details</h4>
                  <button
                    onClick={() => setShowAchDetails(!showAchDetails)}
                    className="text-white/50 hover:text-white"
                  >
                    {showAchDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <form onSubmit={handleAchSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={achInfo.name}
                      onChange={(e) => setAchInfo({...achInfo, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      value={achInfo.routing}
                      onChange={(e) => setAchInfo({...achInfo, routing: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                      placeholder="123456789"
                      maxLength="9"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={achInfo.account}
                      onChange={(e) => setAchInfo({...achInfo, account: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                      placeholder="1234567890"
                      required
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      <strong>Secure ACH Transfer:</strong> Your bank account information is encrypted and processed securely. 
                      ACH transfers typically take 1-3 business days to process.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4" />
                        Pay with Bank Account
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setStep(1)}
              className="w-full text-white/70 hover:text-white py-3 px-6 rounded-xl hover:bg-white/5 transition-all"
            >
              ← Back to Information
            </button>
          </div>
        )}

        {/* Security Badges */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-center gap-6 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureCheckout;
