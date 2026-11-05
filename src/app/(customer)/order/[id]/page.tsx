'use client';

import React, { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket-client';
import { Clock, CheckCircle2, AlertCircle, ChefHat, Bike } from 'lucide-react';

export default function OrderTrackerPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (data.order) setOrder(data.order);
      } catch (err) {
        console.error('Fetch Order Tracker Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Connect to WebSocket channel for live updates
    const socket = getSocket();
    socket.emit('track_order', params.id);

    socket.on('order_status_updated', ({ status }) => {
      setOrder((prev: any) => (prev ? { ...prev, status } : prev));
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [params.id]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading tracker...</div>;
  }

  if (!order) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Order not found.</div>;
  }

  const steps = [
    { key: 'PLACED', label: 'Order Placed', icon: Clock },
    { key: 'PREPARING', label: 'In Kitchen', icon: ChefHat },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: CheckCircle2 },
    { key: 'COMPLETED', label: 'Out for Delivery', icon: Bike },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 text-center shadow-xl">
        <span className="bg-amber-500/10 text-amber-400 font-mono font-bold px-3 py-1 rounded-full text-xs uppercase">
          {order.orderNumber}
        </span>
        <h1 className="text-2xl font-black text-white mt-3">Estimated Delivery</h1>
        <p className="text-3xl font-extrabold text-amber-400 mt-1">
          {new Date(order.promisedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-zinc-400 mt-2">
          Outlet: <span className="text-zinc-200 font-bold">{order.outlet.name}</span> | FSSAI #{order.outlet.fssaiLicense}
        </p>
      </div>

      {/* Progress Pipeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 shadow-xl">
        <h3 className="font-extrabold text-white text-base mb-6">Live Kitchen Pipeline</h3>

        <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    isCurrent
                      ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-amber-400 font-medium">Kitchen staff is working on your food</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="font-extrabold text-white text-base mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
              <span className="text-zinc-200 font-bold">
                {item.menuItem.name} <span className="text-amber-400 font-extrabold">x{item.quantity}</span>
              </span>
              <span className="text-zinc-400 font-mono">₹{item.unitPrice * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 text-base font-black text-white">
          <span>Total Paid (UPI)</span>
          <span className="text-amber-400 font-mono">₹{order.totalAmount}</span>
        </div>
      </div>
    </div>
  );
}