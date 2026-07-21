"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPublicBooking } from "@/app/actions/appointments";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface ClinicData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  settings: { brandColor: string; operatingHours?: unknown } | null;
  users: { id: string; name: string; specialization: string | null }[];
  procedures: {
    id: string;
    name: string;
    description: string | null;
    priceType: string;
    price: number | null;
    priceMin: number | null;
    priceMax: number | null;
  }[];
}

export function ClinicPublicPage({ clinic }: { clinic: ClinicData }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dentistId, setDentistId] = useState<string>("");
  const [service, setService] = useState<string>("");

  const brandColor = clinic.settings?.brandColor || "#0891b2";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set(
      "preferredDentistId",
      dentistId === "no-preference" ? "" : dentistId,
    );
    fd.set("serviceType", service);
    const result = await createPublicBooking(clinic.slug, fd);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  }

  function getPriceLabel(proc: ClinicData["procedures"][0]) {
    if (proc.priceType === "FIXED" && proc.price)
      return formatCurrency(Number(proc.price));
    if (proc.priceType === "RANGE" && proc.priceMin && proc.priceMax)
      return `${formatCurrency(Number(proc.priceMin))} – ${formatCurrency(Number(proc.priceMax))}`;
    return "Inquire for price";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div style={{ backgroundColor: brandColor }} className="text-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold">{clinic.name}</h1>
          {clinic.description && (
            <p className="mt-4 text-white/80 max-w-xl mx-auto">
              {clinic.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/80">
            {clinic.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {clinic.address}
              </span>
            )}
            {clinic.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {clinic.phone}
              </span>
            )}
            {clinic.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {clinic.email}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 space-y-12">
        {/* Services */}
        {clinic.procedures.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Our Services</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.procedures.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {p.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {p.description}
                      </p>
                    )}
                    <p
                      className="text-sm font-semibold"
                      style={{ color: brandColor }}
                    >
                      {getPriceLabel(p)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Booking Form */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Book an Appointment</h2>
          {submitted ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle
                  className="h-12 w-12 mx-auto"
                  style={{ color: brandColor }}
                />
                <h3 className="text-xl font-semibold">Booking Received!</h3>
                <p className="text-muted-foreground">
                  Thank you for your request. Our team will confirm your
                  appointment shortly.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Book Another
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Juan dela Cruz"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number *</Label>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        placeholder="+63 912 345 6789"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="juan@email.com (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Desired Service *</Label>
                    <Select value={service} onValueChange={setService} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clinic.procedures.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="General Consultation">
                          General Consultation
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Dentist</Label>
                    <Select value={dentistId} onValueChange={setDentistId}>
                      <SelectTrigger>
                        <SelectValue placeholder="No Preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-preference">
                          No Preference
                        </SelectItem>
                        {clinic.users.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                            {d.specialization ? ` – ${d.specialization}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalConcern">
                      Additional Concern
                    </Label>
                    <Textarea
                      id="additionalConcern"
                      name="additionalConcern"
                      rows={3}
                      placeholder="Any specific concerns or questions?"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !service}
                    style={{ backgroundColor: brandColor }}
                  >
                    {loading ? "Submitting..." : "Request Appointment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
