import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatTime,
  formatDateTime,
  generateSlug,
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  truncate,
  isValidEmail,
  isValidPhone,
  getDayName,
  timeToMinutes,
  minutesToTime,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("merges tailwind conflicts correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatDate", () => {
  it("formats ISO string with default format", () => {
    const result = formatDate("2026-05-15");
    expect(result).toContain("2026");
    expect(result).toContain("May");
  });

  it("accepts a Date object", () => {
    const result = formatDate(new Date("2026-01-01"));
    expect(result).toContain("2026");
  });

  it("accepts a custom format", () => {
    const result = formatDate("2026-05-15", "yyyy-MM-dd");
    expect(result).toBe("2026-05-15");
  });
});

describe("formatTime", () => {
  it("formats time in h:mm a", () => {
    const result = formatTime("2026-05-15T14:30:00");
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });
});

describe("formatDateTime", () => {
  it("formats date and time together", () => {
    const result = formatDateTime("2026-05-15T14:30:00");
    expect(result).toContain("May");
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("accepts a Date object", () => {
    const result = formatDateTime(new Date("2026-05-15T14:30:00"));
    expect(result).toContain("2026");
  });
});

describe("generateSlug", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(generateSlug("Cabinet Médical")).toBe("cabinet-m-dical");
  });

  it("removes leading and trailing dashes", () => {
    expect(generateSlug("---test---")).toBe("test");
  });

  it("collapses multiple separators", () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
  });

  it("handles already valid slug", () => {
    expect(generateSlug("my-clinic")).toBe("my-clinic");
  });
});

describe("getStatusColor", () => {
  it("returns blue for booked", () => {
    expect(getStatusColor("booked")).toContain("blue");
  });

  it("returns green for confirmed", () => {
    expect(getStatusColor("confirmed")).toContain("green");
  });

  it("returns red for cancelled", () => {
    expect(getStatusColor("cancelled")).toContain("red");
  });

  it("returns yellow for no_show", () => {
    expect(getStatusColor("no_show")).toContain("yellow");
  });

  it("returns gray for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("gray");
  });
});

describe("getStatusLabel", () => {
  it("returns correct label for each status", () => {
    expect(getStatusLabel("booked")).toBe("Booked");
    expect(getStatusLabel("confirmed")).toBe("Confirmed");
    expect(getStatusLabel("completed")).toBe("Completed");
    expect(getStatusLabel("cancelled")).toBe("Cancelled");
    expect(getStatusLabel("no_show")).toBe("No Show");
  });

  it("returns the raw status for unknown values", () => {
    expect(getStatusLabel("pending")).toBe("pending");
  });
});

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(1500)).toContain("1,500");
  });

  it("formats EUR correctly", () => {
    const result = formatCurrency(2000, "EUR");
    expect(result).toContain("2,000");
  });
});

describe("truncate", () => {
  it("returns original string when shorter than limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("returns string as-is when exactly at limit", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("isValidEmail", () => {
  it("validates correct emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user+tag@sub.domain.org")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("validates phone numbers", () => {
    expect(isValidPhone("+33612345678")).toBe(true);
    expect(isValidPhone("0612345678")).toBe(true);
    expect(isValidPhone("+1-555-123")).toBe(true);
  });

  it("rejects short or invalid phones", () => {
    expect(isValidPhone("123")).toBe(false);
  });
});

describe("getDayName", () => {
  it("returns correct day names", () => {
    expect(getDayName(0)).toBe("Sunday");
    expect(getDayName(1)).toBe("Monday");
    expect(getDayName(6)).toBe("Saturday");
  });

  it("returns empty string for invalid day", () => {
    expect(getDayName(7)).toBe("");
  });
});

describe("timeToMinutes", () => {
  it("converts time string to minutes", () => {
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("00:30")).toBe(30);
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("minutesToTime", () => {
  it("converts minutes to time string", () => {
    expect(minutesToTime(540)).toBe("09:00");
    expect(minutesToTime(30)).toBe("00:30");
    expect(minutesToTime(1439)).toBe("23:59");
  });

  it("is inverse of timeToMinutes", () => {
    expect(minutesToTime(timeToMinutes("14:45"))).toBe("14:45");
  });
});
