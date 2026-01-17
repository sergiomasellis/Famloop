"use client";

import { redirect } from "next/navigation";

// Calendar page redirects to dashboard which contains the full calendar view
export default function CalendarPage() {
  redirect("/dashboard");
}
