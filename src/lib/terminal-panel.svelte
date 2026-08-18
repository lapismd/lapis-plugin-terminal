<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { useApplicationState } from "@lapis-notes/api";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
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
  const subscribeHost = createSubscriber((update) => plugin.onHostChange(update));
  let hostAvailable = $derived.by(() => {
    subscribeHost();
    return plugin.sessions.available;
  });
  let showEmpty = $derived(!hostAvailable || Boolean(error));
  let rendererKey = $derived.by(() => {
    subscribeHost();
    subscribeRendererSettings();
    return `${plugin.hostGeneration}:${plugin.getSettings().renderer}:${plugin.rendererGeneration}`;
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
        let boundSessionId = activeSessionId;
        const pendingOutput: Array<{ id: string; text: string }> = [];
        const writeBound = (id: string, text: string) => {
          if (boundSessionId) {
            if (id === boundSessionId) renderer?.write(text);
            return;
          }
          pendingOutput.push({ id, text });
        };
        detach.push(
          renderer.onData((data) => {
            if (boundSessionId) void plugin.sessions.write(boundSessionId, data);
          }),
          renderer.onResize(({ cols, rows }) => {
            if (boundSessionId) void plugin.sessions.resize(boundSessionId, cols, rows);
          }),
          plugin.sessions.onOutput(writeBound),
          plugin.sessions.onExit((id, code) => {
            if (id === boundSessionId) {
              renderer?.write(`\r\n[process exited ${code ?? 0}]\r\n`);
            }
          }),
        );
        if (!boundSessionId) {
          const created = await plugin.sessions.create({ cols: 80, rows: 24 });
          if (cancelled) return;
          boundSessionId = created.sessionId;
          activeSessionId = created.sessionId;
          onSessionId(created.sessionId);
        } else {
          await plugin.sessions.resize(boundSessionId, 80, 24);
        }
        for (const chunk of pendingOutput) {
          if (chunk.id === boundSessionId) renderer.write(chunk.text);
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
</script>

<section
  class={["terminal-panel", { "terminal-panel--empty": showEmpty }]}
  data-ui-component="terminal-panel"
  data-testid="terminal-panel"
  data-owned-app={Boolean(application)}
>
  {#if !hostAvailable}
    {@render hostEmpty(
      "terminal-unavailable",
      "terminal",
      "Terminal unavailable",
      plugin.sessions.reason ??
        "Start lapis-terminal-host and set the Terminal server URL and token, or use the desktop host.",
    )}
  {:else if error}
    {@render hostEmpty("terminal-error", "circle-alert", "Unable to start terminal", error)}
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
    padding: 0.75rem;
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
