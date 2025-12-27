import type { LucideIcon } from "lucide-react";
import {
  Bluetooth,
  Camera,
  CarFront,
  CheckCircle,
  Fuel,
  MapPin,
  Settings,
  Snowflake,
  Sun,
  Usb,
  Users,
  Wrench,
} from "lucide-react";

type FeatureKey = string | null | undefined;

const featureIconMap: Record<string, LucideIcon> = {
  "air conditioning": Snowflake,
  bluetooth: Bluetooth,
  gps: MapPin,
  usb: Usb,
  "usb port": Usb,
  "backup camera": Camera,
  camera: Camera,
  sunroof: Sun,
  automatic: Settings,
  manual: Wrench,
};

export const detailIcons = {
  location: MapPin,
  seats: Users,
  transmission: Settings,
  fuel: Fuel,
  carType: CarFront,
} satisfies Record<string, LucideIcon>;

export function getFeatureIcon(feature: FeatureKey) {
  if (!feature) return CheckCircle;
  const key = feature.toLowerCase().trim();
  return featureIconMap[key] ?? CheckCircle;
}
