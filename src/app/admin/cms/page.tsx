'use client';

import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, DollarSign } from 'lucide-react';

export default function CentralMenuCmsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCentralMenu() {
      try {
        const res = await fetch('/api/admin/menu');
        const data = await res.json();
        if (data.items) setItems(data.items);
      } catch (err) {
        console.error('Failed to load central menu:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCentralMenu();
  }, []);

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, basePrice: newPrice } : item))
    );
  };

  const savePriceMatrix = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/menu/update-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      alert('Central menu prices & tariffs updated across all 17 outlets!');
    } catch (err) {
      console.error('Failed to save price matrix:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-zinc-900 p-6 max-w-6xl mx-auto font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-amber-200 pb-4">
        <div>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Central Marketing Portal
          </span>
          <h1 className="text-3xl font-black text-zinc-900 mt-2">Central Menu CMS & Price Matrix</h1>
          <p className="text-xs text-zinc-600 mt-1">
            Global price tariffs include 5% GST. Updates sync across all 14 dine-in outlets and 3 cloud kitchens in &lt;1 second.
          </p>
        </div>

        <button
          onClick={savePriceMatrix}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-300 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 transition text-sm shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Publish Global Prices'}
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20 text-zinc-400 font-medium">Loading pricing matrix...</div>
      ) : (
        <div className="bg-white border border-amber-200/80 rounded-2xl overflow-hidden shadow-md shadow-amber-900/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/60 border-b border-amber-200 text-xs font-black uppercase text-zinc-700 tracking-wider">
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Dietary</th>
                <th className="p-4">AI Complexity Weight</th>
                <th className="p-4">Base Price (₹ incl 5% GST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition">
                  <td className="p-4 font-bold text-zinc-900">{item.name}</td>
                  <td className="p-4 text-zinc-600">{item.category?.name || 'Main Course'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${item.isVeg ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-zinc-600">{item.prepComplexity}x</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold">₹</span>
                      <input
                        type="number"
                        value={item.basePrice}
                        onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                        className="w-28 bg-white border border-zinc-300 rounded-lg px-3 py-1.5 font-bold text-orange-700 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}