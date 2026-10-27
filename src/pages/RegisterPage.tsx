import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Bike, CheckCircle2 } from "lucide-react";
import { authApi, type RegisterPayload } from "../services/authApi";
import { getApiError } from "../services/api";

const initialForm: RegisterPayload = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  vehicle_type: "motorcycle",
  vehicle_plate: "",
  city: "Daet",
  province: "Camarines Norte",
  license_number: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update<K extends keyof RegisterPayload>(
    key: K,
    value: RegisterPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.register(form);
      setSuccess(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-5 text-primary" size={56} />
          <h1 className="text-2xl font-bold">Application submitted</h1>
          <p className="mt-3 text-gray-500">
            Your rider application is pending admin approval. You'll be able to
            sign in once your account is approved.
          </p>
          <Link
            to="/login"
            className="mt-8 block rounded-xl bg-primary py-4 font-semibold text-white"
          >
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  const fields = [
    ["first_name", "First name"],
    ["last_name", "Last name"],
    ["email", "Email address"],
    ["phone", "Mobile number"],
    ["vehicle_plate", "Plate number (optional)"],
    ["license_number", "License number (optional)"],
    ["city", "City / Municipality"],
    ["province", "Province"],
  ] as const;

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
          <Bike size={25} />
        </div>
        <h1 className="text-3xl font-bold">Become a GoRide Rider</h1>
        <p className="mt-2 text-gray-500">
          Create your account and submit your rider application.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-7"
      >
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {fields.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={key} className="mb-2 block text-sm font-medium">
              {label}
            </label>
            <input
              id={key}
              type={
                key === "email" ? "email" : key === "phone" ? "tel" : "text"
              }
              required={
                !["vehicle_plate", "license_number", "province"].includes(key)
              }
              value={form[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            />
          </div>
        ))}

        <div>
          <label
            htmlFor="vehicle_type"
            className="mb-2 block text-sm font-medium"
          >
            Vehicle type
          </label>
          <select
            id="vehicle_type"
            value={form.vehicle_type}
            onChange={(e) =>
              update(
                "vehicle_type",
                e.target.value as RegisterPayload["vehicle_type"],
              )
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
          >
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="other">Other</option>
          </select>
        </div>

        {(["password", "password_confirmation"] as const).map((key) => (
          <div key={key}>
            <label htmlFor={key} className="mb-2 block text-sm font-medium">
              {key === "password" ? "Password" : "Confirm password"}
            </label>
            <input
              id={key}
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            />
          </div>
        ))}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Rider Application"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
