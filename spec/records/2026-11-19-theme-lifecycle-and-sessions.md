# Theme, renderer lifecycle and terminal sessions

Server review uses separate Ghostty engines per mounted renderer, workspace
colours at construction and OSC 10/11 for live VT default-colour changes.
The owning ghostty-web source fixes VT colour updates and full viewport fitting;
local package archives qualify those unpublished prerequisites without changing
portable registry ranges or editing installed package files.

Open Terminal reveals the selected retained terminal when the dock was hidden,
and creates when a terminal is visible. New Terminal is also available through
an accessible plus button. Tabs retain numbered labels and separate session IDs.
The canvas fills the panel; its scrollbar and hit area meet the right edge.

Source validation:

- Conditional command policy baseline: 3 failed, 1 passed; repaired: 4 passed.
- First real-plugin unit-import attempt failed on the published API's
  extensionless workspace-host-internal export; policy tests use a type-only
  API dependency and exercise the actual destination helper.
- Renderer browser acceptance: light/dark pixels, live theme changes, eight
  remounts, twenty narrow resized remounts and full viewport/scrollbar interaction.
  Six tests pass at device pixel ratio 2. The new scrollbar test initially used
  xterm buffer baseY semantics (one failure); Ghostty's public getViewportY and
  getScrollbackLength expose its reverse history offset, now asserted directly.
- Package checks: zero Svelte errors/warnings, typecheck and App audit pass.
  31 unit tests and six browser tests pass; package build and publint pass. Spec-first initially
  rejected the lockfile change without its governance update; the mapped chapter
  now documents browser qualification and local archive handling, and passes.
- Existing source padding assertion was updated to the intentional zero-padding
  contract, with actual panel/canvas geometry also checked in Server stories.
- In-flight session creation is covered by two source tests: cancelled renderers
  stop their new session; retained renderers preserve it.
- Changed stories remain visual-pending; no visual baselines are updated.

Consumer interaction and actual Storybook reload results remain separately
recorded in Server. Native shell policy is owned by Server and is not implemented
by this plugin or by fixture ANSI transcripts.

Session snapshot regression: the real Server story sequence exposed two sessions
for one initial terminal leaf. Unbound snapshots included sessionId: null, which
prevented the API from recognizing a later bound state as richer during layout
projection. The source snapshot regression initially failed once (one passed),
then both tests passed after omitting the unbound ID. The first test harness
attempt needed its Svelte panel dependency mocked before import. An attempted
per-leaf binding cache was discarded because it replaced renderer ownership
without replay; no such cache remains in production.

## Pull request preparation against current main

Ported the reviewed changes onto main 3d8be40b, retaining API 0.6.5/Core 0.13.4,
published peer ranges, activation fencing, pending input buffering and leaf-owned
session handoff. The newer TerminalSessionOwner already owns cancelled creation
cleanup, so the older private create helper and its duplicate tests are omitted.
The richer snapshot regression now composes with that existing owner.

Requalification: 38 unit and six browser cases pass, together with check, build,
spec and publint. The first ported browser launch missed its explicit provider
dev dependency (one startup error); adding @vitest/browser-playwright restored the
exact browser target and complete package lane. Temporary Ghostty archive
qualification remains separate from registry delivery. Upstream source PR:
https://github.com/coder/ghostty-web/pull/232. The plugin PR remains draft until
those renderer fixes are released and its registry dependency can be refreshed.
