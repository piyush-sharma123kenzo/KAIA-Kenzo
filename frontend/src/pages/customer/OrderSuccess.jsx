import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const OrderSuccess = () => {
  const location = useLocation();
  const orderDetails = location.state?.order || {
    orderId: 'KAIA-' + Math.floor(100000 + Math.random() * 900000),
    finalAmount: 125000,
    shippingAddress: { name: 'Piyush Sharma', city: 'Delhi', state: 'Delhi', pinCode: '110001' }
  };

  return (
    <Container className="py-16 text-left select-none max-w-xl mx-auto">
      <div className="bg-white border border-brand-gray-250 p-8 rounded-sm shadow-premium text-center space-y-6">
        
        <div className="inline-block p-4 bg-green-50 border border-green-200 rounded-full text-green-700">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-brand-gray-900 tracking-tight uppercase">Order Placed Successfully!</h1>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
            Your marketplace checkout is complete. The brand owners will verify serial codes and print logistics shipping labels.
          </p>
        </div>

        {/* Order Summary Receipt */}
        <div className="border border-brand-gray-200 rounded text-left p-6 space-y-4 text-xs font-semibold text-brand-gray-650 bg-brand-light">
          <div className="flex justify-between border-b pb-2">
            <span>Order ID Reference:</span>
            <span className="font-mono font-extrabold text-brand-gray-900">{orderDetails.orderId}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Fulfillment Amount:</span>
            <span className="font-extrabold text-brand-gray-900">₹{orderDetails.finalAmount?.toLocaleString()}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-brand-gray-450">Shipping Destination:</span>
            <p className="font-extrabold text-brand-gray-900">{orderDetails.shippingAddress?.name || orderDetails.shippingAddress?.fullName}</p>
            <p className="text-brand-gray-550 leading-relaxed">
              {orderDetails.shippingAddress?.street || orderDetails.shippingAddress?.line1}, {orderDetails.shippingAddress?.city}, {orderDetails.shippingAddress?.state} - {orderDetails.shippingAddress?.postalCode || orderDetails.shippingAddress?.pinCode}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link to="/account?tab=orders" className="flex-1">
            <Button variant="primary" className="w-full text-xs font-bold uppercase tracking-wider">
              View Order Details
            </Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider">
              Continue Shopping
            </Button>
          </Link>
        </div>

      </div>
    </Container>
  );
};

export default OrderSuccess;
