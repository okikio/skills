# Site quality and verification

## Accessibility

Verify landmarks, heading order, link purpose, disclosure semantics, keyboard
interaction, focus visibility, dialogs, form labels/errors, contrast, zoom,
reflow, reduced motion, and fallback content. Native HTML can eliminate entire
classes of island and accessibility defects.

## Performance

Measure rendered HTML, JavaScript by island, image dimensions/formats, font
loading, icon inclusion, third-party scripts, layout shift, interaction latency,
and continuous frame work. Wildcard icon collections and hydrated static sections
need explicit justification.

## Resilience

Test no JavaScript where progressive enhancement is claimed, image and WebGL
failure, slow CMS/API responses, invalid content, repeated client navigation,
offline/static asset behavior, and server error pages.

## Verification commands

Use repository-owned lint/type/content checks, Astro check, static/server build,
link and feed checks, browser accessibility tests, responsive screenshots where
visual changes matter, and adapter/deployment smoke tests. Keep code formatters
scoped away from authored Markdown.
