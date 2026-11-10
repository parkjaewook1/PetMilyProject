import { extendTheme } from "@chakra-ui/react";
import { journalTokens as t } from "./design/journalTokens.js";

// Register opt-in variants only. No global defaults, fonts, resets or component
// base styles change until a page explicitly adopts variant="journal".
const palette = (mode) =>
  mode.colorMode === "dark" ? t.colors.dark : t.colors;
const field = (mode) => {
  const c = palette(mode);
  return {
    fontFamily: t.fonts.body,
    fontSize: t.type.body,
    color: c.ink,
    bg: c.paper,
    border: "1px solid",
    borderColor: c.line,
    borderRadius: t.radii.control,
    _placeholder: { color: c.muted },
    _hover: { borderColor: c.muted },
    _focusVisible: { borderColor: c.brand, boxShadow: `0 0 0 1px ${c.brand}` },
  };
};

export default extendTheme({
  colors: { journal: t.colors },
  components: {
    Button: {
      variants: {
        journal: (mode) => {
          const c = palette(mode);
          return {
            fontFamily: t.fonts.body,
            fontSize: t.type.control,
            fontWeight: 500,
            borderRadius: t.radii.control,
            bg: c.brand,
            color: c.paper,
            minH: "40px",
            px: 4,
            boxShadow: "none",
            _hover: { opacity: 0.9, boxShadow: "none" },
            _focusVisible: {
              outline: `2px solid ${c.brand}`,
              outlineOffset: "3px",
            },
          };
        },
        journalOutline: (mode) => {
          const c = palette(mode);
          return {
            fontFamily: t.fonts.body,
            fontSize: t.type.control,
            fontWeight: 500,
            borderRadius: t.radii.control,
            border: "1px solid",
            borderColor: c.line,
            color: c.brand,
            bg: "transparent",
            minH: "40px",
            px: 4,
            _hover: { bg: c.note },
            _focusVisible: {
              outline: `2px solid ${c.brand}`,
              outlineOffset: "3px",
            },
          };
        },
      },
    },
    Input: { variants: { journal: (mode) => ({ field: field(mode) }) } },
    Textarea: { variants: { journal: field } },
    Select: { variants: { journal: (mode) => ({ field: field(mode) }) } },
    FormLabel: {
      variants: {
        journal: (mode) => ({
          fontFamily: t.fonts.body,
          fontSize: t.type.label,
          color: palette(mode).muted,
          fontWeight: 500,
          mb: 2,
        }),
      },
    },
    Card: {
      variants: {
        journal: (mode) => {
          const c = palette(mode);
          return {
            container: {
              fontFamily: t.fonts.body,
              color: c.ink,
              bg: c.paper,
              border: "1px solid",
              borderColor: c.line,
              borderRadius: t.radii.panel,
              boxShadow: "none",
            },
            header: {
              p: { base: t.space.mobile, md: t.space.desktop },
              borderBottom: "1px solid",
              borderColor: c.line,
            },
            body: { p: { base: t.space.mobile, md: t.space.desktop } },
            footer: {
              px: { base: t.space.mobile, md: t.space.desktop },
              pb: t.space.mobile,
            },
          };
        },
      },
    },
  },
});
