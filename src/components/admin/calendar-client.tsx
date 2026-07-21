"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { RescheduleDialog } from "@/components/admin/reschedule-dialog";
import { ScheduleListClient } from "@/components/admin/schedule-list-client";
import {
  createCalendarBlock,
  deleteCalendarBlock,
} from "@/app/actions/calendar";
import { updateAppointmentStatus } from "@/app/actions/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
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
  notes: string | null;
}

interface Props {
  appointments: Appointment[];
  blocks: Block[];
  dentists: { id: string; name: string }[];
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
  clinicSlug,
  userRole,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockType, setBlockType] = useState("CLINIC_CLOSED");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  const isBlocked = (date: Date) =>
    blocks.some(
      (b) => date >= new Date(b.startDate) && date <= new Date(b.endDate),
    );

  const dayAppointments = (date: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.preferredDate), date));

  const selectedAppts = selectedDate ? dayAppointments(selectedDate) : [];
  const selectedBlocks = selectedDate
    ? blocks.filter(
        (b) =>
          selectedDate >= new Date(b.startDate) &&
          selectedDate <= new Date(b.endDate),
      )
    : [];

  async function handleBlockSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("type", blockType);
    const result = await createCalendarBlock(clinicSlug, fd);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Block created");
      setBlockOpen(false);
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center gap-2">
                {userRole === UserRole.DENTIST_ADMIN && (
                  <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Block Dates
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Block Calendar Dates</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleBlockSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            name="title"
                            placeholder="e.g. Holiday, Vacation"
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
                            <Select name="dentistId">
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
                            <Input name="startDate" type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input name="endDate" type="date" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea name="notes" rows={2} />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loading}
                        >
                          Create Block
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
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
                                : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${today ? "text-primary" : ""}`}
                        >
                          {format(day, "d")}
                        </span>
                        {blocked && (
                          <div className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                        )}
                        <div className="mt-0.5 space-y-0.5">
                          {appts.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className={`text-xs px-1 rounded truncate ${STATUS_COLORS[a.status] || "bg-gray-100"}`}
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
          </div>

          {/* Day detail panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDate
                    ? format(selectedDate, "MMMM d, yyyy")
                    : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedDate && (
                  <p className="text-sm text-muted-foreground">
                    Click on a date to see appointments.
                  </p>
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleDeleteBlock(b.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedDate &&
                  selectedAppts.length === 0 &&
                  selectedBlocks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No appointments or blocks.
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
                            className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[a.status] || "bg-gray-100"}`}
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
                              description={`Are you sure you want to cancel the appointment for ${a.patient ? a.patient.firstName + " " + a.patient.lastName : a.bookingName}?`}
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
        <ScheduleListClient
          clinicSlug={clinicSlug}
          initialAppointments={appointments}
        />
      </TabsContent>
    </Tabs>
  );
}
