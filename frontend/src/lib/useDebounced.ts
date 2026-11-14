import { useEffect, useState } from "react";

// Returns `value` only after it has stopped changing for `ms` milliseconds,
// so a search box sends one request per pause instead of one per keystroke.
export function useDebounced<T>(value: T, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return settled;
}
