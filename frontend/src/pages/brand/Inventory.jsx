import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, BarChart4, AlertCircle, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields for new Serial
  const [form, setForm] = useState({
    productId: '',
    serialNumber: '',
    imei1: '',
    imei2: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const fetchInventoryData = async () => {
    try {
      const invRes = await axiosInstance.get('/inventory');
      if (invRes.data.success) setInventory(invRes.data.inventory);

      const serRes = await axiosInstance.get('/inventory/serials');
      if (serRes.data.success) setSerials(serRes.data.serials);
    } catch (err) {
      console.error('Error fetching inventory details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleIngestSerial = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (!form.productId || !form.serialNumber) {
      setErrorMsg('Product selection and Serial Number are required.');
      return;
    }

    setIngesting(true);
    try {
      const res = await axiosInstance.post('/inventory/serials', {
        productId: form.productId,
        serialNumber: form.serialNumber.trim(),
        imei1: form.imei1.trim(),
        imei2: form.imei2.trim(),
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setForm({ productId: '', serialNumber: '', imei1: '', imei2: '' });
        fetchInventoryData(); // Reload listings
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error ingesting serial number.');
    } finally {
      setIngesting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading inventory directory...</div>;
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* Overview Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Warehouse Inventory & Serials</h2>
        <p className="text-xs text-brand-gray-500">Manage available stock counts and register unit serial identifiers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Register Serial Form */}
        <div className="lg:col-span-4 bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <h3 className="font-extrabold text-sm text-brand-gray-950 uppercase tracking-wider flex items-center space-x-2">
            <ClipboardList className="w-4.5 h-4.5 text-brand-accent" />
            <span>Ingest Unit Serial</span>
          </h3>

          {errorMsg && <p className="text-xs text-red-500 font-semibold bg-red-50 p-2.5 border border-red-200 rounded">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-green-600 font-semibold bg-green-50 p-2.5 border border-green-200 rounded">{successMsg}</p>}

          <form onSubmit={handleIngestSerial} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-brand-gray-650">Select Catalog Product:</label>
              <select
                required
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded text-xs cursor-pointer text-brand-gray-800"
              >
                <option value="">Select product...</option>
                {inventory.map(item => (
                  <option key={item._id} value={item._id}>{item.name} ({item.SKU})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-brand-gray-655">Unit Serial Number (Barcode):</label>
              <input
                type="text"
                required
                placeholder="e.g. MBP16SN006"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded text-xs uppercase font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-brand-gray-655 font-medium">Cellular IMEI 1 (Optional):</label>
              <input
                type="text"
                placeholder="e.g. 3589111..."
                value={form.imei1}
                onChange={(e) => setForm({ ...form, imei1: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-brand-gray-655 font-medium">Cellular IMEI 2 (Optional):</label>
              <input
                type="text"
                placeholder="e.g. 3589111..."
                value={form.imei2}
                onChange={(e) => setForm({ ...form, imei2: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={ingesting}
              className="w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-2.5 rounded transition-colors"
            >
              {ingesting ? 'Registering...' : 'Register Serial & Add Stock'}
            </button>
          </form>
        </div>

        {/* Right Column: Inventory Stock Table & Serials Directory */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Stock Quantities */}
          <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
            <h3 className="font-extrabold text-sm text-brand-gray-950 uppercase tracking-wider">Available Stock Status</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                <thead className="bg-brand-gray-50 text-brand-gray-500 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Available Stock</th>
                    <th className="px-4 py-3">Reserved Stock</th>
                    <th className="px-4 py-3">Threshold</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y text-brand-gray-700">
                  {inventory.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 font-semibold text-brand-gray-900">{item.name}</td>
                      <td className="px-4 py-3 font-semibold">{item.SKU}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${item.stock.availableQuantity <= item.stock.reorderThreshold ? 'text-red-500' : 'text-green-600'}`}>
                          {item.stock.availableQuantity} Units
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.stock.reservedQuantity} Units</td>
                      <td className="px-4 py-3 text-brand-gray-400">{item.stock.reorderThreshold} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Serials Directory */}
          <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
            <h3 className="font-extrabold text-sm text-brand-gray-955 uppercase tracking-wider">Warehouse Serials Directory</h3>
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                <thead className="bg-brand-gray-50 text-brand-gray-500 font-semibold uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-3 bg-brand-gray-50">Serial Number</th>
                    <th className="px-4 py-3 bg-brand-gray-50">Product Name</th>
                    <th className="px-4 py-3 bg-brand-gray-50">IMEI Codes</th>
                    <th className="px-4 py-3 bg-brand-gray-50">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y text-brand-gray-700">
                  {serials.map((ser) => (
                    <tr key={ser._id}>
                      <td className="px-4 py-3 font-bold text-brand-gray-900">{ser.serialNumber}</td>
                      <td className="px-4 py-3 truncate max-w-[200px]">{ser.product?.name || 'Unlinked Product'}</td>
                      <td className="px-4 py-3 text-brand-gray-400">
                        {ser.imei1 ? `IMEI1: ${ser.imei1}` : 'N/A'}
                        {ser.imei2 ? ` | IMEI2: ${ser.imei2}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ser.status === 'Available' ? 'bg-green-50 text-green-700 border border-green-200' :
                          ser.status === 'Sold' ? 'bg-brand-accent/5 text-brand-accent' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {ser.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Inventory;
