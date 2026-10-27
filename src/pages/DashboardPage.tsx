import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bike,
  Wallet,
  PackageCheck,
  Star,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Truck,
} from "lucide-react";

import { riderApi } from "../services/riderApi";
import { getApiError } from "../services/api";
import type { RiderDashboard } from "../types/rider";

const peso = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<RiderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const data = await riderApi.dashboard();

      setDashboard(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const refreshDashboard = async () => {
    if (refreshing) return;

    setRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOnline = async () => {
    if (!dashboard || updating) return;

    const rider = dashboard.rider;

    const nextStatus = !Boolean(rider.is_online);

    // Only active and verified riders can go ONLINE.
    if (nextStatus) {
      if (rider.status !== "active") {
        setError(
          rider.status === "pending"
            ? "Your rider account is pending approval."
            : rider.status === "approved"
              ? "Your rider account is approved but not yet active."
              : "Your rider account must be active before going online.",
        );
        return;
      }

      if (!rider.is_verified) {
        setError("Your rider account must be verified before going online.");
        return;
      }
    }

    setUpdating(true);
    setError("");

    try {
      await riderApi.setAvailability(nextStatus);

      // Refresh rider data after successful update.
      await loadDashboard();
    } catch (err) {
      console.error("Failed to update rider availability:", err);
      setError(getApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="mx-auto mb-3 animate-spin text-primary"
          />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-3xl p-5">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />

          <h2 className="text-lg font-semibold">Dashboard unavailable</h2>

          <p role="alert" className="mt-2 text-sm text-red-600">
            {error || "Unable to load dashboard."}
          </p>

          <button
            type="button"
            onClick={() => void refreshDashboard()}
            disabled={refreshing}
            className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {refreshing ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  const { rider, stats } = dashboard;

  const riderName =
    [rider.first_name, rider.last_name].filter(Boolean).join(" ") ||
    "GoRide Rider";

  // const canGoOnline = rider.status === "active" && Boolean(rider.is_verified);
  const canGoOnline = rider?.status === "active" && rider?.is_verified === true;

  const statsCards = [
    {
      label: "Wallet Balance",
      value: peso(stats.wallet_balance),
      icon: Wallet,
    },
    {
      label: "Total Deliveries",
      value: String(stats.total_deliveries ?? 0),
      icon: PackageCheck,
    },
    {
      label: "Total Earnings",
      value: peso(stats.total_earnings),
      icon: Wallet,
    },
    {
      label: "Rider Rating",
      value: Number(stats.rating ?? 0).toFixed(2),
      icon: Star,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Welcome back,</p>

          <h1 className="text-2xl font-bold">{riderName}</h1>

          <p className="mt-1 text-sm text-gray-500">
            {[rider.city, rider.province].filter(Boolean).join(", ") ||
              "GoRide Rider"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshDashboard()}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          className="rounded-xl bg-white p-3 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={19} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Rider Availability */}
      <section className="rounded-2xl bg-primary p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Bike size={22} />

              <span className="text-sm text-white/80">Rider Availability</span>
            </div>

            <h2 className="text-2xl font-bold">
              {rider.is_online ? "You're Online" : "You're Offline"}
            </h2>

            <p className="mt-1 text-sm text-white/80">
              {rider.is_online
                ? "You're available for delivery offers."
                : rider.status === "pending"
                  ? "Your rider account is pending approval."
                  : rider.status === "approved"
                    ? "Your rider account is approved. Waiting for activation."
                    : rider.status === "active" && !rider.is_verified
                      ? "Your rider account requires verification."
                      : canGoOnline
                        ? "Go online to start receiving delivery offers."
                        : "Your rider account is not eligible to go online."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(rider.is_online)}
            aria-label="Rider availability"
            disabled={updating || (!Boolean(rider.is_online) && !canGoOnline)}
            onClick={() => void toggleOnline()}
            className={`relative h-9 w-16 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
              rider.is_online ? "bg-green-400" : "bg-white/30"
            }`}
          >
            <span
              className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${
                rider.is_online ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>

        {updating && (
          <p className="mt-3 text-sm text-white/80">Updating availability...</p>
        )}

        {!rider.is_online && rider.status === "approved" && (
          <p className="mt-3 text-sm text-yellow-200">
            Your account has been approved. Please wait for activation.
          </p>
        )}

        {!rider.is_online && rider.status === "pending" && (
          <p className="mt-3 text-sm text-yellow-200">
            Your rider registration is still under review.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </section>

      {/* Approval Notice */}
      {!canGoOnline && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Your rider account must be approved and verified before you can accept
          delivery requests.
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3">
        {statsCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <Icon size={21} className="mb-4 text-primary" />

            <p className="text-xl font-bold">{value}</p>

            <p className="mt-1 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Current Delivery */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Truck size={20} className="text-primary" />

          <h2 className="text-lg font-bold">Current Delivery</h2>
        </div>

        {dashboard.active_delivery ? (
          <div>
            <p className="text-sm text-gray-600">
              You have an active delivery. Open your delivery details to
              continue the pickup or drop-off process.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No active delivery at the moment.
          </p>
        )}
      </section>

      {/* Delivery Offers */}
      <Link
        to="/offers"
        className="flex items-center justify-between rounded-2xl bg-white p-5 font-semibold shadow-sm"
      >
        View Delivery Offers
        <ArrowRight size={20} className="text-primary" />
      </Link>
    </div>
  );
}
