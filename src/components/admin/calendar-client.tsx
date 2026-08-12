"use client";

import { useState, Suspense } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { RescheduleDialog } from "@/components/admin/reschedule-dialog";
import { ScheduleListClient } from "@/components/admin/schedule-list-client";
import {
  createCalendarBlock,
  updateCalendarBlock,
  deleteCalendarBlock,
  updateOperatingDays,
  type ConflictingAppointment,
} from "@/app/actions/calendar";
import { updateAppointmentStatus } from "@/app/actions/appointments";
import { DAYS_OF_WEEK, getOpenDays, isDayOpen } from "@/lib/operating-days";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Ban,
  Edit2,
  Clock,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface Appointment {
  id: string;
  preferredDate: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string;
  serviceType: string | null;
  bookingName: string | null;
  patient: { firstName: string; lastName: string } | null;
  dentist: { name: string } | null;
}

interface Block {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  dentistId?: string | null;
  notes: string | null;
}

interface Props {
  appointments: Appointment[];
  blocks: Block[];
  dentists: { id: string; name: string }[];
  operatingHours?: unknown;
  clinicSlug: string;
  userRole: UserRole;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-200 text-yellow-900",
  CONFIRMED: "bg-blue-200 text-blue-900",
  COMPLETED: "bg-green-200 text-green-900",
  NO_SHOW: "bg-gray-200 text-gray-700",
};

export function CalendarClient({
  appointments,
  blocks,
  dentists,
  operatingHours,
  clinicSlug,
  userRole,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockType, setBlockType] = useState("CLINIC_CLOSED");
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  // Operating Days state
  const [opDaysOpen, setOpDaysOpen] = useState(false);
  const [selectedOpenDays, setSelectedOpenDays] = useState<number[]>(() =>
    getOpenDays(operatingHours),
  );
  const [opDaysLoading, setOpDaysLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictList, setConflictList] = useState<ConflictingAppointment[]>(
    [],
  );

  const router = useRouter();

  const openDays = getOpenDays(operatingHours);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  const getBlockDateStr = (dateInput: string | Date) => {
    if (!dateInput) return "";
    const str =
      typeof dateInput === "string" ? dateInput : dateInput.toISOString();
    return str.split("T")[0];
  };

  const isBlocked = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    return blocks.some((b) => {
      const sStr = getBlockDateStr(b.startDate);
      const eStr = getBlockDateStr(b.endDate);
      return dStr >= sStr && dStr <= eStr;
    });
  };

  const dayAppointments = (date: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.preferredDate), date));

  const selectedAppts = selectedDate ? dayAppointments(selectedDate) : [];
  const selectedBlocks = selectedDate
    ? blocks.filter((b) => {
        const dStr = format(selectedDate, "yyyy-MM-dd");
        const sStr = getBlockDateStr(b.startDate);
        const eStr = getBlockDateStr(b.endDate);
        return dStr >= sStr && dStr <= eStr;
      })
    : [];

  const upcomingBlocks = blocks
    .filter(
      (b) => getBlockDateStr(b.endDate) >= format(new Date(), "yyyy-MM-dd"),
    )
    .sort((a, b) =>
      getBlockDateStr(a.startDate).localeCompare(getBlockDateStr(b.startDate)),
    );

  async function handleBlockSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("type", blockType);

    let result;
    if (editingBlock) {
      result = await updateCalendarBlock(clinicSlug, editingBlock.id, fd);
    } else {
      result = await createCalendarBlock(clinicSlug, fd);
    }

    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(editingBlock ? "Block updated" : "Block created");
      setBlockOpen(false);
      setEditingBlock(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDeleteBlock(blockId: string) {
    const result = await deleteCalendarBlock(clinicSlug, blockId);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Block removed");
      router.refresh();
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const result = await updateAppointmentStatus(clinicSlug, id, status);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Appointment updated");
      router.refresh();
    }
  }

  async function handleSaveOperatingDays() {
    setOpDaysLoading(true);
    setConflictError(null);
    setConflictList([]);

    const result = await updateOperatingDays(clinicSlug, selectedOpenDays);

    if ("error" in result && result.error) {
      setConflictError(result.error);
      if (result.conflicts) {
        setConflictList(result.conflicts);
      }
      toast.error("Cannot update operating days");
    } else {
      toast.success("Operating days updated successfully");
      setOpDaysOpen(false);
      router.refresh();
    }
    setOpDaysLoading(false);
  }

  const toggleDay = (dayId: number) => {
    setSelectedOpenDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort(),
    );
  };

  return (
    <Tabs defaultValue="calendar" className="space-y-4">
      <TabsList>
        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        <TabsTrigger value="list">List View</TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" className="mt-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center gap-2">
                {userRole === UserRole.DENTIST_ADMIN && (
                  <>
                    {/* Operating Days Dialog */}
                    <Dialog
                      open={opDaysOpen}
                      onOpenChange={(open) => {
                        setOpDaysOpen(open);
                        if (!open) {
                          setConflictError(null);
                          setConflictList([]);
                          setSelectedOpenDays(getOpenDays(operatingHours));
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Clock className="h-4 w-4 mr-1 text-primary" />
                          Operating Days
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Operating Days Schedule</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <p className="text-xs text-muted-foreground">
                            Select which days of the week the clinic is
                            regularly open. Closing a day with active upcoming
                            appointments will be blocked until those bookings
                            are cancelled or rescheduled.
                          </p>

                          {conflictError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-2">
                              <div className="flex items-start gap-2 font-medium">
                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>{conflictError}</div>
                              </div>

                              {conflictList.length > 0 && (
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 pt-1 border-t border-red-200">
                                  <p className="font-semibold text-red-800">
                                    Affected Appointments:
                                  </p>
                                  {conflictList.map((c) => (
                                    <div
                                      key={c.id}
                                      className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-red-100"
                                    >
                                      <div>
                                        <span className="font-medium text-gray-900">
                                          {c.patientName}
                                        </span>
                                        <div className="text-gray-500">
                                          {format(
                                            new Date(c.preferredDate),
                                            "MMM d, yyyy (EEE)",
                                          )}
                                        </div>
                                      </div>
                                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded font-semibold text-[10px]">
                                        {c.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 bg-gray-50/50">
                            {DAYS_OF_WEEK.map((day) => {
                              const isChecked = selectedOpenDays.includes(
                                day.id,
                              );
                              return (
                                <label
                                  key={day.id}
                                  className={`flex items-center justify-between p-2 rounded-md border text-sm font-medium cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-white border-primary/40 text-primary shadow-sm"
                                      : "bg-gray-100 border-gray-200 text-gray-500"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() => toggleDay(day.id)}
                                    />
                                    <span>{day.label}</span>
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-normal ${
                                      isChecked
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {isChecked ? "Open" : "Closed"}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          <Button
                            onClick={handleSaveOperatingDays}
                            className="w-full"
                            disabled={opDaysLoading}
                          >
                            {opDaysLoading
                              ? "Saving Schedule..."
                              : "Save Operating Days"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Block Dates Dialog */}
                    <Dialog
                      open={blockOpen}
                      onOpenChange={(open) => {
                        setBlockOpen(open);
                        if (!open) setEditingBlock(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBlock(null);
                            setBlockType("CLINIC_CLOSED");
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Block Dates
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingBlock
                              ? "Edit Calendar Block"
                              : "Block Calendar Dates"}
                          </DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={handleBlockSubmit}
                          className="space-y-4"
                        >
                          <p className="text-xs text-muted-foreground bg-blue-50 text-blue-900 p-2.5 rounded-md border border-blue-200">
                            <strong>Note:</strong> Dates on regularly closed
                            days cannot be blocked. Update Operating Days if you
                            wish to open and block a specific day.
                          </p>

                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              name="title"
                              placeholder="e.g. Holiday, Seminar"
                              defaultValue={editingBlock?.title}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={blockType}
                              onValueChange={setBlockType}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CLINIC_CLOSED">
                                  Clinic Closed
                                </SelectItem>
                                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                                <SelectItem value="EMERGENCY_CLOSURE">
                                  Emergency Closure
                                </SelectItem>
                                <SelectItem value="DENTIST_UNAVAILABLE">
                                  Dentist Unavailable
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {blockType === "DENTIST_UNAVAILABLE" && (
                            <div className="space-y-2">
                              <Label>Dentist</Label>
                              <Select
                                name="dentistId"
                                defaultValue={
                                  editingBlock?.dentistId || undefined
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select dentist" />
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
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                name="startDate"
                                type="date"
                                defaultValue={
                                  editingBlock
                                    ? getBlockDateStr(editingBlock.startDate)
                                    : undefined
                                }
                                min={format(new Date(), "yyyy-MM-dd")}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input
                                name="endDate"
                                type="date"
                                defaultValue={
                                  editingBlock
                                    ? getBlockDateStr(editingBlock.endDate)
                                    : undefined
                                }
                                min={format(new Date(), "yyyy-MM-dd")}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              name="notes"
                              rows={2}
                              defaultValue={editingBlock?.notes || undefined}
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                          >
                            {editingBlock ? "Update Block" : "Create Block"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-7 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div
                        key={d}
                        className="py-2 text-center text-xs font-medium text-muted-foreground"
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`e${i}`} />
                  ))}
                  {days.map((day) => {
                    const appts = dayAppointments(day);
                    const blocked = isBlocked(day);
                    const isOpen = isDayOpen(day, openDays);
                    const selected =
                      selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(selected ? null : day)}
                        className={`min-h-[70px] p-1 rounded-lg border text-left transition-colors relative ${
                          selected
                            ? "border-primary bg-primary/5"
                            : today
                              ? "border-primary/50 bg-primary/10"
                              : blocked
                                ? "bg-red-50 border-red-200"
                                : !isOpen
                                  ? "bg-gray-100/70 border-gray-200 text-gray-400"
                                  : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            today
                              ? "text-primary"
                              : blocked
                                ? "text-red-500"
                                : !isOpen
                                  ? "text-gray-400"
                                  : ""
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {blocked ? (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Ban className="h-2.5 w-2.5 text-red-400" />
                            <span className="text-[9px] font-semibold text-red-500 uppercase tracking-wide leading-none">
                              Blocked
                            </span>
                          </div>
                        ) : !isOpen ? (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide leading-none">
                              Closed
                            </span>
                          </div>
                        ) : null}

                        <div className="mt-0.5 space-y-0.5">
                          {appts.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className={`text-xs px-1 rounded truncate ${
                                STATUS_COLORS[a.status] || "bg-gray-100"
                              }`}
                            >
                              {a.patient
                                ? `${a.patient.firstName} ${a.patient.lastName[0]}.`
                                : a.bookingName || "Appt"}
                            </div>
                          ))}
                          {appts.length > 2 && (
                            <div className="text-xs text-muted-foreground pl-1">
                              +{appts.length - 2} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-gray-200 bg-gray-100 inline-block" />
                <Clock className="h-3 w-3 text-gray-400" />
                Regularly Closed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-red-200 bg-red-50 inline-block" />
                <Ban className="h-3 w-3 text-red-400" />
                Blocked Date
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-primary/50 bg-primary/10 inline-block" />
                Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-primary bg-primary/5 inline-block" />
                Selected
              </span>
            </div>
          </div>

          {/* Day detail panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    {selectedDate
                      ? format(selectedDate, "MMMM d, yyyy")
                      : "Select a date"}
                  </span>
                  {selectedDate && !isDayOpen(selectedDate, openDays) && (
                    <span className="text-xs font-normal px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      Regularly Closed
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedDate && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Click on a date to see appointments and schedule details.
                    </p>

                    {upcomingBlocks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Upcoming Blocked Dates
                        </p>
                        {upcomingBlocks.slice(0, 5).map((b) => (
                          <div
                            key={b.id}
                            className="flex items-start justify-between bg-red-50 rounded-lg p-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-red-800">
                                {b.title}
                              </p>
                              <p className="text-xs text-red-600 mb-1">
                                {b.type.replace("_", " ")}
                              </p>
                              <p className="text-xs font-medium text-red-700">
                                {format(
                                  new Date(
                                    getBlockDateStr(b.startDate) + "T00:00:00",
                                  ),
                                  "MMM d, yyyy",
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(
                                    getBlockDateStr(b.endDate) + "T00:00:00",
                                  ),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                            {userRole === UserRole.DENTIST_ADMIN && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setEditingBlock(b);
                                    setBlockType(b.type);
                                    setBlockOpen(true);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3 text-red-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteBlock(b.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedDate && selectedBlocks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Blocked
                    </p>
                    {selectedBlocks.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-start justify-between bg-red-50 rounded-lg p-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            {b.title}
                          </p>
                          <p className="text-xs text-red-600">
                            {b.type.replace("_", " ")}
                          </p>
                        </div>
                        {userRole === UserRole.DENTIST_ADMIN && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingBlock(b);
                                setBlockType(b.type);
                                setBlockOpen(true);
                              }}
                            >
                              <Edit2 className="h-3 w-3 text-red-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleDeleteBlock(b.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedDate &&
                  selectedAppts.length === 0 &&
                  selectedBlocks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {!isDayOpen(selectedDate, openDays)
                        ? "Clinic is regularly closed on this day."
                        : "No appointments or blocks."}
                    </p>
                  )}

                {selectedAppts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Appointments ({selectedAppts.length})
                    </p>
                    {selectedAppts.map((a) => (
                      <div
                        key={a.id}
                        className="border rounded-lg p-2 space-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium">
                            {a.patient
                              ? `${a.patient.firstName} ${a.patient.lastName}`
                              : a.bookingName}
                          </p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              STATUS_COLORS[a.status] || "bg-gray-100"
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {a.serviceType || "General"}
                        </p>
                        {a.dentist && (
                          <p className="text-xs text-muted-foreground">
                            {a.dentist.name}
                          </p>
                        )}

                        {/* Actions */}
                        {(a.status === "PENDING" ||
                          a.status === "CONFIRMED") && (
                          <div className="flex items-center gap-2 pt-2 border-t mt-2">
                            <RescheduleDialog
                              appointment={{
                                id: a.id,
                                preferredDate: a.preferredDate,
                                patient: a.patient,
                                bookingName: a.bookingName,
                              }}
                              clinicSlug={clinicSlug}
                              onDone={() => router.refresh()}
                              trigger={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-1"
                                >
                                  Reschedule
                                </Button>
                              }
                            />
                            <ConfirmActionDialog
                              title="Cancel Appointment"
                              description={`Are you sure you want to cancel the appointment for ${
                                a.patient
                                  ? a.patient.firstName +
                                    " " +
                                    a.patient.lastName
                                  : a.bookingName
                              }?`}
                              loading={loading}
                              onConfirm={() =>
                                handleStatusUpdate(a.id, "CANCELLED")
                              }
                              trigger={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 flex-1"
                                >
                                  Cancel
                                </Button>
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="list" className="mt-0">
        <Suspense
          fallback={
            <div className="p-4 text-sm text-muted-foreground">
              Loading schedule list...
            </div>
          }
        >
          <ScheduleListClient
            clinicSlug={clinicSlug}
            initialAppointments={appointments}
            dentists={dentists}
          />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
