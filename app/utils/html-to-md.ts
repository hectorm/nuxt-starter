import TurndownService from "turndown";
// @ts-expect-error turndown-plugin-gfm does not export types
import { gfm } from "turndown-plugin-gfm";

import { sanitizeHtml } from "~/utils/sanitize-html";

const turndownService = new TurndownService({
  headingStyle: "atx",
  linkStyle: "inlined",
  codeBlockStyle: "fenced",
  hr: "---",
  fence: "```",
  emDelimiter: "*",
  strongDelimiter: "**",
});
turndownService.use(gfm);
turndownService.addRule("underline", {
  filter: ["ins", "u"],
  replacement: (content) => `__${content}__`,
});
turndownService.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

export const htmlToMd = async (html: string = ""): Promise<string> => {
  return turndownService.turndown(await sanitizeHtml(html));
};
