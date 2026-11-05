
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  RefreshCw,
  Clock,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  Loader2,
  Phone,
} from "lucide-react";

type OrderStatus =
  | "PLACED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isVeg?: boolean;
};

type KitchenOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: {
    name: string | null;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  preparation: {
    estimatedMinutes: number;
    elapsedMinutes: number;
    promisedAt: string | null;
    isOverdue: boolean;
  };
  deliveryAddress?: string | null;
  deliveryInstructions?: string | null;
  createdAt: string;
};

const statusLabels: Record<OrderStatus, string> = {
  PLACED: "New Order",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "COMPLETED",
};

const statusColors: Record<OrderStatus, string> = {
  PLACED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY_FOR_PICKUP: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function KitchenDashboard() {
  const params = useParams();
  const outletId = (params?.outletId as string) ?? "";

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (manual = false) => {
    if (!outletId) return;

    try {
      if (manual) setRefreshing(true);

      const response = await fetch(
        `/api/kitchen/orders?outletId=${encodeURIComponent(outletId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load kitchen orders");
      }

      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [outletId]);

  useEffect(() => {
    fetchOrders();

    const interval = window.setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchOrders]);

  async function updateStatus(
    orderId: string,
    status: OrderStatus
  ) {
    try {
      setUpdatingId(orderId);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Status update failed");
      }

      await fetchOrders();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Unable to update order"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "COMPLETED" &&
      order.status !== "CANCELLED"
  );

  const countByStatus = (status: OrderStatus) =>
    orders.filter((order) => order.status === status).length;

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#a94c29]" />
          <p className="mt-3 text-gray-600">Loading kitchen orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#a94c29]">
              CRAVE · Kitchen Operations
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#28231e]">
              Kitchen Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Outlet ID: {outletId}
            </p>
          </div>

          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-[#a94c29] px-5 py-3 font-semibold text-white hover:bg-[#81391f] disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: "Active Orders",
              value: activeOrders.length,
              icon: PackageCheck,
            },
            {
              label: "New Orders",
              value: countByStatus("PLACED"),
              icon: Clock,
            },
            {
              label: "Preparing",
              value: countByStatus("PREPARING"),
              icon: ChefHat,
            },
            {
              label: "Overdue",
              value: orders.filter(
                (order) => order.preparation.isOverdue
              ).length,
              icon: AlertTriangle,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <stat.icon className="mb-3 text-[#a94c29]" size={23} />
              <p className="text-2xl font-bold text-[#28231e]">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#28231e]">
            Active Kitchen Orders
          </h2>
          <span className="text-sm text-gray-500">
            Auto-refresh every 5 seconds
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <ChefHat className="mx-auto mb-4 text-gray-400" size={40} />
            <h3 className="text-lg font-semibold text-gray-700">
              No active orders
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              New customer orders will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {activeOrders.map((order) => {
              const next = nextStatus[order.status];

              return (
                <article
                  key={order.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    order.preparation.isOverdue
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        ORDER NUMBER
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[#28231e]">
                        {order.orderNumber}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-y border-gray-100 py-4">
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {order.customer.name || "Customer"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="mt-1 flex items-center gap-1 font-medium text-[#a94c29]"
                      >
                        <Phone size={14} />
                        {order.customer.phone}
                      </a>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Received</p>
                      <p className="mt-1 font-medium text-gray-800">
                        {formatTime(order.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Elapsed time
                      </p>
                      <p className="mt-1 font-medium text-gray-800">
                        {order.preparation.elapsedMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="mb-3 font-bold text-gray-800">
                      Order Items
                    </h4>

                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-800">
                            ₹{item.total.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-[#faf8f4] p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Estimated preparation
                      </span>
                      <strong>
                        {order.preparation.estimatedMinutes} min
                      </strong>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-600">Payment</span>
                      <strong className="text-green-700">
                        {order.paymentStatus}
                      </strong>
                    </div>

                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <strong className="text-lg text-[#28231e]">
                        ₹{order.totalAmount.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {order.preparation.isOverdue && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                      <AlertTriangle size={17} />
                      This order is overdue. Please check preparation.
                    </div>
                  )}

                  {order.deliveryAddress && (
                    <div className="mt-4 text-sm text-gray-600">
                      <strong>Delivery address:</strong>{" "}
                      {order.deliveryAddress}
                    </div>
                  )}

                  {order.deliveryInstructions && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Instructions:</strong>{" "}
                      {order.deliveryInstructions}
                    </div>
                  )}

                  {next && (
                    <button
                      onClick={() => updateStatus(order.id, next)}
                      disabled={updatingId === order.id}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a94c29] px-4 py-3 font-semibold text-white hover:bg-[#81391f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}

                      {updatingId === order.id
                        ? "Updating..."
                        : next === "PREPARING"
                          ? "Start Preparing"
                          : next === "READY_FOR_PICKUP"
                            ? "Mark as Ready"
                            : "Complete Order"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
