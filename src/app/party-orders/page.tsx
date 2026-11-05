
"use client";

import { useEffect, useMemo, useState } from "react";

type Outlet = {
  id: string;
  name: string;
  city: string;
};

type PartyOrder = {
  id: string;
  status: string;
  guestCount: number;
  eventDate: string;
  estimatedQuote: number;
  menuSummary: string;
  outlet?: {
    name: string;
  } | null;
};

const initialForm = {
  name: "",
  phone: "",
  email: "",
  guestCount: "50",
  eventDate: "",
  eventTime: "12:00",
  outletId: "",
  menuSummary: "",
};

export default function PartyOrdersPage() {
  const [form, setForm] = useState(initialForm);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loadingOutlets, setLoadingOutlets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<PartyOrder | null>(null);

  useEffect(() => {
    async function loadOutlets() {
      try {
        const response = await fetch("/api/outlets", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load outlets.");
        }

        const list = Array.isArray(data)
          ? data
          : data.outlets ?? data.data ?? [];

        setOutlets(list.filter((outlet: Outlet) => outlet.id));

      } catch (err) {
        console.error("Outlet loading error:", err);
        setError("Unable to load outlets. You can still submit without selecting an outlet.");
      } finally {
        setLoadingOutlets(false);
      }
    }

    loadOutlets();
  }, []);

  const minimumDate = useMemo(() => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const guestCount = Math.max(0, Number(form.guestCount) || 0);

  // Preliminary estimate only. The final quote is confirmed by the team.
  const estimatedQuote = guestCount * 350;

  function updateField(
    field: keyof typeof initialForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Please enter your name.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    if (
      !Number.isInteger(Number(form.guestCount)) ||
      Number(form.guestCount) < 10
    ) {
      return "Party orders require at least 10 guests.";
    }

    if (!form.eventDate) {
      return "Please select your event date.";
    }

    if (!form.eventTime) {
      return "Please select your event time.";
    }

    const eventDateTime = new Date(
      `${form.eventDate}T${form.eventTime}`
    );

    if (
      Number.isNaN(eventDateTime.getTime()) ||
      eventDateTime.getTime() < Date.now() + 24 * 60 * 60 * 1000
    ) {
      return "Party orders must be booked at least 24 hours in advance.";
    }

    if (form.menuSummary.trim().length < 10) {
      return "Please describe your menu requirements.";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setBooking(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const eventDateTime = new Date(
        `${form.eventDate}T${form.eventTime}`
      );

      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
        },
        guestCount,
        eventDate: eventDateTime.toISOString(),
        outletId: form.outletId || null,
        menuSummary: form.menuSummary.trim(),
        estimatedQuote,
      };

      const response = await fetch("/api/party-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
          data.message ||
          "Unable to submit your catering request."
        );
      }

      const createdBooking =
        data.partyOrder ?? data.order ?? data.data ?? data;

      setBooking(createdBooking);
      setMessage(
        "Your catering request has been submitted successfully!"
      );

      setForm(initialForm);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <main className="party-page">
      <header className="party-header">
        <a href="/" className="party-logo">
          CRAVE
        </a>

        <nav>
          <a href="/">Home</a>
          <a href="/menu">Menu</a>
          <a href="/party-orders" className="active">
            Party Orders
          </a>
        </nav>
      </header>

      <section className="party-hero">
        <div className="hero-content">
          <span className="hero-tag">CRAVE CATERING</span>

          <h1>
            Make every
            <br />
            celebration <span>delicious.</span>
          </h1>

          <p>
            From family gatherings to corporate events, bring
            authentic Hyderabadi flavours to your special occasion.
          </p>

          <a href="#booking-form" className="hero-button">
            Plan Your Event
          </a>
        </div>

        <div className="hero-image">
          <div className="hero-image-overlay">
            <span>AUTHENTIC HYDERABADI FLAVOURS</span>
            <h2>Made for sharing.</h2>
          </div>
        </div>
      </section>

      <section className="party-benefits">
        <div>
          <span>01</span>
          <h3>Freshly prepared</h3>
          <p>Food prepared fresh for your event.</p>
        </div>

        <div>
          <span>02</span>
          <h3>Flexible menus</h3>
          <p>Choose your preferred dishes and quantities.</p>
        </div>

        <div>
          <span>03</span>
          <h3>Event support</h3>
          <p>Our team will coordinate your catering request.</p>
        </div>
      </section>

      <section className="booking-section" id="booking-form">
        <div className="booking-intro">
          <span className="section-tag">LET'S PLAN TOGETHER</span>
          <h2>Tell us about your event.</h2>
          <p>
            Share your requirements. Our catering team will
            review your request and confirm the final quote.
          </p>

          <div className="notice-card">
            <strong>Booking notice</strong>
            <p>
              Party orders require at least 24 hours advance
              notice. Final pricing is subject to menu selection
              and manager approval.
            </p>
          </div>

          <div className="estimate-card">
            <span>Indicative estimate</span>
            <strong>{formatCurrency(estimatedQuote)}</strong>
            <small>Based on ₹350 per guest. Not a final quote.</small>
          </div>
        </div>

        <form
          className="booking-form"
          onSubmit={handleSubmit}
        >
          <h2>Event details</h2>

          {error && (
            <div className="alert error-alert">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success-alert">
              {message}
            </div>
          )}

          {booking && (
            <div className="booking-confirmation">
              <h3>Request received!</h3>
              <p>
                Booking reference:{" "}
                <strong>{booking.id}</strong>
              </p>
              <p>
                Status:{" "}
                <strong>
                  {booking.status || "PENDING_REVIEW"}
                </strong>
              </p>
              <p>
                Our catering team will review your requirements.
              </p>
            </div>
          )}

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Your name *</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) =>
                  updateField("name", e.target.value)
                }
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone">Mobile number *</label>
              <input
                id="phone"
                type="tel"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
                placeholder="your@email.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="guestCount">Number of guests *</label>
              <input
                id="guestCount"
                type="number"
                min="10"
                max="10000"
                value={form.guestCount}
                onChange={(e) =>
                  updateField("guestCount", e.target.value)
                }
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="outletId">Preferred outlet</label>
              <select
                id="outletId"
                value={form.outletId}
                onChange={(e) =>
                  updateField("outletId", e.target.value)
                }
              >
                <option value="">
                  {loadingOutlets
                    ? "Loading outlets..."
                    : "Let CRAVE assign an outlet"}
                </option>

                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} - {outlet.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="eventDate">Event date *</label>
              <input
                id="eventDate"
                type="date"
                min={minimumDate}
                value={form.eventDate}
                onChange={(e) =>
                  updateField("eventDate", e.target.value)
                }
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="eventTime">Event time *</label>
              <input
                id="eventTime"
                type="time"
                value={form.eventTime}
                onChange={(e) =>
                  updateField("eventTime", e.target.value)
                }
                required
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="menuSummary">
                Menu and special requirements *
              </label>
              <textarea
                id="menuSummary"
                rows={5}
                value={form.menuSummary}
                onChange={(e) =>
                  updateField("menuSummary", e.target.value)
                }
                placeholder="Example: Chicken Biryani for 50 guests, Mutton Biryani for 20 guests, starters, desserts, vegetarian options, delivery requirements..."
                required
              />
            </div>
          </div>

          <div className="form-footer">
            <p>
              By submitting, you agree that CRAVE may contact
              you about this catering request.
            </p>

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Submitting request..."
                : "Submit Catering Request"}
            </button>
          </div>
        </form>
      </section>

      <footer className="party-footer">
        <a href="/" className="party-logo">
          CRAVE
        </a>
        <p>Authentic Hyderabadi Kitchen</p>
        <span>© {new Date().getFullYear()} CRAVE. All rights reserved.</span>
      </footer>

      <style jsx>{`
        .party-page {
          min-height: 100vh;
          background: #faf8f4;
          color: #28231f;
        }

        .party-header {
          height: 76px;
          padding: 0 7%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          border-bottom: 1px solid #eee9e1;
        }

        .party-logo {
          color: #a52b19;
          font-size: 27px;
          font-weight: 900;
          letter-spacing: 3px;
          text-decoration: none;
        }

        nav {
          display: flex;
          gap: 28px;
        }

        nav a {
          color: #777;
          font-size: 14px;
          text-decoration: none;
        }

        nav a.active {
          color: #a52b19;
          font-weight: 700;
        }

        .party-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 440px;
          background: #f2e8dc;
        }

        .hero-content {
          padding: 75px 10%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
        }

        .hero-tag,
        .section-tag {
          color: #a52b19;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero-content h1 {
          margin: 22px 0;
          font-family: Georgia, serif;
          font-size: clamp(40px, 5vw, 65px);
          line-height: 1.08;
          font-weight: 500;
        }

        .hero-content h1 span {
          color: #a52b19;
          font-style: italic;
        }

        .hero-content p {
          max-width: 420px;
          color: #74685e;
          line-height: 1.8;
        }

        .hero-button {
          display: inline-block;
          margin-top: 20px;
          padding: 14px 24px;
          border-radius: 5px;
          background: #a52b19;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
        }

        .hero-image {
          position: relative;
          min-height: 400px;
          background:
            linear-gradient(
              to top,
              rgba(0,0,0,.65),
              transparent 65%
            ),
            url("https://images.unsplash.com/photo-1563379091339-03246963d96c?w=1200")
            center / cover;
        }

        .hero-image-overlay {
          position: absolute;
          bottom: 38px;
          left: 38px;
          color: #fff;
        }

        .hero-image-overlay span {
          font-size: 10px;
          letter-spacing: 2px;
        }

        .hero-image-overlay h2 {
          margin: 8px 0 0;
          font-family: Georgia, serif;
          font-size: 34px;
        }

        .party-benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 35px;
          padding: 45px 9%;
          background: #fff;
        }

        .party-benefits span {
          color: #b78c64;
          font-size: 12px;
          font-weight: 800;
        }

        .party-benefits h3 {
          margin: 12px 0 7px;
          font-size: 17px;
        }

        .party-benefits p {
          color: #888;
          font-size: 13px;
        }

        .booking-section {
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          gap: 65px;
          max-width: 1200px;
          margin: auto;
          padding: 85px 35px;
        }

        .booking-intro h2 {
          margin: 18px 0;
          font-family: Georgia, serif;
          font-size: 40px;
          font-weight: 500;
          line-height: 1.15;
        }

        .booking-intro > p {
          color: #777;
          line-height: 1.8;
        }

        .notice-card,
        .estimate-card {
          margin-top: 28px;
          padding: 22px;
          border-radius: 10px;
          background: #f1e9de;
        }

        .notice-card strong,
        .estimate-card span {
          font-size: 14px;
          font-weight: 800;
        }

        .notice-card p {
          margin-bottom: 0;
          color: #75695e;
          font-size: 13px;
          line-height: 1.7;
        }

        .estimate-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #fff;
          border: 1px solid #eee6dc;
        }

        .estimate-card strong {
          color: #a52b19;
          font-size: 30px;
        }

        .estimate-card small {
          color: #888;
          font-size: 11px;
        }

        .booking-form {
          padding: 32px;
          background: #fff;
          border: 1px solid #eee9e1;
          border-radius: 14px;
          box-shadow: 0 10px 35px rgba(0,0,0,.035);
        }

        .booking-form h2 {
          margin: 0 0 25px;
          font-size: 23px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-field label {
          font-size: 12px;
          font-weight: 700;
        }

        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          padding: 13px;
          border: 1px solid #e5dfd7;
          border-radius: 7px;
          outline: none;
          background: #fff;
          color: #28231f;
          font: inherit;
          font-size: 13px;
        }

        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          border-color: #a52b19;
          box-shadow: 0 0 0 2px rgba(165,43,25,.08);
        }

        .form-field textarea {
          resize: vertical;
        }

        .form-footer {
          margin-top: 25px;
        }

        .form-footer p {
          color: #888;
          font-size: 11px;
          line-height: 1.6;
        }

        .form-footer button {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 7px;
          background: #a52b19;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .form-footer button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .alert,
        .booking-confirmation {
          margin-bottom: 20px;
          padding: 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.6;
        }

        .error-alert {
          background: #fff0ee;
          color: #a52b19;
        }

        .success-alert,
        .booking-confirmation {
          background: #eaf7ed;
          color: #216c35;
        }

        .booking-confirmation h3 {
          margin: 0 0 10px;
        }

        .booking-confirmation p {
          overflow-wrap: anywhere;
        }

        .party-footer {
          padding: 38px 20px;
          text-align: center;
          background: #27211d;
          color: #fff;
        }

        .party-footer p,
        .party-footer span {
          color: #bcb1a8;
          font-size: 12px;
        }

        @media (max-width: 800px) {
          .party-hero,
          .booking-section {
            grid-template-columns: 1fr;
          }

          .hero-image {
            min-height: 300px;
          }

          .booking-section {
            gap: 30px;
            padding: 55px 20px;
          }

          .party-benefits {
            padding: 35px 25px;
          }
        }

        @media (max-width: 520px) {
          .party-header {
            padding: 0 18px;
          }

          nav {
            gap: 12px;
          }

          nav a {
            font-size: 11px;
          }

          .hero-content {
            padding: 55px 25px;
          }

          .party-benefits {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .booking-form {
            padding: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: auto;
          }
        }
      `}</style>
    </main>
  );
}
