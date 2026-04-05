"use client";

import { RefObject, useEffect, useRef } from "react";

export function useAutoScrollOnRoundChange(
  targetRef: RefObject<HTMLElement | null>,
  dependencyKey: string,
) {
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousKeyRef.current === null) {
      previousKeyRef.current = dependencyKey;
      return;
    }

    if (previousKeyRef.current === dependencyKey) {
      return;
    }

    previousKeyRef.current = dependencyKey;

    window.requestAnimationFrame(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [dependencyKey, targetRef]);
}
