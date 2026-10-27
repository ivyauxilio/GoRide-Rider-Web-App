import { api, initializeCsrf } from "./api";
import type { RiderUser, RiderProfile } from "../types/rider";

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  vehicle_type: "motorcycle" | "bicycle" | "car" | "van" | "other";
  vehicle_plate?: string;
  city: string;
  province?: string;
  license_number?: string;
}

export interface LoginResponse {
  message: string;
  user: RiderUser;
  rider: RiderProfile;
  access_token: string;
  token_type: "Bearer";
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    await initializeCsrf();

    const { data } = await api.post("/register", payload);

    return data;
  },

  login: async (email: string, password: string) => {
    await initializeCsrf();

    const { data } = await api.post<LoginResponse>("/login", {
      email,
      password,
    });

    return data;
  },

  me: async () => {
    const { data } = await api.get<{
      user: RiderUser;
      rider: RiderProfile;
    }>("/me");

    return data;
  },

  logout: async () => {
    await api.post("/logout");
  },
};
