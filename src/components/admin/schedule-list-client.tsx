"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getFilteredAppointments,
  updateAppointmentStatus,
} from "@/app/actions/appointments";
import { checkInAppointment } from "@/app/actions/appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { RescheduleDialog } from "@/components/admin/reschedule-dialog";
import { CheckInDialog } from "@/components/admin/check-in-dialog";
import { LogIn, X, Check } from "lucide-react";
import { TablePagination } from "@/components/ui/pagination";

interface AppointmentListType {
  id: string;
  preferredDate: string | Date;
  scheduledTime: string | null;
  status: string;
  serviceType: string | null;
  bookingName: string | null;
  patient: { firstName: string; lastName: string } | null;
  dentist: { name: string } | null;
}

interface ScheduleListProps {
  clinicSlug: string;
  initialAppointments: AppointmentListType[];
  dentists?: { id: string; name: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  CHECKED_IN: "bg-purple-100 text-purple-800",
};

export function ScheduleListClient({
  clinicSlug,
  initialAppointments,
  dentists = [],
}: ScheduleListProps) {
  const [appointments, setAppointments] =
    useState<AppointmentListType[]>(initialAppointments);
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;
  const total = appointments.length;

  const paginatedAppointments = appointments.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "ALL",
  });

  const router = useRouter();

  function refresh() {
    startTransition(() => router.refresh());
    fetchData();
  }

  async function run<T>(id: string, fn: () => Promise<{ error?: string } | T>) {
    setLoadingId(id);
    const result = (await fn()) as { error?: string };
    if (result?.error) toast.error(result.error);
    else refresh();
    setLoadingId(null);
  }

  async function fetchData() {
    setLoadingId("fetch");
    const result = await getFilteredAppointments(clinicSlug, filters);
    if (result.error) toast.error(result.error);
    else if (result.appointments) setAppointments(result.appointments);
    setLoadingId(null);
  }

  // Fetch when filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.status]);

  function apptName(a: AppointmentListType) {
    return a.patient
      ? `${a.patient.firstName} ${a.patient.lastName}`
      : a.bookingName || "—";
  }

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>Date From</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((f) => ({ ...f, from: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Date To</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((f) => ({ ...f, to: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFilters({ from: "", to: "", status: "ALL" })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date & Time
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
                {appointments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No appointments found
                    </td>
                  </tr>
                )}
                {paginatedAppointments.map((a: AppointmentListType) => (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">
                        {formatDateShort(a.preferredDate)}
                      </div>
                      {a.scheduledTime && (
                        <div className="text-xs text-muted-foreground">
                          {a.scheduledTime}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{apptName(a)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.serviceType || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.dentist?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || "bg-gray-100"}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {a.status === "PENDING" && (
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
                        )}
                        {(a.status === "PENDING" ||
                          a.status === "CONFIRMED") && (
                          <RescheduleDialog
                            appointment={a}
                            clinicSlug={clinicSlug}
                            onDone={refresh}
                          />
                        )}
                        {(a.status === "PENDING" ||
                          a.status === "CONFIRMED") && (
                          <ConfirmActionDialog
                            title="Cancel Appointment"
                            description={`Are you sure you want to cancel the appointment for ${apptName(a)}?`}
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
                        )}
                        {a.status === "CONFIRMED" && (
                          <CheckInDialog
                            appointment={a}
                            dentists={dentists}
                            clinicSlug={clinicSlug}
                            onDone={refresh}
                          />
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
      <TablePagination
        total={total}
        page={page}
        pageSize={pageSize}
        itemName="appointments"
      />
    </div>
  );
}
