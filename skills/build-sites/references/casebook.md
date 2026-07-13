# Site casebook

## Kaiju marketing site

The evidence supports Astro page ownership with narrow Solid islands, native
`details` for FAQ behavior, separate Astro and Solid icon integrations,
Zaidan/Kobalte/Corvu component contracts, Tailwind layers, and visual fallback
for a WebGL hero. Unused Solid FAQ and pricing components are not active patterns;
the import graph decides.

## Kaiju documentation site

A static Astro application can generate service catalogs, OpenAPI JSON, and API
reference pages from service-owned factories at build time. Rich API documents
do not automatically require a runtime server.

## ThunderStrike CMS site

The useful pattern is a project-owned CMS adapter that maps provider records to
stable article/author/topic/category/media shapes. Portable Text remains at the
article boundary, and legacy local content is migration input rather than a
second runtime source.

The webhook is negative evidence: it logs secrets and PII, skips provider
verification, exposes mutation through GET, returns provider errors, and splits
environment ownership. Never copy it as a site endpoint pattern.

## High-value checks

- replace a hydrated FAQ with native disclosure and prove no island bundle;
- require an explicit renderer for a `client:only` component;
- ensure repeated Astro navigation does not multiply listeners;
- retain a static visual when WebGL or an image fails;
- map incomplete CMS records through one validated adapter;
- forbid secret/PII logs and mutating GET webhooks.
