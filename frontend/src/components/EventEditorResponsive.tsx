"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type EventEditorResponsiveProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  description?: string;
};

/**
 * A responsive event editor that uses:
 * - Sheet (bottom drawer) on mobile for full-screen editing
 * - Popover on desktop for inline editing
 */
export function EventEditorResponsive({
  open,
  onOpenChange,
  trigger,
  children,
  title = "Edit Event",
  description = "Update details and save.",
}: EventEditorResponsiveProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Render trigger separately - Sheet doesn't use asChild trigger like Popover */}
        <div onClick={() => onOpenChange(true)}>{trigger}</div>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[85dvh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader className="pb-2">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-8">{children}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}
