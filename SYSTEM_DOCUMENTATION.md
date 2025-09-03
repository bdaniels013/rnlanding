# Rich Nick Offers System - Complete Documentation

## 🎯 System Overview

The Rich Nick Offers System is a production-ready sales funnel with integrated admin dashboard that processes PayPal payments, manages credit balances, handles bookings, and stores all artifacts securely.

### Core Features
- **🛒 E-commerce**: PayPal checkout integration with order management
- **💳 Credit System**: Award and track credits for events and platform features
- **📅 Booking Management**: Schedule events and platform features
- **👥 Customer Management**: Full customer profiles and history
- **📊 Admin Dashboard**: Real-time metrics and order management
- **🔐 Authentication**: Secure login with role-based access control
- **📄 Document Management**: Contracts, invoices, and receipts
- **📧 Notifications**: Email and SMS confirmations

## 💰 Offers Structure

### 1. Monthly Creator Pass - $1,000/month
- **Credits**: 1 credit
- **Includes**: Access to 1 RichhNick Event + content shoot + strategy call
- **Type**: Recurring subscription

### 2. Annual Plan - $10,000/year  
- **Credits**: 12 credits
- **Includes**: 12 Events OR 6 Platform Features (2 credits each)
- **Type**: Annual subscription

### 3. Ongoing Content Management - $1,500/month
- **Credits**: 0 credits
- **Includes**: Weekly follow-ups and collaboration
- **Type**: Service subscription (no credits)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: API Routes (Vite-compatible)
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: PayPal Checkout + Webhooks
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Ready for S3-compatible storage
- **Notifications**: Ready for SendGrid (email) + Twilio (SMS)

### Database Schema
```sql
# Core entities:
- users (authentication, roles)
- customers (customer profiles)
- offers (product catalog)
- orders (purchase records)
- order_items (line items)
- payments (payment tracking)
- credits_ledger (credit transactions)
- bookings (event/platform reservations)
- platform_slots (available features)
- contracts (agreements)
- invoices (billing documents)
- notifications (email/SMS log)
- audit_logs (security tracking)
```

## 🚀 Quick Start

### 1. Initial Setup
```bash
npm install
npm run setup
```

### 2. Environment Configuration
Copy `env.template` to `.env` and update:
```bash
# Database (required)
DATABASE_URL="postgresql://user:pass@host:5432/db"

# PayPal (required for payments)
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_WEBHOOK_ID="your-paypal-webhook-id"

# Auth (required)
NEXTAUTH_SECRET="your-secret-key-here"
```

### 3. Database Setup
```bash
npx prisma db push
npm run db:seed
```

### 4. Development
```bash
npm run dev
```

## 📡 API Endpoints

### Public Endpoints
- `GET /api/offers` - List all available offers
- `POST /api/checkout/create` - Create new order and PayPal payment
- `POST /api/paypal/webhook` - Handle PayPal payment notifications

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Customer Endpoints (Authenticated)
- `GET /api/bookings?customer_id=X` - List customer bookings
- `POST /api/bookings` - Create new booking

### Admin Endpoints (Admin Role Required)
- `GET /api/admin/dashboard` - Real-time metrics
- `GET /api/admin/orders` - Order management
- `POST /api/admin/orders` - Order actions (refund, resend receipt)

## 💳 Credit System Logic

### Credit Values
- **Monthly Creator Pass**: 1 credit
- **Annual Plan**: 12 credits
- **Content Management**: 0 credits

### Credit Usage
- **Event Booking**: 1 credit
- **Platform Feature**: 2 credits

### Credit Ledger
All credit transactions are tracked in `credits_ledger`:
- Positive delta = credits awarded
- Negative delta = credits spent/held
- `balance_after` = running balance
- Never allow negative balances

## 🛒 Purchase Flow

### Frontend Flow
1. **Landing Page** → Select offer
2. **Customer Info** → Name, email, phone
3. **Review** → Order summary and terms
4. **PayPal** → Secure payment processing
5. **Confirmation** → Credits awarded, receipts sent

### Backend Flow
1. `POST /api/checkout/create` → Create order + PayPal order
2. PayPal redirect → Customer approves payment
3. PayPal webhook → `PAYMENT.CAPTURE.COMPLETED`
4. Award credits → Update ledger
5. Send notifications → Email + SMS receipts

## 🎛️ Admin Dashboard

### Key Metrics
- Revenue today/MRR/ARR
- Orders and customers
- Credits outstanding
- Active subscriptions
- Recent orders table
- Upcoming platform slots

### Order Management
- Search and filter orders
- View order details
- Process refunds
- Resend receipts
- Download exports

## 🔐 Security Features

### Authentication
- JWT tokens with 7-day expiry
- bcrypt password hashing (12 rounds)
- Role-based access control (OWNER/ADMIN/STAFF/READONLY)
- 2FA ready (TOTP secret field)

### Audit Logging
- All admin actions logged
- IP address tracking
- Metadata storage for forensics
- Immutable audit trail

### Data Protection
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- HTTPS enforced
- Sensitive data encryption ready

## 📊 Database Relationships

```
User (1) → (0..n) Customer
Customer (1) → (0..n) Order
Customer (1) → (0..n) Booking
Customer (1) → (0..n) CreditsLedger
Order (1) → (0..n) OrderItem
Order (1) → (0..n) Payment
Order (1) → (0..n) Contract
Order (1) → (0..n) Invoice
Offer (1) → (0..n) OrderItem
```

## 🔧 Configuration

### Offers Management
Offers are configured in the database via the `offers` table:
```javascript
{
  sku: 'monthly-creator-pass',
  name: 'Monthly Creator Pass',
  priceCents: 100000, // $1,000
  isSubscription: true,
  creditsValue: 1,
  isCreditEligible: true
}
```

### Platform Slots
Available platform features are managed via `platform_slots`:
```javascript
{
  name: 'Famous Animal Feature',
  partner: 'Famous Animal',
  slotAt: '2025-10-01T10:00:00Z',
  status: 'AVAILABLE'
}
```

## 🚦 Development Workflow

### 1. Database Changes
```bash
# Make schema changes in prisma/schema.prisma
npx prisma db push  # Push to dev database
npx prisma generate # Regenerate client
```

### 2. Adding New Offers
```bash
# Update prisma/seed.js with new offers
npm run db:seed
```

### 3. Testing Payments
```bash
# Use PayPal sandbox for testing
# Test webhook with ngrok or similar
```

## 📈 Monitoring & Analytics

### Real-time Dashboard
- Live visitor count (TODO: implement tracking)
- Active checkout sessions
- Revenue metrics (daily/monthly/annual)
- Credit balances and outstanding amounts

### Audit Trail
- All user actions logged
- Payment webhook events stored
- Admin actions tracked with IP

## 🔄 Deployment Checklist

### Environment Setup
- [ ] PostgreSQL database provisioned
- [ ] PayPal app configured (live credentials)
- [ ] SendGrid account + API key
- [ ] Twilio account + phone number
- [ ] S3-compatible storage (optional)

### Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Admin password changed
- [ ] Webhook endpoints verified

### Testing
- [ ] Full purchase flow tested
- [ ] PayPal webhook delivery confirmed
- [ ] Credit system verified
- [ ] Admin dashboard functional

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check DATABASE_URL format
- Verify database server is running
- Ensure network connectivity

**PayPal Webhook Not Working**
- Verify webhook URL is publicly accessible
- Check PAYPAL_WEBHOOK_ID matches PayPal dashboard
- Validate webhook signature verification

**Credits Not Awarded**
- Check PayPal webhook delivery
- Verify order status is 'PAID'
- Review audit logs for errors

## 📚 API Documentation

### Sample Requests

**Create Checkout**
```bash
curl -X POST /api/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "customer_info": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0101"
    },
    "items": [{"offer_id": "monthly-creator-pass", "qty": 1}]
  }'
```

**Get Dashboard Metrics**
```bash
curl -X GET /api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Core API infrastructure
- [x] PayPal integration
- [x] Credit system
- [x] Admin dashboard
- [x] Basic checkout flow

### Phase 2 (Next)
- [ ] Email/SMS notifications
- [ ] Contract generation
- [ ] Invoice PDF generation
- [ ] Customer portal
- [ ] Advanced booking calendar

### Phase 3 (Future)
- [ ] Stripe integration
- [ ] Advanced analytics
- [ ] Referral system
- [ ] Multi-tenant support

---

**Built with ❤️ for Rich Nick's viral growth empire**
