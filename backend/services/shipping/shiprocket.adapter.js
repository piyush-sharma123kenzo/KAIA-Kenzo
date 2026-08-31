import ShippingProvider from './shippingProvider.interface.js';

export class ShiprocketAdapter extends ShippingProvider {
  constructor() {
    super('Shiprocket');
    this.apiUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.email = process.env.SHIPROCKET_EMAIL || '';
    this.password = process.env.SHIPROCKET_PASSWORD || '';
    this.token = null;
    this.tokenExpiry = null;
  }

  isConfigured() {
    return Boolean(
      this.email &&
      this.password &&
      this.email !== 'your_shiprocket_email_here' &&
      !this.email.includes('placeholder')
    );
  }

  /**
   * Helper to obtain and cache Shiprocket API bearer token
   */
  async getAuthToken() {
    if (!this.isConfigured()) {
      throw new Error('Shipping provider (Shiprocket) is not configured.');
    }

    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.email, password: this.password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Shiprocket Auth failed: ${errText}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('Shiprocket Auth token missing in response');
      }

      this.token = data.token;
      // Cache token for 23 hours (Shiprocket tokens expire in 24 hours)
      this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      return this.token;
    } catch (err) {
      console.error('Shiprocket Authentication Error:', err.message);
      throw new Error(`Shiprocket provider unavailable: ${err.message}`);
    }
  }

  /**
   * 1. Create Shipment Order in Shiprocket
   */
  async createShipment(shipmentData) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'Shipping provider is not configured. Real courier assignment requires valid Shiprocket credentials.',
      };
    }

    try {
      const token = await this.getAuthToken();
      const payload = {
        order_id: shipmentData.sellerOrderId,
        order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: shipmentData.pickupLocationName || 'Primary Warehouse',
        billing_customer_name: shipmentData.shippingAddress.fullName,
        billing_last_name: '',
        billing_address: shipmentData.shippingAddress.addressLine1,
        billing_address_2: shipmentData.shippingAddress.addressLine2 || '',
        billing_city: shipmentData.shippingAddress.city,
        billing_pincode: shipmentData.shippingAddress.postalCode,
        billing_state: shipmentData.shippingAddress.state,
        billing_country: shipmentData.shippingAddress.country || 'India',
        billing_email: shipmentData.customerEmail || 'customer@kaia.tech',
        billing_phone: shipmentData.shippingAddress.phone,
        shipping_is_billing: true,
        order_items: shipmentData.items.map((it) => ({
          name: it.name,
          sku: it.sku || 'SKU-ITEM',
          units: it.qty,
          selling_price: it.price,
          discount: 0,
          tax: 0,
          hsn: 8517,
        })),
        payment_method: 'Prepaid',
        sub_total: shipmentData.subtotal,
        length: shipmentData.package.length,
        breadth: shipmentData.package.breadth,
        height: shipmentData.package.height,
        weight: shipmentData.package.weight,
      };

      const response = await fetch(`${this.apiUrl}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok || resData.status_code === 400) {
        return {
          success: false,
          configured: true,
          message: resData.message || 'Error creating order in Shiprocket',
          rawResponse: resData,
        };
      }

      return {
        success: true,
        configured: true,
        providerOrderId: resData.order_id,
        providerShipmentId: resData.shipment_id,
        rawResponse: resData,
      };
    } catch (err) {
      console.error('Shiprocket createShipment error:', err.message);
      return {
        success: false,
        configured: true,
        message: err.message || 'Shipment creation failed with shipping provider.',
      };
    }
  }

  /**
   * 2. Generate Shipping Label
   */
  async generateLabel(providerShipmentId) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'Shipping provider is not configured.',
      };
    }

    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiUrl}/courier/generate/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [providerShipmentId] }),
      });

      const resData = await response.json();
      if (resData.label_url || resData.label_created) {
        return {
          success: true,
          labelUrl: resData.label_url || '',
          rawResponse: resData,
        };
      }

      return {
        success: false,
        message: resData.message || 'Could not generate label with courier provider.',
        rawResponse: resData,
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 3. Schedule Courier Pickup
   */
  async schedulePickup(pickupData) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'Shipping provider is not configured.',
      };
    }

    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiUrl}/courier/generate/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [pickupData.providerShipmentId] }),
      });

      const resData = await response.json();
      return {
        success: response.ok,
        pickupStatus: resData.pickup_status || 'Scheduled',
        rawResponse: resData,
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 4. Cancel Shipment with Provider
   */
  async cancelShipment(providerShipmentId, awbNumber) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'Shipping provider is not configured.',
      };
    }

    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiUrl}/orders/cancel/shipment/awbs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ awbs: [awbNumber] }),
      });

      const resData = await response.json();
      return {
        success: response.ok,
        rawResponse: resData,
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 5. Track Shipment
   */
  async trackShipment(awbOrTrackingNumber) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'Shipping provider is not configured.',
        events: [],
      };
    }

    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiUrl}/courier/track/awb/${awbOrTrackingNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      const trackingData = resData.tracking_data;
      if (!trackingData || !trackingData.shipment_track) {
        return {
          success: false,
          configured: true,
          message: 'No tracking events found for this AWB with provider.',
          events: [],
        };
      }

      const activities = trackingData.shipment_track_activities || [];
      const events = activities.map((act) => ({
        status: act['sr-status-label'] || act.activity || 'IN_TRANSIT',
        description: act.activity || 'Shipment status updated',
        location: act.location || '',
        eventTime: new Date(act.date),
        source: 'ShiprocketAPI',
      }));

      return {
        success: true,
        configured: true,
        currentStatus: trackingData.shipment_track[0]?.current_status,
        events,
      };
    } catch (err) {
      return {
        success: false,
        configured: true,
        message: err.message,
        events: [],
      };
    }
  }

  /**
   * 6. Calculate Shipping Rates
   */
  async getShippingRates(rateQuery) {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        message: 'Shipping provider is not configured.',
        rates: [],
      };
    }

    try {
      const token = await this.getAuthToken();
      const url = `${this.apiUrl}/courier/serviceability?pickup_postcode=${rateQuery.pickupPincode}&delivery_postcode=${rateQuery.deliveryPincode}&weight=${rateQuery.weight}&cod=0`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await response.json();
      if (!response.ok || !resData.data || !resData.data.available_courier_companies) {
        return {
          success: false,
          message: resData.message || 'No available couriers for this route.',
          rates: [],
        };
      }

      const rates = resData.data.available_courier_companies.map((c) => ({
        courierName: c.courier_name,
        courierCode: c.courier_company_id?.toString(),
        rate: c.rate,
        estimatedDeliveryDays: c.estimated_delivery_days,
        etd: c.etd,
      }));

      return {
        success: true,
        configured: true,
        rates,
      };
    } catch (err) {
      return { success: false, message: err.message, rates: [] };
    }
  }

  verifyWebhookSignature(payload, signature, secret) {
    // Shiprocket sends standard custom token/header verification
    if (!secret) return true;
    return signature === secret;
  }
}

export default new ShiprocketAdapter();
