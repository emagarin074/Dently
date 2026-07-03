"use client"

import { useRef } from "react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Printer, Copy } from "lucide-react"
import { toast } from "sonner"

interface Props {
  registrationUrl: string
  clinicSlug: string
}

export function QrPageClient({ registrationUrl, clinicSlug }: Props) {
  const qrRef = useRef<HTMLDivElement>(null)

  function handleCopyLink() {
    navigator.clipboard.writeText(registrationUrl)
    toast.success("Link copied to clipboard")
  }

  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const size = 512
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const a = document.createElement("a")
      a.download = `${clinicSlug}-registration-qr.png`
      a.href = canvas.toDataURL("image/png")
      a.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="space-y-6">
      {/* QR Code card — shown in print too */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <div ref={qrRef} className="p-4 bg-white rounded-xl border">
            <QRCode value={registrationUrl} size={220} />
          </div>

          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">Scan to Register</p>
            <p className="text-sm text-muted-foreground">
              New patients: scan this code to create your profile
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-2 break-all px-4">
              {registrationUrl}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions — hidden when printing */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={handleDownload} className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" onClick={handleCopyLink} className="flex-1 sm:flex-none">
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      </div>

      {/* Usage instructions */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2 print:hidden">
        <p className="font-medium">How to use</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Download or print the QR code and display it at your reception desk.</li>
          <li>New patients scan the code with their phone camera.</li>
          <li>They fill in their personal info and health questionnaire.</li>
          <li>Their profile appears instantly in your Patients list.</li>
        </ol>
      </div>
    </div>
  )
}
