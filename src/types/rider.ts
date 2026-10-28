export interface RiderUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: "rider";
  status: string;
}

export interface RiderProfile {
  rider_id: number;
  rider_uuid?: string;
  status: string;
  is_verified: boolean;
  is_online: boolean;
  vehicle_type: string;
  city?: string | null;
}

export interface RiderStats {
  total_deliveries: number;
  cancelled_deliveries: number;
  rating: string | number;
  wallet_balance: string | number;
  total_earnings: string | number;
  commission_rate: string | number;
}

// export interface DeliveryOffer {
//   offer_id: number;
//   delivery_id: number;
//   status: string;
//   expires_at?: string | null;
//   delivery?: {
//     delivery_id: number;
//     service_type: string;
//     pickup_address: string;
//     dropoff_address: string;
//     distance_km?: number | string;
//     delivery_fee?: number | string;
//   };
// }

export interface DeliveryOffer {
  offer_uuid: string | null;
  is_offered: boolean;
  earnings: number;
  distance_from_pickup_m: number | null;
  expires_at: string | null;

  delivery: {
    delivery_id: number;
    service_type?: string | null;
    pickup_address?: string | null;
    dropoff_address?: string | null;
    distance_km?: number | string | null;
    delivery_fee?: number | string | null;
    status?: string;
  } | null;
}

export interface RiderDashboard {
  rider: {
    id: number;
    first_name: string;
    last_name: string;
    status: string;
    is_verified: boolean;
    is_online: boolean;
    active: boolean;
    vehicle_type: string;
    city: string | null;
    province: string | null;
  };

  stats: {
    total_deliveries: number;
    cancelled_deliveries: number;
    wallet_balance: number | string;
    total_earnings: number | string;
    rating: number | string;
  };

  active_delivery?: unknown | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RiderEarnings {
  today: number;
  this_week: number;
  this_month: number;
  total_earnings: number;
  completed_deliveries: number;
}

export interface DeliveryHistoryItem {
  delivery_id: number;
  status: string;
  rider_earnings: number | string | null;
  delivered_at: string | null;
  rating: number | null;
  review: string | null;
}

export interface PaginatedDeliveryHistory {
  current_page: number;
  data: DeliveryHistoryItem[];
  last_page: number;
  total: number;
}
