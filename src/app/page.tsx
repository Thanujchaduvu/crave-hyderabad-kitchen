
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  ChefHat,
  Clock3,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Monitor,
  LayoutDashboard,
  PartyPopper,
  Utensils,
} from 'lucide-react';

const portals = [
  {
    href: '/menu',
    eyebrow: 'ORDER DIRECT',
    title: 'Your next favourite meal.',
    copy: 'Explore authentic dum biryani, delicious sides and traditional desserts. Order directly from CRAVE.',
    action: 'Explore the menu',
    icon: ShoppingBag,
    tone: 'saffron',
  },
  {
    href: '/kitchen/kondapur',
    eyebrow: 'KITCHEN OPERATIONS',
    title: 'Built for busy kitchens.',
    copy: 'Manage incoming orders, monitor preparation and keep every kitchen handoff organised.',
    action: 'Open kitchen display',
    icon: Monitor,
    tone: 'green',
  },
  {
    href: '/admin/analytics',
    eyebrow: 'BUSINESS INTELLIGENCE',
    title: 'Know your business.',
    copy: 'Monitor sales, outlet performance, preparation times and business growth.',
    action: 'View analytics',
    icon: LayoutDashboard,
    tone: 'blue',
  },
  {
    href: '/party-orders',
    eyebrow: 'CATERING & EVENTS',
    title: 'Bring everyone together.',
    copy: 'Make birthdays, family gatherings and office celebrations memorable with CRAVE catering.',
    action: 'Plan your event',
    icon: PartyPopper,
    tone: 'plum',
  },
];

const promises = [
  {
    icon: ChefHat,
    title: 'Authentic dum cooking',
    description: 'Slow-cooked with carefully selected spices.',
  },
  {
    icon: MapPin,
    title: 'Multiple Hyderabad outlets',
    description: 'Find a kitchen serving your location.',
  },
  {
    icon: ShoppingBag,
    title: 'Order directly',
    description: 'A convenient ordering experience.',
  },
];

export default function HomePage() {
  return (
    <main className="home-shell">

      {/* Announcement bar */}
      <div className="topline">
        <span>
          <Sparkles size={14} />
          Hyderabad, served with a little more love
        </span>

        <span className="topline-right">
          Freshly prepared <i /> Delivered with care
        </span>
      </div>

      {/* Navigation */}
      <header className="site-header">

        <Link href="/" className="brand">
          <span className="brand-mark">C</span>
          <span>
            CRAVE
            <small>HYDERABADI KITCHEN</small>
          </span>
        </Link>

        <nav>
          <Link href="/menu">Menu</Link>
          <Link href="/party-orders">Catering</Link>
          <Link href="/admin/analytics">Our impact</Link>
        </nav>

        <Link href="/menu" className="header-cta">
          Order now <ArrowRight size={16} />
        </Link>
      </header>

      {/* Hero section */}
      <section className="hero-wrap">

        <div className="hero-copy">

          <span className="eyebrow">
            <span className="eyebrow-dot" />
            THE REAL HYDERABADI FEAST
          </span>

          <h1>
            Layers of
            <br />
            flavour.
            <br />
            <em>Made to be shared.</em>
          </h1>

          <p>
            Slow-cooked dum biryani, fragrant spices and
            the sides you always save room for.
            Experience the authentic taste of Hyderabad
            with CRAVE.
          </p>

          <div className="hero-actions">

            <Link href="/menu" className="primary-cta">
              Order biryani
              <ArrowRight size={18} />
            </Link>

            <Link href="/party-orders" className="text-cta">
              Planning a celebration?
              <ArrowRight size={15} />
            </Link>

          </div>

          <div className="hero-trust">
            <span>
              <Clock3 size={16} />
              Freshly prepared
            </span>

            <span>
              <BadgePercent size={16} />
              Direct ordering
            </span>

            <span>
              <ShieldCheck size={16} />
              Secure checkout
            </span>
          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-photo" />

          <div className="photo-label">
            <span className="photo-label-icon">
              <Star size={15} fill="currentColor" />
            </span>

            <span>
              <b>Made fresh, every order</b>
              <small>Our kitchen. Your table.</small>
            </span>
          </div>

          <div className="hero-stamp">
            DUM
            <br />
            COOKED
            <br />
            <b>WITH LOVE</b>
          </div>

        </div>
      </section>

      {/* Brand promises */}
      <section className="promise-strip">

        {promises.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title}>
              <span className="promise-icon">
                <Icon />
              </span>

              <span>
                <b>{item.title}</b>
                <small>{item.description}</small>
              </span>
            </div>
          );
        })}

      </section>

      {/* Application portals */}
      <section className="portal-section">

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              ONE PLATFORM, MANY POSSIBILITIES
            </span>

            <h2>Welcome to CRAVE.</h2>
          </div>

          <p>
            From the first craving to the final handoff,
            everything has its place.
          </p>

        </div>

        <div className="portal-grid">

          {portals.map((portal) => {
            const Icon = portal.icon;

            return (
              <Link
                href={portal.href}
                key={portal.href}
                className={`portal-card ${portal.tone}`}
              >

                <div className="portal-card-top">

                  <span className="portal-icon">
                    <Icon size={21} />
                  </span>

                  <span className="portal-eyebrow">
                    {portal.eyebrow}
                  </span>

                  <ArrowRight
                    className="portal-arrow"
                    size={19}
                  />

                </div>

                <h3>{portal.title}</h3>

                <p>{portal.copy}</p>

                <span className="portal-action">
                  {portal.action}
                  <ArrowRight size={15} />
                </span>

              </Link>
            );
          })}

        </div>

      </section>

      {/* Footer */}
      <footer className="home-footer">

        <span className="brand brand-footer">
          <span className="brand-mark">C</span>

          <span>
            CRAVE
            <small>HYDERABADI KITCHEN</small>
          </span>
        </span>

        <span>
          Freshly prepared. Thoughtfully delivered.
        </span>

        <span>
          Menu prices include applicable GST.
        </span>

      </footer>

    </main>
  );
}

