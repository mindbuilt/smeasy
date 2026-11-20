"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { CORE_FEATURES_ENFORCED, FREE_STAFF_LIMIT, OPEN_BETA, STAFF_LIMIT_ENFORCED, type PlanId } from "./site";

/** The business's current plan (Free until Stripe says otherwise). null while loading. */
export function usePlan(businessId: string | undefined) {
  const [plan, setPlan] = useState<PlanId | null>(null);
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    supabase().from("billing").select("plan").eq("business_id", businessId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setPlan((data?.plan as PlanId | undefined) ?? "free"); });
    return () => { cancelled = true; };
  }, [businessId]);
  return plan;
}

/** Paid-plan features: timesheets and usual-hours notes need Plus or Pro. */
export function hasCore(plan: PlanId | null) {
  return !CORE_FEATURES_ENFORCED || plan === "core" || plan === "pro";
}

/** Xero/MYOB payroll sync: top tier only (everyone during the open beta). */
export function hasPro(plan: PlanId | null) {
  return OPEN_BETA || plan === "pro";
}

/** True when a Free business already has as many active staff as the plan allows. */
export function atStaffLimit(plan: PlanId | null, activeCount: number) {
  return STAFF_LIMIT_ENFORCED && plan === "free" && activeCount >= FREE_STAFF_LIMIT;
}
