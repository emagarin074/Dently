"use client";

import { GlobalStyles } from "@/lib/website-builder/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  globalStyles: GlobalStyles;
  onChange: (styles: GlobalStyles) => void;
}

export function StyleEditor({ globalStyles, onChange }: Props) {
  function update(field: keyof GlobalStyles, value: string) {
    onChange({ ...globalStyles, [field]: value });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={globalStyles.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={globalStyles.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for hero, buttons, accents
            </p>
          </div>
          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={globalStyles.secondaryColor}
                onChange={(e) => update("secondaryColor", e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={globalStyles.secondaryColor}
                onChange={(e) => update("secondaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Typography & Shape</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={globalStyles.fontFamily}
              onValueChange={(v) => update("fontFamily", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter (Modern)</SelectItem>
                <SelectItem value="poppins">Poppins (Friendly)</SelectItem>
                <SelectItem value="playfair">
                  Playfair Display (Elegant)
                </SelectItem>
                <SelectItem value="roboto">Roboto (Classic)</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Border Radius</Label>
            <Select
              value={globalStyles.borderRadius}
              onValueChange={(v) => update("borderRadius", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Sharp)</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="full">Full (Pill)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Button Style</Label>
            <Select
              value={globalStyles.buttonStyle}
              onValueChange={(v) => update("buttonStyle", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid (Filled)</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost (Minimal)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
