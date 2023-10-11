import { ItemView } from "obsidian";
import { useMemo } from "react";
import { useState } from "react";
import { useEffect } from "react";

export default function useStateView<T>(value: T, key: string, self: ItemView) {
  const data = useMemo<T | undefined>(() => self.getState()?.key, [key]);

  const [state, setState] = useState<T>(data || value);

  useEffect(() => {
    (async () => {
      await self.setState(
        {
          ...self.getState(),
          [key]: state,
        },
        {
          history: true,
        }
      );
    })();
  }, [state]);

  return [state, setState] as const;
}
