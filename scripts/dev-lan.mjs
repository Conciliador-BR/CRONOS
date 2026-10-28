// Mostra os endereços da rede local (192.168.x.x etc.) antes do `next dev`,
// para abrir o CRONOS em outro aparelho conectado na mesma rede.
import os from "node:os";
import { pathToFileURL } from "node:url";

const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

export function lanAddresses(interfaces) {
  return Object.values(interfaces)
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal && PRIVATE_IPV4.test(net.address))
    .map((net) => net.address);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = process.env.PORT || "3000";
  const addresses = lanAddresses(os.networkInterfaces());
  if (addresses.length === 0) {
    console.log("CRONOS na rede local: nenhum endereço 192.168/10/172.16-31 encontrado.");
  } else {
    console.log("CRONOS na rede local (mesmo Wi-Fi):");
    for (const address of addresses) console.log(`  http://${address}:${port}`);
  }
}
