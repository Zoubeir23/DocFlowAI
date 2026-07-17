import { describe, it, expect } from "vitest";
import {
  isPrivateIpAddress,
  isBlockedHostname,
  validateWebhookUrl,
} from "@/lib/security/webhook-url-validation";

describe("isPrivateIpAddress", () => {
  it.each([
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "198.18.0.1",
    "224.0.0.1",
  ])("bloque l'adresse privée/réservée IPv4 %s", (address) => {
    expect(isPrivateIpAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "198.20.0.1", "100.128.0.1"])(
    "autorise l'adresse publique IPv4 %s",
    (address) => {
      expect(isPrivateIpAddress(address)).toBe(false);
    }
  );

  it.each(["::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "::ffff:10.0.0.1"])(
    "bloque l'adresse privée IPv6 %s",
    (address) => {
      expect(isPrivateIpAddress(address)).toBe(true);
    }
  );

  it("autorise une adresse IPv6 publique", () => {
    expect(isPrivateIpAddress("2606:4700:4700::1111")).toBe(false);
  });
});

describe("isBlockedHostname", () => {
  it.each([
    "localhost",
    "LOCALHOST",
    "api.localhost",
    "printer.local",
    "service.internal",
    "metadata.google.internal",
    "localhost.",
  ])("bloque l'hôte interne %s", (hostname) => {
    expect(isBlockedHostname(hostname)).toBe(true);
  });

  it.each(["example.com", "hooks.slack.com", "my-internal-app.com"])(
    "autorise l'hôte public %s",
    (hostname) => {
      expect(isBlockedHostname(hostname)).toBe(false);
    }
  );
});

describe("validateWebhookUrl", () => {
  it("rejette une URL non HTTPS", async () => {
    const result = await validateWebhookUrl("http://example.com/hook");
    expect(result.valid).toBe(false);
  });

  it("rejette une chaîne qui n'est pas une URL", async () => {
    const result = await validateWebhookUrl("pas-une-url");
    expect(result.valid).toBe(false);
  });

  it("rejette une URL avec identifiants", async () => {
    const result = await validateWebhookUrl("https://user:pass@example.com/hook");
    expect(result.valid).toBe(false);
  });

  it("rejette une IP privée littérale", async () => {
    const result = await validateWebhookUrl("https://169.254.169.254/latest/meta-data/");
    expect(result.valid).toBe(false);
  });

  it("rejette une IPv6 privée littérale", async () => {
    const result = await validateWebhookUrl("https://[::1]/hook");
    expect(result.valid).toBe(false);
  });

  it("rejette localhost", async () => {
    const result = await validateWebhookUrl("https://localhost/hook");
    expect(result.valid).toBe(false);
  });

  it("accepte une IP publique littérale sans résolution DNS", async () => {
    const result = await validateWebhookUrl("https://8.8.8.8/hook");
    expect(result.valid).toBe(true);
  });

  it("rejette un hôte dont la résolution DNS échoue", async () => {
    // .invalid est réservé (RFC 6761) et renvoie toujours NXDOMAIN
    const result = await validateWebhookUrl("https://docflow-nxdomain.invalid/hook");
    expect(result.valid).toBe(false);
  }, 15000);
});
