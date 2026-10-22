export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function escapeTree(value) {
  if (typeof value === "string") return escapeHTML(value);
  if (Array.isArray(value)) return value.map(escapeTree);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, escapeTree(item)]),
    );
  return value;
}
