import React from "react";
import {
  CheckCircle2,
  Sparkles,
  AlignCenter,
  Heart,
  Shield,
  Smile,
  Star,
  Activity,
  Microscope,
  Cross,
  Thermometer,
  Baby,
} from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import {
  FaTooth,
  FaSyringe,
  FaStethoscope,
  FaPills,
  FaHospital,
  FaTeeth,
  FaTeethOpen,
  FaPrescriptionBottle,
  FaUserDoctor,
  FaUserNurse,
} from "react-icons/fa6";
import { ClinicData } from "@/components/clinic/public-page";
import { type BlockedDate } from "@/components/clinic/public-page";
import { isDayOpen, getDayName } from "@/lib/operating-days";

export interface TemplateProps {
  clinic: ClinicData;
  data: Record<string, unknown>;
  initialBranchId?: string;
  blockedDates?: BlockedDate[];
}

export const PlatformIcon: Record<string, React.ElementType> = {
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  Twitter: FaTwitter,
  LinkedIn: FaLinkedin,
  YouTube: FaYoutube,
};

export const TemplateIconMap: Record<string, React.ElementType> = {
  CheckCircle2,
  Tooth: FaTooth,
  Teeth: FaTeeth,
  TeethOpen: FaTeethOpen,
  Syringe: FaSyringe,
  Stethoscope: FaStethoscope,
  Pills: FaPills,
  Prescription: FaPrescriptionBottle,
  Hospital: FaHospital,
  Doctor: FaUserDoctor,
  Nurse: FaUserNurse,
  Sparkles,
  AlignCenter,
  Heart,
  Shield,
  Smile,
  Star,
  Activity,
  Microscope,
  Cross,
  Thermometer,
  Baby,
};

export function isDateBlocked(
  dateStr: string,
  blockedDates: BlockedDate[] = [],
): BlockedDate | null {
  if (!dateStr) return null;
  return (
    blockedDates.find((b) => dateStr >= b.startDate && dateStr <= b.endDate) ??
    null
  );
}

export function checkTemplateDateValidity(
  dateStr: string,
  openDays: number[],
  blockedDates: BlockedDate[] = [],
): string | null {
  if (!dateStr) return null;
  if (!isDayOpen(dateStr, openDays)) {
    const dayName = getDayName(new Date(dateStr + "T00:00:00").getDay());
    return `The clinic is closed on ${dayName}s. Please choose an open operating day.`;
  }
  const blocked = isDateBlocked(dateStr, blockedDates);
  if (blocked) {
    return `This date is unavailable (${blocked.title}). Please choose another date.`;
  }
  return null;
}

export function handleTemplateScroll(
  e: React.MouseEvent<HTMLElement>,
  id: string,
) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    window.history.pushState({}, "", `#${id}`);
  }
}
