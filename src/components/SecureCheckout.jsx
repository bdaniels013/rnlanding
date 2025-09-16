import React, { useState, useEffect } from 'react';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    // Load saved customer info
    const savedInfo = localStorage.getItem('richnick_customer_info');
    if (savedInfo) {
      setCustomerInfo(JSON.parse(savedInfo));
    }
  }, []);

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

  const handleAchSubmit = (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    
    if (!achInfo.routing || !achInfo.account || !achInfo.name) {
      setError('Please fill in all ACH details');
      return;
    }
    
    // Validate routing number (basic check)
    if (achInfo.routing.length !== 9) {
      setError('Routing number must be exactly 9 digits');
      return;
    }

    // Validate account number
    if (achInfo.account.length < 4 || achInfo.account.length > 17) {
      setError('Account number must be between 4 and 17 digits');
      return;
    }

    // Validate account holder name
    if (achInfo.name.trim().length < 2) {
      setError('Account holder name must be at least 2 characters');
      return;
    }
    
    processPayment('ach', achInfo);
  };

  const handleApplePay = async () => {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      setError('Apple Pay not available on this device');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const request = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: selectedOffer?.name || 'Rich Nick Service',
          amount: ((selectedOffer?.priceCents || 100000) / 100).toFixed(2)
        }
      };

      const session = new ApplePaySession(3, request);

      session.onvalidatemerchant = async (event) => {
        try {
          const response = await fetch('/api/payment-cloud/validate-merchant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validationURL: event.validationURL })
          });
          const { merchantSession } = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (err) {
          session.abort();
          setError('Apple Pay validation failed');
        }
      };

      session.onpaymentauthorized = async (event) => {
        try {
          const payment = event.payment;
          const result = await processPayment('apple_pay', {
            payment_data: payment.paymentData,
            payment_method: payment.paymentMethod
          });
          
          if (result.success) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
          } else {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            setError(result.error || 'Apple Pay payment failed');
          }
        } catch (err) {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          setError('Apple Pay payment failed');
        }
      };

      session.oncancel = () => {
        setError('Apple Pay payment cancelled');
      };

      session.begin();
    } catch (error) {
      setError('Apple Pay initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGooglePay = async () => {
    if (!window.google || !window.google.payments) {
      setError('Google Pay not available');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'PRODUCTION' // or 'TEST' for testing
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
          }
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: ((selectedOffer?.priceCents || 100000) / 100).toFixed(2),
          currencyCode: 'USD'
        },
        merchantInfo: {
          merchantId: process.env.REACT_APP_GOOGLE_MERCHANT_ID,
          merchantName: 'Rich Nick'
        }
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      
      const result = await processPayment('google_pay', {
        payment_method_data: paymentData.paymentMethodData
      });

      if (!result.success) {
        setError(result.error || 'Google Pay payment failed');
      }
    } catch (error) {
      if (error.statusCode === 'CANCELED') {
        setError('Google Pay payment cancelled');
      } else {
        setError('Google Pay payment failed');
      }
    } finally {
      setIsProcessing(false);
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
                if (method === 'apple_pay') {
                  handleApplePay();
                } else if (method === 'google_pay') {
                  handleGooglePay();
                } else if (method === 'paypal') {
                  handlePayPal();
                } else {
                  setPaymentMethod(method);
                }
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
                      type={showAchDetails ? "text" : "password"}
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
                      type={showAchDetails ? "text" : "password"}
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