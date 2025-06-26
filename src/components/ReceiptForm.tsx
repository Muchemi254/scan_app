import { useState, useMemo, useEffect } from 'react';
import Decimal from 'decimal.js';

const DEFAULT_TAX_RATE = 16;

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
  const [formData, setFormData] = useState(() => ({
    supplier: initialData?.supplier || '',
    totalAmount: initialData?.totalAmount || '',
    taxAmount: initialData?.taxAmount || '',
    receiptDate: initialData?.receiptDate || '',
    category: initialData?.category || '',
    invoiceNumber: initialData?.invoiceNumber || '',
    kraPin: initialData?.kraPin || '',
    cuInvoice: initialData?.cuInvoice || '',
    items: initialData?.items?.length
      ? initialData.items.map((item: any) => ({
          ...item,
          tax: item.tax || '',
          isZeroRated: item.isZeroRated || false,
        }))
      : [],
  }));
  

  const [taxAdded, setTaxAdded] = useState(false);
  const [taxSplit, setTaxSplit] = useState(false);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [hasZeroTaxItems, setHasZeroTaxItems] = useState(false);

  // Check for zero-rated items on initial load
  useEffect(() => {
    const zeroTaxItemsExist = formData.items.some(item => 
      item.isZeroRated || parseFloat(item.tax || '0') === 0
    );
    setHasZeroTaxItems(zeroTaxItemsExist);
  }, [formData.items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index: number, field: string, value: string | number | boolean) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If changing zero-rated status, clear tax if marking as zero-rated
    if (field === 'isZeroRated' && value === true) {
      newItems[index].tax = '0';
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { 
        name: '', 
        quantity: 1, 
        price: '', 
        tax: '', 
        isZeroRated: false 
      }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate tax amount matches calculated tax if taxAmount is provided
    if (formData.taxAmount) {
      const calculatedTax = formData.items.reduce((sum, item) => {
        const quantity = new Decimal(item.quantity || 0);
        const tax = new Decimal(item.tax || 0);
        return sum.plus(quantity.mul(tax));
      }, new Decimal(0)).toNumber();

      const formTaxAmount = parseFloat(formData.taxAmount) || 0;
      const taxVariance = Math.abs(calculatedTax - formTaxAmount);

      if (taxVariance > 0.01 && taxVariance <= 0.05) {
        console.warn(`Minor tax mismatch: ${taxVariance.toFixed(3)} allowed.`);
      }
      
    }

    const sanitizedData = {
      ...formData,
      items: formData.items.map(({ name, quantity, price, tax, isZeroRated }) => ({
        name,
        quantity,
        price: new Decimal(price || 0).toDecimalPlaces(3).toString(),
        tax: tax ? new Decimal(tax || 0).toDecimalPlaces(3).toString() : '0',
        isZeroRated
      })),
    };
    onSubmit(sanitizedData);
  };

  const itemsTotal = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const quantity = new Decimal(item.quantity || 0);
      const price = new Decimal(item.price || 0);
      const tax = new Decimal(item.tax || 0);
      const lineTotal = quantity.mul(price.plus(tax)).toDecimalPlaces(3);
      return sum.plus(lineTotal);
    }, new Decimal(0)).toNumber();
  }, [formData.items]);

  const numericTotalAmount = parseFloat(formData.totalAmount) || 0;
  const variance = new Decimal(numericTotalAmount).minus(itemsTotal).toDecimalPlaces(3).toNumber();

  const handleAddTax = () => {
    if (taxSplit || hasZeroTaxItems) return;
    if (!taxAdded) setOriginalItems(formData.items);

    const updatedItems = formData.items.map((item) => {
      if (item.isZeroRated) return item; // Skip zero-rated items
      
      const price = parseFloat(item.price) || 0;
      const tax = new Decimal(price).mul(DEFAULT_TAX_RATE).div(100).toDecimalPlaces(3).toNumber();
      return { ...item, tax: tax.toString() };
    });

    setFormData({ ...formData, items: updatedItems });
    setTaxAdded(!taxAdded);
    if (taxAdded) {
      setFormData({ ...formData, items: originalItems });
    }
  };

  const handleSplitTax = () => {
    if (taxAdded || hasZeroTaxItems) return;
    if (!taxSplit) setOriginalItems(formData.items);

    const updatedItems = formData.items.map((item) => {
      if (item.isZeroRated) return item; // Skip zero-rated items
      
      const fullPrice = parseFloat(item.price) || 0;
      const fullPriceDecimal = new Decimal(fullPrice);
      const priceWithoutTax = fullPriceDecimal.div(new Decimal(1).plus(DEFAULT_TAX_RATE / 100));
      const tax = fullPriceDecimal.minus(priceWithoutTax);

      return {
        ...item,
        price: priceWithoutTax.toDecimalPlaces(3).toString(),
        tax: tax.toDecimalPlaces(3).toString(),
      };
    });

    setFormData({ ...formData, items: updatedItems });
    setTaxSplit(!taxSplit);
    if (taxSplit) {
      setFormData({ ...formData, items: originalItems });
    }
  };

  const handleIndividualTaxChange = (index: number) => {
    const item = formData.items[index];
    if (item.isZeroRated) return; // Skip zero-rated items

    const price = parseFloat(item.price) || 0;
    const tax = new Decimal(price).mul(DEFAULT_TAX_RATE).div(100).toDecimalPlaces(3).toNumber();
    
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], tax: tax.toString() };
    
    setFormData({ ...formData, items: newItems });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["supplier", "totalAmount", "taxAmount", "receiptDate", "category", "invoiceNumber", "kraPin", "cuInvoice"].map((name) => (
          <div key={name}>
            <label className="block mb-1 capitalize">{name.replace(/([A-Z])/g, ' $1')}</label>
            <input
              type="text"
              name={name}
              value={(formData as any)[name]}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required={name === 'supplier' || name === 'totalAmount'}
              disabled={name === 'taxAmount' && hasZeroTaxItems}
            />
          </div>
        ))}
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
        <div className="flex justify-between items-center mb-2 gap-4 flex-wrap">
          <h3 className="font-semibold">Items</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddTax}
              disabled={taxSplit || hasZeroTaxItems}
              className={`text-sm px-2 py-1 rounded ${taxAdded ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {taxAdded ? 'Undo Add Tax' : 'Prices Exclude Tax? Add'}
            </button>
            <button
              type="button"
              onClick={handleSplitTax}
              disabled={taxAdded || hasZeroTaxItems}
              className={`text-sm px-2 py-1 rounded ${taxSplit ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              {taxSplit ? 'Undo Split' : 'Prices Include Tax? Split'}
            </button>
          </div>
        </div>

        {formData.items.map((item, index) => {
          const quantity = new Decimal(item.quantity || 0);
          const price = new Decimal(item.price || 0);
          const tax = new Decimal(item.tax || 0);
          const total = quantity.mul(price.plus(tax));

          return (
            <div key={index} className="flex gap-2 mb-2 items-center">
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
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                className="w-20 p-2 border rounded"
                min="0.01"
                step="0.01"
              />
              <input
                type="text"
                placeholder="Price"
                value={item.price}
                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                className="w-24 p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Tax"
                value={item.tax || ''}
                onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                className="w-20 p-2 border rounded text-gray-600"
                disabled={item.isZeroRated}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.isZeroRated}
                  onChange={(e) => handleItemChange(index, 'isZeroRated', e.target.checked)}
                  className="mr-1"
                />
                <span className="text-sm">Zero-rated</span>
              </div>
              {!item.isZeroRated && (
                <button
                  type="button"
                  onClick={() => handleIndividualTaxChange(index)}
                  className="text-xs px-2 py-1 bg-gray-200 rounded"
                >
                  Calc Tax
                </button>
              )}
              <span className="w-24 text-right text-sm text-gray-700">{total.toFixed(3)}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm"
        >
          + Add Item
        </button>

        <div className="mt-4 p-2 bg-gray-50 border rounded text-sm">
          <p><strong>Calculated Items Total (incl. tax):</strong> {itemsTotal.toFixed(3)}</p>
          <p><strong>Form Total Amount:</strong> {formData.totalAmount}</p>
          <p className={Math.abs(Number(variance)) > 0.005 ? 'text-red-600' : 'text-green-600'}>
            <strong>Variance:</strong> {variance}
          </p>
          {hasZeroTaxItems && (
            <p className="text-yellow-600">
              <strong>Note:</strong> Some items are marked as zero-rated. Tax calculations disabled.
            </p>
          )}
        </div>
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