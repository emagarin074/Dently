"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

async function submitPatientRegistration(
  clinicSlug: string,
  data: Record<string, unknown>,
) {
  const res = await fetch(`/api/clinic/${clinicSlug}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export default function PatientRegistrationPage({ params }: Props) {
  const { slug } = use(params);
  const [step, setStep] = useState<"form" | "health" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [gender, setGender] = useState("");

  const [healthData, setHealthData] = useState({
    hasHypertension: false,
    hasDiabetes: false,
    hasHeartDisease: false,
    hasBleedingDisorder: false,
    isPregnant: false,
    hasAllergies: false,
    allergiesDetail: "",
    currentMedications: "",
    previousDentalWork: "",
    chiefComplaint: "",
  });

  async function handlePatientSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    data.gender = gender;

    const result = await submitPatientRegistration(slug, data);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setPatientId(result.patientId);
    setStep("health");
    setLoading(false);
  }

  async function handleHealthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);

    const res = await fetch(`/api/clinic/${slug}/register/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, ...healthData }),
    });
    const result = await res.json();
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    setStep("done");
    setLoading(false);
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-50/50 border-b border-slate-100 p-5 text-left">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Registration Complete!
            </h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Your patient profile has been created. Please proceed to the
              reception desk.
            </p>
          </div>
          <div className="p-5 flex justify-end bg-slate-50/30">
            <Button
              onClick={() => window.location.reload()}
              className="h-9 px-5 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
            >
              Register Another Patient
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">
            Patient Registration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step {step === "form" ? 1 : 2} of 2
          </p>
        </div>

        {step === "form" && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Middle Name</Label>
                    <Input name="middleName" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input name="lastName" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input name="dateOfBirth" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
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
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input name="phone" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input name="address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Input name="bloodType" placeholder="A+, O-, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input name="emergencyContactName" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Phone</Label>
                  <Input name="emergencyContactPhone" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Next: Health Questionnaire"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "health" && (
          <Card>
            <CardHeader>
              <CardTitle>Health Questionnaire</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHealthSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please answer honestly for your safety.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      key: "hasHypertension",
                      label: "Do you have hypertension / high blood pressure?",
                    },
                    { key: "hasDiabetes", label: "Do you have diabetes?" },
                    {
                      key: "hasHeartDisease",
                      label: "Do you have heart disease?",
                    },
                    {
                      key: "hasBleedingDisorder",
                      label: "Do you have a bleeding disorder?",
                    },
                    { key: "isPregnant", label: "Are you pregnant?" },
                    {
                      key: "hasAllergies",
                      label: "Do you have any known allergies?",
                    },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Checkbox
                        id={key}
                        checked={
                          healthData[key as keyof typeof healthData] as boolean
                        }
                        onCheckedChange={(v) =>
                          setHealthData((prev) => ({ ...prev, [key]: !!v }))
                        }
                      />
                      <Label htmlFor={key} className="cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>

                {healthData.hasAllergies && (
                  <div className="space-y-2">
                    <Label>Please describe your allergies</Label>
                    <Textarea
                      value={healthData.allergiesDetail}
                      onChange={(e) =>
                        setHealthData((prev) => ({
                          ...prev,
                          allergiesDetail: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Textarea
                    value={healthData.currentMedications}
                    onChange={(e) =>
                      setHealthData((prev) => ({
                        ...prev,
                        currentMedications: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="List any medications you are currently taking..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Previous Dental Work</Label>
                  <Textarea
                    value={healthData.previousDentalWork}
                    onChange={(e) =>
                      setHealthData((prev) => ({
                        ...prev,
                        previousDentalWork: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Describe any previous dental procedures..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chief Complaint / Reason for Visit</Label>
                  <Textarea
                    value={healthData.chiefComplaint}
                    onChange={(e) =>
                      setHealthData((prev) => ({
                        ...prev,
                        chiefComplaint: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="What brings you in today?"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("form")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Submitting..." : "Complete Registration"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
