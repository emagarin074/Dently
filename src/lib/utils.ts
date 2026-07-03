import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(num)
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(d)
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric" }).format(d)
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function calculateAge(dob: Date | string) {
  const d = typeof dob === "string" ? new Date(dob) : dob
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}
