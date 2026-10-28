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
  MapPin,
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

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        {/* Subtle brand accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-400" />

        <div className="flex items-center justify-between gap-4">
          {/* Rider information */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:h-14 sm:w-14">
              <Bike size={27} strokeWidth={1.8} />
            </div> */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-50 text-emerald-700 sm:h-14 sm:w-14">
              <img
                src="/icons/icon-192.png"
                alt="Delivery App Logo"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex flex-col items-start">
              <p className="text-sm font-medium text-gray-500">Welcome back,</p>

              <h4 className="mt-0.5 truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {riderName}
              </h4>

              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-gray-500">
                <MapPin size={14} className="shrink-0 text-emerald-600" />
                <span className="truncate">
                  {[rider.city, rider.province].filter(Boolean).join(", ") ||
                    "Delivery Rider"}
                </span>
              </p>
            </div>
          </div>

          {/* Refresh dashboard */}
          <button
            type="button"
            onClick={() => void refreshDashboard()}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={19} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Rider status */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${
                  rider.is_online ? "bg-green-400" : "bg-gray-400"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full  ${
                  rider.is_online ? "bg-emerald-500" : "bg-gray-500"
                }`}
              />
            </span>
            <span className="text-xs font-medium text-gray-600">
              {rider.is_online ? "You're Online" : "You're Offline"}
            </span>
          </div>
          {updating && (
            <span className="text-xs font-medium text-emerald-600">
              Updating availability...
            </span>
          )}
          {refreshing && (
            <span className="text-xs font-medium text-emerald-600">
              Updating...
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(rider.is_online)}
            aria-label="Rider availability"
            disabled={updating || (!Boolean(rider.is_online) && !canGoOnline)}
            onClick={() => void toggleOnline()}
            className={`relative h-9 w-16 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
              rider.is_online ? "bg-green-400" : "bg-gray-400"
            }`}
          >
            <span
              className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${
                rider.is_online ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>
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
            {/* <div className="mb-2 flex items-center gap-2">
              <Bike size={22} />

              <span className="text-sm text-white/80">Rider Availability</span>
            </div> */}
            {/* 
            <h2 className="text-2xl font-bold">
              {rider.is_online ? "You're Online" : "You're Offline"}
            </h2> */}

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

          {/* <button
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
          </button> */}
        </div>

        {/* {updating && (
          <p className="mt-3 text-sm text-white/80">Updating availability...</p>
        )} */}

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
