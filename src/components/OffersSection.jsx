import React, { useState, useEffect } from 'react';
import { Star, CreditCard, Calendar, Users, ArrowRight, Check } from 'lucide-react';
import CheckoutFlow from './CheckoutFlow';
import SecureCheckout from './SecureCheckout';

const OffersSection = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSecureCheckout, setShowSecureCheckout] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOffer = (offer) => {
    const amountCents = offer.priceCents;
    const offerId = offer.id;
    window.location.href = `/api/payment-cloud/hpp/start?amount_cents=${amountCents}&offer_id=${offerId}`;
  };

  const handleSecureCheckoutSuccess = (result) => {
    console.log('Payment successful:', result);
    setShowSecureCheckout(false);
    setSelectedOffer(null);
    // Redirect to success page or show success message
    window.location.href = '/checkout/success?payment=secure&txn=' + result.transaction_id;
  };

  const getOfferFeatures = (offer) => {
    const features = [];
    
    if (offer.sku === 'monthly-creator-pass') {
      features.push(
        '1 Credit to be at the RichhNick Event',
        'Content shoot at event with 3 different sets',
        'Photos + Video + Launch content',
        'Collaboration opportunities at the event',
        'Custom strategy call for personal playbook',
        'Guaranteed to boost engagement & followers'
      );
    } else if (offer.sku === 'annual-plan') {
      features.push(
        '12 Credits for 12 Events OR 6 Platform Features',
        'Platform options: Famous Animal, The Debut, We Go Tampa, Ugly Money Podcast',
        'Content shoots at all events',
        'Priority booking access',
        'Advanced collaboration network',
        'Guaranteed to boost engagement & followers'
      );
    } else if (offer.sku === 'content-management') {
      features.push(
        'Weekly scheduled follow-ups',
        'Ongoing collaboration to market & promote',
        'Product/service promotion strategies',
        'Content optimization across all platforms',
        'Performance tracking & analytics',
        'Guaranteed to boost engagement & followers'
      );
    }
    
    return features;
  };

  const getOfferBadge = (offer) => {
    if (offer.sku === 'annual-plan') {
      return { text: 'BEST VALUE', color: 'bg-green-600' };
    } else if (offer.sku === 'monthly-creator-pass') {
      return { text: 'EVENT ACCESS', color: 'bg-blue-600' };
    } else if (offer.sku === 'content-management') {
      return { text: 'ONGOING SUPPORT', color: 'bg-purple-600' };
    }
    return null;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center text-white">Loading offers...</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Viral Growth Path</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get guaranteed engagement & followers across all platforms with Rich Nick's proven system
            </p>
          </div>

          {/* Offers Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {offers.map((offer) => {
              const badge = getOfferBadge(offer);
              const features = getOfferFeatures(offer);
              
              return (
                <div key={offer.id} className="relative">
                  {/* Badge */}
                  {badge && (
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${badge.color} text-white px-4 py-1 rounded-full text-sm font-semibold z-10`}>
                      {badge.text}
                    </div>
                  )}
                  
                  {/* Card */}
                  <div className={`bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300 hover:scale-105 hover:border-blue-500/50 ${
                    badge ? 'border-blue-500/30' : 'border-gray-700/50'
                  }`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{offer.name}</h3>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${(offer.priceCents / 100).toLocaleString()}
                        {offer.isSubscription && <span className="text-lg text-gray-400">/month</span>}
                      </div>
                      {offer.isCreditEligible && (
                        <div className="text-blue-400 font-semibold">
                          {offer.creditsValue} Credit{offer.creditsValue !== 1 ? 's' : ''} Included
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectOffer(offer)}
                      className={`w-full py-4 px-6 rounded-lg font-semibold transition-all flex items-center justify-center ${
                        badge 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Get Started Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                    {/* Credit System Info */}
                    {offer.isCreditEligible && (
                      <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                        <div className="text-sm text-blue-400 font-medium mb-1">Credit System:</div>
                        <div className="text-xs text-gray-400">
                          • 1 credit = 1 RichhNick Event access<br/>
                          • 2 credits = 1 Platform Feature (Famous Animal, The Debut, We Go Tampa, Ugly Money Podcast)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-2" />
                <span>Secure Payment Cloud Checkout</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-2" />
                <span>Guaranteed Engagement Boost</span>
              </div>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-400 mr-2" />
                <span>Proven Viral Growth System</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secure Checkout Modal */}
      {showSecureCheckout && (
        <SecureCheckout
          selectedOffer={selectedOffer}
          onClose={() => {
            setShowSecureCheckout(false);
            setSelectedOffer(null);
          }}
          onSuccess={handleSecureCheckoutSuccess}
        />
      )}
    </>
  );
};

export default OffersSection;
