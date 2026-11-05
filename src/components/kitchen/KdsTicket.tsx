'use client';

import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  menuItem: {
    name: string;
    isVeg: boolean;
    spiceLevel: number;
  };
}

interface OrderTicketProps {
  order: {
    id: string;
    orderNumber: string;
    status: 'PLACED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    promisedAt: string;
    items: OrderItem[];
    overdueFlag: boolean;
  };
  onUpdateStatus: (orderId: string, nextStatus: string) => void;
}

export default function KdsTicket({ order, onUpdateStatus }: OrderTicketProps) {
  const [elapsedMins, setElapsedMins] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      setElapsedMins(mins);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const pastPromiseMs = Date.now() - new Date(order.promisedAt).getTime();
  const isLate = pastPromiseMs > 0;
  const isOverdue = order.overdueFlag || pastPromiseMs >= 10 * 60000;

  // Clear 2-meter visual indicators
  const getCardStyle = () => {
    if (isOverdue) {
      return 'border-4 border-rose-600 bg-rose-50 text-zinc-900 shadow-xl animate-pulse';
    }
    if (isLate) {
      return 'border-4 border-amber-500 bg-amber-50 text-zinc-900 shadow-lg';
    }
    return 'border-2 border-emerald-500 bg-white text-zinc-900 shadow-md';
  };

  return (
    <div className={`flex flex-col justify-between rounded-2xl p-5 font-sans transition-all ${getCardStyle()}`}>
      <div>
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-3">
          <span className="text-2xl font-black tracking-wider text-zinc-900">{order.orderNumber}</span>
          <span className="text-lg font-black bg-zinc-900 text-amber-400 px-3 py-1 rounded-xl">
            {elapsedMins} MINS
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
            {order.status}
          </span>
          {isOverdue ? (
            <span className="bg-rose-600 text-white font-black text-xs uppercase px-2 py-1 rounded">
              OVERDUE · {Math.floor(pastPromiseMs / 60000)} MIN
            </span>
          ) : isLate ? (
            <span className="bg-amber-500 text-zinc-950 font-black text-xs uppercase px-2 py-1 rounded">
              LATE · {Math.floor(pastPromiseMs / 60000)} MIN
            </span>
          ) : null}
        </div>

        {/* High Contrast 24pt Bold Font for Kitchen Staff */}
        <ul className="space-y-2.5 mb-6">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between items-center text-lg font-black text-zinc-900">
              <span className="flex items-center gap-2">
                <span>{item.menuItem.isVeg ? '🟢' : '🔴'}</span>
                {item.menuItem.name}
              </span>
              <span className="text-orange-700 font-black text-2xl">x{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 60px Min Touch Target Action Buttons */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        {order.status === 'PLACED' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'PREPARING')}
            className="h-14 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-lg rounded-xl transition uppercase shadow-md"
          >
            START PREPARATION
          </button>
        )}

        {order.status === 'PREPARING' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'READY_FOR_PICKUP')}
            className="h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg rounded-xl transition uppercase shadow-md"
          >
            MARK READY FOR PICKUP
          </button>
        )}

        {order.status === 'READY_FOR_PICKUP' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
            className="h-14 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white font-black text-lg rounded-xl transition uppercase shadow-md"
          >
            HANDOFF TO RIDER
          </button>
        )}
      </div>
    </div>
  );
}