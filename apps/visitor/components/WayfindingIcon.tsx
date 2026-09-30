import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/colors";

const paths = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5",
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5m6-2v16m6-14v16",
  scan: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7h3v3H7V7m7 0h3v3h-3V7M7 14h3v3H7v-3m7 0h3v3h-3v-3",
  explore: "M3 10h18M4 10v11h16V10M3 10l2-7h14l2 7M9 21v-7h6v7",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2",
  chevron: "m6 9 6 6 6-6",
  search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0m-2 4 7 7",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3",
  close: "m6 6 12 12M18 6 6 18",
  lift: "M5 3h14v18H5V3m4 6 3-3 3 3m-6 6 3 3 3-3M12 6v12",
  service: "M8 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M3 10h6m-3-2v13m-3-7h6m11-10a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-5 6h6m-3-2 4 9h-8l4-9m-2 9v4m4-4v4",
  help: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1",
} as const;

export function WayfindingIcon({ name, color = colors.text, size = 22 }: {
  name: keyof typeof paths;
  color?: string;
  size?: number;
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d={paths[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
