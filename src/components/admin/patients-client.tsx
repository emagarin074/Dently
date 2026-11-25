"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { createPatient } from "@/app/actions/patients";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ChevronRight,
  QrCode,
  Users,
  ChevronLeft,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  _count: { appointments: number };
}

interface Props {
  patients?: Patient[];
  total?: number;
  page?: number;
  clinicSlug: string;
}

export function PatientsClient({
  patients = [],
  total = 0,
  page = 1,
  clinicSlug,
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`?q=${encodeURIComponent(search)}`);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("gender", gender);
      const result = await createPatient(clinicSlug, fd);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Patient registered successfully");
        setOpen(false);
        router.refresh();
        if ("patientId" in result)
          router.push(
            `/clinic/${clinicSlug}/admin/patients/${result.patientId}`,
          );
      }
    } catch {
      toast.error("Network error while creating patient. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 max-w-sm w-full"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm bg-white"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-9 px-3"
          >
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Link href={`/clinic/${clinicSlug}/admin/qr?tab=intake`}>
              <QrCode className="h-3.5 w-3.5 text-slate-500" />
              <span>Intake QR</span>
            </Link>
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Patient</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-2xl border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                  Add New Patient Record
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      First Name *
                    </Label>
                    <Input name="firstName" required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Middle Name
                    </Label>
                    <Input name="middleName" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Last Name *
                    </Label>
                    <Input name="lastName" required className="h-9 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Date of Birth
                    </Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Gender
                    </Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select gender..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="PREFER_NOT_TO_SAY">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Phone
                    </Label>
                    <Input
                      name="phone"
                      placeholder="+63 912 345 6789"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Email
                    </Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="patient@example.com"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Home Address
                  </Label>
                  <Input
                    name="address"
                    placeholder="Street, City, Postal Code"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Emergency Contact
                    </Label>
                    <Input
                      name="emergencyContactName"
                      placeholder="Full Name"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Emergency Phone
                    </Label>
                    <Input
                      name="emergencyContactPhone"
                      placeholder="Contact number"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-xs font-semibold mt-2"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Save Patient Record"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Patients Data Table */}
      <Card className="border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
                <TableHead>Patient Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead className="text-center">Visits</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                      <Users className="h-6 w-6 text-slate-400" />
                      <p className="font-medium text-slate-700">
                        No patient records found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search terms or add a new patient.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((p) => {
                  const initials =
                    `${p.firstName[0] || ""}${p.lastName[0] || ""}`.toUpperCase();
                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold flex-shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/clinic/${clinicSlug}/admin/patients/${p.id}`}
                              className="font-semibold text-xs sm:text-sm text-slate-900 hover:text-primary transition-colors block"
                            >
                              {p.lastName}, {p.firstName}
                            </Link>
                            {p.middleName && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                Middle: {p.middleName}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {p.phone || p.email || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {p.gender ? (
                          <span className="capitalize">
                            {p.gender.toLowerCase().replace(/_/g, " ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px]"
                        >
                          {p._count.appointments}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(p.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900 group-hover:bg-white"
                        >
                          <Link
                            href={`/clinic/${clinicSlug}/admin/patients/${p.id}`}
                          >
                            <span>View Chart</span>
                            <ChevronRight className="h-3 w-3 ml-1 text-slate-400" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
        <p className="font-medium">
          Showing{" "}
          <span className="text-slate-900 font-bold">{patients.length}</span> of{" "}
          <span className="text-slate-900 font-bold">{total}</span> patients
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => router.push(`?page=${page - 1}`)}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
          )}
          {patients.length === 20 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => router.push(`?page=${page + 1}`)}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
