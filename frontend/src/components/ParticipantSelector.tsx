"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FamilyMember } from "@/hooks/useFamilyMembers";
import { cn } from "@/lib/utils";

type ParticipantSelectorProps = {
  familyMembers: FamilyMember[];
  selectedNames: string[];
  onChange: (names: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function ParticipantSelector({
  familyMembers,
  selectedNames,
  onChange,
  placeholder = "Select participants...",
  className,
}: ParticipantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMember = (name: string) => {
    if (selectedNames.includes(name)) {
      onChange(selectedNames.filter((n) => n !== name));
    } else {
      onChange([...selectedNames, name]);
    }
  };

  const removeMember = (name: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange(selectedNames.filter((n) => n !== name));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full min-h-9 items-center justify-between gap-2 rounded-md border-2 border-border bg-transparent px-3 py-2 text-sm shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30 dark:hover:bg-input/50 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selectedNames.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedNames.map((name) => {
              const member = familyMembers.find((m) => m.name === name);
              return (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {member?.iconEmoji || getInitials(name)}
                    <span className="truncate max-w-[80px]">{name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeMember(name, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeMember(name, e);
                      }
                    }}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    aria-label={`Remove ${name}`}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              );
            })
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1">
            {familyMembers.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No family members available.
                <br />
                <span className="text-xs">Add members in the Family tab.</span>
              </div>
            ) : (
              familyMembers.map((member) => {
                const isSelected = selectedNames.includes(member.name);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleMember(member.name)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      isSelected && "bg-accent/50"
                    )}
                  >
                    <div className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <Avatar className="size-6">
                      <AvatarImage
                        src={member.profileImageUrl || undefined}
                        alt={member.name}
                      />
                      <AvatarFallback className="text-[10px]">
                        {member.iconEmoji || getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left truncate">{member.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

