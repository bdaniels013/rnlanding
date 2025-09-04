import { paypalClient as PayPalSDKClient, Environment } from '@paypal/paypal-server-sdk';

class PayPalClient {
  constructor() {
    this.client = PayPalSDKClient({
      clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
      },
      environment: process.env.PAYPAL_ENV === 'live' 
        ? Environment.Live 
        : Environment.Sandbox,
    });
  }

  async createOrder(orderData) {
    try {
      const { body: order } = await this.client.ordersController.ordersCreate({
        body: orderData,
        prefer: 'return=representation'
      });
      return order;
    } catch (error) {
      console.error('PayPal create order error:', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(orderId) {
    try {
      const { body: capture } = await this.client.ordersController.ordersCapture({
        id: orderId,
        prefer: 'return=representation'
      });
      return capture;
    } catch (error) {
      console.error('PayPal capture order error:', error);
      throw new Error('Failed to capture PayPal order');
    }
  }

  async getOrder(orderId) {
    try {
      const { body: order } = await this.client.ordersController.ordersGet({
        id: orderId
      });
      return order;
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw new Error('Failed to get PayPal order');
    }
  }

  async refundPayment(captureId, amount, reason) {
    try {
      const { body: refund } = await this.client.paymentsController.capturesRefund({
        id: captureId,
        body: {
          amount: {
            currencyCode: 'USD',
            value: amount
          },
          noteToPayer: reason
        }
      });
      return refund;
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw new Error('Failed to refund PayPal payment');
    }
  }

  verifyWebhookSignature(headers, body, webhookId) {
    try {
      // Verify webhook signature
      // This is a simplified version - implement proper verification
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
export const paypalClient = new PayPalClient();
