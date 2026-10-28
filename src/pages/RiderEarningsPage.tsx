import { useEffect, useState } from "react";
import { Wallet, CalendarDays, TrendingUp, PackageCheck } from "lucide-react";

import { riderApi } from "../services/riderApi";
import type { RiderEarnings } from "../types/rider";

const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);

export default function RiderEarningsPage() {
  const [earnings, setEarnings] = useState<RiderEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await riderApi.earnings();

        if (active) setEarnings(data);
      } catch {
        if (active) {
          setError("Unable to load your earnings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="p-5 text-gray-500">Loading earnings...</div>;
  }

  if (error || !earnings) {
    return (
      <div className="p-5 text-red-600">{error || "Earnings unavailable."}</div>
    );
  }

  const cards = [
    {
      label: "Today's earnings",
      value: peso(earnings.today),
      icon: Wallet,
    },
    {
      label: "This week",
      value: peso(earnings.this_week),
      icon: CalendarDays,
    },
    {
      label: "This month",
      value: peso(earnings.this_month),
      icon: TrendingUp,
    },
    {
      label: "Completed deliveries",
      value: String(earnings.completed_deliveries),
      icon: PackageCheck,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col items-start">
        <h2 className="text-2xl font-bold text-gray-900">My Earnings</h2>

        <p className="mt-1 text-sm text-gray-500">
          Track your completed deliveries and earnings.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <Icon size={22} className="mb-4 text-violet-600" />

            <p className="text-xl font-bold text-gray-900 md:text-2xl">
              {value}
            </p>

            <p className="mt-1 text-xs text-gray-500 md:text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-sm text-gray-500">
          Total earned from completed deliveries
        </p>

        <p className="mt-2 text-3xl font-bold text-gray-900">
          {peso(earnings.total_earnings)}
        </p>
      </div>
    </main>
  );
}
