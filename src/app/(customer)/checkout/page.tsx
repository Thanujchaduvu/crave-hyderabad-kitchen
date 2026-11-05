
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  isVeg: boolean;
  imageUrl?: string | null;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  instructions: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("TEST");

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    instructions: "",
  });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("crave-cart");

      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {
      setError("Unable to load your cart. Please return to the menu.");
    }
  }, []);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, entry) =>
          sum + entry.item.basePrice * entry.quantity,
        0
      ),
    [cart]
  );

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  function updateCustomer(
    field: keyof CustomerDetails,
    value: string
  ) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty. Please add items before checkout.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(customer.phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(customer.pincode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          items: cart.map(({ item, quantity }) => ({
            menuItemId: item.id,
            quantity,
          })),
          paymentMethod,
          paymentMode: "TEST",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to place your order.");
      }

      if (data.paymentStatus !== "SUCCESS" && !data.orderId) {
        throw new Error(
          "The order was not confirmed. Please try again."
        );
      }

      const orderId = data.orderId ?? data.id;

      if (!orderId) {
        throw new Error("Order response did not contain an order ID.");
      }

      localStorage.removeItem("crave-cart");

      router.push(
        `/order-success?orderId=${encodeURIComponent(orderId)}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button
          type="button"
          className="checkout-back-button"
          onClick={() => router.push("/menu")}
        >
          ← Back to menu
        </button>

        <div className="checkout-brand">
          <span>CRAVE</span>
          <small>HYDERABADI KITCHEN</small>
        </div>

        <span className="checkout-secure-label">
          🔒 Secure checkout
        </span>
      </header>

      <div className="checkout-container">
        <div className="checkout-title">
          <span>ALMOST THERE</span>
          <h1>Complete your order</h1>
          <p>Freshly prepared. Carefully packed. Made with love.</p>
        </div>

        <form onSubmit={placeOrder} className="checkout-grid">
          <section className="checkout-form-section">
            <div className="checkout-panel">
              <h2>01. Contact details</h2>

              <div className="checkout-field">
                <label htmlFor="customer-name">Full name *</label>
                <input
                  id="customer-name"
                  required
                  value={customer.name}
                  onChange={(e) =>
                    updateCustomer("name", e.target.value)
                  }
                  placeholder="Enter your full name"
                />
              </div>

              <div className="checkout-two-columns">
                <div className="checkout-field">
                  <label htmlFor="customer-phone">Mobile number *</label>
                  <input
                    id="customer-phone"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) =>
                      updateCustomer(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="10-digit number"
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="customer-email">Email address</label>
                  <input
                    id="customer-email"
                    type="email"
                    value={customer.email}
                    onChange={(e) =>
                      updateCustomer("email", e.target.value)
                    }
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="checkout-panel">
              <h2>02. Delivery address</h2>

              <div className="checkout-field">
                <label htmlFor="customer-address">
                  House / Street address *
                </label>
                <textarea
                  id="customer-address"
                  required
                  rows={3}
                  value={customer.address}
                  onChange={(e) =>
                    updateCustomer("address", e.target.value)
                  }
                  placeholder="House number, street, landmark..."
                />
              </div>

              <div className="checkout-two-columns">
                <div className="checkout-field">
                  <label htmlFor="customer-city">City *</label>
                  <input
                    id="customer-city"
                    required
                    value={customer.city}
                    onChange={(e) =>
                      updateCustomer("city", e.target.value)
                    }
                    placeholder="Your city"
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="customer-pincode">PIN code *</label>
                  <input
                    id="customer-pincode"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={customer.pincode}
                    onChange={(e) =>
                      updateCustomer(
                        "pincode",
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="6-digit PIN"
                  />
                </div>
              </div>

              <div className="checkout-field">
                <label htmlFor="delivery-instructions">
                  Delivery instructions (optional)
                </label>
                <textarea
                  id="delivery-instructions"
                  rows={2}
                  value={customer.instructions}
                  onChange={(e) =>
                    updateCustomer("instructions", e.target.value)
                  }
                  placeholder="Any directions for the kitchen or delivery team?"
                />
              </div>
            </div>

            <div className="checkout-panel">
              <h2>03. Payment method</h2>

              <label className="checkout-payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="TEST"
                  checked={paymentMethod === "TEST"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />

                <span>
                  <strong>Test payment</strong>
                  <small>
                    Use the assignment&apos;s test payment flow.
                  </small>
                </span>

                <span>🧪</span>
              </label>
            </div>
          </section>

          <aside className="checkout-summary-panel">
            <h2>Your order</h2>

            {cart.length === 0 ? (
              <p className="checkout-empty">
                Your cart is empty.
              </p>
            ) : (
              <div className="checkout-summary-items">
                {cart.map(({ item, quantity }) => (
                  <div
                    className="checkout-summary-item"
                    key={item.id}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <small>Qty: {quantity}</small>
                    </div>

                    <span>
                      {formatPrice(item.basePrice * quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="checkout-total-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="checkout-total-row">
              <span>Taxes</span>
              <span>Included in listed prices</span>
            </div>

            <div className="checkout-grand-total">
              <span>Total payable</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            {error && (
              <p className="checkout-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="checkout-place-order"
              disabled={loading || cart.length === 0}
            >
              {loading ? "Processing..." : "Place test order"}
              {!loading && <span>→</span>}
            </button>

            <p className="checkout-disclaimer">
              This is a test checkout for the CRAVE project.
              No real payment will be collected by this screen.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}

