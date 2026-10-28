import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Bike,
  Clock,
} from "lucide-react";

import { riderApi } from "../services/riderApi";
import { getApiError } from "../services/api";
import type { DeliveryOffer } from "../types/rider";

type OfferAction = "accept" | "decline" | "claim";

type ProcessingOffer = {
  key: string;
  action: OfferAction;
} | null;

type ActiveDelivery = {
  delivery_id: number;
  rider_id: number;
  status: string;
  service_type?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
};

const peso = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number.isFinite(amount) ? amount : 0);
};

function extractOffers(response: unknown): DeliveryOffer[] {
  let payload: unknown = response;

  // Supports a raw array or Laravel response envelopes,
  // including paginated data.
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(payload)) {
      return payload as DeliveryOffer[];
    }

    if (typeof payload === "object" && payload !== null && "data" in payload) {
      payload = (payload as { data: unknown }).data;
      continue;
    }

    break;
  }

  throw new Error("Unexpected delivery offers response format.");
}

function extractActiveDeliveries(response: unknown): ActiveDelivery[] {
  let payload: unknown = response;

  for (let i = 0; i < 3; i++) {
    if (Array.isArray(payload)) {
      return payload as ActiveDelivery[];
    }

    if (typeof payload === "object" && payload !== null && "data" in payload) {
      payload = (payload as { data: unknown }).data;
      continue;
    }

    break;
  }

  throw new Error("Unexpected active deliveries response.");
}

export default function DeliveryOffersPage() {
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<ProcessingOffer>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>(
    [],
  );

  // Keep newly accepted jobs visible even if the offers API removes them.
  // For persistence across reloads, fetch assigned jobs from a rider deliveries API.
  const [acceptedJobs, setAcceptedJobs] = useState<DeliveryOffer[]>([]);
  const [pickupProcessingId, setPickupProcessingId] = useState<number | null>(
    null,
  );
  const [startingDeliveryId, setStartingDeliveryId] = useState<number | null>(
    null,
  );
  const [completingDeliveryId, setCompletingDeliveryId] = useState<
    number | null
  >(null);

  const processingRef = useRef(false);

  const loadOffers = useCallback(async (): Promise<boolean> => {
    try {
      const response = await riderApi.offers();
      const items = extractOffers(response);

      setOffers(items);
      setError("");
      return true;
    } catch (err) {
      setError(getApiError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActiveDeliveries = useCallback(async () => {
    try {
      const response = await riderApi.activeDeliveries();

      const deliveries = extractActiveDeliveries(response);

      setActiveDeliveries(deliveries);
    } catch (err) {
      setError(getApiError(err));
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadOffers(), loadActiveDeliveries()]);
  }, [loadOffers, loadActiveDeliveries]);

  const refreshOffers = async () => {
    if (refreshing || processingRef.current) return;

    setRefreshing(true);
    setMessage("");

    try {
      await loadOffers();
    } finally {
      setRefreshing(false);
    }
  };

  const respond = async (offer: DeliveryOffer, action: OfferAction) => {
    if (processingRef.current) return;

    const offerUuid = offer.offer_uuid;
    const deliveryId = offer.delivery?.delivery_id;

    if (action === "claim") {
      if (offer.is_offered) {
        setError("This delivery must be accepted as an assigned offer.");
        return;
      }

      if (deliveryId == null) {
        setError("Delivery ID is missing.");
        return;
      }
    } else {
      if (!offer.is_offered || !offerUuid) {
        setError("A valid assigned offer UUID is required.");
        return;
      }
    }

    const key = offer.is_offered
      ? `offer-${offerUuid}`
      : `delivery-${deliveryId}`;

    processingRef.current = true;
    setProcessing({ key, action });
    setError("");
    setMessage("");

    try {
      if (action === "accept") {
        await riderApi.acceptOffer(offerUuid!);
        if (deliveryId != null) {
          setAcceptedJobs((previous) => [
            ...previous.filter(
              (job) => job.delivery?.delivery_id !== deliveryId,
            ),
            { ...offer, delivery: { ...offer.delivery!, status: "assigned" } },
          ]);
        }
        setMessage("Delivery offer accepted successfully.");
      } else if (action === "decline") {
        await riderApi.declineOffer(offerUuid!);
        setMessage("Delivery offer declined successfully.");
      } else {
        await riderApi.claimJob(deliveryId!);
        if (deliveryId != null) {
          setAcceptedJobs((previous) => [
            ...previous.filter(
              (job) => job.delivery?.delivery_id !== deliveryId,
            ),
            { ...offer, delivery: { ...offer.delivery!, status: "assigned" } },
          ]);
        }
        setMessage("Delivery claimed successfully.");
      }

      // Refresh the list after the action.
      // await loadOffers();
      await Promise.all([loadOffers(), loadActiveDeliveries()]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      processingRef.current = false;
      setProcessing(null);
    }
  };

  const handleParcelAccepted = async (deliveryId: number) => {
    if (pickupProcessingId !== null || processingRef.current) return;

    setPickupProcessingId(deliveryId);
    setError("");
    setMessage("");

    try {
      await riderApi.confirmPickup(deliveryId);
      setAcceptedJobs((previous) =>
        previous.map((job) =>
          job.delivery?.delivery_id === deliveryId
            ? { ...job, delivery: { ...job.delivery, status: "picked_up" } }
            : job,
        ),
      );
      setMessage("Parcel pickup confirmed successfully.");
      // await loadOffers();
      await Promise.all([loadOffers(), loadActiveDeliveries()]);
    } catch (err) {
      console.error("Parcel acceptance failed:", err);
      setError(getApiError(err));
    } finally {
      setPickupProcessingId(null);
    }
  };

  const handleStartDelivery = async (deliveryId: number) => {
    if (startingDeliveryId !== null || processingRef.current) return;

    setStartingDeliveryId(deliveryId);
    setError("");
    setMessage("");

    try {
      await riderApi.startDelivery(deliveryId);

      setMessage("Delivery started successfully.");

      await Promise.all([loadOffers(), loadActiveDeliveries()]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setStartingDeliveryId(null);
    }
  };

  const handleConfirmDelivery = async (deliveryId: number) => {
    if (completingDeliveryId !== null || processingRef.current) {
      return;
    }

    setCompletingDeliveryId(deliveryId);
    setError("");
    setMessage("");

    try {
      await riderApi.confirmDelivery(deliveryId);

      setMessage("Delivery completed successfully!");

      // Remove any temporary accepted-job entry.
      setAcceptedJobs((previous) =>
        previous.filter((offer) => offer.delivery?.delivery_id !== deliveryId),
      );

      // Reload the offers and active deliveries.
      await Promise.all([loadOffers(), loadActiveDeliveries()]);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setCompletingDeliveryId(null);
    }
  };

  const acceptedIds = new Set(
    acceptedJobs
      .map((job) => job.delivery?.delivery_id)
      .filter((id) => id != null),
  );
  const visibleOffers = [
    ...acceptedJobs,
    ...offers.filter((offer) => {
      const deliveryId = offer.delivery?.delivery_id;

      return deliveryId == null || !acceptedIds.has(deliveryId);
    }),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-5 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-start">
          <h2 className="text-base font-bold text-gray-900">Delivery Offers</h2>

          <p className="mt-1 text-sm text-gray-500">
            View available deliveries and assigned offers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshOffers()}
          disabled={refreshing || processing !== null}
          aria-label="Refresh delivery offers"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
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
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Success */}
      {message && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {activeDeliveries.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            My Active Deliveries
          </h2>

          {activeDeliveries.map((delivery) => (
            <div
              key={delivery.delivery_id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Delivery #{delivery.delivery_id}
                </h3>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {delivery.status.replaceAll("_", " ")}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Pickup: {delivery.pickup_address ?? "N/A"}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Drop-off: {delivery.dropoff_address ?? "N/A"}
              </p>

              {delivery.status === "assigned" && (
                <button
                  type="button"
                  disabled={pickupProcessingId !== null}
                  onClick={() =>
                    void handleParcelAccepted(delivery.delivery_id)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pickupProcessingId === delivery.delivery_id ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Confirming Pickup...
                    </>
                  ) : (
                    "Confirm Parcel Pickup"
                  )}
                </button>
              )}

              {delivery.status === "picked_up" && (
                <div className="mt-4 rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
                  Parcel Accepted
                </div>
              )}

              {delivery.status === "picked_up" && (
                <button
                  type="button"
                  disabled={startingDeliveryId !== null}
                  onClick={() => void handleStartDelivery(delivery.delivery_id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startingDeliveryId === delivery.delivery_id ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Starting Delivery...
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      Start Delivery
                    </>
                  )}
                </button>
              )}

              {delivery.status === "in_transit" && (
                <button
                  type="button"
                  disabled={completingDeliveryId !== null}
                  onClick={() =>
                    void handleConfirmDelivery(delivery.delivery_id)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {completingDeliveryId === delivery.delivery_id ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Completing Delivery...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirm Delivered
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw size={28} className="mb-4 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Loading delivery offers...</p>
        </div>
      ) : visibleOffers.length === 0 ? (
        /* Empty state */

        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm sm:px-8 sm:py-16">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-100/80">
            <Package size={36} strokeWidth={1.6} className="text-emerald-600" />
          </div>

          <div className="flex flex-col justify-center items-center">
            {/* Message */}
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              No deliveries available
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              You're all caught up! <br /> Check back soon for new delivery
              request.
            </p>
          </div>
          {/* Helpful hint */}
          <div className="mx-auto mt-6 flex max-w-sm items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <Clock size={18} className="text-gray-500" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Stay ready</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">
                New delivery requests may arrive anytime.
              </p>
            </div>
          </div>

          {/* Refresh action */}
          <button
            type="button"
            onClick={() => void refreshOffers()}
            disabled={refreshing}
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing offers..." : "Refresh Offers"}
          </button>

          <p className="mt-3 text-xs text-gray-400">
            Tap to check for new delivery requests
          </p>
        </div>
      ) : (
        /* Offers list */
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-600">
            {visibleOffers.length}{" "}
            {visibleOffers.length === 1
              ? "delivery available"
              : "deliveries available"}
          </p>

          {visibleOffers.map((offer, index) => {
            const delivery = offer.delivery;
            const offerUuid = offer.offer_uuid;
            const deliveryId = delivery?.delivery_id;
            const deliveryStatus = delivery?.status;
            // Only jobs accepted in this session are known to belong to this rider.
            const isMyDelivery =
              deliveryId != null && acceptedIds.has(deliveryId);

            const isAssignedOffer =
              offer.is_offered === true && Boolean(offerUuid);

            const key = isAssignedOffer
              ? `offer-${offerUuid}`
              : `delivery-${deliveryId ?? index}`;

            const isCurrentProcessing = processing?.key === key;

            const isAccepting =
              isCurrentProcessing && processing?.action === "accept";

            const isDeclining =
              isCurrentProcessing && processing?.action === "decline";

            const isClaiming =
              isCurrentProcessing && processing?.action === "claim";

            const isDisabled =
              processing !== null || pickupProcessingId !== null;

            return (
              <article
                key={key}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                {/* Delivery details */}
                <div className="p-5">
                  {/* Card header */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {delivery?.service_type ?? "Delivery Service"}
                      </p>

                      <h2 className="mt-1 text-lg font-bold text-gray-900">
                        Delivery #{deliveryId ?? "N/A"}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        isAssignedOffer
                          ? "bg-purple-50 text-primary"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {isAssignedOffer ? (
                        <Clock3 size={13} />
                      ) : (
                        <Bike size={13} />
                      )}

                      {isAssignedOffer ? "Assigned Offer" : "Available Job"}
                    </span>
                  </div>

                  {/* Locations */}
                  <div className="space-y-5 border-l-2 border-dashed border-gray-200 pl-5">
                    <div className="relative">
                      <MapPin
                        size={17}
                        className="absolute -left-[30px] top-0 bg-white text-green-600"
                      />

                      <p className="text-xs text-gray-500">Pickup Location</p>

                      <p className="mt-1 text-sm font-medium leading-relaxed text-gray-900">
                        {delivery?.pickup_address ||
                          "Pickup address unavailable"}
                      </p>
                    </div>

                    <div className="relative">
                      <Navigation
                        size={17}
                        className="absolute -left-[30px] top-0 bg-white text-primary"
                      />

                      <p className="text-xs text-gray-500">Drop-off Location</p>

                      <p className="mt-1 text-sm font-medium leading-relaxed text-gray-900">
                        {delivery?.dropoff_address ||
                          "Drop-off address unavailable"}
                      </p>
                    </div>
                  </div>

                  {/* Earnings and distance */}
                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Estimated Rider Earnings
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {peso(offer.earnings)}
                      </p>
                    </div>

                    {delivery?.distance_km != null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Distance</p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {Number(delivery.distance_km).toFixed(1)} km
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Offer expiry */}
                  {isAssignedOffer && offer.expires_at && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-700">
                      <Clock3 size={14} />
                      <span>
                        Offer expires:{" "}
                        {new Date(offer.expires_at).toLocaleString("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}

                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                  {deliveryStatus === "assigned" && isMyDelivery ? (
                    // Rider already accepted the delivery.
                    <button
                      type="button"
                      disabled={isDisabled || deliveryId == null}
                      onClick={() => {
                        if (deliveryId != null)
                          void handleParcelAccepted(deliveryId);
                      }}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pickupProcessingId === deliveryId ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Confirming Pickup...
                        </>
                      ) : (
                        "Confirm Parcel Pickup"
                      )}
                    </button>
                  ) : deliveryStatus === "picked_up" && isMyDelivery ? (
                    // Parcel has already been picked up.
                    <div className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                      Parcel Accepted — Ready for Delivery
                    </div>
                  ) : isMyDelivery ? (
                    <div className="rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-blue-700">
                      Delivery status: {deliveryStatus ?? "Unknown"}
                    </div>
                  ) : isAssignedOffer ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => void respond(offer, "decline")}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeclining ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Declining...
                          </>
                        ) : (
                          "Decline"
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => void respond(offer, "accept")}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAccepting ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          "Accept Offer"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isDisabled || deliveryId == null}
                      onClick={() => void respond(offer, "claim")}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isClaiming ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        "Claim Delivery"
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
