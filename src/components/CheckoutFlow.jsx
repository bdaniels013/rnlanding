import React, { useState, useEffect } from 'react';
import { CreditCard, Check, ArrowRight, Star } from 'lucide-react';

const CheckoutFlow = ({ selectedOffer, onClose }) => {
  const [step, setStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [offers, setOffers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOffers();
    if (selectedOffer) {
      setSelectedItems([{ offer_id: selectedOffer.id, qty: 1 }]);
    }
  }, [selectedOffer]);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      const data = await response.json();
      setOffers(data);
    } catch (err) {
      setError('Failed to load offers');
    }
  };

  const handleCustomerInfoSubmit = (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email) {
      setError('Name and email are required');
      return;
    }
    setStep(2);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_info: customerInfo,
          items: selectedItems,
          contract_template_id: 'standard-v1'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to PayPal for payment
      if (data.paypal_approval_url) {
        window.location.href = data.paypal_approval_url;
      } else {
        throw new Error('PayPal approval URL not received');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const offer = offers.find(o => o.id === item.offer_id);
      return total + (offer ? (offer.priceCents / 100) * item.qty : 0);
    }, 0);
  };

  const calculateCredits = () => {
    return selectedItems.reduce((total, item) => {
      const offer = offers.find(o => o.id === item.offer_id);
      return total + (offer && offer.isCreditEligible ? offer.creditsValue * item.qty : 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Complete Your Purchase</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 1 ? 'border-blue-400 bg-blue-400/20' : 'border-gray-500'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm">Customer Info</span>
          </div>
          <div className="flex-1 h-px bg-gray-700 mx-4"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              step >= 2 ? 'border-blue-400 bg-blue-400/20' : 'border-gray-500'
            }`}>
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm">Review & Pay</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <form onSubmit={handleCustomerInfoSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
            >
              Continue to Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>
        )}

        {/* Step 2: Review & Payment */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              {selectedItems.map((item, index) => {
                const offer = offers.find(o => o.id === item.offer_id);
                if (!offer) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div>
                      <div className="font-medium">{offer.name}</div>
                      <div className="text-sm text-gray-400">
                        {offer.isCreditEligible && `${offer.creditsValue} credits included`}
                        {offer.isSubscription && ' • Recurring'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${offer.price}</div>
                      <div className="text-sm text-gray-400">Qty: {item.qty}</div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 mt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                {calculateCredits() > 0 && (
                  <div className="flex items-center justify-between text-sm text-blue-400 mt-2">
                    <span>Credits to be awarded</span>
                    <span>{calculateCredits()} credits</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info Review */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Name:</span> {customerInfo.name}</div>
                <div><span className="text-gray-400">Email:</span> {customerInfo.email}</div>
                {customerInfo.phone && <div><span className="text-gray-400">Phone:</span> {customerInfo.phone}</div>}
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-blue-400 hover:text-blue-300 text-sm mt-3"
              >
                Edit information
              </button>
            </div>

            {/* Payment Button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay with PayPal - ${calculateTotal().toFixed(2)}
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;
