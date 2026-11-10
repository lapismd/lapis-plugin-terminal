<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { useApplicationState } from "@lapis-notes/api";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import { getContext, untrack } from "svelte";
  import { TERMINAL_SESSION_OWNER, type TerminalSessionOwner } from "./terminal-session-owner";
  import { createSubscriber } from "svelte/reactivity";
  import type { TerminalRenderer } from "./renderers/terminal-renderer";
  import type { TerminalPlugin } from "./terminal-plugin";
  import { resolveTerminalCreateOptions } from "./terminal-session-options";

  let {
    app,
    plugin,
    sessionId = null,
    onSessionId,
    onSessionExit,
  }: {
    app?: App;
    plugin: TerminalPlugin;
    sessionId?: string | null;
    onSessionId: (sessionId: string | null) => void;
    onSessionExit?: () => void;
  } = $props();

  const sessionOwner = getContext<TerminalSessionOwner | undefined>(TERMINAL_SESSION_OWNER);
  const application = useApplicationState(untrack(() => app));
  let error = $state<string | null>(null);
  let ready = $state(false);
  let activeSessionId = $state<string | null>(untrack(() => sessionId));
  const subscribeHost = createSubscriber((update) => plugin.onHostChange(update));
  let hostAvailable = $derived.by(() => {
    subscribeHost();
    return plugin.sessions.available;
  });
  let showEmpty = $derived(!hostAvailable || Boolean(error));
  let rendererKey = $derived.by(() => {
    subscribeHost();
    return plugin.hostGeneration;
  });

  function attachRenderer(element: HTMLElement) {
    ready = false;
    let cancelled = false;
    let renderer: TerminalRenderer | null = null;
    const detach: Array<() => void> = [];

    void (async () => {
      try {
        const selected = await plugin.createRenderer();
        if (cancelled) {
          selected.dispose();
          return;
        }
        renderer = selected;
        await renderer.mount(element);
        let boundSessionId = activeSessionId;
        let fitted = { cols: 80, rows: 24 };
        let lastSent = { cols: 0, rows: 0 };
        let pendingInput = "";
        const pendingOutput: Array<{ id: string; bytes: Uint8Array }> = [];
        const closeBoundSession = (id?: string | null) => {
          if (cancelled || !boundSessionId) return;
          if (id && id !== boundSessionId) return;
          onSessionExit?.();
        };
        const keepAlive = (task: Promise<void>) => {
          void task.catch((error: unknown) => {
            if (isUnavailableSession(error)) closeBoundSession();
          });
        };
        const sendResize = (cols: number, rows: number) => {
          if (!boundSessionId || cols < 2 || rows < 1) return;
          if (cols === lastSent.cols && rows === lastSent.rows) return;
          lastSent = { cols, rows };
          keepAlive(plugin.sessions.resize(boundSessionId, cols, rows));
        };
        const writeBound = (id: string, bytes: Uint8Array) => {
          if (boundSessionId) {
            if (id === boundSessionId) renderer?.write(bytes);
            return;
          }
          pendingOutput.push({ id, bytes });
        };
        detach.push(
          renderer.onData((data) => {
            if (boundSessionId) keepAlive(plugin.sessions.write(boundSessionId, data));
            else if (new TextEncoder().encode(pendingInput + data).byteLength <= 65536) pendingInput += data;
            else error = "Terminal input buffer exceeds its limit";
          }),
          renderer.onResize(({ cols, rows }) => {
            fitted = { cols, rows };
            sendResize(cols, rows);
          }),
          plugin.sessions.onOutput(writeBound),
          plugin.sessions.onExit((id) => {
            closeBoundSession(id);
          }),
        );
        const createSession = async () => {
          const options = resolveTerminalCreateOptions(plugin.getSettings(), app ?? application, fitted);
          const created = await (sessionOwner?.acquire(options) ?? plugin.sessions.create(options));
          if (cancelled) return;
          boundSessionId = created.sessionId;
          activeSessionId = created.sessionId;
          onSessionId(created.sessionId);
          sendResize(fitted.cols, fitted.rows);
        };
        if (!boundSessionId) {
          await createSession();
        } else {
          try {
            await plugin.sessions.resize(boundSessionId, fitted.cols, fitted.rows);
            lastSent = fitted;
          } catch {
            sessionOwner?.forget(boundSessionId);
            if (!cancelled) await createSession();
          }
        }
        for (const chunk of pendingOutput) {
          if (chunk.id === boundSessionId) renderer.write(chunk.bytes);
        }
        if (!cancelled && boundSessionId) {
          if (pendingInput) await plugin.sessions.write(boundSessionId, pendingInput);
          pendingInput = "";
          if (!cancelled) ready = true;
        }
      } catch (caught: unknown) {
        if (!cancelled) {
          error =
            caught instanceof Error ? caught.message : "Unable to start a terminal session";
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const dispose of detach) dispose();
      renderer?.dispose();
    };
  }

  function isUnavailableSession(error: unknown): boolean {
    return error instanceof Error && /unavailable|closed/i.test(error.message);
  }
</script>

<section
  class={["terminal-panel", { "terminal-panel--empty": showEmpty }]}
  data-ui-component="terminal-panel"
  data-testid="terminal-panel"
  data-owned-app={Boolean(application)}
  aria-busy={hostAvailable && !error && !ready}
>
  {#if !hostAvailable}
    {@render hostEmpty(
      "terminal-unavailable",
      "square-terminal",
      "Terminal unavailable",
      plugin.sessions.reason ??
        "Start lapis-terminal-host and set the Terminal server URL and token, or use the desktop host.",
    )}
  {:else if error}
    {@render hostEmpty("terminal-error", "circle-alert", "Unable to start terminal", error)}
  {:else}
    {#key rendererKey}
      <div
        class="terminal-surface"
        data-testid="terminal-surface"
        {@attach attachRenderer}
      ></div>
    {/key}
  {/if}
</section>

{#snippet hostEmpty(
  testId: string,
  icon: string,
  title: string,
  description: string,
)}
  <div class="terminal-panel-empty">
    <Empty.Root data-testid={testId}>
      <Empty.Header>
        <Empty.Media variant="icon">
          <WorkspaceIcon name={icon} />
        </Empty.Media>
        <Empty.Title role="heading" aria-level={2}>{title}</Empty.Title>
        <Empty.Description>{description}</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  </div>
{/snippet}

<style>
  .terminal-panel {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: var(--ui-workspace-explorer-content-padding, 0.5rem);
    color: var(--ui-workspace-view-foreground);
    background: var(--ui-workspace-view-background);
  }

  .terminal-panel--empty {
    padding: 0;
  }

  .terminal-panel-empty {
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .terminal-surface {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    color: var(--ui-workspace-view-foreground);
    background: var(--ui-workspace-view-background);
    caret-color: transparent;
  }

  :global(.terminal-surface canvas) {
    height: 100%;
  }

  :global(.terminal-surface textarea),
  :global(.terminal-surface [contenteditable="true"]) {
    caret-color: transparent;
  }
</style>
