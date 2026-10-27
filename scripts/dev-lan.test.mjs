import { describe, expect, it } from "vitest";
import { lanAddresses } from "./dev-lan.mjs";

describe("lanAddresses", () => {
  it("keeps only private IPv4 addresses that are not loopback", () => {
    const interfaces = {
      lo: [{ family: "IPv4", address: "127.0.0.1", internal: true }],
      wifi: [
        { family: "IPv4", address: "192.168.0.15", internal: false },
        { family: "IPv6", address: "fe80::1", internal: false },
      ],
      vpn: [{ family: "IPv4", address: "10.8.0.2", internal: false }],
      docker: [{ family: "IPv4", address: "172.17.0.1", internal: false }],
      cloud: [{ family: "IPv4", address: "54.232.189.113", internal: false }],
      outside: [{ family: "IPv4", address: "172.32.0.1", internal: false }],
    };
    expect(lanAddresses(interfaces)).toEqual(["192.168.0.15", "10.8.0.2", "172.17.0.1"]);
  });

  it("returns an empty list without a local network", () => {
    expect(lanAddresses({})).toEqual([]);
  });
});
