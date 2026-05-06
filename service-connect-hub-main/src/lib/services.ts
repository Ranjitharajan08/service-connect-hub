import cleaningImg from "@/assets/service-cleaning.png";
import plumbingImg from "@/assets/service-plumbing.png";
import electricianImg from "@/assets/service-electrician.png";
import movingImg from "@/assets/service-moving.png";
import carpentryImg from "@/assets/service-carpentry.png";
import gardeningImg from "@/assets/service-gardening.png";

export const SERVICE_TYPES = [
  { key: "Cleaning", label: "Cleaning", image: cleaningImg },
  { key: "Plumbing", label: "Plumbing", image: plumbingImg },
  { key: "Electrician", label: "Electrician", image: electricianImg },
  { key: "Moving", label: "Moving", image: movingImg },
  { key: "Carpentry", label: "Carpentry", image: carpentryImg },
  { key: "Gardening", label: "Gardening", image: gardeningImg },
] as const;

export type ServiceTypeKey = (typeof SERVICE_TYPES)[number]["key"];

export const getServiceImage = (serviceType: string) => {
  return SERVICE_TYPES.find((s) => s.key === serviceType)?.image ?? cleaningImg;
};
