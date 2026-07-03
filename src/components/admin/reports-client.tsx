"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { format } from "date-fns"

interface Props {
  dailyRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  monthlyData: { amount: unknown; paidAt: string }[]
  appointmentsByStatus: { status: string; _count: { id: number } }[]
  procedureStats: { procedureId: string; name: string; count: number; revenue: number }[]
  dentistRevenue: { dentistId: string | null; name: string; procedures: number; revenue: number }[]
}

const COLORS = ["#0891b2", "#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc", "#ecfeff"]

export function ReportsClient({ dailyRevenue, monthlyRevenue, yearlyRevenue, monthlyData, appointmentsByStatus, procedureStats, dentistRevenue }: Props) {
  // Build daily revenue chart data for current month
  const dailyMap: Record<string, number> = {}
  monthlyData.forEach((p) => {
    const day = format(new Date(p.paidAt), "MMM d")
    dailyMap[day] = (dailyMap[day] || 0) + Number(p.amount)
  })
  const chartData = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }))

  const apptChartData = appointmentsByStatus.map(s => ({ name: s.status, value: s._count.id }))

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(dailyRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(monthlyRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(yearlyRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Revenue (This Month)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="#0891b2" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments by Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Appointments by Status</CardTitle></CardHeader>
          <CardContent>
            {apptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={apptChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {apptChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Procedure Statistics */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Procedures</CardTitle></CardHeader>
          <CardContent>
            {procedureStats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            ) : (
              <div className="space-y-2">
                {procedureStats.sort((a,b) => b.count - a.count).slice(0, 8).map((p) => (
                  <div key={p.procedureId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span className="font-medium">{p.name}</span>
                    <div className="text-right">
                      <span className="text-muted-foreground text-xs mr-2">{p.count}x</span>
                      <span className="font-semibold">{formatCurrency(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dentist Revenue */}
      {dentistRevenue.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Dentist</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Dentist</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Procedures</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dentistRevenue.sort((a,b) => b.revenue - a.revenue).map((d, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{d.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{d.procedures}</td>
                      <td className="py-2 text-right font-semibold text-primary">{formatCurrency(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
