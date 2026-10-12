# Security review — 2026-10-13

Prepared by i729. This review records tested source changes; it is not a certification of the deployed service.

## Change

Verify the caller session before querying or queuing work; bind website ownership and task authorship to the verified user. Use the caller token with the public Supabase client instead of bypassing RLS with a service-role client. Bound instruction sizes, hide internal errors, and patch Next/React.

## Validation

Three authentication/ownership/input tests passed; TypeScript and Next production build passed, including missing-configuration handling.

## Dependency audit

Counts refer to package findings across the complete locked dependency tree, including tooling; they are not counts of distinct exploitable production vulnerabilities.

| Package project | Before | After | Remaining critical | Remaining high |
| --- | ---: | ---: | ---: | ---: |
| ai-web-company | 14 | 5 | 0 | 5 |

## Required before rollout

The deployed Supabase schema must contain websites.owner_id and enforce owner-scoped RLS on websites/tasks. The repository has no database policies to verify; review them before deployment. Approved Supabase sessions are required. No production database mutations were made.

## Scope

Source and locally fetched Git branches/tags/available pull-request heads were inspected. Private production settings, actual database policies, deployed binaries, backup stores, and third-party service permissions were not changed. Current-source cleanup does not remove data from Git history, existing forks, cached copies, or previously downloaded assets. Sensitive values are intentionally omitted.
