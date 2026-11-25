"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Check, UserCheck, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { linkPatientToAppointment } from "@/app/actions/appointments";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

export interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

interface LinkPatientDialogProps {
  appointmentId: string;
  clinicSlug: string;
  patients: PatientOption[];
  trigger?: React.ReactNode;
  currentPatient?: { id: string; name: string } | null;
  bookingName?: string | null;
  bookingPhone?: string | null;
  onSuccess?: () => void;
}

export function LinkPatientDialog({
  appointmentId,
  clinicSlug,
  patients,
  trigger,
  currentPatient,
  bookingName,
  bookingPhone,
  onSuccess,
}: LinkPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(
    currentPatient?.id || "",
  );
  const router = useRouter();

  const isChanging = Boolean(currentPatient);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const isSamePatient =
    currentPatient && currentPatient.id === selectedPatientId;

  async function handleConfirmLink() {
    if (!selectedPatientId || isSamePatient) return;
    setLoading(true);
    try {
      const result = await linkPatientToAppointment(
        clinicSlug,
        appointmentId,
        selectedPatientId,
      );
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isChanging
            ? `Patient changed to ${selectedPatient?.firstName} ${selectedPatient?.lastName}`
            : `Linked to ${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
        );
        setOpen(false);
        onSuccess?.();
        router.refresh();
      }
    } catch {
      toast.error(
        "Network error while linking patient profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const confirmTitle = isChanging
    ? "Confirm Patient Reassignment"
    : "Confirm Patient Profile Link";

  const confirmDesc = isChanging
    ? `Are you sure you want to change the linked patient from "${currentPatient?.name}" to "${selectedPatient?.firstName} ${selectedPatient?.lastName}"? All procedures, charting, and records for this appointment will be linked to ${selectedPatient?.firstName} ${selectedPatient?.lastName}.`
    : `Are you sure you want to link booking "${bookingName || "Walk-in"}" to patient profile "${selectedPatient?.firstName} ${selectedPatient?.lastName}"? All procedures charted for this appointment will belong to their patient record.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <UserCheck className="h-3 w-3 mr-1" />
            {isChanging ? "Change Patient" : "Link Patient"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {isChanging ? "Change Linked Patient" : "Link Patient Profile"}
          </DialogTitle>
          <DialogDescription>
            {isChanging
              ? "Reassign this visit and its charted procedures to a different patient profile."
              : "This appointment does not have a linked patient profile yet. Search and connect an existing patient profile before charting."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current vs Target banner if changing */}
          {isChanging && currentPatient && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Current Linked Patient
              </div>
              <p className="text-sm font-bold text-amber-950">
                {currentPatient.name}
              </p>
              {bookingName && bookingName !== currentPatient.name && (
                <p className="text-[11px] text-amber-700">
                  Original booking name: {bookingName}
                </p>
              )}
            </div>
          )}

          {/* Booking info if first-time link */}
          {!isChanging && bookingName && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Booking Information
              </span>
              <p className="text-sm font-bold text-slate-900">{bookingName}</p>
              {bookingPhone && (
                <p className="text-xs text-slate-600">{bookingPhone}</p>
              )}
            </div>
          )}

          {/* Patient Search Combobox */}
          <div className="space-y-2 flex flex-col">
            <Label>
              {isChanging
                ? "Select New Patient Profile"
                : "Select Existing Patient"}
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="justify-between h-10 w-full text-left font-normal"
                >
                  {selectedPatient ? (
                    <span className="font-semibold text-slate-900 truncate">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                      {selectedPatient.phone
                        ? ` (${selectedPatient.phone})`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Search patient...
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search patient name or phone..." />
                  <CommandList>
                    <CommandEmpty>No patients found.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((p) => {
                        const fullName = `${p.firstName} ${p.lastName}`;
                        const isCurrent = currentPatient?.id === p.id;
                        return (
                          <CommandItem
                            key={p.id}
                            value={`${fullName} ${p.phone || ""}`}
                            onSelect={() => {
                              setSelectedPatientId(p.id);
                              setOpenCombobox(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Check
                                className={`h-4 w-4 text-primary flex-shrink-0 ${
                                  selectedPatientId === p.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <div className="truncate">
                                <span className="font-medium text-slate-900">
                                  {fullName}
                                </span>
                                {p.phone && (
                                  <span className="text-xs text-muted-foreground ml-1.5">
                                    {p.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                                Current
                              </span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Reassignment visual comparison */}
          {isChanging && selectedPatient && !isSamePatient && (
            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="text-[10px] text-sky-600 uppercase font-semibold block">
                  Current
                </span>
                <span className="font-medium truncate">
                  {currentPatient?.name}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-sky-500 flex-shrink-0" />
              <div className="truncate text-right">
                <span className="text-[10px] text-sky-600 uppercase font-semibold block">
                  New Target
                </span>
                <span className="font-bold text-sky-900 truncate">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground bg-muted/60 p-3 rounded-lg leading-relaxed">
            If the patient does not have a profile yet, please click{" "}
            <strong>Cancel</strong>, visit the <strong>Patients</strong> tab to
            create their profile, and return here to connect it.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>

          {/* Confirmation Guard before executing link */}
          <ConfirmActionDialog
            title={confirmTitle}
            description={confirmDesc}
            confirmLabel={
              isChanging ? "Yes, Change Patient" : "Yes, Link Patient"
            }
            loading={loading}
            onConfirm={handleConfirmLink}
            trigger={
              <Button
                disabled={!selectedPatientId || isSamePatient || loading}
                className="font-semibold"
              >
                {isChanging ? "Change Patient" : "Link Patient"}
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
