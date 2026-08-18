<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { useApplicationState } from "@lapis-notes/api";
  import { untrack } from "svelte";
  import { createSubscriber } from "svelte/reactivity";
  import type { TerminalRenderer } from "./renderers/terminal-renderer";
  import type { TerminalPlugin } from "./terminal-plugin";

  let {
    app,
    plugin,
    sessionId = null,
    onSessionId,
  }: {
    app?: App;
    plugin: TerminalPlugin;
    sessionId?: string | null;
    onSessionId: (sessionId: string | null) => void;
  } = $props();

  const application = useApplicationState(untrack(() => app));
  let error = $state<string | null>(null);
  let fallbackStatus = $state<string | null>(null);
  let activeSessionId = $state<string | null>(untrack(() => sessionId));
  const subscribeRendererSettings = createSubscriber((update) =>
    plugin.onSettingsChange(update),
  );
  let rendererKey = $derived.by(() => {
    subscribeRendererSettings();
    return `${plugin.getSettings().renderer}:${plugin.rendererGeneration}`;
  });

  function attachRenderer(element: HTMLElement) {
    let cancelled = false;
    let renderer: TerminalRenderer | null = null;
    const detach: Array<() => void> = [];

    void (async () => {
      fallbackStatus = null;
      try {
        const selected = await plugin.selectRenderer();
        if (cancelled) {
          selected.renderer.dispose();
          return;
        }
        renderer = selected.renderer;
        fallbackStatus = selected.fallbackReason;
        await renderer.mount(element);
        if (!activeSessionId) {
          const created = await plugin.sessions.create({ cols: 80, rows: 24 });
          if (cancelled) return;
          activeSessionId = created.sessionId;
          onSessionId(created.sessionId);
        }
        detach.push(
          renderer.onData((data) => {
            if (activeSessionId) void plugin.sessions.write(activeSessionId, data);
          }),
          renderer.onResize(({ cols, rows }) => {
            if (activeSessionId) void plugin.sessions.resize(activeSessionId, cols, rows);
          }),
          plugin.sessions.onOutput((id, text) => {
            if (id === activeSessionId) renderer?.write(text);
          }),
          plugin.sessions.onExit((id, code) => {
            if (id === activeSessionId) {
              renderer?.write(`\r\n[process exited ${code ?? 0}]\r\n`);
            }
          }),
        );
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
</script>

<section
  class="terminal-panel"
  data-ui-component="terminal-panel"
  data-testid="terminal-panel"
  data-owned-app={Boolean(application)}
>
  {#if !plugin.sessions.available}
    <p data-testid="terminal-unavailable">{plugin.sessions.reason}</p>
  {:else if error}
    <p data-testid="terminal-error">{error}</p>
  {:else}
    {#if fallbackStatus}
      <p data-testid="terminal-renderer-status">{fallbackStatus}</p>
    {/if}
    {#key rendererKey}
      <div
        class="terminal-surface"
        data-testid="terminal-surface"
        {@attach attachRenderer}
      ></div>
    {/key}
  {/if}
</section>

<style>
  .terminal-panel {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 0.75rem;
    color: var(--ui-workspace-view-foreground);
    background: var(--ui-workspace-view-background);
  }

  .terminal-surface {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  p {
    margin: 0 0 0.5rem;
  }

  :global(.terminal-surface .xterm),
  :global(.terminal-surface canvas) {
    height: 100%;
  }
</style>
