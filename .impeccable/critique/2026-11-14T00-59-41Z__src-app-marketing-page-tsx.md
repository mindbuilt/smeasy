---
target: src/app/(marketing)/page.tsx
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/oliverjmoran/smeasy-live/src/app/(marketing)/page.tsx"
target_fingerprint: "sha256:5e4cfa9cc0871d4b686af88d490bb3295f9001c0f7d28263cae50ed2fbde3a0a"
target_path: /Users/oliverjmoran/smeasy-live/src/app/(marketing)/page.tsx
timestamp: 2026-11-14T00-59-41Z
slug: src-app-marketing-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No preview of what happens after "Get started" |
| 2 | Match System / Real World | 4 | Excellent — owner language throughout |
| 3 | User Control and Freedom | 2 | Both CTAs go to /auth/login/. No demo or preview |
| 4 | Consistency and Standards | 3 | Strong internally; header vs hero CTA label inconsistency |
| 5 | Error Prevention | 3 | Minimal interaction surface |
| 6 | Recognition Rather Than Recall | 3 | Roster preview shows product; feature grid is text-only |
| 7 | Flexibility and Efficiency | n/a | Persuade surface |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but monotonous |
| 9 | Error Recovery | 2 | No pricing, no demo — soft mismatches with no recovery |
| 10 | Help and Documentation | n/a | Persuade surface |
| **Total** | | **22/32** | **Good** |

## Design Specificity Verdict
Moderate-to-low. Copy is product-specific, palette is distinctive, roster preview is strong proof. But visual structure is category-interchangeable SaaS template. "Joyful" brand promise lives in words, not visuals.

Detector: 6 genuine findings (2x P1, 1x P2, 3x P3). Key: outline:none removes focus rings, C.muted fails WCAG AA contrast at 3.1:1.

## Priority Issues

[P0] No interactive states — zero hover/focus/active on any element. WCAG 2.4.7 failure. Page feels dead.
[P1] Roster preview unusable on mobile — minWidth:720px on 375px viewport. Key proof element broken.
[P1] Muted text fails WCAG AA — C.muted on C.bg ≈ 3.1:1 at 13px.
[P2] Visual monotony — every section is centered heading + grid of white cards. No compositional variety.
[P3] Guides section disrupts conversion flow — SEO content between trust section and closing CTA.

## Persona Red Flags
Jordan (First-Timer): No demo/preview, auth flow is opaque, no social proof.
Casey (Mobile): Roster preview clipped, hero subhead too dense, six stacked cards, tiny nav touch targets.

## Minor Observations
- Step circles borderRadius:999 contradicts flat design system
- Header "Get started" vs hero "Get started free" inconsistency
- Hardcoded roster date will go stale
- outline:none on shared input style affects entire app
- JSON-LD price:"0" needs future update
