
"use client";

import { useCallback, useEffect, useState } from "react";

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
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  subtotal?: number;
  totalAmount?: number;
  estPrepMins?: number;
  estimatedPrepTime?: number;
  promisedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  outlet?: {
    name?: string;
    city?: string;
  };
  customer?: {
    name?: string;
    phone?: string;
  };
  items?: OrderItem[];
  preparation?: {
    estimatedMinutes?: number;
    elapsedMinutes?: number;
    isOverdue?: boolean;
  };
};

const steps: { status: OrderStatus; label: string; description: string }[] = [
  {
    status: "PLACED",
    label: "Order placed",
    description: "Your order has been received.",
  },
  {
    status: "PREPARING",
    label: "Preparing",
    description: "Our kitchen is preparing your food.",
  },
  {
    status: "READY_FOR_PICKUP",
    label: "Ready for pickup",
    description: "Your order is ready.",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    description: "Your order has been completed.",
  },
];

const statusIndex: Record<OrderStatus, number> = {
  PLACED: 0,
  PREPARING: 1,
  READY_FOR_PICKUP: 2,
  COMPLETED: 3,
  CANCELLED: -1,
};

export default function OrderTrackingPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOrder = useCallback(async () => {
    const orderId = new URLSearchParams(window.location.search).get("orderId");

    if (!orderId) {
      setError("Order ID is missing from the tracking URL.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || "Unable to load order.");
      }

      const rawOrder = data.order ?? data;

      if (!rawOrder?.id) {
        throw new Error("Order details were not returned by the server.");
      }

      const normalizedItems: OrderItem[] = (rawOrder.items ?? []).map(
        (item: any) => ({
          id: item.id,
          name: item.name ?? item.menuItem?.name ?? "Menu item",
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? item.price ?? 0),
          total: Number(
            item.total ??
              item.lineTotal ??
              Number(item.unitPrice ?? item.price ?? 0) *
                Number(item.quantity ?? 0)
          ),
        })
      );

      setOrder({
        ...rawOrder,
        items: normalizedItems,
      });

      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrder();

    const interval = window.setInterval(fetchOrder, 5000);

    return () => window.clearInterval(interval);
  }, [fetchOrder]);

  const formatDate = (value?: string | null) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const money = (value?: number) =>
    `₹${Number(value ?? 0).toFixed(2)}`;

  if (loading) {
    return (
      <main className="tracking-page">
        <div className="tracking-container">
          <div className="tracking-panel">
            <p>Loading your order details...</p>
          </div>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="tracking-page">
        <div className="tracking-container">
          <div className="tracking-panel">
            <h1>Unable to track order</h1>
            <p>{error}</p>
            <button onClick={fetchOrder}>Try Again</button>
          </div>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!order) return null;

  const currentStep =
    statusIndex[order.status] === undefined
      ? -1
      : statusIndex[order.status];

  const estimatedMinutes =
    order.preparation?.estimatedMinutes ??
    order.estPrepMins ??
    order.estimatedPrepTime ??
    0;

  const isOverdue = Boolean(order.preparation?.isOverdue);

  return (
    <main className="tracking-page">
      <div className="tracking-container">
        <header className="tracking-header">
          <a href="/" className="brand">
            CRAVE
          </a>
          <span>Order Tracking</span>
        </header>

        <section className="tracking-panel">
          <div className="order-heading">
            <div>
              <span className="eyebrow">ORDER NUMBER</span>
              <h1>{order.orderNumber}</h1>
            </div>

            <span className={`status-badge ${order.status.toLowerCase()}`}>
              {order.status.replaceAll("_", " ")}
            </span>
          </div>

          {order.status === "CANCELLED" ? (
            <div className="cancelled-message">
              <h2>Order cancelled</h2>
              <p>
                This order has been cancelled. Please contact the outlet if
                you need assistance.
              </p>
            </div>
          ) : (
            <>
              <div className="progress-section">
                <h2>Order progress</h2>

                <div className="timeline">
                  {steps.map((step, index) => {
                    const completed = currentStep >= index;
                    const active = currentStep === index;

                    return (
                      <div className="timeline-step" key={step.status}>
                        <div
                          className={`timeline-icon ${
                            completed ? "completed" : ""
                          } ${active ? "active" : ""}`}
                        >
                          {completed ? "✓" : index + 1}
                        </div>

                        <div className="timeline-content">
                          <h3>{step.label}</h3>
                          <p>{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="estimate-card">
                <div>
                  <span>Estimated preparation time</span>
                  <strong>{estimatedMinutes} minutes</strong>
                </div>

                <div>
                  <span>Expected time</span>
                  <strong>{formatDate(order.promisedAt)}</strong>
                </div>
              </div>

              {isOverdue && (
                <div className="overdue-message">
                  Your order is taking longer than expected. Our kitchen is
                  checking the preparation.
                </div>
              )}
            </>
          )}

          <div className="details-section">
            <h2>Order details</h2>

            <div className="detail-row">
              <span>Outlet</span>
              <strong>{order.outlet?.name ?? "CRAVE Outlet"}</strong>
            </div>

            <div className="detail-row">
              <span>Customer</span>
              <strong>{order.customer?.name ?? "Customer"}</strong>
            </div>

            <div className="detail-row">
              <span>Phone</span>
              <strong>{order.customer?.phone ?? "Not available"}</strong>
            </div>

            <div className="detail-row">
              <span>Order placed</span>
              <strong>{formatDate(order.createdAt)}</strong>
            </div>

            <div className="detail-row">
              <span>Payment</span>
              <strong>{order.paymentStatus ?? "Not available"}</strong>
            </div>
          </div>

          <div className="items-section">
            <h2>Items ordered</h2>

            {order.items?.length ? (
              order.items.map((item) => (
                <div className="item-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>Quantity: {item.quantity}</span>
                  </div>
                  <strong>{money(item.total)}</strong>
                </div>
              ))
            ) : (
              <p>No item details available.</p>
            )}

            <div className="total-row">
              <span>Total amount</span>
              <strong>{money(order.totalAmount)}</strong>
            </div>
          </div>

          <footer className="tracking-footer">
            <p>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN")}`
                : "Waiting for updates"}
            </p>
            <p>Order information refreshes automatically every 5 seconds.</p>
            <button onClick={fetchOrder}>Refresh now</button>
          </footer>
        </section>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .tracking-page {
    min-height: 100vh;
    padding: 32px 16px;
    background: #f6f4f0;
    color: #26221f;
  }

  .tracking-container {
    max-width: 760px;
    margin: 0 auto;
  }

  .tracking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .brand {
    font-size: 25px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #a52b19;
    text-decoration: none;
  }

  .tracking-header span {
    color: #777;
    font-size: 14px;
  }

  .tracking-panel {
    padding: 28px;
    background: white;
    border: 1px solid #eee8e1;
    border-radius: 18px;
    box-shadow: 0 8px 30px rgba(0,0,0,.04);
  }

  .order-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-bottom: 24px;
    border-bottom: 1px solid #eee;
  }

  .eyebrow {
    color: #888;
    font-size: 11px;
    letter-spacing: 1.5px;
  }

  h1 {
    margin: 7px 0 0;
    font-size: 25px;
  }

  h2 {
    margin: 0 0 20px;
    font-size: 18px;
  }

  .status-badge {
    padding: 9px 12px;
    border-radius: 20px;
    background: #fff1d8;
    color: #95600b;
    font-size: 11px;
    font-weight: 800;
  }

  .status-badge.ready_for_pickup,
  .status-badge.completed {
    background: #e2f6e8;
    color: #21733b;
  }

  .status-badge.cancelled {
    background: #ffe5e5;
    color: #b42318;
  }

  .progress-section,
  .details-section,
  .items-section {
    padding-top: 26px;
    margin-top: 22px;
    border-top: 1px solid #eee;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline-step {
    display: flex;
    gap: 15px;
    min-height: 76px;
  }

  .timeline-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 2px solid #ddd;
    border-radius: 50%;
    color: #999;
    font-weight: 700;
  }

  .timeline-icon.completed {
    background: #e5f5e9;
    border-color: #29944b;
    color: #21733b;
  }

  .timeline-icon.active {
    border-color: #a52b19;
    box-shadow: 0 0 0 4px #f9e9e5;
  }

  .timeline-content h3 {
    margin: 4px 0 5px;
    font-size: 14px;
  }

  .timeline-content p {
    margin: 0;
    color: #888;
    font-size: 12px;
  }

  .estimate-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 18px;
    background: #fff7ed;
    border-radius: 12px;
  }

  .estimate-card div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .estimate-card span {
    color: #8a7565;
    font-size: 12px;
  }

  .estimate-card strong {
    font-size: 16px;
  }

  .overdue-message,
  .cancelled-message {
    margin-top: 18px;
    padding: 16px;
    border-radius: 10px;
    background: #fff1e8;
    color: #9b421e;
    font-size: 13px;
  }

  .cancelled-message h2 {
    margin-bottom: 8px;
  }

  .detail-row,
  .item-row,
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f1efec;
    font-size: 13px;
  }

  .detail-row span,
  .item-row span {
    color: #888;
  }

  .item-row div {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .total-row {
    margin-top: 12px;
    border-bottom: 0;
    font-size: 17px;
  }

  .tracking-footer {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid #eee;
    text-align: center;
  }

  .tracking-footer p {
    color: #888;
    font-size: 11px;
  }

  button {
    margin-top: 10px;
    padding: 11px 20px;
    border: 0;
    border-radius: 8px;
    background: #a52b19;
    color: white;
    font-weight: 700;
    cursor: pointer;
  }

  @media (max-width: 520px) {
    .tracking-panel {
      padding: 18px;
    }

    .order-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .estimate-card {
      grid-template-columns: 1fr;
    }
  }
`;

