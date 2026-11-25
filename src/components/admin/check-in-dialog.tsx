"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LogIn, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { checkInAppointment } from "@/app/actions/appointments";

interface CheckInDialogProps {
  appointment: {
    id: string;
    bookingName?: string | null;
    patient?: { firstName: string; lastName: string } | null;
    dentistId?: string | null;
    dentist?: { id?: string; name: string } | null;
    branchId?: string | null;
    branch?: { id: string; name: string } | null;
    serviceType?: string | null;
  };
  dentists: { id: string; name: string }[];
  branches?: { id: string; name: string; isPrimary?: boolean }[];
  clinicSlug: string;
  onDone: () => void;
  trigger?: React.ReactNode;
}

export function CheckInDialog({
  appointment,
  dentists,
  branches = [],
  clinicSlug,
  onDone,
  trigger,
}: CheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDentistId, setSelectedDentistId] = useState<string>(
    appointment.dentistId || appointment.dentist?.id || "",
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    appointment.branchId ||
      appointment.branch?.id ||
      branches.find((branch) => branch.isPrimary)?.id ||
      branches[0]?.id ||
      "",
  );

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : appointment.bookingName || "Patient";

  async function handleCheckIn() {
    if (
      !selectedDentistId ||
      selectedDentistId === "none" ||
      selectedDentistId.trim() === ""
    ) {
      toast.error("Please select an assigned dentist for this visit.");
      return;
    }
    if (!selectedBranchId) {
      toast.error("Please select a clinic branch for this visit.");
      return;
    }
    setLoading(true);
    try {
      const res = await checkInAppointment(
        clinicSlug,
        appointment.id,
        selectedDentistId,
        selectedBranchId,
      );
      if ("error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Checked in ${patientName} into Today's Queue`);
        setOpen(false);
        onDone();
      }
    } catch {
      toast.error("Network error while checking in patient. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="h-7 px-2 bg-primary hover:bg-primary/90">
            <LogIn className="h-3 w-3 mr-1" />
            Check In
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Check In Patient
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-slate-700">
            Confirm check-in for <strong>{patientName}</strong> into
            Today&apos;s Queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {appointment.serviceType && (
            <div className="text-xs bg-slate-50 p-2.5 rounded-md border text-slate-600">
              <span className="font-semibold text-slate-900">Service: </span>
              {appointment.serviceType}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Branch <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Assign Attending Dentist <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedDentistId}
              onValueChange={setSelectedDentistId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dentist..." />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Select the dentist who will cater to the patient during this
              visit.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCheckIn} disabled={loading}>
            {loading ? "Checking In..." : "Confirm & Check In"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
