# Hosted Terminal activation and view retirement

Default seeding now constructs a bottom-panel leaf without activating the
command host. Explicit Open/New Terminal actions still reveal their leaf.
A renderer arriving late preserves focus held by another input or palette.
Layout-ready callbacks are fenced per activation and pending seed work drains
before plugin cleanup. View unload also closes its owned session, including
when layout replacement retires the View; renderer-only remounts still reuse
one View-owned pending PTY.

The focus regression fails before repair and passes afterward. The view-unload
regression likewise fails with zero stop calls on the previous source and
passes with exactly one stop call after repair. All 26 unit tests, source
check, build, specification and publint lanes pass.

Separate Server consumer acceptance exposed HTTP/1 connection starvation from
unbounded output streams. The consumer owns finite cursor-resumed responses
and its own authenticated transport; this package does not copy that policy.
Its exact multi-browser Tasks switch/refusal scenario passes with this packed
UI. The wider consumer run passes 14 of 15 cases; the remaining AI startup
Retry defect belongs to Notes/Server and is not a Terminal source pass claim.
