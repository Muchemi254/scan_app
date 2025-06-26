import { useState } from 'react';

const ReceiptForm = ({
  initialData,
  onSubmit,
  onImageChange,
  loading,
}: {
  initialData: any;
  onSubmit: (data: any) => void;
  onImageChange: (file: File | null) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState({
    supplier: initialData?.supplier || '',
    totalAmount: initialData?.totalAmount || '',
    taxAmount: initialData?.taxAmount || '',
    receiptDate: initialData?.receiptDate || '',
    category: initialData?.category || '',
    invoiceNumber: initialData?.invoiceNumber || '',
    kraPin: initialData?.kraPin || '',
    cuInvoice: initialData?.cuInvoice || '',
    items: initialData?.items?.length ? initialData.items : [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, price: '' }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Supplier</label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Total Amount</label>
          <input
            type="text"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Tax Amount</label>
          <input
            type="text"
            name="taxAmount"
            value={formData.taxAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Date</label>
          <input
            type="text"
            name="receiptDate"
            value={formData.receiptDate}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="MM/DD/YYYY"
          />
        </div>

        <div>
          <label className="block mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Invoice Number</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">KRA PIN</label>
          <input
            type="text"
            name="kraPin"
            value={formData.kraPin}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">CU Invoice</label>
          <input
            type="text"
            name="cuInvoice"
            value={formData.cuInvoice}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1">Receipt Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onImageChange(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Items</h3>
        {formData.items?.map((item: any, index: number) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
              className="w-20 p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Price"
              value={item.price}
              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
              className="w-24 p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="p-2 text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm"
        >
          + Add Item
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ReceiptForm;
