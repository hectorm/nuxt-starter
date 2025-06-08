import showdown from "showdown";

import { sanitizeHtml } from "~/utils/sanitize-html";

const converter = new showdown.Converter({
  underline: true,
  strikethrough: true,
  tables: true,
  tasklists: true,
  simpleLineBreaks: true,
  emoji: true,
  ellipsis: false,
  noHeaderId: true,
  smoothLivePreview: true,
});

export const mdToHtml = async (md: string = ""): Promise<string> => {
  return sanitizeHtml(converter.makeHtml(md));
};
