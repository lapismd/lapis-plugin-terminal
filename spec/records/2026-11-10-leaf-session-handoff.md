# Terminal leaf session handoff

The cold production Server scenario caught two PTY creations during startup
where one was expected. Layout projection replaced a Terminal View on the same
leaf. A renderer-only owner fixed remounts but did not survive that View
replacement; unload cleanup correctly retired the old shell, then created a
second one.

The leaf now hands its pending/session owner to a same-plugin replacement
before retiring the previous View. Session identity lives in that owner, so a
late create resolves into the replacement's persisted state. A final unload,
detach, or replacement with another view still stops the PTY.

The new handoff test fails before repair and passes after. Both View lifecycle
cases pass, as do all 27 unit tests, check, build, specification and publint
through prepack. The exact real production browser scenario changes from one
failure to one pass without weakening its single-creation assertion and proves
keyboard input writes the expected file in the admitted vault. The consumer
keeps complete hosted qualification and image release evidence separately.
