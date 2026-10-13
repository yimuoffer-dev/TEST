<script setup>
import { computed } from "vue";
const props = defineProps({
  name: { type: String, default: "grid" },
  size: { type: Number, default: 22 },
  color: { type: String, default: "currentColor" },
});
const paths = {
  home: "M3 10 12 3l9 7M5 9v11h5v-6h4v6h5V9",
  file: "M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6",
  records: "M7 5H4v16h16V5h-3M9 3h6v4H9zM8 12l2 2 5-5M8 18h8",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  chevron: "m9 5 7 7-7 7",
  back: "m15 5-7 7 7 7",
  close: "m6 6 12 12M6 18 18 6",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2",
  calendar: "M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 18h2",
  filter: "M3 4h18l-7 8v8l-4-2v-6z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  building: "M3 9 12 3l9 6H3ZM5 11v8M10 11v8M14 11v8M19 11v8M3 21h18",
  bank: "M3 9 12 3l9 6H3ZM5 11v8M10 11v8M14 11v8M19 11v8M3 21h18",
  monitor: "M3 4h18v13H3zM12 17v4M7 21h10",
  bag: "M4 7h16l1 14H3L4 7ZM8 9V6a4 4 0 0 1 8 0v3",
  star: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  heart: "M12 21 3 12C-3 5 7-1 12 6c5-7 15-1 9 6Z",
  share:
    "M9 11 17 6M9 14l8 4M9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM22 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM22 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  plus: "M12 4v16M4 12h16",
  crown: "m3 7 5 4 4-7 4 7 5-4-2 14H5L3 7Z",
  location:
    "M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 0 1 14 0ZM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  help: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9 9c0-4 7-4 6 0-.3 2-3 2-3 5M12 17v1",
  check: "m4 12 5 5L20 6",
  wallet: "M3 5h17v16H3zM3 5V3h14v2M14 10h8v6h-8zM17 13h1",
  gift: "M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8c-9 0-9-8-4-6 3 1 4 6 4 6Zm0 0c9 0 9-8 4-6-3 1-4 6-4 6Z",
  logout: "M10 3H3v18h7M8 12h13m-5-5 5 5-5 5",
  shield: "M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7l-9-4ZM8 12l3 3 5-5",
  link: "m10 8 3-3c7-6 13 1 7 6l-4 4M14 16l-3 3c-7 6-13-1-7-6l4-4M8 16l8-8",
  team: "M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 21v-2a8 8 0 0 1 16 0v2M17 3a4 4 0 0 1 0 8M20 14a7 7 0 0 1 2 7",
  edit: "m15 3 6 6-12 12H3v-6L15 3ZM12 6l6 6",
  trash: "M3 6h18M5 6l1 15h12l1-15M9 6V3h6v3M10 10v7M14 10v7",
  upload: "M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6",
  down: "m5 9 7 7 7-7",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 10v7M12 6v1",
};
const src = computed(() => {
  // #ifndef H5
  const color = props.color.toUpperCase();
  const variant =
    color === "#FFFFFF"
      ? "white"
      : color === "#17233B"
        ? "dark"
        : color === "#007AFF"
          ? "blue"
          : color === "#E5484D"
            ? "red"
            : color === "#F59A23"
              ? "orange"
              : color === "#1B9A67"
                ? "green"
                : color === "#FFEDCC"
                  ? "cream"
                  : color === "#8DBAFF"
                    ? "light"
                    : ["#B1874E", "#986225", "#765536", "#A77A45"].includes(
                          color,
                        )
                      ? "gold"
                      : "gray";
  return (
    "/static/icons/" +
    (paths[props.name] ? props.name : "grid") +
    "-" +
    variant +
    ".png"
  );
  // #endif
  // #ifdef H5
  const c = props.color === "currentColor" ? "#65758E" : props.color;
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[props.name] || paths.grid}"/></svg>`,
    )
  );
  // #endif
});
</script>
<template>
  <image
    class="ui-icon"
    :src="src"
    :style="{ width: size + 'px', height: size + 'px' }"
    mode="aspectFit"
    aria-hidden="true"
  />
</template>
