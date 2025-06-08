import DOMPurify from "dompurify";

let purify: ReturnType<typeof DOMPurify>;

export const sanitizeHtml = async (html: string) => {
  if (!purify) {
    if (import.meta.client) {
      purify = DOMPurify();
    } else if (import.meta.server) {
      const { JSDOM } = await import("jsdom");
      const { window } = new JSDOM("<!DOCTYPE html>");
      purify = DOMPurify(window);
    } else {
      throw new Error("Execution context could not be determined");
    }
  }

  purify.addHook("afterSanitizeAttributes", (node) => {
    if ("target" in node) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });

  return purify.sanitize(html);
};
