// lib/utils/plan.ts
// Replaces all Stripe plan checks in the app

export function isPro(userPlan?: string): boolean {
  // In demo/portfolio mode, everyone gets Pro
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true
  return userPlan === 'pro'
}