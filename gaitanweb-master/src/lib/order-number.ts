export function generateOrderNumber() {
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `ORD-${Date.now().toString().slice(-8)}${rand.slice(0, 2)}`;
}
