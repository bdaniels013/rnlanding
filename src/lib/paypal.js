import paypal from '@paypal/checkout-server-sdk';

class PayPalService {
  constructor() {
    // Set up the PayPal environment
    const environment = process.env.PAYPAL_ENV === 'live' 
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );
    
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createOrder(orderData) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody(orderData);
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal create order error:', error);
      throw new Error('Failed to create PayPal order: ' + error.message);
    }
  }

  async createSubscription(subscriptionData) {
    try {
      // For now, we'll use a simple HTTP request to create subscriptions
      // since the checkout SDK doesn't support subscriptions
      const response = await fetch('https://api-m.paypal.com/v1/billing/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
          'PayPal-Request-Id': `subscription-${Date.now()}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal create subscription error:', error);
      throw new Error('Failed to create PayPal subscription: ' + error.message);
    }
  }

  async captureOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.prefer("return=representation");
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal capture order error:', error);
      throw new Error('Failed to capture PayPal order: ' + error.message);
    }
  }

  async getOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw new Error('Failed to get PayPal order: ' + error.message);
    }
  }

  async refundPayment(captureId, amount, reason) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.requestBody({
        amount: {
          currency_code: 'USD',
          value: amount
        },
        note_to_payer: reason
      });
      
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