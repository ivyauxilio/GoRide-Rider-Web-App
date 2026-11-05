import { useEffect, useRef, useState } from "react";
import { LockKeyhole, ShieldCheck, X } from "lucide-react";

interface DeliveryPinModalProps {
  open: boolean;
  deliveryId: number;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<void>;
}

export default function DeliveryPinModal({
  open,
  deliveryId,
  loading = false,
  error,
  onClose,
  onConfirm,
}: DeliveryPinModalProps) {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4 || loading) return;

    await onConfirm(pin);
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-pin-title"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0077FF]">
            <ShieldCheck size={25} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delivery-pin-title"
          className="mt-5 text-xl font-bold text-gray-900"
        >
          Confirm delivery
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Ask the customer for their 4-digit security PIN to confirm the package
          has been delivered.
        </p>

        <p className="mt-3 text-xs font-medium text-gray-400">
          Delivery #{deliveryId}
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label
            htmlFor="delivery-pin-input"
            className="mb-3 block text-sm font-semibold text-gray-700"
          >
            Security PIN
          </label>

          <input
            ref={inputRef}
            id="delivery-pin-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            disabled={loading}
            placeholder="4-Digit PIN"
            className="w-full rounded-xl border border-gray-200 px-4 py-4 text-center text-2xl font-bold tracking-[0.6em] text-gray-900 outline-none focus:border-[#0077FF] focus:ring-2 focus:ring-blue-100"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4 || loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077FF] px-4 py-4 font-semibold text-white transition hover:bg-[#0066DD] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole size={18} />
            {loading ? "Verifying..." : "Verify & Complete Delivery"}
          </button>
        </form>
      </div>
    </div>
  );
}
