# Motion, presence, canvas, and continuous work

Use this reference when implementing or reviewing animation, transitions, presence, gesture states, layout motion, canvas/WebGL, or scroll/pointer effects. Motion is a lifecycle and state-ownership problem before it is a visual problem.

## Contents

- Evidence and capability inventory
- Selection ladder
- State and priority model
- Solid motion adapter boundaries
- Presence and exit retention
- SSR and hydration
- Layout motion
- WebGL and continuous work
- Accessibility and performance policy
- Failure signatures
- Verification
- Sources and freshness

## Evidence and capability inventory

Do not infer runtime capability from prop types, package names, or a demo screenshot. Trace:

- public exports and the code path that consumes each prop;
- event bindings for hover, focus, press, tap, drag, and viewport states;
- value renderer, animation driver, cancellation, and completion callback;
- DOM/SVG style writers and transform composition;
- variant resolution and priority order;
- presence registration, retained ownership, and removal;
- layout measurement timing and scroll/fixed ancestor compensation;
- server initial-style serialization and hydration tests;
- reduced-motion policy;
- resource cleanup.

The uploaded Solid motion code is an experiment with explicit limitations. It provides source evidence for MotionState, initial styles, presence aggregation, and single-slot retention. Research documents explicitly defer keyed-list parity, full gesture/layout parity, and Solid 2 production parity. Do not turn experimental types into production claims.

## Selection ladder

Choose the smallest mechanism that provides the needed semantics:

1. No motion when it adds no feedback, continuity, spatial explanation, or state change.
2. CSS transition for hover/focus/pressed/expanded visual states.
3. CSS keyframes for self-contained decorative sequences with a clear reduced-motion replacement.
4. Web Animations API for imperative timing, cancellation, or sequencing on known DOM nodes.
5. A renderer-specific primitive when motion targets reactive component state.
6. Presence only when logically removed content must remain physically present for exit.
7. Layout projection only after ordinary layout/transform approaches cannot express the continuity.
8. Canvas/WebGL only when the visual cannot be delivered efficiently and accessibly with document content or media.

Do not add a framework island solely to rotate a disclosure icon. The Kaiju FAQ uses `<details>` plus a CSS `group-open` transition; that preserves native disclosure without hydration.

## State and priority model

Separate motion lanes rather than letting the last effect win. The uploaded design proposes this low-to-high order:

```text
base style
  < initial
  < animate / variants
  < whileInView
  < whileFocus
  < whileHover
  < whileTap / whilePress
  < drag ownership
  < layout projection
  < exit
```

This is evidence from the local experiment, not a universal Motion guarantee. Compare with the installed animation engine's actual priority model before integrating.

Define conflict rules:

- higher priority overrides only the value channels it owns;
- lower lanes remain available for unaffected channels;
- release resumes from the current sampled value rather than jumping to an old initial value;
- drag owns position channels while active;
- exit becomes terminal only after logical removal and cancels/replaces incompatible work;
- cancellation settles completion exactly once.

Example state contract:

```ts
type MotionLane =
  | "animate"
  | "inView"
  | "focus"
  | "hover"
  | "press"
  | "drag"
  | "layout"
  | "exit";

type ActiveTargets = Map<MotionLane, Record<string, unknown>>;
```

The map alone is not an implementation. A resolver must merge channels in documented priority order and a renderer must animate/cancel values.

## Solid motion adapter boundaries

Keep framework-neutral animation work separate from Solid ownership:

```text
Solid adapter
  - reactive prop access
  - mount/ref timing
  - context and presence registration
  - owner cleanup
  - SSR initial snapshot

animation engine
  - MotionValue/value lifecycle
  - target animation and cancellation
  - HTML/SVG writes
  - easing, spring, time scheduling
```

Do not destructure reactive motion props. Snapshot options in a tracked scope only if the runtime owns a plain-object contract, and keep render-time initial-style resolution pure.

The local experiment deliberately reuses framework-neutral `motion-dom` primitives such as value animation and DOM style writers while retaining Solid-owned `mount`, `unmount`, option update, presence, and cleanup seams. It does not yet prove that higher-level VisualElement APIs can be used unchanged.

External work begins after mount:

```tsx
onMount(() => {
  const animation = element.animate(keyframes(), timing());
  const stopPreference = bindReducedMotion((reduced) => {
    if (reduced) animation.finish();
  });

  onCleanup(() => {
    stopPreference();
    animation.cancel();
  });
});
```

Completion handlers must tolerate cancellation and disposal. Never leave a rejected `.finished` promise unobserved.

## Presence and exit retention

Presence separates:

- logical presence: the item remains in application state;
- physical presence: the DOM and reactive owner remain long enough to complete exit.

Solid control flow normally disposes a removed branch. Starting an exit effect after disposal is too late. The parent presence boundary must own retained records:

```text
next keyed records
  -> diff previous records
  -> mark missing record logically absent
  -> retain its owner/DOM
  -> descendants register exit work
  -> aggregate completion
  -> release record and dispose exactly once
```

Minimum contracts:

```ts
interface PresenceHandle {
  id: symbol;
  key?: string | number;
  startExit(): void;
  dispose(): void;
}

interface PresenceBoundary {
  isPresent: boolean;
  register(handle: PresenceHandle): () => void;
  onExitComplete(id: symbol): void;
}
```

Required cases:

- no exit target: remove without deadlock;
- one exit: retain until completion;
- nested exits: wait for every registered descendant;
- cancellation: completion/release once;
- remove then same-key reentry: explicitly cancel, replace, or coexist;
- reorder without remove: preserve logical identity;
- owner disposal during exit: retained handle still has a safe terminal path;
- `wait` mode: entering child does not starve if exit has no animated values.

The uploaded implementation's `AnimatePresence` is single-slot with `sync` and `wait` experiments. It is not evidence for keyed-list or Framer Motion parity. `@solid-primitives/transition-group` is useful evidence for transition sequencing, but DOM-element retention alone is not proof that nested Solid owners/context remain alive.

## SSR and hydration

Server output and first client render must use the same initial style. Resolve it without DOM access:

```ts
function resolveInitialStyle(options: MotionOptions): JSX.CSSProperties {
  if (options.initial === false || options.initial === undefined) {
    return resolveTarget(options.animate);
  }
  return resolveTarget(options.initial);
}
```

The exact library rules may differ; test them. Cover:

- explicit initial target;
- `initial={false}`;
- omitted initial;
- variants and custom data;
- CSS variables plus transforms;
- HTML and SVG;
- reduced motion known only after mount;
- server markup hydration diagnostics.

Do not initialize to a browser media-query value on the client if the server serialized another value. Hydrate the shared snapshot first, then reconcile preferences.

## Layout motion

FLIP requires ordered reads and writes:

```text
First: capture previous box
DOM update
Last: capture next box
Invert: apply delta transform
Play: animate to identity
```

Fine-grained updates make the pre-mutation capture boundary difficult. Start with explicit `layoutDependency` or invalidation rather than installing observers everywhere. Validate:

- read/write phase separation;
- transforms and existing transform composition;
- scroll containers and fixed ancestors;
- resized content and fonts/images;
- server path performs no layout reads;
- cancellation/reorder during active projection;
- focus and hit testing during transforms.

Shared-layout ids require uniqueness and a defined scope. They do not automatically solve cross-root, portal, or route-transition ownership.

## WebGL and continuous work

The Kaiju depth scene provides a concrete resource checklist:

- Solid island begins after mount;
- pointer listener is passive and removed;
- reduced-motion media listener is removed;
- `requestAnimationFrame` ids are cancelled;
- `ResizeObserver` disconnects;
- WebGL textures, buffers, and programs are deleted;
- third-party particles container is destroyed;
- async initialization checks a `disposed` flag;
- a static `<img alt="">` remains when WebGL or texture loading fails;
- canvas is decorative and `aria-hidden`.

Improve it by defining visibility/page-lifecycle suspension. `client:visible` delays initial hydration but does not pause frames after the island scrolls away. Use page visibility and intersection evidence when continuous work is expensive.

Cap device pixel ratio and texture dimensions deliberately. Handle context loss/restoration if the feature is important; otherwise fall back permanently. Never let a decorative hero prevent content or interaction.

## Accessibility and performance policy

Reduced motion is a behavior decision:

| Motion purpose | Reduced-motion response |
|---|---|
| Decorative drift/parallax | Disable |
| State feedback | Shorten or replace with opacity/color |
| Spatial navigation | Preserve minimal continuity without large travel |
| Progress/indeterminate activity | Preserve non-motion status text; reduce continuous movement |
| Essential simulation | Provide controls and a static/step alternative |

Also:

- never hide focus or change focus order during animation;
- avoid vestibular triggers such as large parallax, zoom, and continuous background movement;
- prefer transform/opacity but measure compositing and memory rather than assuming they are free;
- cancel work in background tabs and when removed;
- avoid animating blur/large shadows or layout properties on large trees without evidence;
- define interrupt, rapid toggle, and route navigation behavior;
- do not announce decorative animation through live regions.

## Failure signatures

| Signature | Likely cause | Next inspection |
|---|---|---|
| Removed item never disappears | Exit completion never settles | Registration, cancellation, zero-animation path |
| Item disappears before exit | Parent did not retain owner | Control-flow/presence boundary |
| Same key renders twice | Reentry policy missing | Record identity and cancel/replace rules |
| Hydration flash | Initial style differs server/client | Pure resolver and serialized markup |
| Hover/tap sticks | Lane release/cancellation missing | Priority resolver and event cleanup |
| Work continues offscreen | Hydration visibility mistaken for suspension | Page/intersection visibility owner |
| FPS degrades per navigation | Frame/listener/observer leak | Mount/unmount resource counts |
| WebGL blank removes hero | No fallback or wrong stacking | Static image and error state |
| Types advertise drag but nothing moves | Public surface exceeds implementation | Event bindings and integration tests |
| Layout jumps after font/image | Measurement before content settled | Invalidation and asset dimensions |

## Verification

1. Test target resolution and priority conflicts without the DOM.
2. Test animation start, interruption, cancellation, completion, and zero-duration paths with a deterministic driver.
3. Server-render and hydrate initial-style cases while failing on warnings.
4. Test single and nested presence, reentry, rapid toggles, reorder, and disposal.
5. Count frames, listeners, observers, animation objects, WebGL resources, and retained owners after repeated navigation.
6. Test reduced motion before mount and preference changes after mount.
7. Test background tab, offscreen, resize, context failure, texture failure, and route removal.
8. Measure long tasks, frame time, memory, layout shift, and shipped animation code.
9. Run keyboard/focus checks while elements enter, exit, reorder, and transform.
10. Claim only the capabilities covered by executable tests.

## Sources and freshness

- Uploaded `solid-motion-experiments.zip` source and research notes, reviewed 2026-07-17. Status: experimental; not proof of full Motion parity.
- Uploaded `kaiju-website(6).zip` depth/WebGL and native FAQ implementations, reviewed 2026-07-17.
- Uploaded `solid-primitives(2).zip`, including presence, transition, scheduling, visibility, observer, and lifecycle packages, reviewed 2026-07-17.
- Solid lifecycle docs: https://docs.solidjs.com/reference/lifecycle/on-mount and https://docs.solidjs.com/reference/lifecycle/on-cleanup (reviewed 2026-07-17).
- Browser animation and WebGL behavior varies by runtime. Verify target-browser policy and installed library source before claiming gesture, presence, layout, or context-recovery support.
