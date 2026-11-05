
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Flame,
  AlertCircle,
  ArrowRight,
  Search,
  Clock3,
  RefreshCw,
  UtensilsCrossed,
  Plus,
  Minus,
  Leaf,
} from 'lucide-react';

import OutletSelector from '@/components/customer/OutletSelector';
import CartDrawer from '@/components/customer/CartDrawer';
import { getSocket } from '@/lib/socket-client';

interface Outlet {
  id: string;
  name: string;
  city: string;
  deliveryRadiusKm: number;
  fssaiLicense: string;
  isCloudKitchen: boolean;
  distanceKm?: number | null;
  isDeliverable?: boolean | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isVeg: boolean;
  spiceLevel: number;
  allergens: string[];
  imageUrl: string;
  isAvailable: boolean;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

const fallbackPhotos = [
  'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80',
];

export default function CustomerMenuPage() {
  const [selectedOutlet, setSelectedOutlet] =
    useState<Outlet | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filterVeg, setFilterVeg] =
    useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Fetch menu from PostgreSQL
  useEffect(() => {
    const outletId = selectedOutlet?.id;

    if (!outletId) {
      setMenuItems([]);
      return;
    }

    const menuOutletId = outletId;
    let active = true;

    async function fetchMenu() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/menu?outletId=${encodeURIComponent(menuOutletId)}`,
          { cache: 'no-store' }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load menu.'
          );
        }

        const items = Array.isArray(data)
          ? data
          : data.items;

        if (!Array.isArray(items)) {
          throw new Error('Invalid menu response.');
        }

        if (active) {
          setMenuItems(items);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Something went wrong.'
          );
          setMenuItems([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMenu();

    return () => {
      active = false;
    };
  }, [selectedOutlet?.id, retryCount]);

  // Real-time inventory updates
  useEffect(() => {
    if (!selectedOutlet?.id) return;

    const socket = getSocket();

    const joinOutlet = () => {
      socket.emit('join_outlet_menu', selectedOutlet.id);
    };

    const onInventory = ({
      menuItemId,
      isAvailable,
    }: {
      menuItemId: string;
      isAvailable: boolean;
    }) => {
      setMenuItems((current) =>
        current.map((item) =>
          item.id === menuItemId
            ? { ...item, isAvailable }
            : item
        )
      );
    };

    if (socket.connected) joinOutlet();

    socket.on('connect', joinOutlet);
    socket.on('inventory_updated', onInventory);

    return () => {
      socket.off('connect', joinOutlet);
      socket.off('inventory_updated', onInventory);
    };
  }, [selectedOutlet?.id]);

  // Outlet selection
  const handleOutletSelection = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setCart([]);
    setMenuItems([]);
    setError('');
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;

    setCart((previous) => {
      const existing = previous.find(
        (entry) => entry.item.id === item.id
      );

      if (existing) {
        return previous.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }

      return [...previous, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (
    itemId: string,
    delta: number
  ) => {
    setCart((previous) =>
      previous
        .map((entry) =>
          entry.item.id === itemId
            ? {
                ...entry,
                quantity: entry.quantity + delta,
              }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  // Search and dietary filters
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const dietaryMatch =
        filterVeg === 'ALL' ||
        (filterVeg === 'VEG' && item.isVeg) ||
        (filterVeg === 'NON_VEG' && !item.isVeg);

      const searchMatch =
        `${item.name} ${item.description || ''}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      return dietaryMatch && searchMatch;
    });
  }, [menuItems, filterVeg, search]);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (sum, entry) =>
      sum + Number(entry.item.basePrice) * entry.quantity,
    0
  );

  return (
    <div className="customer-shell">

      {/* Navigation */}
      <header className="customer-header">
        <div className="customer-header-inner">

          <Link href="/" className="customer-brand">
            CRAVE
            <small>HYDERABADI KITCHEN</small>
          </Link>

          <OutletSelector
            selectedOutlet={selectedOutlet}
            onSelectOutlet={handleOutletSelection}
          />

          <button
            onClick={() => setIsCartOpen(true)}
            className="customer-cart-button flex items-center gap-2 px-4 py-2.5 font-bold"
          >
            <ShoppingBag size={17} />
            Cart
            <span className="bg-white text-orange-800 rounded-full min-w-5 h-5 px-1 grid place-items-center text-[10px]">
              {cartCount}
            </span>
          </button>

        </div>
      </header>

      <main className="customer-main">

        {/* Hero */}
        <section className="menu-hero">
          <div className="menu-hero-content">

            <span className="eyebrow">
              AUTHENTIC HYDERABADI FLAVOURS
            </span>

            <h1>
              A feast worth
              <br />
              slowing down for.
            </h1>

            <p>
              Fragrant dum biryani, delicious sides and
              traditional desserts. Made fresh and served
              with love.
            </p>

            <div className="flex items-center gap-4 mt-5 text-xs text-orange-100">
              <span className="flex items-center gap-2">
                <Clock3 size={14} />
                Freshly prepared
              </span>
              <span>•</span>
              <span>Prices include 5% GST</span>
            </div>

          </div>
        </section>

        {/* Menu heading */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

          <div>
            <span className="eyebrow">
              FROM OUR KITCHEN
            </span>

            <h2 className="text-3xl mt-2"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Explore the menu
            </h2>

            <p className="text-xs text-stone-500 mt-2">
              {selectedOutlet
                ? `Preparing orders from ${selectedOutlet.name}`
                : 'Choose your nearest outlet to begin'}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your favourite food..."
              className="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-3 text-xs outline-none focus:border-orange-500"
            />
          </div>

        </section>

        {/* Filters */}
        <div className="menu-controls">

          <div className="menu-filters">
            {[
              { value: 'ALL', label: 'All dishes' },
              { value: 'VEG', label: 'Vegetarian' },
              { value: 'NON_VEG', label: 'Non-vegetarian' },
            ].map((filter) => (
              <button
                key={filter.value}
                className={
                  filterVeg === filter.value ? 'active' : ''
                }
                onClick={() =>
                  setFilterVeg(
                    filter.value as 'ALL' | 'VEG' | 'NON_VEG'
                  )
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-500">
            {filteredItems.length} dishes
          </span>

        </div>

        {/* No outlet */}
        {!selectedOutlet && (
          <div className="customer-empty">
            <UtensilsCrossed
              size={35}
              className="mx-auto mb-4 text-orange-700"
            />
            <b className="text-stone-800 block">
              Welcome to CRAVE
            </b>
            <p className="mt-2">
              Select an outlet above to explore our menu.
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedOutlet && loading && (
          <div className="customer-empty">
            <RefreshCw
              size={28}
              className="mx-auto mb-3 animate-spin text-orange-700"
            />
            Preparing your menu...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="customer-empty">
            <AlertCircle
              size={30}
              className="mx-auto mb-3 text-red-600"
            />

            <b>Unable to load the menu</b>

            <p className="mt-2">{error}</p>

            <button
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 bg-orange-800 text-white rounded-lg px-5 py-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty menu */}
        {!loading &&
          !error &&
          selectedOutlet &&
          menuItems.length === 0 && (
            <div className="customer-empty">
              No menu items are currently available.
            </div>
          )}

        {/* No search results */}
        {!loading &&
          !error &&
          menuItems.length > 0 &&
          filteredItems.length === 0 && (
            <div className="customer-empty">
              No dishes match your search.
            </div>
          )}

        {/* Food cards */}
        {!loading &&
          !error &&
          filteredItems.length > 0 && (

            <div className="menu-grid">

              {filteredItems.map((item, index) => {
                const quantity =
                  cart.find(
                    (entry) => entry.item.id === item.id
                  )?.quantity || 0;

                const image =
                  item.imageUrl?.trim() ||
                  fallbackPhotos[index % fallbackPhotos.length];

                return (
                  <article
                    key={item.id}
                    className="menu-product"
                  >

                    <div className="menu-product-image">

                      <img
                        src={image}
                        alt={item.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            fallbackPhotos[
                              index % fallbackPhotos.length
                            ];
                        }}
                      />

                      <span className="absolute top-3 left-3 bg-white rounded-full px-3 py-1.5">
                        <span
                          className={`diet-tag ${
                            item.isVeg ? '' : 'nonveg'
                          }`}
                        >
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </span>

                      {!item.isAvailable && (
                        <span className="absolute inset-0 bg-black/55 text-white grid place-items-center font-bold tracking-widest">
                          SOLD OUT
                        </span>
                      )}

                    </div>

                    <div className="menu-product-body">

                      <div className="flex items-center gap-2 text-[10px] text-stone-500">

                        {item.isVeg && (
                          <Leaf size={12} className="text-green-700" />
                        )}

                        {item.spiceLevel > 0 && (
                          <span className="flex items-center gap-1">
                            <Flame size={12} className="text-orange-600" />
                            Spice {item.spiceLevel}/5
                          </span>
                        )}

                      </div>

                      <h3 className="menu-product-title">
                        {item.name}
                      </h3>

                      <p className="menu-product-desc">
                        {item.description ||
                          'Freshly prepared with authentic Hyderabadi spices.'}
                      </p>

                      {item.allergens?.length > 0 && (
                        <p className="mt-2 text-[10px] text-stone-500">
                          Allergens: {item.allergens.join(', ')}
                        </p>
                      )}

                      <div className="menu-product-bottom">

                        <span className="menu-price">
                          ₹{Number(item.basePrice).toFixed(0)}
                          <small>Inclusive of 5% GST</small>
                        </span>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-3 rounded-lg border border-orange-200 px-3 py-2">

                            <button
                              onClick={() =>
                                updateQuantity(item.id, -1)
                              }
                              aria-label={`Remove ${item.name}`}
                            >
                              <Minus size={14} />
                            </button>

                            <b className="text-xs">
                              {quantity}
                            </b>

                            <button
                              onClick={() => addToCart(item)}
                              disabled={!item.isAvailable}
                              aria-label={`Add ${item.name}`}
                            >
                              <Plus size={14} />
                            </button>

                          </div>
                        ) : (
                          <button
                            disabled={!item.isAvailable}
                            onClick={() => addToCart(item)}
                            className="add-btn"
                          >
                            Add +
                          </button>
                        )}

                      </div>

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        {/* Food information */}
        <div className="mt-10 flex items-start gap-3 text-xs text-stone-500">
          <AlertCircle size={16} className="shrink-0" />
          <p>
            Food images are indicative. Please inform us about
            allergies before ordering. FSSAI licence details are
            available in the outlet selector.
          </p>
        </div>

      </main>

      {/* Floating cart */}
      {cartCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 bg-[#a94c29] text-white rounded-full px-6 py-3 shadow-xl flex items-center gap-3 font-bold text-sm"
        >
          <ShoppingBag size={17} />
          {cartCount} items
          <span>₹{cartTotal.toFixed(0)}</span>
          <ArrowRight size={16} />
        </button>
      )}

      {/* Existing cart component */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        selectedOutlet={selectedOutlet}
        updateQuantity={updateQuantity}
      />

    </div>
  );
}

