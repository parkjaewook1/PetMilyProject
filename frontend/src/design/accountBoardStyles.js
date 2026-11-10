import { journalTokens as t } from "./journalTokens.js";
import "./AccountBoard.css";

// Explicit page/portal scope. No global Chakra defaults are changed.
export const accountBoardPageStyle = {
  "--ab-brand": t.colors.brand,
  "--ab-paper": t.colors.paper,
  "--ab-ink": t.colors.ink,
  "--ab-muted": t.colors.muted,
  "--ab-line": t.colors.line,
  "--ab-note": t.colors.note,
  "--ab-hover": t.colors.hover,
  color: t.colors.ink,
  bg: t.colors.paper,
  fontFamily: t.fonts.body,
};
