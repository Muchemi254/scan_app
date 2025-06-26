import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardPage = ({ userId }: { userId: string | null }) => {
  const [processedCount, setProcessedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [batchTitles, setBatchTitles] = useState<string[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [supplierTotals, setSupplierTotals] = useState<Record<string, number>>({});
  const [averageValue, setAverageValue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [totalSpend, setTotalSpend] = useState(0);
  const [subtotal, setSubtotal] = useState(0);     // Before tax
const [taxTotal, setTaxTotal] = useState(0);     // Tax only


  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
  
    const ref = collection(db, `users/${userId}/receipts`);
  
    const unsubscribe = onSnapshot(ref, snapshot => {
      const all = snapshot.docs.map(doc => doc.data());
      const total = all.length;
      const processed = all.filter(r => r.status === 'processed').length;
      const needsReview = all.filter(r => r.status === 'needs_review').length;
  
      const batches = Array.from(
        new Set(
          all.map(r => (r.batchTitle || '').trim()).filter(title => title.length > 0)
        )
      );
  
      const categoryMap: Record<string, number> = {};
      const supplierMap: Record<string, number> = {};
      let subtotal = 0; // before tax
      let taxTotal = 0; // only tax
      let totalSpend = 0; // subtotal + tax
      let count = 0;
  
      all.forEach((r: any) => {
        let receiptSubtotal = 0;
        let receiptTax = 0;
  
        if (Array.isArray(r.items)) {
          r.items.forEach((item: any) => {
            const price = parseFloat(item.price || '0');
            const qty = Number(item.quantity || 0);
            const tax = parseFloat(item.tax || '0');
  
            const itemSubtotal = price * qty;
            const itemTax = tax * qty;
  
            receiptSubtotal += itemSubtotal;
            receiptTax += itemTax;
          });
        }
  
        const total = receiptSubtotal + receiptTax;
  
        subtotal += receiptSubtotal;
        taxTotal += receiptTax;
        totalSpend += total;
        count++;
  
        const category = r.category || 'Uncategorized';
        categoryMap[category] = (categoryMap[category] || 0) + total;
  
        const supplier = r.supplier || 'Unknown';
        supplierMap[supplier] = (supplierMap[supplier] || 0) + total;
      });
  
      setTotalCount(total);
      setProcessedCount(processed);
      setReviewCount(needsReview);
      setBatchTitles(batches);
      setCategoryTotals(categoryMap);
      setSupplierTotals(supplierMap);
      setAverageValue(count ? totalSpend / count : 0);
      setTotalSpend(totalSpend); // 👈 include this in your component state
      setTaxTotal(taxTotal);     // 👈 new state: total tax
      setSubtotal(subtotal);     // 👈 new state: total before tax
    });
  
    return () => unsubscribe();
  }, [userId]);
  

  const cards = [
    {
      title: 'Total Receipts',
      count: totalCount,
      link: '/receipts',
      color: 'bg-indigo-100 text-indigo-800',
    },
    {
      title: 'Processed',
      count: processedCount,
      link: '/receipts',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Needs Review',
      count: reviewCount,
      link: '/review',
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      title: 'Receipt Batches',
      count: batchTitles.length,
      link: '#',
      onClick: () => setShowModal(true),
      color: 'bg-blue-100 text-blue-800',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">📊 Receipt Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`p-6 rounded shadow hover:shadow-md transition cursor-pointer ${card.color}`}
            onClick={card.onClick || (() => navigate(card.link))}
          >
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-3xl font-bold">{card.count}</p>
          </div>
        ))}

        {/* Average value */}
        {/* Total spend */}
        <div className="bg-white p-6 rounded shadow">
  <h4 className="text-lg font-semibold mb-2">Total Spend (Incl. Tax)</h4>
  <p className="text-3xl font-bold text-green-700">
    KES {totalSpend.toFixed(2)}
  </p>
</div>

<div className="bg-white p-6 rounded shadow">
  <h4 className="text-lg font-semibold mb-2">Excluding VAT</h4>
  <p className="text-2xl font-medium text-blue-700">
    KES {subtotal.toFixed(2)}
  </p>
</div>

<div className="bg-white p-6 rounded shadow">
  <h4 className="text-lg font-semibold mb-2">VAT</h4>
  <p className="text-2xl font-medium text-blue-700">
    KES {taxTotal.toFixed(2)}
  </p>
</div>
      </div>
      

      {/* Charts and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Doughnut chart */}
        <div className="bg-white p-6 rounded shadow">
          <h4 className="text-md font-semibold mb-4">Receipt Status</h4>
          <Doughnut
            data={{
              labels: ['Processed', 'Needs Review'],
              datasets: [
                {
                  data: [processedCount, reviewCount],
                  backgroundColor: ['#34d399', '#facc15'],
                  borderWidth: 1,
                },
              ],
            }}
          />
        </div>

        {/* Bar chart for categories */}
        <div
  className="bg-white p-6 rounded shadow"
  style={{
    height: `${Object.keys(categoryTotals).length * 40 + 80}px`, // 40px per bar + top padding
  }}
>
  <h4 className="text-md font-semibold mb-4">Spend by Category</h4>
  <Bar
    data={{
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: 'KES',
          data: Object.values(categoryTotals),
          backgroundColor: '#6366f1',
          borderRadius: 4,
        },
      ],
    }}
    options={{
      indexAxis: 'y',
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `KES ${context.formattedValue}`,
          },
        },
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
        },
      },
      scales: {
        x: {
          ticks: {
            callback: value =>
              Number(value).toLocaleString('en-KE', {
                minimumFractionDigits: 0,
              }),
          },
        },
        y: {
          ticks: {
            font: {
              size: 12,
            },
            autoSkip: false,
          },
        },
      },
    }}
  />
</div>

        {/* Top 5 suppliers */}
        <div className="bg-white p-6 rounded shadow col-span-1 md:col-span-2">
          <h4 className="text-lg font-semibold mb-4">Top 5 Suppliers by Spend</h4>
          <ul className="space-y-2 text-sm">
            {Object.entries(supplierTotals)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([supplier, total], i) => (
                <li
                  key={i}
                  className="flex justify-between border-b pb-1 border-gray-200"
                >
                  <span>{supplier}</span>
                  <span className="font-medium">KES {total.toLocaleString()}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Modal for Batches */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg relative">
            <button
              className="absolute top-2 right-3 text-red-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ❌
            </button>
            <h3 className="text-xl font-semibold mb-4">📦 Receipt Batches</h3>
            {batchTitles.length === 0 && <p>No batches available.</p>}
            <ul className="space-y-2">
              {batchTitles.map((batch, i) => (
                <li
                  key={i}
                  className="cursor-pointer p-2 border rounded hover:bg-gray-100 text-sm"
                  onClick={() => {
                    navigate(`/receipts?batch=${encodeURIComponent(batch)}`);
                    setShowModal(false);
                  }}
                >
                  {batch}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
