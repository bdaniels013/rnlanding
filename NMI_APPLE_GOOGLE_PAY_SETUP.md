# NMI Apple Pay & Google Pay Setup Guide

## Overview
Apple Pay and Google Pay integration with NMI requires specific merchant configuration in the NMI merchant portal before they can be used in your application.

## Apple Pay Setup

### 1. NMI Merchant Portal Configuration
1. Log into your NMI merchant portal
2. Navigate to **Settings** → **Apple Pay**
3. Enable Apple Pay for your merchant account
4. Configure the following:
   - **Merchant ID**: `merchant.com.richhnick` (or your custom ID)
   - **Domain Name**: `richhnick.org`
   - **Display Name**: `Rich Nick`
   - **Supported Networks**: Visa, Mastercard, Amex, Discover

### 2. Apple Developer Account Setup
1. Log into [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new **Merchant ID**:
   - Identifier: `merchant.com.richhnick`
   - Description: `Rich Nick Payment Processing`
4. Create a **Merchant ID Certificate**:
   - Download the Certificate Signing Request (CSR)
   - Upload to Apple Developer Portal
   - Download the merchant certificate
5. Upload the merchant certificate to NMI merchant portal

### 3. Environment Variables
Add these to your Render environment variables:
```bash
APPLE_MERCHANT_ID="merchant.com.richhnick"
APPLE_PAY_DOMAIN="richhnick.org"
```

## Google Pay Setup

### 1. Google Pay Console Configuration
1. Log into [Google Pay Console](https://pay.google.com/business/console)
2. Create a new merchant account
3. Configure the following:
   - **Merchant Name**: `Rich Nick`
   - **Merchant ID**: Your Google Pay merchant ID
   - **Supported Payment Methods**: Cards, Digital Wallets
   - **Supported Networks**: Visa, Mastercard, Amex, Discover

### 2. NMI Merchant Portal Configuration
1. Log into your NMI merchant portal
2. Navigate to **Settings** → **Google Pay**
3. Enable Google Pay for your merchant account
4. Enter your Google Pay merchant ID
5. Configure supported payment methods

### 3. Environment Variables
Add these to your Render environment variables:
```bash
GOOGLE_PAY_MERCHANT_ID="your-google-pay-merchant-id"
REACT_APP_GOOGLE_MERCHANT_ID="your-google-pay-merchant-id"
```

## Testing

### Apple Pay Testing
1. Use Safari on macOS or iOS device
2. Ensure device has Touch ID or Face ID enabled
3. Test with Apple Pay test cards in sandbox mode

### Google Pay Testing
1. Use Chrome browser on Android or desktop
2. Ensure Google Pay is set up on the device
3. Test with Google Pay test cards in sandbox mode

## Current Status
- ✅ **Card Payments**: Fully functional
- ✅ **ACH Payments**: Fully functional  
- ✅ **PayPal**: Fully functional
- ⚠️ **Apple Pay**: Requires NMI merchant portal setup
- ⚠️ **Google Pay**: Requires NMI merchant portal setup
- 🔄 **Crypto**: Coming soon
- 🔄 **Digital Wallets**: Coming soon

## Support
For NMI Apple Pay and Google Pay setup assistance:
- NMI Support: [support@nmi.com](mailto:support@nmi.com)
- Apple Pay Support: [Apple Developer Support](https://developer.apple.com/support/)
- Google Pay Support: [Google Pay Support](https://support.google.com/pay/merchants)

## Notes
- Apple Pay and Google Pay will show "Setup Required" until properly configured
- Card and ACH payments work immediately without additional setup
- PayPal integration is already functional
