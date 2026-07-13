# Motion and presence

## Selection order

1. No motion when it adds no comprehension or feedback.
2. CSS transitions/animations for simple state changes.
3. Web Animations or a small primitive for imperative DOM behavior.
4. Renderer-aware component integration for coordinated state.
5. A presence system only when removed values must remain until exit completes.

## Solid motion contract

Solid does not rerun component functions like React. Preserve reactive access to
props and split renderer state from host component ownership. Start DOM-backed
animation after mount and make the server/initial client style deterministic.

Presence requires more than retaining DOM values:

- stable semantic identity;
- retained Solid owner and context where descendants need it;
- explicit completion callback;
- defined remove, reorder, cancel, and same-key reentry behavior;
- cleanup on cancellation and disposal.

If exit completion is never called, the value may remain forever. Object identity
and logical identity are not always the same.

## Operational budget

Reduced motion is a behavior policy, not only lower amplitude. Decide whether to
disable, shorten, replace, or preserve essential movement. Pause continuous frame
work while offscreen when appropriate. `client:visible` controls initial
hydration, not later suspension.

Provide a static fallback for WebGL, canvas, image, or animation failure. Test no
context, loading errors, background tabs, resize, unmount, and route navigation.

## Capability honesty

Inspect implementation and tests before claiming gesture, viewport, layout,
presence, SSR, or Solid-version parity. Declared prop types and research notes do
not prove an event-binding or renderer exists.
