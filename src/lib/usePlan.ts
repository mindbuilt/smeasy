"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { FREE_STAFF_LIMIT, STAFF_LIMIT_ENFORCED, type PlanId } from "./site";

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

/** True when a Free business already has as many active staff as the plan allows. */
export function atStaffLimit(plan: PlanId | null, activeCount: number) {
  return STAFF_LIMIT_ENFORCED && plan === "free" && activeCount >= FREE_STAFF_LIMIT;
}
