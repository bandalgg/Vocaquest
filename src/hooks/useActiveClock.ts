import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
export function useActiveClock(running = true) {
  const [active, setActive] = useState(
    AppState.currentState === "active" || AppState.currentState === null,
  );
  const ms = useRef(0);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) =>
      setActive(s === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!running || !active) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      ms.current += Math.min(1500, now - last);
      last = now;
    }, 250);
    return () => clearInterval(id);
  }, [running, active]);
  return {
    active,
    ms,
    reset: () => {
      ms.current = 0;
    },
  };
}
