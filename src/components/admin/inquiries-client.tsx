"use client";

import { useState } from "react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  markInquiryRead,
  deleteInquiry,
  bulkMarkInquiriesRead,
  bulkMarkInquiriesUnread,
  bulkDeleteInquiries,
} from "@/app/actions/inquiries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Mail,
  MailOpen,
  User,
  Calendar,
  CheckCircle2,
  Phone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Inquiry } from "@prisma/client";
import { TablePagination } from "@/components/ui/pagination";

interface Props {
  inquiries: Inquiry[];
  total: number;
  page: number;
  clinicSlug: string;
}

export function InquiriesClient({ inquiries, total, page, clinicSlug }: Props) {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    setLoading(true);
    const result = await markInquiryRead(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Marked as read");
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, isRead: true });
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const result = await deleteInquiry(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Inquiry deleted");
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    }
    setLoading(false);
  };

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleBulkMarkRead = async () => {
    setLoading(true);
    const result = await bulkMarkInquiriesRead(Array.from(selectedIds));
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Inquiries marked as read");
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  const handleBulkMarkUnread = async () => {
    setLoading(true);
    const result = await bulkMarkInquiriesUnread(Array.from(selectedIds));
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Inquiries marked as unread");
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    const result = await bulkDeleteInquiries(Array.from(selectedIds));
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Inquiries deleted");
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredInquiries = inquiries.filter((inq) => {
    if (statusFilter === "READ" && !inq.isRead) return false;
    if (statusFilter === "UNREAD" && inq.isRead) return false;

    if (fromDate) {
      if (isBefore(new Date(inq.createdAt), startOfDay(new Date(fromDate))))
        return false;
    }
    if (toDate) {
      if (isAfter(new Date(inq.createdAt), endOfDay(new Date(toDate))))
        return false;
    }
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (
      selectedIds.size === filteredInquiries.length &&
      filteredInquiries.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInquiries.map((i) => i.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <p className="text-slate-500 text-sm">
          You have {inquiries.filter((i) => !i.isRead).length} unread message
          {inquiries.filter((i) => !i.isRead).length !== 1 ? "s" : ""}.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-36 h-9 text-sm"
            />
            <span className="text-slate-400 text-sm">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-36 h-9 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="UNREAD">Unread</SelectItem>
              <SelectItem value="READ">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50/50 border rounded-lg">
          <span className="text-sm font-medium text-blue-700 px-2 border-r border-blue-200">
            {selectedIds.size} selected
          </span>
          <ConfirmActionDialog
            title="Mark as Read"
            description="Are you sure you want to mark the selected inquiries as read?"
            loading={loading}
            onConfirm={handleBulkMarkRead}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 h-8"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Read
              </Button>
            }
          />
          <ConfirmActionDialog
            title="Mark as Unread"
            description="Are you sure you want to mark the selected inquiries as unread?"
            loading={loading}
            onConfirm={handleBulkMarkUnread}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 h-8"
              >
                <Mail className="w-4 h-4 mr-2" /> Mark Unread
              </Button>
            }
          />
          <ConfirmActionDialog
            title="Delete Selected"
            description="Are you sure you want to delete the selected inquiries? This action cannot be undone."
            loading={loading}
            onConfirm={handleBulkDelete}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 ml-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            }
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] pl-4">
                  <Checkbox
                    checked={
                      filteredInquiries.length > 0 &&
                      selectedIds.size === filteredInquiries.length
                    }
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-slate-500"
                  >
                    No inquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <TableRow
                    key={inquiry.id}
                    className={!inquiry.isRead ? "bg-blue-50/50" : ""}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.has(inquiry.id)}
                        onCheckedChange={() => toggleSelection(inquiry.id)}
                        aria-label={`Select ${inquiry.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(
                        new Date(inquiry.createdAt),
                        "MMM d, yyyy h:mm a",
                      )}
                    </TableCell>
                    <TableCell>{inquiry.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {inquiry.email && <span>{inquiry.email}</span>}
                        {inquiry.phone && (
                          <span className="text-sm text-slate-500">
                            {inquiry.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {inquiry.isRead ? (
                        <Badge variant="outline" className="text-slate-500">
                          Read
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInquiry(inquiry)}
                        >
                          View Message
                        </Button>
                        <ConfirmActionDialog
                          title="Delete Inquiry"
                          description="Are you sure you want to delete this message? This action cannot be undone."
                          loading={loading}
                          onConfirm={() => handleDelete(inquiry.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TablePagination total={total} page={page} itemName="inquiries" />

      <Dialog
        open={!!selectedInquiry}
        onOpenChange={(open) => !open && setSelectedInquiry(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Inquiry Details
            </DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4" /> Name
                  </span>
                  <p className="font-medium">{selectedInquiry.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </span>
                  {selectedInquiry.email ? (
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="font-medium text-blue-600 hover:underline break-all"
                    >
                      {selectedInquiry.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not provided</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </span>
                  {selectedInquiry.phone ? (
                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {selectedInquiry.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not provided</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Received
                  </span>
                  <p className="font-medium">
                    {format(
                      new Date(selectedInquiry.createdAt),
                      "MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-slate-500 font-medium">
                  Message
                </span>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap text-slate-700">
                  {selectedInquiry.message}
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-2 border-t">
                {!selectedInquiry.isRead && (
                  <Button
                    onClick={() => handleMarkAsRead(selectedInquiry.id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
