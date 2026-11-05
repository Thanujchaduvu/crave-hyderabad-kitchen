
"use client";

import { useEffect, useState } from "react";

interface Outlet {
  id: string;
  name: string;
  city: string;
  deliveryRadiusKm: number;
  fssaiLicense: string;
  isCloudKitchen: boolean;
  distanceKm?: number | null;
  isDeliverable?: boolean | null;
  active?: boolean;
}

interface OutletSelectorProps {
  selectedOutlet: Outlet | null;
  onSelectOutlet: (outlet: Outlet) => void;
}

export default function OutletSelector({
  selectedOutlet,
  onSelectOutlet,
}: OutletSelectorProps) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOutlets();
  }, []);

  async function loadOutlets(url = "/api/outlets") {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to load outlets.");
      }

      const data = await response.json();
      const list: Outlet[] = Array.isArray(data)
        ? data
        : data.outlets ?? [];

      const activeOutlets = list.filter(
        (outlet) => outlet.active !== false
      );

      setOutlets(activeOutlets);

      if (!selectedOutlet && activeOutlets.length > 0) {
        const availableOutlet =
          activeOutlets.find(
            (outlet) => outlet.isDeliverable === true
          ) ?? activeOutlets[0];

        onSelectOutlet(availableOutlet);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Location detection is not supported by your browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const url = `/api/outlets?lat=${latitude}&lng=${longitude}`;
          const response = await fetch(url, { cache: "no-store" });

          if (!response.ok) {
            throw new Error("Unable to find nearby outlets.");
          }

          const data = await response.json();
          const list: Outlet[] = Array.isArray(data)
            ? data
            : data.outlets ?? [];

          const activeOutlets = list.filter(
            (outlet) => outlet.active !== false
          );

          setOutlets(activeOutlets);

          const nearestDeliverable = activeOutlets
            .filter((outlet) => outlet.isDeliverable === true)
            .sort(
              (a, b) =>
                (a.distanceKm ?? Infinity) -
                (b.distanceKm ?? Infinity)
            )[0];

          if (nearestDeliverable) {
            onSelectOutlet(nearestDeliverable);
            setIsOpen(false);
          } else {
            setError(
              "No outlet currently delivers to your location."
            );
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to detect nearby outlets."
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError(
          "Location permission was denied. Please select an outlet manually."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  function chooseOutlet(outlet: Outlet) {
    if (outlet.isDeliverable === false) return;

    onSelectOutlet(outlet);
    setIsOpen(false);
    setError("");
  }

  return (
    <div className="outlet-selector">
      <button
        type="button"
        className="outlet-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className="outlet-trigger-icon">📍</span>

        <span className="outlet-trigger-content">
          <span className="outlet-trigger-label">
            YOUR OUTLET
          </span>
          <span className="outlet-trigger-name">
            {selectedOutlet?.name ?? "Select outlet"}
          </span>
        </span>

        <span className={`outlet-chevron ${isOpen ? "open" : ""}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="outlet-backdrop"
            aria-label="Close outlet selector"
            onClick={() => setIsOpen(false)}
          />

          <div className="outlet-dropdown">
            <div className="outlet-dropdown-header">
              <div>
                <h3>Choose your outlet</h3>
                <p>Select an outlet to view its menu.</p>
              </div>

              <button
                type="button"
                className="outlet-city-badge"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              className="outlet-location-button"
              onClick={detectLocation}
              disabled={locating}
            >
              {locating ? "Detecting location..." : "◎ Use my current location"}
            </button>

            {error && (
              <p className="outlet-message outlet-error">
                {error}
              </p>
            )}

            {loading ? (
              <div className="outlet-loading">
                Loading outlets...
              </div>
            ) : outlets.length === 0 ? (
              <div className="outlet-empty">
                No outlets are currently available.
              </div>
            ) : (
              <div className="outlet-options">
                {outlets.map((outlet) => {
                  const selected = selectedOutlet?.id === outlet.id;
                  const unavailable = outlet.isDeliverable === false;

                  return (
                    <button
                      type="button"
                      key={outlet.id}
                      className={[
                        "outlet-option",
                        selected ? "selected" : "",
                        unavailable ? "unavailable" : "",
                      ].join(" ")}
                      onClick={() => chooseOutlet(outlet)}
                      disabled={unavailable}
                    >
                      <span className="outlet-option-content">
                        <span className="outlet-option-title">
                          {outlet.name}

                          {outlet.isCloudKitchen && (
                            <span className="cloud-badge">
                              Cloud Kitchen
                            </span>
                          )}
                        </span>

                        <span className="outlet-option-city">
                          {outlet.city}
                        </span>

                        <span className="outlet-option-details">
                          {outlet.distanceKm != null
                            ? `${outlet.distanceKm.toFixed(1)} km away`
                            : `Delivery radius: ${outlet.deliveryRadiusKm} km`}
                        </span>

                        {outlet.fssaiLicense && (
                          <span className="outlet-option-license">
                            FSSAI: {outlet.fssaiLicense}
                          </span>
                        )}

                        {unavailable && (
                          <span className="outlet-unavailable-text">
                            Delivery unavailable
                          </span>
                        )}
                      </span>

                      {selected && (
                        <span className="outlet-selected-check">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="outlet-dropdown-footer">
              <span>CRAVE – Hyderabadi Kitchen</span>
              <span>Freshness from our kitchen to you.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

