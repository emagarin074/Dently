import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Contact" }

export default function ContactPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">Get in touch</h1>
          <p className="mt-4 text-muted-foreground">We'd love to hear from you. Send us a message.</p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-muted-foreground text-sm mt-1">hello@dently.app</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p className="text-muted-foreground text-sm mt-1">+63 (2) 8888-8888</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first">First Name</Label>
                    <Input id="first" placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last">Last Name</Label>
                    <Input id="last" placeholder="dela Cruz" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="juan@clinic.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={4} placeholder="Tell us about your clinic..." />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
