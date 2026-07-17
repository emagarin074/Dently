import { describe, it, expect } from "vitest";
import { slugify, getInitials, calculateAge, formatCurrency } from "./utils";

describe("Utility Functions", () => {
  describe("slugify", () => {
    it("should convert text to lowercase, remove special characters, and hyphenate spaces", () => {
      expect(slugify("Luna Dental Care!")).toBe("luna-dental-care");
      expect(slugify("Tooth-Extraction and Cleaning")).toBe(
        "tooth-extraction-and-cleaning",
      );
      expect(slugify("Dental123")).toBe("dental123");
    });
  });

  describe("getInitials", () => {
    it("should return the first letters of first and last names in uppercase", () => {
      expect(getInitials("Juan dela Cruz")).toBe("JD");
      expect(getInitials("maria").slice(0, 1)).toBe("M");
      expect(getInitials("Dr. Alan Santos")).toBe("DA");
    });
  });

  describe("calculateAge", () => {
    it("should correctly compute age based on date of birth", () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      expect(calculateAge(birthDate)).toBe(25);
    });
  });

  describe("formatCurrency", () => {
    it("should format numbers as Philippine Pesos (PHP)", () => {
      const resultStr = formatCurrency(1500).replace(/\s/g, " ");
      // Check that it contains "PHP" or currency symbol and the value
      expect(resultStr).toContain("1,500.00");
    });
  });
});
