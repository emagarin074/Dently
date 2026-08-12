"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { rescheduleAppointment } from "@/app/actions/appointments";
import { formatDateShort } from "@/lib/utils";

export interface RescheduleAppointment {
  id: string;
  preferredDate: string | Date;
  patient?: { firstName: string; lastName: string } | null;
  bookingName?: string | null;
}

function apptName(a: RescheduleAppointment) {
  return a.patient
    ? `${a.patient.firstName} ${a.patient.lastName}`
    : a.bookingName || "—";
}

export function RescheduleDialog({
  appointment,
  clinicSlug,
  onDone,
  trigger,
}: {
  appointment: RescheduleAppointment;
  clinicSlug: string;
  onDone: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dateString =
    appointment.preferredDate instanceof Date
      ? appointment.preferredDate.toISOString().slice(0, 10)
      : String(appointment.preferredDate).slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await rescheduleAppointment(
      clinicSlug,
      appointment.id,
      fd.get("date") as string,
      (fd.get("time") as string) || undefined,
    );
    if ("error" in result && result.error) toast.error(result.error);
    else {
      toast.success("Appointment rescheduled");
      setOpen(false);
      onDone();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Calendar className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Rescheduling for <strong>{apptName(appointment)}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>New Date</Label>
            <Input
              name="date"
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              defaultValue={dateString}
            />
          </div>
          <div className="space-y-2">
            <Label>Time (optional)</Label>
            <Input name="time" type="time" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Confirm Reschedule
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
