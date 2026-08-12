"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { formatDateShort, formatDate } from "@/lib/utils";
import { Check, X, Calendar, Plus, LogIn, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import {
  updateAppointmentStatus,
  rescheduleAppointment,
  checkInAppointment,
  createManualBooking,
  linkPatientToAppointment,
} from "@/app/actions/appointments";
import { updateQueueStatus, markQueueNoShow } from "@/app/actions/queue";
import { type ProcedureOption } from "@/components/admin/add-procedure-dialog";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { RescheduleDialog } from "@/components/admin/reschedule-dialog";
import { CheckInDialog } from "@/components/admin/check-in-dialog";
import { TablePagination } from "@/components/ui/pagination";
import { AlertCircle } from "lucide-react";
import { type BlockedDate } from "@/components/clinic/public-page";
import { format } from "date-fns";

// ─── types ────────────────────────────────────────────────────────────────────

interface RequestAppt {
  id: string;
  bookingName: string | null;
  bookingPhone: string | null;
  bookingEmail: string | null;
  bookingConcern: string | null;
  serviceType: string | null;
  status: string;
  source: string;
  preferredDate: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  dentist: { id: string; name: string } | null;
}

interface TodayAppt {
  id: string;
  bookingName: string | null;
  serviceType: string | null;
  status: string;
  scheduledTime: string | null;
  preferredDate: string;
  patient: { id: string; firstName: string; lastName: string } | null;
  dentist: { id: string; name: string } | null;
  queueEntry: { id: string; queueNumber: number; status: string } | null;
}

interface QueueEntry {
  id: string;
  queueNumber: number;
  patientName: string;
  status: string;
  notes: string | null;
  createdAt: string;
  appointmentId: string | null;
  appointment: {
    id: string;
    serviceType: string | null;
    dentist: { id: string; name: string } | null;
    patient: { id: string; firstName: string; lastName: string } | null;
  } | null;
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

interface Props {
  requests: RequestAppt[];
  todaySchedule: TodayAppt[];
  todayQueue: QueueEntry[];
  procedures: ProcedureOption[];
  dentists: { id: string; name: string }[];
  patients: PatientOption[];
  clinicSlug: string;
  userRole: UserRole;
  defaultTab: string;
  requestsTotal?: number;
  page?: number;
  blockedDates?: BlockedDate[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const QUEUE_COLS = [
  {
    status: "WAITING",
    label: "Waiting",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    status: "IN_CONSULTATION",
    label: "In Consultation",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    status: "IN_TREATMENT",
    label: "In Treatment",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    status: "FOR_PAYMENT",
    label: "For Payment",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
  },
];

const NEXT_QUEUE_STATUS: Record<string, string> = {
  WAITING: "IN_CONSULTATION",
  IN_CONSULTATION: "IN_TREATMENT",
};

const NEXT_QUEUE_LABEL: Record<string, string> = {
  WAITING: "Consult",
  IN_CONSULTATION: "Treat",
};

function apptName(a: RequestAppt | TodayAppt) {
  return a.patient
    ? `${a.patient.firstName} ${a.patient.lastName}`
    : a.bookingName || "—";
}

// ─── main component ───────────────────────────────────────────────────────────

export function BookingsClient({
  requests,
  todaySchedule,
  todayQueue,
  procedures,
  dentists,
  patients,
  clinicSlug,
  userRole,
  defaultTab,
  requestsTotal = 0,
  page = 1,
  blockedDates = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function run<T>(id: string, fn: () => Promise<{ error?: string } | T>) {
    setLoadingId(id);
    const result = (await fn()) as { error?: string };
    if (result?.error) toast.error(result.error);
    else refresh();
    setLoadingId(null);
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <TabsList>
          <TabsTrigger value="requests">
            Booking Requests
            {requests.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 text-white text-[10px] font-bold px-1">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="today">Today&apos;s Schedule</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
        </TabsList>

        <NewAppointmentModal
          dentists={dentists}
          patients={patients}
          clinicSlug={clinicSlug}
          onDone={refresh}
          blockedDates={blockedDates}
        />
      </div>

      {/* ── Tab 1: Booking Requests ── */}
      <TabsContent value="requests">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Preferred Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Concern
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No pending booking requests
                      </td>
                    </tr>
                  )}
                  {requests.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{apptName(a)}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.patient?.phone || a.bookingPhone || ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.bookingEmail || ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.serviceType || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateShort(a.preferredDate)}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {a.bookingConcern || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <ConfirmActionDialog
                            title="Accept Booking Request"
                            description={`Are you sure you want to accept the booking request for ${apptName(a)}?`}
                            loading={loadingId === a.id}
                            onConfirm={() =>
                              run(a.id, () =>
                                updateAppointmentStatus(
                                  clinicSlug,
                                  a.id,
                                  "CONFIRMED",
                                ),
                              )
                            }
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                                disabled={loadingId === a.id}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <RescheduleDialog
                            appointment={a}
                            clinicSlug={clinicSlug}
                            onDone={refresh}
                          />
                          <ConfirmActionDialog
                            title="Decline Booking Request"
                            description={`Are you sure you want to decline the booking request for ${apptName(a)}?`}
                            loading={loadingId === a.id}
                            onConfirm={() =>
                              run(a.id, () =>
                                updateAppointmentStatus(
                                  clinicSlug,
                                  a.id,
                                  "CANCELLED",
                                ),
                              )
                            }
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                disabled={loadingId === a.id}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <TablePagination
          total={requestsTotal}
          page={page}
          itemName="requests"
        />
      </TabsContent>

      {/* ── Tab 2: Today's Schedule ── */}
      <TabsContent value="today">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Dentist
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No appointments scheduled for today
                      </td>
                    </tr>
                  )}
                  {todaySchedule.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {a.scheduledTime || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{apptName(a)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.serviceType || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.dentist?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "CHECKED_IN" && a.queueEntry ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                              #{a.queueEntry.queueNumber}
                            </span>
                            <QueueBadge status={a.queueEntry.status} />
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            CONFIRMED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {a.status === "CONFIRMED" && (
                            <>
                              <CheckInDialog
                                appointment={a}
                                dentists={dentists}
                                clinicSlug={clinicSlug}
                                onDone={refresh}
                              />
                              <ConfirmActionDialog
                                title="Mark Appointment as No-Show"
                                description={`Are you sure you want to mark the appointment for ${apptName(a)} as no-show?`}
                                loading={loadingId === a.id}
                                onConfirm={() =>
                                  run(a.id, () =>
                                    updateAppointmentStatus(
                                      clinicSlug,
                                      a.id,
                                      "NO_SHOW",
                                    ),
                                  )
                                }
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={loadingId === a.id}
                                  >
                                    No-show
                                  </Button>
                                }
                              />
                            </>
                          )}
                          {a.status === "CHECKED_IN" && (
                            <span className="text-xs text-muted-foreground py-1">
                              In Queue
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab 3: Queue Kanban ── */}
      <TabsContent value="queue">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-4 min-h-[400px]">
          {QUEUE_COLS.map((col) => {
            const cards = todayQueue.filter((q) => q.status === col.status);
            return (
              <div key={col.status} className="flex flex-col min-w-0">
                <div
                  className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg border ${col.color}`}
                >
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="text-xs font-bold">{cards.length}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {cards.map((entry) => (
                    <QueueCard
                      key={entry.id}
                      entry={entry}
                      clinicSlug={clinicSlug}
                      loadingId={loadingId}
                      patients={patients}
                      onAction={(id, fn) => run(id, fn)}
                    />
                  ))}
                  {cards.length === 0 && (
                    <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Queue card ───────────────────────────────────────────────────────────────

function QueueCard({
  entry,
  clinicSlug,
  loadingId,
  patients,
  onAction,
}: {
  entry: QueueEntry;
  clinicSlug: string;
  loadingId: string | null;
  patients: PatientOption[];
  onAction: (id: string, fn: () => Promise<unknown>) => void;
}) {
  const nextStatus = NEXT_QUEUE_STATUS[entry.status];
  const nextLabel = NEXT_QUEUE_LABEL[entry.status];
  const isLoading = loadingId === entry.id;
  const checkedInTime = new Date(entry.createdAt);
  const minAgo = Math.floor((Date.now() - checkedInTime.getTime()) / 60000);

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
              {entry.queueNumber}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">
                {entry.patientName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.appointment?.serviceType || "—"}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5 mt-1">
            <Clock className="h-2.5 w-2.5" />
            {minAgo}m
          </span>
        </div>

        <div className="flex items-center justify-between">
          {entry.appointment?.dentist && (
            <p className="text-xs text-muted-foreground">
              {entry.appointment.dentist.name}
            </p>
          )}
          {entry.appointmentId &&
            entry.status !== "COMPLETED" &&
            (entry.appointment?.patient ? (
              <Link
                href={`/clinic/${clinicSlug}/admin/treatment/${entry.appointmentId}`}
                className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-auto"
              >
                <FileText className="h-3 w-3" />
                Chart
              </Link>
            ) : (
              <LinkPatientDialog
                appointmentId={entry.appointmentId}
                clinicSlug={clinicSlug}
                patients={patients}
                trigger={
                  <button className="text-xs text-primary hover:underline flex items-center gap-0.5 ml-auto bg-transparent border-none p-0">
                    <FileText className="h-3 w-3" />
                    Chart
                  </button>
                }
              />
            ))}
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          {nextStatus && (
            <Button
              size="sm"
              className="h-6 px-2 text-xs flex-1"
              disabled={isLoading}
              onClick={() =>
                onAction(entry.id, () =>
                  updateQueueStatus(clinicSlug, entry.id, nextStatus),
                )
              }
            >
              → {nextLabel}
            </Button>
          )}

          {entry.status === "WAITING" && (
            <ConfirmActionDialog
              title="Mark Patient as No-Show"
              description={`Are you sure you want to mark ${entry.patientName} as no-show? This will remove them from the queue.`}
              loading={isLoading}
              onConfirm={() =>
                onAction(entry.id, () => markQueueNoShow(clinicSlug, entry.id))
              }
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  disabled={isLoading}
                >
                  No-show
                </Button>
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Link Patient Dialog ────────────────────────────────────────────────────────

function LinkPatientDialog({
  appointmentId,
  clinicSlug,
  patients,
  trigger,
}: {
  appointmentId: string;
  clinicSlug: string;
  patients: PatientOption[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const router = useRouter();

  async function handleLink() {
    if (!selectedPatientId) return;
    setLoading(true);
    const result = await linkPatientToAppointment(
      clinicSlug,
      appointmentId,
      selectedPatientId,
    );
    if (result.error) toast.error(result.error);
    else {
      toast.success("Patient linked successfully");
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Patient Profile</DialogTitle>
          <DialogDescription>
            This appointment was created from the public page and does not have
            a linked patient profile. Before charting, you must link it to an
            existing patient profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 flex flex-col">
            <Label>Select Existing Patient</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="justify-between"
                >
                  {selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                    : "Search patient..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search patient..." />
                  <CommandList>
                    <CommandEmpty>No patient found.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.firstName} ${p.lastName}`}
                          onSelect={() => {
                            setSelectedPatientId(p.id);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedPatientId === p.id ? "opacity-100" : "opacity-0"}`}
                          />
                          {p.firstName} {p.lastName}{" "}
                          {p.phone ? `(${p.phone})` : ""}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            If the patient does not have a profile yet, please click{" "}
            <strong>Cancel</strong>, go to the <strong>Patients</strong> tab,
            create a new profile, and then return here to link it.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleLink} disabled={!selectedPatientId || loading}>
            Link Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Queue badge ──────────────────────────────────────────────────────────────

function QueueBadge({ status }: { status: string }) {
  const col = QUEUE_COLS.find((c) => c.status === status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${col?.color ?? "bg-gray-100 text-gray-800"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── New Appointment Modal ───────────────────────────────────────────────────

export function NewAppointmentModal({
  patients,
  dentists,
  clinicSlug,
  onDone,
  blockedDates = [],
}: {
  dentists: { id: string; name: string }[];
  patients: PatientOption[];
  clinicSlug: string;
  onDone: () => void;
  blockedDates?: BlockedDate[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFd, setPendingFd] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDateVal, setSelectedDateVal] = useState<string>(todayStr);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(
    null,
  );
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const isToday = selectedDateVal === todayStr;

  function isDateBlocked(dateStr: string): BlockedDate | null {
    if (!dateStr || dateStr === todayStr) return null;
    return (
      blockedDates.find(
        (b) => dateStr >= b.startDate && dateStr <= b.endDate,
      ) ?? null
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Select a patient");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const chosenDate = (fd.get("preferredDate") as string) || selectedDateVal;
    const isChosenToday = chosenDate === todayStr;

    if (!isChosenToday) {
      const blocked = isDateBlocked(chosenDate);
      if (blocked) {
        setDateError(
          `This date is unavailable (${blocked.title}). Please choose another date.`,
        );
        return;
      }
    }

    fd.set("isWalkIn", isChosenToday ? "true" : "false");
    fd.set("preferredDate", chosenDate);
    fd.set("patientId", selectedPatient.id);
    fd.set(
      "bookingName",
      `${selectedPatient.firstName} ${selectedPatient.lastName}`,
    );

    setPendingFd(fd);
    setConfirmOpen(true);
  }

  async function handleConfirmCreate() {
    if (!pendingFd) return;
    setLoading(true);
    const chosenDate =
      (pendingFd.get("preferredDate") as string) || selectedDateVal;
    const isChosenToday = chosenDate === todayStr;

    const result = await createManualBooking(clinicSlug, pendingFd);
    if ("error" in result && result.error) {
      toast.error(result.error);
    } else {
      const num = (result as { queueNumber?: number }).queueNumber;
      toast.success(
        isChosenToday ? `Checked in — Queue #${num}` : "Appointment created",
      );
      setConfirmOpen(false);
      setOpen(false);
      setSelectedPatient(null);
      setPatientSearch("");
      setDateError(null);
      setSelectedDateVal(todayStr);
      setPendingFd(null);
      onDone();
    }
    setLoading(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setSelectedPatient(null);
            setPatientSearch("");
            setDateError(null);
            setSelectedDateVal(todayStr);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Appointment
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>
                Patient <span className="text-red-500">*</span>
              </Label>
              <Popover
                open={patientPopoverOpen}
                onOpenChange={setPatientPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {selectedPatient ? (
                      <>
                        <span className="font-medium">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </span>
                        {selectedPatient.phone && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            {selectedPatient.phone}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Search patient...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search by name or phone..."
                      value={patientSearch}
                      onValueChange={setPatientSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No patients found.</CommandEmpty>
                      <CommandGroup>
                        {patients
                          .filter((p) => {
                            const full =
                              `${p.firstName} ${p.lastName} ${p.phone ?? ""}`.toLowerCase();
                            return full.includes(patientSearch.toLowerCase());
                          })
                          .slice(0, 30)
                          .map((p) => (
                            <CommandItem
                              key={p.id}
                              onSelect={() => {
                                setSelectedPatient(p);
                                setPatientPopoverOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <div>
                                <p className="font-medium">
                                  {p.firstName} {p.lastName}
                                </p>
                                {p.phone && (
                                  <p className="text-xs text-muted-foreground">
                                    {p.phone}
                                  </p>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Service / Concern</Label>
              <Input
                name="serviceType"
                placeholder="e.g. Cleaning, Extraction..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  name="preferredDate"
                  type="date"
                  required
                  value={selectedDateVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDateVal(val);
                    const blocked = isDateBlocked(val);
                    setDateError(
                      blocked
                        ? `This date is unavailable (${blocked.title}). Please choose another date.`
                        : null,
                    );
                  }}
                />
                {isToday ? (
                  <p className="text-xs text-green-700 font-medium">
                    Same-day visit — Checks patient directly into Today&apos;s
                    Queue.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-blue-700 font-medium">
                      Scheduled appointment for future date.
                    </p>
                    {dateError && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {dateError}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input name="scheduledTime" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign Dentist</Label>
              <Select name="dentistId">
                <SelectTrigger>
                  <SelectValue placeholder="No preference" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedPatient}
            >
              {isToday
                ? "Check In Now (Today)"
                : "Create Scheduled Appointment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Warning Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isToday
                ? "Confirm Walk-in Check-in"
                : "Confirm Appointment Schedule"}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-slate-700">
              {isToday ? (
                <span>
                  Are you sure you want to check in{" "}
                  <strong>
                    {selectedPatient?.firstName} {selectedPatient?.lastName}
                  </strong>{" "}
                  for today? This will immediately add them to Today&apos;s
                  Queue.
                </span>
              ) : (
                <span>
                  Are you sure you want to schedule an appointment for{" "}
                  <strong>
                    {selectedPatient?.firstName} {selectedPatient?.lastName}
                  </strong>{" "}
                  on{" "}
                  <strong>
                    {format(
                      new Date(selectedDateVal + "T00:00:00"),
                      "EEEE, MMMM d, yyyy",
                    )}
                  </strong>
                  ?
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmCreate} disabled={loading}>
              {loading ? "Processing..." : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
