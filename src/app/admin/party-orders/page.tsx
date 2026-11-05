'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, PartyPopper } from 'lucide-react';

export default function CateringManagerPortal() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartyOrders() {
      try {
        const res = await fetch('/api/party-orders');
        const data = await res.json();
        if (data.partyOrders) setRequests(data.partyOrders);
      } catch (err) {
        console.error('Failed to load party orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPartyOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/party-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Failed status update:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-6xl mx-auto font-sans">
      <header className="mb-8 border-b border-zinc-800 pb-4">
        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
          Catering Manager Portal
        </span>
        <h1 className="text-3xl font-black text-white mt-2">Bulk & Party Orders Approval</h1>
      </header>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading catering requests...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-extrabold text-amber-400">{req.guestCount} Guests</span>
                  <span className="text-xs font-bold bg-purple-950 text-purple-400 px-3 py-1 rounded-full uppercase">
                    {req.status}
                  </span>
                </div>

                <p className="text-sm font-bold text-white mb-1">{req.menuSummary}</p>
                <p className="text-xs text-zinc-400 mb-4 font-mono">
                  Event Date: {new Date(req.eventDate).toLocaleDateString()}
                </p>

                {req.managerNotes && (
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-zinc-300 mb-4">
                    <strong>Notes:</strong> {req.managerNotes}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-lg font-black text-white font-mono">₹{req.estimatedQuote}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(req.id, 'APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Quote
                  </button>
                  <button
                    onClick={() => updateStatus(req.id, 'REJECTED')}
                    className="bg-zinc-800 hover:bg-red-700 text-zinc-400 hover:text-white font-bold text-xs px-3 py-2 rounded-xl transition"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}