# Replay Lab: one-match online pilot

This repository tests a small workflow: Pages CMS edits a match and uploads a `.rep`, GitHub Actions validates and publishes it, and visitors watch it in OpenBW without importing files.

- Public viewer: https://lmnst.github.io/starcraft-replay-pilot/
- Editor: https://app.pagescms.org/ (connect only this repository)
- English is the default; Chinese is available from the language switch.
- Content: `content/matches/*.json`; uploaded replays: `site/replays/`.
- Local build: `python scripts/build.py`, then serve `dist/` with a static HTTP server.

The viewer is derived from https://github.com/dgant/openbw-replay-viewer at commit `bb4b9a3a89b7b1c189bbc3fcaafb5c33a8ca66e8`. Third-party notices are in `THIRD_PARTY.md`. Do not infer a new licence for upstream code from this repository.

## Resource limitation

This pilot uses the upstream player's public MPQ host, `https://dgant.github.io/mpqs`. The browser fetches around 90 MB on the first visit and can cache it. This repository does not distribute Blizzard MPQ archives. Availability and future permission to rely on that host are not guaranteed. Successful pilot playback does not settle production asset hosting or long-term reliability.

CMS edits are not instantly live: wait for the `Validate and publish pilot` workflow. Only successful builds deploy. Replacing a replay with a new uploaded filename avoids stale replay caching; preserve the match `id` to keep its page link.
