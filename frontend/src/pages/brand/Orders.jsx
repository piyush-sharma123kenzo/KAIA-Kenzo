import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, Truck, FileText, BarChart, FileCheck, ShieldAlert, Award, QrCode } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fulfillment states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scannedSerials, setScannedSerials] = useState({}); // { [productId]: ['SN1', 'SN2'] }
  const [availableSerialsMap, setAvailableSerialsMap] = useState({}); // { [productId]: [serialDocs] }
  const [processingFulfillment, setProcessingFulfillment] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/orders/seller/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenFulfillment = async (order) => {
    setSelectedOrder(order);
    
    // Initialize scanned serials structure
    const initialScanned = {};
    const serialsMap = {};

    setProcessingFulfillment(true);
    try {
      // Fetch available serial numbers for each product in the order
      for (let item of order.items) {
        initialScanned[item.product] = Array(item.qty).fill('');
        
        // Fetch serial numbers for this product
        const res = await axiosInstance.get(`/inventory/serials`);
        if (res.data.success) {
          // Filter available serial numbers for this specific product ID
          const productSerials = res.data.serials.filter(
            (s) => s.product?._id === item.product && s.status === 'Available'
          );
          serialsMap[item.product] = productSerials;
        }
      }
      setScannedSerials(initialScanned);
      setAvailableSerialsMap(serialsMap);
    } catch (err) {
      console.error('Error loading serial numbers for fulfillment:', err);
    } finally {
      setProcessingFulfillment(false);
    }
  };

  const handleSerialSelect = (productId, index, value) => {
    const updated = { ...scannedSerials };
    updated[productId][index] = value;
    setScannedSerials(updated);
  };

  const submitFulfillment = async (e) => {
    e.preventDefault();
    setProcessingFulfillment(true);

    // Format payload
    const itemsFulfillment = Object.keys(scannedSerials).map((productId) => ({
      product: productId,
      serials: scannedSerials[productId],
    }));

    // Basic validation: ensure all fields filled
    for (let item of itemsFulfillment) {
      if (item.serials.some(s => s === '')) {
        alert('Please assign serial numbers to all items in the shipment.');
        setProcessingFulfillment(false);
        return;
      }
    }

    try {
      const res = await axiosInstance.put(
        `/orders/seller/my-orders/${selectedOrder.orderId}/fulfill`,
        { itemsFulfillment }
      );

      if (res.data.success) {
        alert(res.data.message);
        setSelectedOrder(null);
        fetchOrders(); // Refresh order listing
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Fulfillment mapping failed.');
    } finally {
      setProcessingFulfillment(false);
    }
  };

  // Progress fulfillment status
  const handleUpdateStatus = async (childOrderId, nextStatus) => {
    try {
      const res = await axiosInstance.put(
        `/orders/seller/my-orders/${childOrderId}/status`,
        { status: nextStatus }
      );
      if (res.data.success) {
        alert(res.data.message);
        fetchOrders();
      }
    } catch (err) {
      alert('Error updating package status.');
    }
  };

  const handleDownloadInvoice = (childOrderId) => {
    window.open(`http://localhost:5000/api/orders/${childOrderId}/invoice`, '_blank');
  };

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading incoming orders...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Incoming Seller Orders</h2>
        <p className="text-xs text-brand-gray-500">Fulfill purchase orders, scan serials, and track logistics dispatches.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium">
          <p className="text-sm text-brand-gray-500">Your store has received no incoming orders yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
            <thead className="bg-brand-gray-50 uppercase tracking-wider font-semibold text-brand-gray-500">
              <tr>
                <th className="px-6 py-4">Order Reference</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Shipment Items</th>
                <th className="px-6 py-4">GST Invoice No</th>
                <th className="px-6 py-4">Courier Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-700">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-brand-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-gray-900">{order.orderId}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{order.parentOrder?.shippingAddress?.name || 'Customer'}</p>
                    <p className="text-[10px] text-brand-gray-450 mt-0.5">{order.parentOrder?.shippingAddress?.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="font-medium">
                          {item.name} <span className="text-brand-gray-400 font-bold">x {item.qty}</span>
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold">
                    {order.invoiceNumber || <span className="text-brand-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      order.fulfillmentStatus === 'Delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                      order.fulfillmentStatus === 'Processing' ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right space-y-1.5 whitespace-nowrap">
                    {order.fulfillmentStatus === 'Processing' && (
                      <button
                        onClick={() => handleOpenFulfillment(order)}
                        className="bg-brand-accent hover:bg-brand-accentHover text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase"
                      >
                        Pack & Scan
                      </button>
                    )}

                    {order.fulfillmentStatus === 'Packed' && (
                      <div className="flex flex-col space-y-1 items-end">
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'Shipped')}
                          className="bg-brand-dark hover:bg-brand-gray-850 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase w-28"
                        >
                          Dispatch package
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(order.orderId)}
                          className="text-brand-accent hover:underline text-[10px] font-semibold flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF Invoice</span>
                        </button>
                      </div>
                    )}

                    {order.fulfillmentStatus === 'Shipped' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'Delivered')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase w-28"
                      >
                        Confirm Delivery
                      </button>
                    )}

                    {order.fulfillmentStatus === 'Delivered' && (
                      <button
                        onClick={() => handleDownloadInvoice(order.orderId)}
                        className="text-brand-gray-500 hover:text-brand-gray-900 border px-3 py-1.5 rounded-sm text-[10px] font-semibold inline-flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fulfillment Pack & Scan Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden text-left">
            <div className="bg-brand-gray-50 px-6 py-4 border-b border-brand-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase">Pack & Scan: {selectedOrder.orderId}</h3>
                <p className="text-[10px] text-brand-gray-500 mt-0.5">Map warehouse serial numbers to customer shipment</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-brand-gray-400 hover:text-brand-gray-900">
                Cancel
              </button>
            </div>

            <form onSubmit={submitFulfillment} className="p-6 space-y-6">
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.product} className="space-y-3 p-4 bg-brand-gray-50 border rounded-sm">
                    <p className="font-bold text-xs text-brand-gray-800 uppercase tracking-wider">{item.name}</p>
                    <p className="text-[10px] text-brand-gray-500">Scan exactly {item.qty} serial barcode(s):</p>
                    
                    <div className="space-y-2">
                      {Array(item.qty).fill(0).map((_, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs">
                          <QrCode className="w-4 h-4 text-brand-gray-400" />
                          <select
                            required
                            value={scannedSerials[item.product]?.[idx] || ''}
                            onChange={(e) => handleSerialSelect(item.product, idx, e.target.value)}
                            className="flex-1 bg-white border border-brand-gray-250 p-2 rounded text-xs cursor-pointer text-brand-gray-800"
                          >
                            <option value="">Select Available Serial...</option>
                            {(availableSerialsMap[item.product] || []).map((ser) => (
                              <option key={ser.serialNumber} value={ser.serialNumber}>
                                {ser.serialNumber} {ser.imei1 ? `(IMEI: ${ser.imei1})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 border border-brand-gray-300 py-2.5 rounded text-xs font-semibold hover:bg-brand-gray-50"
                >
                  Close Panel
                </button>
                <button
                  type="submit"
                  disabled={processingFulfillment}
                  className="flex-1 bg-brand-accent hover:bg-brand-accentHover text-white py-2.5 rounded text-xs font-semibold transition-colors"
                >
                  {processingFulfillment ? 'Fulfilling...' : 'Fulfill & Print Label'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
