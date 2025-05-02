import { useRequestHeaders } from "nuxt/app";

// Very naive check but good enough for most cases
const mobileRegex = /Mobile|Android|iP(hone|ad)/i;

export const useDevice = () => {
  let isMobile = false;

  if (import.meta.server) {
    const headers = useRequestHeaders(["sec-ch-ua-mobile", "user-agent"]);
    const secChUaMobile = headers["sec-ch-ua-mobile"] ?? "";
    const userAgent = headers["user-agent"] ?? "";
    isMobile = secChUaMobile ? secChUaMobile === "?1" : mobileRegex.test(userAgent);
  } else if (globalThis.navigator) {
    // @ts-expect-error TypeScript does not ship with userAgentData
    const userAgentData = globalThis.navigator.userAgentData ?? null;
    const userAgent = globalThis.navigator.userAgent ?? "";
    isMobile = userAgentData ? userAgentData.mobile : mobileRegex.test(userAgent);
  }

  return { isMobile };
};
