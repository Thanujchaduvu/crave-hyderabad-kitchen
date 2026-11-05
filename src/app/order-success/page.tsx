
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  id: string;
  orderNumber?: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  items?: OrderItem[];
  createdAt?: string;
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderId!)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load order details.");
        }

        setOrder(data.order ?? data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to retrieve your order."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <main className="order-success-page">
        <div className="order-success-loading">
          <div className="order-loading-spinner" />
          <p>Confirming your order...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="order-success-page">
        <div className="order-success-card">
          <div className="order-failure-icon">!</div>
          <h1>Order details unavailable</h1>
          <p>{error || "We couldn't find this order."}</p>
          <button
            type="button"
            onClick={() => router.push("/menu")}
          >
            Return to menu
          </button>
        </div>
      </main>
    );
  }

  const confirmed =
    order.paymentStatus?.toUpperCase() === "SUCCESS" ||
    order.status?.toUpperCase() === "CONFIRMED";

  return (
    <main className="order-success-page">
      <header className="order-success-header">
        <div className="order-success-brand">
          CRAVE
          <small>HYDERABADI KITCHEN</small>
        </div>
      </header>

      <section className="order-success-card">
        <div className="order-success-icon">
          {confirmed ? "✓" : "!"}
        </div>

        <span className="order-success-eyebrow">
          {confirmed ? "ORDER RECEIVED" : "ORDER CREATED"}
        </span>

        <h1>
          {confirmed
            ? "Your order is confirmed!"
            : "Your order is being processed"}
        </h1>

        <p className="order-success-description">
          {confirmed
            ? "Thank you for choosing CRAVE. Our kitchen is getting started on your delicious meal."
            : "Your order has been created. Please check its payment and confirmation status below."}
        </p>

        <div className="order-number-box">
          <span>ORDER NUMBER</span>
          <strong>{order.orderNumber ?? order.id}</strong>
        </div>

        <div className="order-status-grid">
          <div>
            <span>Order status</span>
            <strong>{order.status}</strong>
          </div>

          <div>
            <span>Payment status</span>
            <strong>{order.paymentStatus}</strong>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="order-confirmed-items">
            <h3>Order summary</h3>

            {order.items.map((item, index) => (
              <div className="order-confirmed-item" key={index}>
                <span>
                  {item.name} × {item.quantity}
                </span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="order-confirmed-total">
          <span>Total amount</span>
          <strong>{formatPrice(order.totalAmount)}</strong>
        </div>

        <div className="order-success-actions">
          <button
            type="button"
            className="order-track-button"
            onClick={() =>
              router.push(
                `/order-tracking?orderId=${encodeURIComponent(order.id)}`
              )
            }
          >
            Track your order →
          </button>

          <button
            type="button"
            className="order-menu-button"
            onClick={() => router.push("/menu")}
          >
            Order more food
          </button>
        </div>

        <p className="order-success-footer">
          Thank you for ordering from CRAVE – Hyderabadi Kitchen.
        </p>
      </section>
    </main>
  );
}
