export const KITCHEN_COORDS = { lat: 21.1643, lng: 79.0772 }; // Sadar, Nagpur
export const KITCHEN_NAME = "Naadan Cloud Kitchen (Sadar, Nagpur)";
export const KITCHEN_LOCALITY = "Sadar";
export const KITCHEN_PHONE = "+919876543210";
export const KITCHEN_ADDRESS = "Naadan Cloud Kitchen, Sadar, Nagpur, Maharashtra, 440001";
export const PREP_TIME_MINS = 15;
export const FOOD_GST_PERCENT = 5;
export const MAX_RADIUS_KM = 8;

export type DeliveryMetrics = {
  formattedAddress: string;
  addressComponents?: {
    street: string;
    sublocality: string;
    city: string;
    postal_code: string;
  };
  distanceKm: string;
  travelMins: number;
  prepMins: number;
  totalEtaMins: number;
  etaRangeText?: string;
};

export interface PlaceOrderPayload {
  pickup?: { lat: number; lng: number }
  drop: {
    lat: number
    lng: number
    address: string
    phone: string
  }
  etaMins?: number
  deliveryFee?: number
  distanceKm?: number | string
  deviceFingerprint?: string
  saveAddressToProfile?: boolean
  addressLabel?: string
  flatDetails?: string
}
