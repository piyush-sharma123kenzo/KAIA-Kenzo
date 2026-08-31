/**
 * Base Abstract Shipping Provider Interface for KAIA Technologies
 * Enables modular support for Shiprocket, Delhivery, Blue Dart, or Custom Logistics.
 */
export class ShippingProvider {
  constructor(name = 'GenericShippingProvider') {
    this.name = name;
  }

  isConfigured() {
    throw new Error('isConfigured() must be implemented by provider adapter');
  }

  async createShipment(shipmentData) {
    throw new Error('createShipment() must be implemented by provider adapter');
  }

  async generateLabel(providerShipmentId, providerOrderId) {
    throw new Error('generateLabel() must be implemented by provider adapter');
  }

  async schedulePickup(pickupData) {
    throw new Error('schedulePickup() must be implemented by provider adapter');
  }

  async cancelShipment(providerShipmentId, awbNumber) {
    throw new Error('cancelShipment() must be implemented by provider adapter');
  }

  async trackShipment(awbOrTrackingNumber) {
    throw new Error('trackShipment() must be implemented by provider adapter');
  }

  async getShippingRates(rateQuery) {
    throw new Error('getShippingRates() must be implemented by provider adapter');
  }

  verifyWebhookSignature(payload, signature, secret) {
    throw new Error('verifyWebhookSignature() must be implemented by provider adapter');
  }
}

export default ShippingProvider;
