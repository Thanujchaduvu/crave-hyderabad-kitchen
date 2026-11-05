
"use client";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  isVeg: boolean;
  imageUrl?: string | null;
  isAvailable: boolean;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface Outlet {
  id: string;
  name: string;
  city: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  selectedOutlet: Outlet | null;
  updateQuantity: (itemId: string, change: number) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  selectedOutlet,
  updateQuantity,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const validItems = cart.filter(
    (entry) => entry.quantity > 0
  );

  const subtotal = validItems.reduce(
    (total, entry) =>
      total + entry.item.basePrice * entry.quantity,
    0
  );

  const tax = 0;
  const total = subtotal + tax;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  function proceedToCheckout() {
    if (!selectedOutlet) {
      alert("Please select an outlet before checkout.");
      return;
    }

    if (validItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    window.location.href = "/checkout";
  }

  return (
    <div className="cart-drawer-root">
      <button
        type="button"
        className="cart-drawer-backdrop"
        onClick={onClose}
        aria-label="Close cart"
      />

      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Your shopping cart"
      >
        <div className="cart-drawer-header">
          <div>
            <span className="cart-eyebrow">CRAVE ORDER</span>
            <h2>Your Cart</h2>
            <p>
              {validItems.reduce(
                (sum, entry) => sum + entry.quantity,
                0
              )}{" "}
              items in your bag
            </p>
          </div>

          <button
            type="button"
            className="cart-close-button"
            onClick={onClose}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {selectedOutlet && (
          <div className="cart-outlet-info">
            <span>📍</span>
            <div>
              <strong>{selectedOutlet.name}</strong>
              <small>{selectedOutlet.city}</small>
            </div>
          </div>
        )}

        {validItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>
              Looks like you haven&apos;t added anything delicious yet.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="cart-continue-button"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {validItems.map(({ item, quantity }) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <span>🍛</span>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-title">
                      <span
                        className={`cart-food-indicator ${
                          item.isVeg ? "veg" : "non-veg"
                        }`}
                      />
                      <h4>{item.name}</h4>
                    </div>

                    <p>{formatPrice(item.basePrice)}</p>

                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, -1)
                        }
                        aria-label={`Remove one ${item.name}`}
                      >
                        −
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, 1)
                        }
                        aria-label={`Add one ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <strong className="cart-item-total">
                    {formatPrice(item.basePrice * quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Bill Summary</h3>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="cart-summary-row">
                <span>Taxes</span>
                <span>Included in item prices</span>
              </div>

              <div className="cart-summary-total">
                <span>Total Amount</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <p className="cart-tax-note">
                Final payable amount will be confirmed at checkout.
              </p>

              <button
                type="button"
                className="cart-checkout-button"
                onClick={proceedToCheckout}
              >
                Proceed to Checkout
                <span>→</span>
              </button>

              <button
                type="button"
                className="cart-continue-shopping"
                onClick={onClose}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

