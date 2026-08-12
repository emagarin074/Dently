"use client";

import { SectionBlock } from "@/lib/website-builder/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Smile,
  Star,
  Shield,
  Heart,
  Activity,
  Users,
  Stethoscope,
  Microscope,
  Pill,
  Cross,
  Building2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  section: SectionBlock;
  onUpdateContent: (content: Record<string, unknown>) => void;
}

export function ModernTemplateEditor({ section, onUpdateContent }: Props) {
  if (!section) return null;
  const content = section.content;

  const faqs = (content.faqItems as { q: string; a: string }[]) || [];
  const socialLinks =
    (content.socialLinks as {
      platform: string;
      url: string;
      label?: string;
    }[]) || [];
  const contactPhones = (content.contactPhones as string[]) || [];

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateContent({ [key]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFaq = (index: number, key: "q" | "a", value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [key]: value };
    onUpdateContent({ faqItems: newFaqs });
  };

  const addFaq = () => {
    onUpdateContent({ faqItems: [...faqs, { q: "", a: "" }] });
  };

  const removeFaq = (index: number) => {
    const newFaqs = [...faqs];
    newFaqs.splice(index, 1);
    onUpdateContent({ faqItems: newFaqs });
  };

  const updateSocialLink = (
    index: number,
    key: "platform" | "url" | "label",
    value: string,
  ) => {
    const newLinks = [...socialLinks];
    newLinks[index] = { ...newLinks[index], [key]: value };
    onUpdateContent({ socialLinks: newLinks });
  };

  const addSocialLink = () => {
    onUpdateContent({
      socialLinks: [
        ...socialLinks,
        { platform: "Facebook", url: "", label: "Facebook" },
      ],
    });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = [...socialLinks];
    newLinks.splice(index, 1);
    onUpdateContent({ socialLinks: newLinks });
  };

  const updateContactPhone = (index: number, value: string) => {
    const newPhones = [...contactPhones];
    newPhones[index] = value;
    onUpdateContent({ contactPhones: newPhones });
  };

  const addContactPhone = () => {
    onUpdateContent({ contactPhones: [...contactPhones, ""] });
  };

  const removeContactPhone = (index: number) => {
    const newPhones = [...contactPhones];
    newPhones.splice(index, 1);
    onUpdateContent({ contactPhones: newPhones });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          defaultValue="hero"
          className="w-full"
        >
          {/* Navigation & Header */}
          <AccordionItem value="navigation">
            <AccordionTrigger className="text-lg font-semibold">
              Navigation & Header
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo Type</Label>
                    <Select
                      value={(content.logoType as string) || "text"}
                      onValueChange={(val) =>
                        onUpdateContent({ logoType: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Logo</SelectItem>
                        <SelectItem value="image">Image Logo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {((content.logoType as string) || "text") === "text" ? (
                    <>
                      <div className="space-y-2">
                        <Label>Logo Text</Label>
                        <Input
                          value={(content.logoText as string) || ""}
                          onChange={(e) =>
                            onUpdateContent({ logoText: e.target.value })
                          }
                          placeholder="e.g. Luna Dental"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label>Logo Font Class (Tailwind)</Label>
                        <Input
                          value={(content.logoFont as string) || "font-sans"}
                          onChange={(e) =>
                            onUpdateContent({ logoFont: e.target.value })
                          }
                          placeholder="font-sans, font-serif, font-mono"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label>Logo Icon</Label>
                        <Select
                          value={(content.logoIcon as string) || "Smile"}
                          onValueChange={(val) =>
                            onUpdateContent({ logoIcon: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Smile">
                              <div className="flex items-center gap-2">
                                Smile
                              </div>
                            </SelectItem>
                            <SelectItem value="Star">
                              <div className="flex items-center gap-2">
                                Star
                              </div>
                            </SelectItem>
                            <SelectItem value="Shield">
                              <div className="flex items-center gap-2">
                                Shield
                              </div>
                            </SelectItem>
                            <SelectItem value="Heart">
                              <div className="flex items-center gap-2">
                                Heart
                              </div>
                            </SelectItem>
                            <SelectItem value="Stethoscope">
                              <div className="flex items-center gap-2">
                                Stethoscope
                              </div>
                            </SelectItem>
                            <SelectItem value="Tooth">
                              <div className="flex items-center gap-2">
                                Tooth
                              </div>
                            </SelectItem>
                            <SelectItem value="Teeth">
                              <div className="flex items-center gap-2">
                                Teeth
                              </div>
                            </SelectItem>
                            <SelectItem value="TeethOpen">
                              <div className="flex items-center gap-2">
                                TeethOpen
                              </div>
                            </SelectItem>
                            <SelectItem value="Prescription">
                              <div className="flex items-center gap-2">
                                Prescription
                              </div>
                            </SelectItem>
                            <SelectItem value="Doctor">
                              <div className="flex items-center gap-2">
                                Doctor
                              </div>
                            </SelectItem>
                            <SelectItem value="Nurse">
                              <div className="flex items-center gap-2">
                                Nurse
                              </div>
                            </SelectItem>
                            <SelectItem value="Activity">
                              <div className="flex items-center gap-2">
                                Activity
                              </div>
                            </SelectItem>
                            <SelectItem value="Microscope">
                              <div className="flex items-center gap-2">
                                Microscope
                              </div>
                            </SelectItem>
                            <SelectItem value="Cross">
                              <div className="flex items-center gap-2">
                                Cross
                              </div>
                            </SelectItem>
                            <SelectItem value="Thermometer">
                              <div className="flex items-center gap-2">
                                Thermometer
                              </div>
                            </SelectItem>
                            <SelectItem value="Baby">
                              <div className="flex items-center gap-2">
                                Baby
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Logo Image URL</Label>
                      <Input
                        value={(content.logoImage as string) || ""}
                        onChange={(e) =>
                          onUpdateContent({ logoImage: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Navigation Links</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const links =
                          (content.navLinks as {
                            label: string;
                            sectionId: string;
                          }[]) || [];
                        onUpdateContent({
                          navLinks: [
                            ...links,
                            { label: "New Link", sectionId: "new-section" },
                          ],
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Link
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(
                      (content.navLinks as {
                        label: string;
                        sectionId: string;
                      }[]) || []
                    ).map((link, idx, arr) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-slate-50 p-3 rounded-md border"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500">
                              Label
                            </Label>
                            <Input
                              value={link.label}
                              onChange={(e) => {
                                const newLinks = [...arr];
                                newLinks[idx].label = e.target.value;
                                onUpdateContent({ navLinks: newLinks });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500">
                              Section ID
                            </Label>
                            <Select
                              value={link.sectionId}
                              onValueChange={(val) => {
                                const newLinks = [...arr];
                                newLinks[idx].sectionId = val;
                                onUpdateContent({ navLinks: newLinks });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="services">
                                  Services
                                </SelectItem>
                                <SelectItem value="about">About Us</SelectItem>
                                <SelectItem value="faqs">FAQs</SelectItem>
                                <SelectItem value="contact">
                                  Contact Us
                                </SelectItem>
                                <SelectItem value="booking">Booking</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 self-end mb-0.5"
                          onClick={() => {
                            const newLinks = [...arr];
                            newLinks.splice(idx, 1);
                            onUpdateContent({ navLinks: newLinks });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Hero Section */}
          <AccordionItem value="hero">
            <AccordionTrigger className="text-lg font-semibold">
              Hero Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Badge Icon (e.g. plane, star)</Label>
                  <Input
                    value={(content.heroBadgeIcon as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroBadgeIcon: e.target.value })
                    }
                    placeholder="plane"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input
                    value={(content.heroBadgeText as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroBadgeText: e.target.value })
                    }
                    placeholder="True 24/7"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Badge Sub-Text</Label>
                  <Input
                    value={(content.heroBadgeSub as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroBadgeSub: e.target.value })
                    }
                    placeholder="Care When It Counts"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Main Heading (Black Text)</Label>
                  <Input
                    value={(content.heroHeadingMain as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroHeadingMain: e.target.value })
                    }
                    placeholder="A calmer"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Highlight Heading (Blue Text, supports \n for new line)
                  </Label>
                  <Textarea
                    value={(content.heroHeadingHighlight as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroHeadingHighlight: e.target.value })
                    }
                    placeholder="dental\nvisit starts here."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Subheading</Label>
                  <Textarea
                    value={(content.heroSubheading as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroSubheading: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    value={(content.heroCtaText as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroCtaText: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>CTA Target Section</Label>
                  <Select
                    value={
                      (content.heroCtaSection as string) ||
                      ((content.heroCtaText as string)
                        ?.toLowerCase()
                        .includes("contact")
                        ? "contact"
                        : "booking")
                    }
                    onValueChange={(val) =>
                      onUpdateContent({ heroCtaSection: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target section..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">
                        Contact Us Section
                      </SelectItem>
                      <SelectItem value="booking">Booking Section</SelectItem>
                      <SelectItem value="services">Services Section</SelectItem>
                      <SelectItem value="about">About Us Section</SelectItem>
                      <SelectItem value="faqs">FAQs Section</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trust Count Text (e.g. 1,000+)</Label>
                  <Input
                    value={(content.heroTrustCount as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroTrustCount: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Trust Subtext</Label>
                  <Input
                    value={(content.heroTrustText as string) || ""}
                    onChange={(e) =>
                      onUpdateContent({ heroTrustText: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Hero Image (Optional)</Label>
                    {Boolean(content.heroImage) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateContent({ heroImage: "" })}
                        className="h-auto p-0 text-red-500 hover:text-red-600 hover:bg-transparent"
                      >
                        Clear Image
                      </Button>
                    )}
                  </div>
                  <Input
                    key={(content.heroImage as string) || "hero-empty"}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "heroImage")}
                  />
                  <p className="text-xs text-slate-500">
                    Upload an image to override the default hero image. Max 2MB.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Services Section */}
          <AccordionItem value="services">
            <AccordionTrigger className="text-lg font-semibold">
              Services Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Heading</Label>
                <Input
                  value={(content.servicesHeading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ servicesHeading: e.target.value })
                  }
                  placeholder="Our Services"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheading</Label>
                <Textarea
                  value={(content.servicesSubheading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ servicesSubheading: e.target.value })
                  }
                  placeholder="Comprehensive dental care tailored to your needs."
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <Label>Service Cards</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const services =
                        (content.servicesItems as {
                          title: string;
                          description: string;
                          icon: string;
                        }[]) || [];
                      onUpdateContent({
                        servicesItems: [
                          ...services,
                          {
                            title: "New Service",
                            description: "Description here.",
                            icon: "CheckCircle2",
                          },
                        ],
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Service
                  </Button>
                </div>

                <div className="space-y-3">
                  {(
                    (content.servicesItems as {
                      title: string;
                      description: string;
                      icon: string;
                    }[]) || []
                  ).map((service, idx, arr) => (
                    <div
                      key={idx}
                      className="flex gap-3 bg-slate-50 p-4 rounded-md border flex-col md:flex-row md:items-start"
                    >
                      <div className="flex-1 space-y-4 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500">
                              Title
                            </Label>
                            <Input
                              value={service.title}
                              onChange={(e) => {
                                const newServices = [...arr];
                                newServices[idx].title = e.target.value;
                                onUpdateContent({ servicesItems: newServices });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-500">
                              Icon
                            </Label>
                            <Select
                              value={service.icon}
                              onValueChange={(val) => {
                                const newServices = [...arr];
                                newServices[idx].icon = val;
                                onUpdateContent({ servicesItems: newServices });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select icon" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CheckCircle2">
                                  CheckCircle2
                                </SelectItem>
                                <SelectItem value="Tooth">Tooth</SelectItem>
                                <SelectItem value="Teeth">Teeth</SelectItem>
                                <SelectItem value="TeethOpen">
                                  TeethOpen
                                </SelectItem>
                                <SelectItem value="Syringe">Syringe</SelectItem>
                                <SelectItem value="Stethoscope">
                                  Stethoscope
                                </SelectItem>
                                <SelectItem value="Pills">Pills</SelectItem>
                                <SelectItem value="Prescription">
                                  Prescription
                                </SelectItem>
                                <SelectItem value="Hospital">
                                  Hospital
                                </SelectItem>
                                <SelectItem value="Doctor">Doctor</SelectItem>
                                <SelectItem value="Nurse">Nurse</SelectItem>
                                <SelectItem value="Activity">
                                  Activity
                                </SelectItem>
                                <SelectItem value="Microscope">
                                  Microscope
                                </SelectItem>
                                <SelectItem value="Cross">Cross</SelectItem>
                                <SelectItem value="Thermometer">
                                  Thermometer
                                </SelectItem>
                                <SelectItem value="Baby">Baby</SelectItem>
                                <SelectItem value="Sparkles">
                                  Sparkles
                                </SelectItem>
                                <SelectItem value="AlignCenter">
                                  AlignCenter
                                </SelectItem>
                                <SelectItem value="Heart">Heart</SelectItem>
                                <SelectItem value="Shield">Shield</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">
                            Description
                          </Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => {
                              const newServices = [...arr];
                              newServices[idx].description = e.target.value;
                              onUpdateContent({ servicesItems: newServices });
                            }}
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 shrink-0 self-end md:self-auto md:mt-[1.5rem]"
                        onClick={() => {
                          const newServices = [...arr];
                          newServices.splice(idx, 1);
                          onUpdateContent({ servicesItems: newServices });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* About Us Section */}
          <AccordionItem value="about">
            <AccordionTrigger className="text-lg font-semibold">
              About Us Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Heading</Label>
                <Input
                  value={(content.aboutHeading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ aboutHeading: e.target.value })
                  }
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={(content.aboutContent as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ aboutContent: e.target.value })
                  }
                  rows={5}
                  placeholder="We believe that a healthy smile is the foundation of overall wellness..."
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>About Image (Optional)</Label>
                  {Boolean(content.aboutImage) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateContent({ aboutImage: "" })}
                      className="h-auto p-0 text-red-500 hover:text-red-600 hover:bg-transparent"
                    >
                      Clear Image
                    </Button>
                  )}
                </div>
                <Input
                  key={(content.aboutImage as string) || "about-empty"}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "aboutImage")}
                />
                <p className="text-xs text-slate-500">
                  Upload an image to override the default about us image. Max
                  2MB.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Booking Section */}
          <AccordionItem value="booking">
            <AccordionTrigger className="text-lg font-semibold">
              Booking Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Heading</Label>
                <Input
                  value={(content.bookingHeading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ bookingHeading: e.target.value })
                  }
                  placeholder="Ready to Smile?"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheading</Label>
                <Textarea
                  value={(content.bookingSubheading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ bookingSubheading: e.target.value })
                  }
                  placeholder="Book your appointment online today."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FAQs Section */}
          <AccordionItem value="faqs">
            <AccordionTrigger className="text-lg font-semibold">
              FAQs Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Heading</Label>
                <Input
                  value={(content.faqHeading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ faqHeading: e.target.value })
                  }
                  placeholder="Frequently Asked Questions"
                />
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label>Questions & Answers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFaq}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add FAQ
                  </Button>
                </div>

                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md space-y-3 relative group bg-slate-50"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFaq(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Question</Label>
                      <Input
                        value={faq.q}
                        onChange={(e) => updateFaq(index, "q", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Answer</Label>
                      <Textarea
                        value={faq.a}
                        onChange={(e) => updateFaq(index, "a", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contact Us Section */}
          <AccordionItem value="contact">
            <AccordionTrigger className="text-lg font-semibold">
              Contact Us Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Heading</Label>
                <Input
                  value={(content.contactHeading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ contactHeading: e.target.value })
                  }
                  placeholder="Get in Touch"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheading</Label>
                <Textarea
                  value={(content.contactSubheading as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ contactSubheading: e.target.value })
                  }
                  placeholder="We're here to answer any questions you have."
                />
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label>Contact Phone Numbers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContactPhone}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Phone
                  </Button>
                </div>
                {contactPhones.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={phone}
                      onChange={(e) =>
                        updateContactPhone(index, e.target.value)
                      }
                      placeholder="e.g. +1 234 567 8900"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeContactPhone(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label>Social Media Links</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialLink}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Social Link
                  </Button>
                </div>

                {socialLinks.map((link, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md space-y-3 relative group bg-slate-50"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeSocialLink(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">
                          Platform
                        </Label>
                        <Select
                          value={link.platform}
                          onValueChange={(val) =>
                            updateSocialLink(index, "platform", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                            <SelectItem value="Instagram">Instagram</SelectItem>
                            <SelectItem value="Twitter">Twitter</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="YouTube">YouTube</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">
                          Display Text
                        </Label>
                        <Input
                          value={link.label ?? link.platform}
                          onChange={(e) =>
                            updateSocialLink(index, "label", e.target.value)
                          }
                          placeholder="e.g. Dently Page"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            updateSocialLink(index, "url", e.target.value)
                          }
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Footer Section */}
          <AccordionItem value="footer">
            <AccordionTrigger className="text-lg font-semibold">
              Footer Section
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Footer Text (Copyright)</Label>
                <Input
                  value={(content.footerText as string) || ""}
                  onChange={(e) =>
                    onUpdateContent({ footerText: e.target.value })
                  }
                  placeholder="© 2024 Modern Dental Clinic. All rights reserved."
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
