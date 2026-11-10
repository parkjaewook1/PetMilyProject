import { journalTokens as t } from "./journalTokens.js";
import "./FullAudit.css";

// Explicit opt-in for the remaining service surfaces and their portal contents.
export const fullSurfaceStyle = {
  "--full-brand": t.colors.brand,
  "--full-paper": t.colors.paper,
  "--full-ink": t.colors.ink,
  "--full-muted": t.colors.muted,
  "--full-line": t.colors.line,
  "--full-note": t.colors.note,
  "--full-hover": t.colors.hover,
  "--full-night-brand": t.colors.dark.brand,
  "--full-night-paper": t.colors.dark.paper,
  "--full-night-ink": t.colors.dark.ink,
  "--full-night-muted": t.colors.dark.muted,
  "--full-night-line": t.colors.dark.line,
  "--full-night-note": t.colors.dark.note,
};
