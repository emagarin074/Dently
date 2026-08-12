"use client";

import { useState } from "react";
import { format, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import {
  getInquiries,
  markInquiryRead,
  deleteInquiry,
  bulkMarkInquiriesRead,
  bulkMarkInquiriesUnread,
  bulkDeleteInquiries,
  replyToInquiry,
} from "@/app/actions/inquiries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Trash2,
  Search,
  ArrowLeft,
  Copy,
  ExternalLink,
  RotateCcw,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Inquiry } from "@prisma/client";

interface Props {
  initialInquiries: Inquiry[];
  total: number;
  clinicId: string;
  clinicSlug: string;
}

export function InquiriesClient({
  initialInquiries,
  total,
  clinicId,
  clinicSlug,
}: Props) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [totalCount, setTotalCount] = useState(total);
  const [hasMore, setHasMore] = useState(initialInquiries.length < total);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  async function handleSendReply() {
    if (!selectedInquiry || !replyText.trim()) return;
    setSendingReply(true);
    const res = await replyToInquiry(clinicSlug, selectedInquiry.id, replyText);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Reply email sent to patient!");
      setReplyOpen(false);
      setReplyText("");
      setSelectedInquiry({ ...selectedInquiry, isRead: true });
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === selectedInquiry.id ? { ...i, isRead: true } : i,
        ),
      );
    }
    setSendingReply(false);
  }

  const [prevInitialInquiries, setPrevInitialInquiries] =
    useState(initialInquiries);

  if (prevInitialInquiries !== initialInquiries) {
    setPrevInitialInquiries(initialInquiries);
    setInquiries(initialInquiries);
    setTotalCount(total);
    setHasMore(initialInquiries.length < total);
  }

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop - clientHeight < 40 &&
      hasMore &&
      !loadingMore
    ) {
      setLoadingMore(true);
      try {
        const res = await getInquiries(clinicId, inquiries.length, 20);
        if (res.inquiries && res.inquiries.length > 0) {
          setInquiries((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = res.inquiries.filter(
              (i) => !existingIds.has(i.id),
            );
            const updated = [...prev, ...newItems];
            if (updated.length >= res.total || res.inquiries.length < 20) {
              setHasMore(false);
            }
            return updated;
          });
          setTotalCount(res.total);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Error fetching more inquiries:", err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setLoading(true);
    const result = await markInquiryRead(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Marked as read");
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
      );
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
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    }
    setLoading(false);
  };

  const handleBulkMarkRead = async () => {
    setLoading(true);
    const result = await bulkMarkInquiriesRead(Array.from(selectedIds));
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Inquiries marked as read");
      setInquiries((prev) =>
        prev.map((i) => (selectedIds.has(i.id) ? { ...i, isRead: true } : i)),
      );
      if (selectedInquiry && selectedIds.has(selectedInquiry.id)) {
        setSelectedInquiry({ ...selectedInquiry, isRead: true });
      }
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
      setInquiries((prev) =>
        prev.map((i) => (selectedIds.has(i.id) ? { ...i, isRead: false } : i)),
      );
      if (selectedInquiry && selectedIds.has(selectedInquiry.id)) {
        setSelectedInquiry({ ...selectedInquiry, isRead: false });
      }
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
      setInquiries((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      if (selectedInquiry && selectedIds.has(selectedInquiry.id)) {
        setSelectedInquiry(null);
      }
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (statusFilter === "READ" && !inq.isRead) return false;
    if (statusFilter === "UNREAD" && inq.isRead) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = inq.name.toLowerCase().includes(q);
      const matchEmail = inq.email?.toLowerCase().includes(q) ?? false;
      const matchPhone = inq.phone?.toLowerCase().includes(q) ?? false;
      const matchMsg = inq.message.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchMsg) return false;
    }

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

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied message to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const unreadCount = inquiries.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-4">
      {/* Top Filter & Toolbar Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Inquiries
            </h2>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? (
                <span className="text-primary font-semibold">
                  {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
                </span>
              ) : (
                "All messages read"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-32 h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
            />
            <span>to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-32 h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs bg-slate-50 border-slate-200">
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

      {/* Bulk Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl animate-in fade-in duration-200">
          <span className="text-xs font-semibold text-primary px-2 border-r border-primary/30">
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
                className="text-primary hover:text-primary hover:bg-primary/15 h-8 text-xs font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark Read
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
                className="text-primary hover:text-primary hover:bg-primary/15 h-8 text-xs font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Mark Unread
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs font-medium ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            }
          />
        </div>
      )}

      {/* Main Split Panel Container */}
      <div className="h-[calc(100vh-180px)] min-h-[580px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col md:flex-row">
        {/* Sidebar: Conversation List with Infinite Scroll */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0 ${
            selectedInquiry ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search & Select All Header */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search messages, names, emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-full focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <Checkbox
                  checked={
                    filteredInquiries.length > 0 &&
                    selectedIds.size === filteredInquiries.length
                  }
                  onCheckedChange={toggleAll}
                />
                <span className="font-medium">Select all</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                Showing {filteredInquiries.length} of {totalCount}
              </span>
            </div>
          </div>

          {/* Infinite Scroll Conversation Items List */}
          <div
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto divide-y divide-slate-100"
          >
            {filteredInquiries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-medium">No inquiries found</p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => {
                const isSelected = selectedInquiry?.id === inquiry.id;
                const isChecked = selectedIds.has(inquiry.id);

                return (
                  <div
                    key={inquiry.id}
                    onClick={() => {
                      setSelectedInquiry(inquiry);
                      if (!inquiry.isRead) {
                        handleMarkAsRead(inquiry.id);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all relative group ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-primary pl-2.5 shadow-xs"
                        : !inquiry.isRead
                          ? "bg-slate-50/70 hover:bg-slate-100/80"
                          : "hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className="pt-0.5 shrink-0"
                      onClick={(e) => toggleSelection(inquiry.id, e)}
                    >
                      <Checkbox
                        checked={isChecked}
                        aria-label="Select thread"
                      />
                    </div>

                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 border border-slate-200/80 shadow-2xs">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                          {getInitials(inquiry.name)}
                        </AvatarFallback>
                      </Avatar>
                      {!inquiry.isRead && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-white rounded-full shadow-xs animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            !inquiry.isRead
                              ? "font-bold text-slate-900"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          {inquiry.name}
                        </h4>
                        <span
                          className={`text-[10px] shrink-0 ${
                            !inquiry.isRead
                              ? "font-semibold text-primary"
                              : "text-slate-400"
                          }`}
                        >
                          {format(new Date(inquiry.createdAt), "MMM d")}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate leading-tight ${
                          !inquiry.isRead
                            ? "font-semibold text-slate-800"
                            : "text-slate-500"
                        }`}
                      >
                        {inquiry.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        {inquiry.email && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            {inquiry.email}
                          </span>
                        )}
                        {inquiry.phone && (
                          <span className="text-[10px] text-slate-400">
                            {inquiry.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading Spinner for Infinite Scroll */}
            {loadingMore && (
              <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-slate-50/50">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading more conversations...</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Panel: Chat Thread View */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden ${
            !selectedInquiry ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedInquiry ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Thread Header */}
              <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 text-slate-600"
                    onClick={() => setSelectedInquiry(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>

                  <Avatar className="w-10 h-10 border border-slate-200">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                      {getInitials(selectedInquiry.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {selectedInquiry.name}
                      </h3>
                      {selectedInquiry.isRead ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 text-slate-500"
                        >
                          Read
                        </Badge>
                      ) : (
                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0">
                          Unread
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Received{" "}
                      {format(
                        new Date(selectedInquiry.createdAt),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Quick Actions */}
                <div className="flex items-center gap-1.5">
                  {!selectedInquiry.isRead ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(selectedInquiry.id)}
                      className="text-xs text-primary hover:text-primary hover:bg-primary/10 h-8"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Read
                    </Button>
                  ) : (
                    <ConfirmActionDialog
                      title="Mark as Unread"
                      description="Are you sure you want to mark this message as unread?"
                      loading={loading}
                      onConfirm={async () => {
                        await bulkMarkInquiriesUnread([selectedInquiry.id]);
                        setSelectedInquiry({
                          ...selectedInquiry,
                          isRead: false,
                        });
                        setInquiries((prev) =>
                          prev.map((i) =>
                            i.id === selectedInquiry.id
                              ? { ...i, isRead: false }
                              : i,
                          ),
                        );
                        toast.success("Marked as unread");
                      }}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-8"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Mark Unread
                        </Button>
                      }
                    />
                  )}

                  <ConfirmActionDialog
                    title="Delete Inquiry"
                    description="Are you sure you want to delete this inquiry message? This action cannot be undone."
                    loading={loading}
                    onConfirm={() => handleDelete(selectedInquiry.id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* Chat Window Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {/* Date Divider */}
                <div className="flex items-center justify-center">
                  <span className="bg-slate-200/70 text-slate-600 text-[11px] px-3 py-1 rounded-full font-medium shadow-2xs">
                    {format(
                      new Date(selectedInquiry.createdAt),
                      "EEEE, MMM d, yyyy 'at' h:mm a",
                    )}
                  </span>
                </div>

                {/* Patient Chat Message Bubble */}
                <div className="flex items-start gap-3 max-w-2xl">
                  <Avatar className="w-8 h-8 shrink-0 mt-1 border border-slate-200">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-[10px]">
                      {getInitials(selectedInquiry.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-slate-500 px-1">
                      {selectedInquiry.name}
                    </span>

                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap shadow-xs">
                      {selectedInquiry.message}
                    </div>

                    {/* Contact Details Card Box inside Chat */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedInquiry.email && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs shadow-2xs">
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-slate-700 truncate font-medium">
                              {selectedInquiry.email}
                            </span>
                          </div>
                          <a
                            href={`mailto:${selectedInquiry.email}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold text-[11px] flex items-center gap-1 shrink-0 ml-2"
                          >
                            Email <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {selectedInquiry.phone && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs shadow-2xs">
                          <div className="flex items-center gap-2 truncate">
                            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-slate-700 font-medium">
                              {selectedInquiry.phone}
                            </span>
                          </div>
                          <a
                            href={`tel:${selectedInquiry.phone}`}
                            className="text-emerald-600 hover:underline font-semibold text-[11px] flex items-center gap-1 shrink-0 ml-2"
                          >
                            Call <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="bg-white border-t border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {selectedInquiry.email && (
                    <Button
                      size="sm"
                      onClick={() => setReplyOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-full px-4"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" /> Reply via Email
                    </Button>
                  )}

                  {selectedInquiry.phone && (
                    <a href={`tel:${selectedInquiry.phone}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs rounded-full px-4 border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />{" "}
                        Call Patient
                      </Button>
                    </a>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(selectedInquiry.message, selectedInquiry.id)
                  }
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  {copiedId === selectedInquiry.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />{" "}
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy Message Text
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Empty State: No Thread Selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  Select a Conversation
                </h3>
                <p className="text-xs text-slate-500">
                  Choose an inquiry from the left sidebar to view message
                  contents, reply, or manage patient details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply via Email Dialog Modal */}
      {selectedInquiry && (
        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Reply to{" "}
                {selectedInquiry.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                <p className="text-slate-500 font-medium">
                  To:{" "}
                  <span className="text-slate-900">
                    {selectedInquiry.email}
                  </span>
                </p>
                <p className="text-slate-500 truncate">
                  Re: Inquiring about dental services
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Your Response Message
                </label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to the patient..."
                  rows={5}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplyOpen(false)}
                disabled={sendingReply}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={sendingReply || !replyText.trim()}
              >
                {sendingReply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 mr-1.5" /> Send Email Reply
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
