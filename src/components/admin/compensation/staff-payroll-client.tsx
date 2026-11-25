"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDailySalaryPayrollRun,
  upsertStaffAttendance,
} from "@/app/actions/compensation";
import { formatCurrency } from "@/lib/utils";
import { CalendarCheck2, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PayrollRunUI, PayrollStaffUI } from "./payroll-run-client";

export interface StaffPayProfileUI {
  id: string;
  staffId: string;
  payType: string;
  dailyRate: number | string;
  expectedTimeIn: string | null;
  expectedTimeOut: string | null;
  breakMinutes: number;
  lateGraceMinutes: number;
  lateDeductionType: string;
  lateDeductionValue: number | string;
  isActive: boolean;
  staff?: {
    name: string;
    email: string;
    role: string;
  };
}

export interface StaffAttendanceUI {
  id: string;
  staffId: string;
  date: Date | string;
  status: string;
  timeIn: string | null;
  timeOut: string | null;
  notes: string | null;
  staff?: {
    name: string;
    email: string;
  };
}

interface Props {
  clinicSlug: string;
  staff: PayrollStaffUI[];
  profiles: StaffPayProfileUI[];
  attendance: StaffAttendanceUI[];
  onPayrollCreated?: (payroll: PayrollRunUI) => void;
}

const ATTENDANCE_STATUSES = ["PRESENT", "HALF_DAY", "ABSENT"] as const;

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StaffPayrollClient({
  clinicSlug,
  staff,
  profiles: initialProfiles,
  attendance: initialAttendance,
  onPayrollCreated,
}: Props) {
  const router = useRouter();
  const [attendance, setAttendance] =
    useState<StaffAttendanceUI[]>(initialAttendance);
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id ?? "");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] =
    useState<(typeof ATTENDANCE_STATUSES)[number]>("PRESENT");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [attendanceNotes, setAttendanceNotes] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProfile = initialProfiles.find(
    (p) => p.staffId === selectedStaffId,
  );
  const isFixedDaily =
    selectedProfile?.payType === "FIXED_DAILY" ||
    selectedProfile?.payType === "DAILY";
  const visibleAttendance = useMemo(
    () =>
      attendance
        .filter((item) => item.staffId === selectedStaffId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [attendance, selectedStaffId],
  );

  async function handleSaveAttendance() {
    if (!selectedStaffId || !attendanceDate) {
      toast.error("Choose staff and attendance date");
      return;
    }

    setLoading(true);
    const result = await upsertStaffAttendance(clinicSlug, {
      staffId: selectedStaffId,
      date: attendanceDate,
      status: attendanceStatus,
      timeIn: attendanceStatus === "PRESENT" ? timeIn : undefined,
      timeOut: attendanceStatus === "PRESENT" ? timeOut : undefined,
      notes: attendanceNotes,
    });
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    if (result.attendance) {
      const item = result.attendance as StaffAttendanceUI;
      setAttendance((prev) => [
        item,
        ...prev.filter(
          (existing) =>
            !(
              existing.staffId === item.staffId &&
              new Date(existing.date).toDateString() ===
                new Date(item.date).toDateString()
            ),
        ),
      ]);
      setTimeIn("");
      setTimeOut("");
      setAttendanceNotes("");
      toast.success("Attendance saved");
    }
  }

  async function handleCreateSalaryPayroll() {
    if (!selectedStaffId || !periodStart || !periodEnd) {
      toast.error("Choose staff and payroll period");
      return;
    }
    if (!isFixedDaily) {
      toast.error("This staff member is set to procedure based computation");
      return;
    }

    setLoading(true);
    const result = await createDailySalaryPayrollRun(clinicSlug, {
      staffId: selectedStaffId,
      periodStart,
      periodEnd,
    });
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    if (result.payroll) {
      toast.success("Daily salary payroll draft created");
      onPayrollCreated?.(result.payroll as PayrollRunUI);
      router.refresh();
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-3 px-4 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <UserRoundCog className="w-4 h-4 text-primary" />
          Staff Daily Payroll
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Staff</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-bold uppercase text-slate-500">
              Pay Setup
            </div>
            {selectedProfile ? (
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">
                  {isFixedDaily ? "Fixed daily" : "Procedure based"}
                </Badge>
                {isFixedDaily && (
                  <>
                    <Badge variant="outline">
                      Daily {formatCurrency(Number(selectedProfile.dailyRate))}
                    </Badge>
                    <Badge variant="outline">
                      Shift {selectedProfile.expectedTimeIn ?? "08:00"}-
                      {selectedProfile.expectedTimeOut ?? "17:00"}
                    </Badge>
                    <Badge variant="outline">
                      Break {selectedProfile.breakMinutes ?? 0} min
                    </Badge>
                    <Badge variant="outline">
                      Grace {selectedProfile.lateGraceMinutes ?? 0} min
                    </Badge>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Configure this staff member in User Management.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1.3fr_auto] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select
              value={attendanceStatus}
              onValueChange={(value) => {
                setAttendanceStatus(
                  ATTENDANCE_STATUSES.includes(
                    value as (typeof ATTENDANCE_STATUSES)[number],
                  )
                    ? (value as (typeof ATTENDANCE_STATUSES)[number])
                    : "PRESENT",
                );
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Time In</Label>
            <Input
              type="time"
              value={timeIn}
              disabled={attendanceStatus !== "PRESENT"}
              onChange={(e) => setTimeIn(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Time Out</Label>
            <Input
              type="time"
              value={timeOut}
              disabled={attendanceStatus !== "PRESENT"}
              onChange={(e) => setTimeOut(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input
              value={attendanceNotes}
              onChange={(e) => setAttendanceNotes(e.target.value)}
              className="h-9 text-xs"
              placeholder="Optional"
            />
          </div>
          <ConfirmActionDialog
            title="Save attendance?"
            description="This will update the staff attendance record for the selected date."
            loading={loading}
            onConfirm={handleSaveAttendance}
            trigger={<Button disabled={loading}>Save Attendance</Button>}
          />
        </div>

        <div className="rounded-md border border-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
            <CalendarCheck2 className="w-3.5 h-3.5 text-primary" />
            Recent Attendance
          </div>
          {visibleAttendance.length === 0 ? (
            <div className="p-4 text-xs text-slate-500">
              No attendance records for this staff member.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleAttendance.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {formatDate(item.date)}
                    </div>
                    {(item.timeIn || item.timeOut) && (
                      <div className="text-slate-500">
                        {item.timeIn || "--:--"} - {item.timeOut || "--:--"}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-slate-500">{item.notes}</div>
                    )}
                  </div>
                  <Badge variant="outline">
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 rounded-md border border-slate-100 p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Payroll Period Start</Label>
            <Input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Payroll Period End</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <ConfirmActionDialog
            title="Create daily salary payroll?"
            description="This creates a draft payroll run from attendance records in the selected period."
            loading={loading}
            onConfirm={handleCreateSalaryPayroll}
            trigger={
              <Button disabled={loading || !isFixedDaily}>
                Create Salary Payroll
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
