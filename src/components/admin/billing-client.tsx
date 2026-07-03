"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { recordPayment } from "@/app/actions/billing"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { CreditCard, Plus } from "lucide-react"

interface Billing {
  id: string
  totalAmount: unknown; paidAmount: unknown; status: string; notes: string | null
  appointment: {
    patient: { id: string; firstName: string; lastName: string } | null
    bookingName: string | null
    procedures: { procedure: { name: string } }[]
  }
  payments: { id: string; amount: unknown; method: string; reference: string | null; paidAt: string }[]
  createdAt: string
}

const statusColors: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-800",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
  FULLY_PAID: "bg-green-100 text-green-800",
}

export function BillingClient({ billings, clinicSlug }: { billings: Billing[]; clinicSlug: string }) {
  const [selected, setSelected] = useState<Billing | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("CASH")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePayment() {
    if (!selected || !amount) return
    setLoading(true)
    const result = await recordPayment(clinicSlug, selected.id, parseFloat(amount), method, reference, notes)
    if ("error" in result) toast.error(result.error)
    else {
      toast.success("Payment recorded")
      setSelected(null)
      setAmount("")
      setReference("")
      setNotes("")
      router.refresh()
    }
    setLoading(false)
  }

  const getName = (b: Billing) =>
    b.appointment.patient
      ? `${b.appointment.patient.firstName} ${b.appointment.patient.lastName}`
      : b.appointment.bookingName || "—"

  const balance = selected ? Number(selected.totalAmount) - Number(selected.paidAmount) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["UNPAID", "PARTIALLY_PAID", "FULLY_PAID"].map((s) => (
          <Card key={s}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.replace("_", " ")}</p>
              <p className="text-2xl font-bold">{billings.filter(b => b.status === s).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Procedures</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Paid</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {billings.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No billing records</td></tr>
                )}
                {billings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{getName(b)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{b.appointment.procedures.map(p => p.procedure.name).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(b.totalAmount))}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(Number(b.paidAmount))}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(Number(b.totalAmount) - Number(b.paidAmount))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status]}`}>{b.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      {b.status !== "FULLY_PAID" && (
                        <Button size="sm" variant="outline" onClick={() => setSelected(b)}>
                          <Plus className="h-3 w-3 mr-1" />Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium">{getName(selected)}</p>
                <p>Total: {formatCurrency(Number(selected.totalAmount))}</p>
                <p className="text-green-600">Paid: {formatCurrency(Number(selected.paidAmount))}</p>
                <p className="text-red-600 font-semibold">Balance: {formatCurrency(balance)}</p>
              </div>

              <div className="space-y-2">
                <Label>Amount (₱)</Label>
                <Input
                  type="number"
                  step="0.01"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max: ${balance}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "INSURANCE", "OTHER"].map(m => (
                      <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference / Receipt No.</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              {selected.payments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Payment History</p>
                  {selected.payments.map((pay) => (
                    <div key={pay.id} className="flex justify-between text-xs py-1 border-b">
                      <span>{formatDate(pay.paidAt)} – {pay.method}</span>
                      <span className="font-medium">{formatCurrency(Number(pay.amount))}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full" onClick={handlePayment} disabled={!amount || loading}>
                {loading ? "Processing..." : "Record Payment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
