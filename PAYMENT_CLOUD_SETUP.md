# Payment Cloud Integration Setup Guide

This guide will help you set up the secure checkout page with Payment Cloud integration.

## 🚀 Quick Start

### 1. Get Payment Cloud Credentials

1. **Sign up for Payment Cloud** at [paymentcloud.com](https://paymentcloud.com)
2. **Complete merchant verification** (they need to see your secure checkout page first)
3. **Get your credentials** from the Payment Cloud dashboard:
   - Secret Key (for backend API calls)
   - Public Key (for frontend tokenization)

### 2. Configure Environment Variables

Copy the template and add your credentials:

```bash
cp env.payment-cloud.template .env.local
```

Edit `.env.local` and add your Payment Cloud credentials:

```env
PAYMENT_CLOUD_SECRET_KEY=your_actual_secret_key_here
PAYMENT_CLOUD_PUBLIC_KEY=your_actual_public_key_here
PAYMENT_CLOUD_ENVIRONMENT=sandbox
```

### 3. Test the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the checkout flow:**
   - Click "Reserve Event Seat" on your landing page
   - Fill in customer information
   - Try different payment methods:
     - Credit/Debit Card (uses Payment Cloud tokenization)
     - ACH Bank Transfer
     - PayPal (redirects to existing PayPal flow)

## 🔧 Features Implemented

### ✅ Payment Methods
- **Credit/Debit Cards** - Secure tokenization via Payment Cloud
- **ACH Bank Transfers** - Direct bank account payments
- **PayPal** - Redirects to existing PayPal integration
- **Apple Pay** - Ready for configuration (needs merchant ID)
- **Google Pay** - Ready for configuration (needs merchant ID)

### ✅ Security Features
- **PCI Compliance** - Card data never touches your servers
- **Tokenization** - Sensitive data replaced with secure tokens
- **SSL Encryption** - All data encrypted in transit
- **Input Validation** - Client and server-side validation
- **Error Handling** - Comprehensive error messages

### ✅ UI/UX Features
- **Modern Design** - Matches your site's aesthetic perfectly
- **Mobile Responsive** - Works on all devices
- **Progress Indicators** - Clear step-by-step flow
- **Loading States** - Visual feedback during processing
- **Security Badges** - Trust indicators for customers

## 🛠️ Technical Implementation

### Frontend (React Component)
- **File:** `src/components/SecureCheckout.jsx`
- **Features:** Multi-step checkout, payment method selection, form validation
- **Integration:** Payment Cloud Collect.js SDK for card tokenization

### Backend (Express API)
- **File:** `api/payment-cloud/charge.js`
- **Features:** Payment processing, response handling, error management
- **Integration:** Direct API calls to Payment Cloud

### Database Integration
- **Ready for:** Transaction logging, customer data storage, credit management
- **TODO:** Add database calls in the charge endpoint

## 🔐 Security Best Practices

1. **Never store card data** - Use Payment Cloud tokenization
2. **Validate all inputs** - Both client and server-side
3. **Use HTTPS** - Always in production
4. **Log transactions** - For audit and debugging
5. **Handle errors gracefully** - Don't expose sensitive information

## 🧪 Testing

### Test Cards (Sandbox Mode)
```
Visa: 4111111111111111
Mastercard: 5555555555554444
Amex: 378282246310005
CVV: Any 3-4 digits
Expiry: Any future date
```

### Test ACH
```
Routing: 021000021 (Chase Bank test routing)
Account: Any 8-12 digits
Name: Any name
```

## 🚀 Production Deployment

### 1. Update Environment Variables
```env
PAYMENT_CLOUD_ENVIRONMENT=production
PAYMENT_CLOUD_SECRET_KEY=your_production_secret_key
PAYMENT_CLOUD_PUBLIC_KEY=your_production_public_key
```

### 2. Configure Webhooks (Optional)
Set up webhooks in Payment Cloud dashboard to receive payment notifications:
- URL: `https://your-domain.com/api/payment-cloud/webhook`
- Events: Transaction completed, failed, etc.

### 3. Enable Apple Pay & Google Pay
1. **Apple Pay:** Get merchant ID from Apple Developer account
2. **Google Pay:** Configure in Google Pay Console
3. **Update environment variables** with merchant IDs

## 📊 Monitoring & Analytics

### Logs to Monitor
- Payment success/failure rates
- Error messages and response codes
- Transaction amounts and methods
- Customer information (anonymized)

### Recommended Tools
- Payment Cloud dashboard for transaction monitoring
- Server logs for error tracking
- Database queries for business analytics

## 🆘 Troubleshooting

### Common Issues

**"Payment system not configured"**
- Check that `PAYMENT_CLOUD_SECRET_KEY` is set
- Verify the key is correct and active

**"Card tokenization failed"**
- Check that `PAYMENT_CLOUD_PUBLIC_KEY` is set
- Verify the Collect.js SDK is loading
- Check browser console for JavaScript errors

**"Payment failed" with response code**
- Check Payment Cloud response codes documentation
- Verify card details are valid
- Check if card is supported by Payment Cloud

**ACH payments not working**
- Verify routing number is valid
- Check account number format
- Ensure account holder name matches

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=payment-cloud:*
```

## 📞 Support

- **Payment Cloud Support:** [support.paymentcloud.com](https://support.paymentcloud.com)
- **Technical Issues:** Check server logs and browser console
- **Integration Questions:** Refer to Payment Cloud API documentation

## 🔄 Next Steps

1. **Test thoroughly** in sandbox mode
2. **Get Payment Cloud approval** with your secure checkout page
3. **Configure production credentials**
4. **Set up monitoring and alerts**
5. **Enable additional payment methods** (Apple Pay, Google Pay)
6. **Add database integration** for transaction storage
7. **Implement webhooks** for real-time notifications

---

**Ready to go live?** Your secure checkout page is now fully integrated and ready for Payment Cloud verification! 🎉
