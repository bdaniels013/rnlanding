import pkg from '@paypal/paypal-server-sdk';
const { PayPalClient, Environment } = pkg;

class PayPalService {
  constructor() {
    // Set up the PayPal environment
    const environment = process.env.PAYPAL_ENV === 'live' 
      ? new Environment.Live(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new Environment.Sandbox(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );
    
    this.client = new PayPalClient(environment);
  }

  async createOrder(orderData) {
    try {
      const request = {
        method: 'POST',
        path: '/v2/checkout/orders',
        body: orderData,
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      };
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal create order error:', error);
      throw new Error('Failed to create PayPal order: ' + error.message);
    }
  }

  async createSubscription(subscriptionData) {
    try {
      const request = {
        method: 'POST',
        path: '/v1/billing/subscriptions',
        body: subscriptionData,
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      };
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal create subscription error:', error);
      throw new Error('Failed to create PayPal subscription: ' + error.message);
    }
  }

  async captureOrder(orderId) {
    try {
      const request = {
        method: 'POST',
        path: `/v2/checkout/orders/${orderId}/capture`,
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      };
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal capture order error:', error);
      throw new Error('Failed to capture PayPal order: ' + error.message);
    }
  }

  async getOrder(orderId) {
    try {
      const request = {
        method: 'GET',
        path: `/v2/checkout/orders/${orderId}`
      };
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw new Error('Failed to get PayPal order: ' + error.message);
    }
  }

  async refundPayment(captureId, amount, reason) {
    try {
      const request = {
        method: 'POST',
        path: `/v2/payments/captures/${captureId}/refund`,
        body: {
          amount: {
            currency_code: 'USD',
            value: amount
          },
          note_to_payer: reason
        },
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw new Error('Failed to refund PayPal payment: ' + error.message);
    }
  }

  verifyWebhookSignature(headers, body, webhookId) {
    // This is a placeholder. Proper webhook verification requires PayPal's SDK utility or manual implementation.
    // For now, we'll do a basic check.
    const transmissionId = headers['paypal-transmission-id'];
    const timestamp = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionSig = headers['paypal-transmission-sig'];

    if (!transmissionId || !timestamp || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
      console.warn('Missing PayPal webhook verification headers or webhook ID.');
      return false;
    }

    // TODO: Implement proper signature verification using PayPal's SDK or a robust library.
    // For now, we'll return true to allow processing, but this is INSECURE for production.
    console.warn('PayPal webhook signature verification is a placeholder and INSECURE for production.');
    return true;
  }
}

export const paypalService = new PayPalService();