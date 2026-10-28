import { useEffect, useState } from "react";
import { PackageCheck, Star } from "lucide-react";

import { riderApi } from "../services/riderApi";
import type {
  DeliveryHistoryItem,
  PaginatedDeliveryHistory,
} from "../types/rider";

const peso = (value: number | string | null) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));

export default function RiderDeliveryHistoryPage() {
  const [history, setHistory] = useState<PaginatedDeliveryHistory | null>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await riderApi.deliveryHistory(page);

        if (active) setHistory(result);
      } catch {
        if (active) {
          setError("Unable to load delivery history.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <div className="flex flex-col items-start">
        <h2 className="text-2xl font-bold">Delivery History</h2>

        <p className="mt-1 text-sm text-gray-500">
          Your successfully completed deliveries.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading delivery history...</p>
      ) : history?.data.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">
          No completed deliveries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {history?.data.map((delivery: DeliveryHistoryItem) => (
            <div
              key={delivery.delivery_id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-50 p-3">
                    <PackageCheck size={20} className="text-green-600" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      Delivery #{delivery.delivery_id}
                    </p>

                    <p className="text-xs text-gray-500">
                      {delivery.delivered_at
                        ? new Date(delivery.delivered_at).toLocaleString(
                            "en-PH",
                          )
                        : "Date unavailable"}
                    </p>
                  </div>
                </div>

                <p className="font-bold text-green-600">
                  {peso(delivery.rider_earnings)}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs font-medium text-green-700">
                  Delivered
                </span>

                {delivery.rating != null && (
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    {delivery.rating}/5
                  </span>
                )}
              </div>

              {delivery.review && (
                <p className="mt-3 text-sm text-gray-500">{delivery.review}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {history && history.last_page > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">
            Page {page} of {history.last_page}
          </span>

          <button
            type="button"
            disabled={page >= history.last_page || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
