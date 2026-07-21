const fs = require("fs");
const { renderToStaticMarkup } = require("react-dom/server");
const React = require("react");

// The icons we want
const LucideIcons = require("lucide-react");
const FaIcons = require("react-icons/fa6");

const iconsToExtract = {
  Smile: LucideIcons.Smile,
  Star: LucideIcons.Star,
  Shield: LucideIcons.Shield,
  Heart: LucideIcons.Heart,
  Activity: LucideIcons.Activity,
  Microscope: LucideIcons.Microscope,
  Cross: LucideIcons.Cross,
  Thermometer: LucideIcons.Thermometer,
  Baby: LucideIcons.Baby,
  Stethoscope: FaIcons.FaStethoscope,
  Tooth: FaIcons.FaTooth,
  Teeth: FaIcons.FaTeeth,
  TeethOpen: FaIcons.FaTeethOpen,
  Prescription: FaIcons.FaPrescriptionBottle,
  Doctor: FaIcons.FaUserDoctor,
  Nurse: FaIcons.FaUserNurse,
  Hospital: FaIcons.FaHospital,
  Syringe: FaIcons.FaSyringe,
  Pills: FaIcons.FaPills,
};

let output = `export const SVG_ICONS: Record<string, string> = {\n`;

for (const [name, Component] of Object.entries(iconsToExtract)) {
  if (!Component) {
    console.error(`Component not found for ${name}`);
    continue;
  }
  const svgString = renderToStaticMarkup(
    React.createElement(Component, { size: 32, color: "#2563eb" }),
  );
  // Wrap in raw string literal
  output += `  "${name}": \`${svgString}\`,\n`;
}

output += `};\n`;

fs.writeFileSync("src/app/api/icon/[name]/svgs.ts", output);
console.log("SVGs generated!");
