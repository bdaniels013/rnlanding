import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  ArrowRight, 
  Shield, 
  Lock, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import PaymentSuccess from './PaymentSuccess';
import PaymentMethods from './PaymentMethods';

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
    zip: '',
    platform: '',
    username: ''
  });
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  useEffect(() => {
    // Load saved customer info
    const savedInfo = localStorage.getItem('richnick_customer_info');
    if (savedInfo) {
      setCustomerInfo(JSON.parse(savedInfo));
    }
    
    // Auto-select credit card payment method
    setPaymentMethod('card');
  }, []);

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email) {
      setError('Name and email are required');
      return;
    }
    
    // For shoutout offers, require platform and username
    if (selectedOffer?.name?.toLowerCase().includes('shoutout')) {
      if (!customerInfo.platform || !customerInfo.username) {
        setError('Platform and username are required for shoutout orders');
        return;
      }
    }
    
    // Save customer info to localStorage
    localStorage.setItem('richnick_customer_info', JSON.stringify(customerInfo));
    
    // Log customer info capture for admin dashboard
    console.log('Attempting to capture customer info:', {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone || '',
      selectedOffer: selectedOffer?.name || 'Unknown Offer'
    });
    
    try {
      const response = await fetch('/api/customer-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone || '',
          platform: customerInfo.platform || '',
          username: customerInfo.username || '',
          timestamp: new Date().toISOString(),
          action: 'continue_to_payment',
          selectedOffer: selectedOffer?.name || 'Unknown Offer'
        })
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Customer info captured successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('Failed to capture customer info:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to log customer info capture:', error);
      // Don't block the user flow if logging fails
    }
    
    setStep(2);
  };

  const processPayment = async (method, paymentData) => {
    setIsProcessing(true);
    setError(null);

    const requestData = {
      method,
      customer_info: customerInfo,
      payment_data: paymentData,
      amount: selectedOffer?.priceCents || 100000, // Default to $1000
      offer_id: selectedOffer?.id || 'monthly-creator-pass'
    };

    console.log('=== FRONTEND PAYMENT REQUEST ===');
    console.log('Request data:', JSON.stringify(requestData, null, 2));

    try {
      const response = await fetch('/api/payment-cloud/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('=== FRONTEND PAYMENT RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response data:', await response.clone().json());

      const result = await response.json();

      if (result.success) {
        // Clear saved customer info
        localStorage.removeItem('richnick_customer_info');
        
        // Store transaction data and show success screen
        setTransactionData(result);
        setShowSuccess(true);
        
        // Call success callback
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
    setError(null); // Clear previous errors
    
    if (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvv || !cardInfo.name) {
      setError('Please fill in all card details');
      return;
    }
    
    // Validate card number (basic Luhn algorithm)
    const cardNumber = cardInfo.number.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      setError('Card number must be between 13 and 19 digits');
      return;
    }
    
    if (!isValidCardNumber(cardNumber)) {
      setError('Please enter a valid card number');
      return;
    }

    // Validate expiry date
    const [month, year] = cardInfo.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setError('Please enter expiry date in MM/YY format');
      return;
    }
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (monthNum < 1 || monthNum > 12) {
      setError('Please enter a valid expiry month (01-12)');
      return;
    }
    
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      setError('Card has expired');
      return;
    }

    // Validate CVV
    if (cardInfo.cvv.length < 3 || cardInfo.cvv.length > 4) {
      setError('CVV must be 3 or 4 digits');
      return;
    }

    // Process card payment
    processPayment('card', {
      number: cardNumber,
      expiry: cardInfo.expiry,
      cvv: cardInfo.cvv,
      name: cardInfo.name
    });
  };




  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const isValidCardNumber = (number) => {
    // Basic Luhn algorithm validation
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Show success screen if payment was successful
  if (showSuccess) {
    return (
      <PaymentSuccess
        transactionData={transactionData}
        onClose={onClose}
        onBackToSite={() => {
          setShowSuccess(false);
          onClose();
        }}
      />
    );
  }

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

            {/* Social Media Platform Selection - Only show for Story Shoutout offer */}
            {selectedOffer?.name?.toLowerCase().includes('shoutout') && (
              <div className="space-y-4">
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Social Media Details</h3>
                  <p className="text-sm text-white/70 mb-4">
                    Please select the platform where you'd like to receive your shoutout and provide your username.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Platform *
                    </label>
                    <select
                      value={customerInfo.platform}
                      onChange={(e) => setCustomerInfo({...customerInfo, platform: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                      required
                    >
                      <option value="">Select platform</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">@</span>
                      <input
                        type="text"
                        value={customerInfo.username}
                        onChange={(e) => setCustomerInfo({...customerInfo, username: e.target.value.replace('@', '')})}
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all"
                        placeholder="yourusername"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
            <PaymentMethods 
              onSelectMethod={(method) => {
                setSelectedPaymentMethod(method);
                setPaymentMethod(method);
              }}
              selectedMethod={selectedPaymentMethod}
              isProcessing={isProcessing}
            />

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
                      type={showCardDetails ? "text" : "password"}
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
                        type={showCardDetails ? "text" : "password"}
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