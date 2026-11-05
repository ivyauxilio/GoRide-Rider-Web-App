import { api } from "./api";
import type {
  ApiEnvelope,
  RiderDashboard,
  DeliveryOffer,
  RiderEarnings,
  DeliveryHistoryItem,
  PaginatedDeliveryHistory,
} from "../types/rider";

export const riderApi = {
  dashboard: async (): Promise<RiderDashboard> => {
    const response = await api.get<{
      success: boolean;
      data: RiderDashboard;
    }>("/dashboard");

    return response.data.data;
  },

  setAvailability: async (isOnline: boolean) => {
    const response = await api.post("/online", {
      is_online: isOnline,
    });

    return response.data;
  },

  offers: async () => {
    const { data } = await api.get("/jobs/available");
    return data;
  },
  activeJob: async () => {
    const { data } = await api.get("/jobs/active");
    return data;
  },

  acceptOffer: async (offerUuid: string) => {
    const { data } = await api.post(
      `/jobs/offers/${encodeURIComponent(offerUuid)}/accept`,
    );

    return data;
  },

  declineOffer: async (offerUuid: string) => {
    const { data } = await api.post(
      `/jobs/offers/${encodeURIComponent(offerUuid)}/decline`,
    );

    return data;
  },
  claimJob: async (deliveryId: number | string) => {
    const { data } = await api.post(
      `/jobs/${encodeURIComponent(String(deliveryId))}/claim`,
    );

    return data;
  },
  confirmPickup: async (deliveryId: number) => {
    return api.patch(`/deliveries/${deliveryId}/pickup`);
  },
  activeDeliveries: async () => {
    return api.get("/rider/deliveries/active");
  },
  startDelivery: async (deliveryId: number) => {
    const response = await api.patch(`/deliveries/${deliveryId}/start`);
    return response.data;
  },
  // confirmDelivery: async (deliveryId: number) => {
  //   const response = await api.patch(`/deliveries/${deliveryId}/complete`);
  //   return response.data;
  // },
  confirmDelivery: async (
    deliveryId: number,
    payload: { delivery_pin?: string } = {},
  ) => {
    const response = await api.patch(
      `/deliveries/${deliveryId}/complete`,
      payload,
    );
    console.log("data", response.data);
    return response.data;
  },
  earnings: async (): Promise<RiderEarnings> => {
    const response = await api.get<{
      success: boolean;
      data: RiderEarnings;
    }>("/earnings");

    return response.data.data;
  },

  deliveryHistory: async (page = 1): Promise<PaginatedDeliveryHistory> => {
    const response = await api.get<{
      success: boolean;
      data: PaginatedDeliveryHistory;
    }>("/deliveries/history", {
      params: { page },
    });

    return response.data.data;
  },
};

// export const riderApi = {
//   dashboard: async () => {
//     const { data } = await api.get("/dashboard");
//     return data.data;
//   },

//   availableJobs: async () => {
//     const { data } = await api.get("/jobs/available");
//     return data;
//   },

//   activeJob: async () => {
//     const { data } = await api.get("/jobs/active");
//     return data;
//   },

//   setAvailability: async (isOnline: boolean) => {
//     const { data } = await api.post("/online", {
//       is_online: isOnline,
//     });
//     return data;
//   },
// };
