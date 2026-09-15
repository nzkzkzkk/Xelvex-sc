"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, defaultKey }: { items: TabItem[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const activeItem = items.find((i) => i.key === active);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              active === item.key ? "text-foreground" : "text-muted hover:text-foreground"
            )}
          >
            {item.label}
            {active === item.key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="py-5 text-sm leading-relaxed text-muted">{activeItem?.content}</div>
    </div>
  );
}
