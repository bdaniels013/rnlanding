import paypal from '@paypal/checkout-server-sdk';

class PayPalClient {
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
      throw new Error('Failed to create PayPal order');
    }
  }

  async createSubscription(subscriptionData) {
    try {
      const request = new paypal.subscriptions.SubscriptionsCreateRequest();
      request.prefer("return=representation");
      request.requestBody(subscriptionData);
      
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal create subscription error:', error);
      throw new Error('Failed to create PayPal subscription');
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
      throw new Error('Failed to capture PayPal order');
    }
  }

  async getOrder(orderId) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw new Error('Failed to get PayPal order');
    }
  }

  async refundPayment(captureId, amount, reason) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      request.prefer("return=representation");
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
      throw new Error('Failed to refund PayPal payment');
    }
  }

  verifyWebhookSignature(headers, body, webhookId) {
    try {
      // Verify webhook signature
      const webhookIdHeader = headers['paypal-webhook-id'];
      const transmissionId = headers['paypal-transmission-id'];
      const timestamp = headers['paypal-transmission-time'];
      const certUrl = headers['paypal-cert-url'];
      const authAlgo = headers['paypal-auth-algo'];
      const transmissionSig = headers['paypal-transmission-sig'];

      // Basic validation
      if (!webhookIdHeader || webhookIdHeader !== webhookId) {
        return false;
      }

      // TODO: Implement proper signature verification
      // For now, return true if webhook ID matches
      return true;
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const paypalService = new PayPalClient();