// ThemeSwitcher.jsx
import { Select } from "@chakra-ui/react";

export function ThemeSwitcher({ theme, setTheme, ...props }) {
  return (
    <Select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      {...props} // ✅ 외부에서 준 size, w, fontSize 등을 그대로 전달
    >
      <option value="default">기본</option>
      <option value="pastel">파스텔</option>
      <option value="mono">모노</option>
      <option value="vivid">비비드</option>
    </Select>
  );
}
