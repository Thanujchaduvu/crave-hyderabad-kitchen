
"use client";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isVeg: boolean;
  spiceLevel: number;
  allergens?: string[];
  imageUrl?: string | null;
  isAvailable: boolean;
}

interface MenuCardProps {
  item: MenuItem;
  quantity?: number;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart?: (itemId: string) => void;
}

export default function MenuCard({
  item,
  quantity = 0,
  onAddToCart,
  onRemoveFromCart,
}: MenuCardProps) {
  const available = item.isAvailable;

  const spiceLabel =
    item.spiceLevel <= 1
      ? "Mild"
      : item.spiceLevel <= 3
        ? "Medium"
        : "Spicy";

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(item.basePrice);

  return (
    <article className={`menu-card ${!available ? "menu-card-unavailable" : ""}`}>
      <div className="menu-card-image-wrap">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="menu-card-image"
            loading="lazy"
          />
        ) : (
          <div className="menu-card-image-placeholder">
            🍛
          </div>
        )}

        <span className={`menu-food-type ${item.isVeg ? "veg" : "non-veg"}`}>
          <span className="food-type-dot" />
          {item.isVeg ? "VEG" : "NON-VEG"}
        </span>

        {!available && (
          <div className="menu-unavailable-overlay">
            Currently unavailable
          </div>
        )}

        {quantity > 0 && (
          <span className="menu-cart-count">
            {quantity} in cart
          </span>
        )}
      </div>

      <div className="menu-card-content">
        <div className="menu-card-heading">
          <h3>{item.name}</h3>
          <span className="menu-spice-level">
            🌶️ {spiceLabel}
          </span>
        </div>

        <p className="menu-card-description">
          {item.description || "Freshly prepared with authentic ingredients."}
        </p>

        {item.allergens && item.allergens.length > 0 && (
          <p className="menu-allergens">
            <strong>Allergens:</strong> {item.allergens.join(", ")}
          </p>
        )}

        <div className="menu-card-footer">
          <div className="menu-price-block">
            <span className="menu-price">{formattedPrice}</span>
            <span className="menu-price-note">Inclusive of applicable taxes</span>
          </div>

          {quantity > 0 ? (
            <div className="menu-quantity-control">
              <button
                type="button"
                aria-label={`Remove one ${item.name}`}
                onClick={() => onRemoveFromCart?.(item.id)}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                aria-label={`Add one ${item.name}`}
                disabled={!available}
                onClick={() => onAddToCart(item)}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="menu-add-button"
              disabled={!available}
              onClick={() => onAddToCart(item)}
            >
              {available ? "ADD +" : "SOLD OUT"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
