Drop your titlebar icon here as `icon.png`. It's referenced directly by
src/main.jsx (createPrettyWindow icon option) and index.html's #pretty-icon
fallback path — no other wiring needed once the file exists.

For the actual app bundle icons (taskbar/dock/installer), see the note in
src-tauri/icons/README.md — that's a separate, larger asset generated via
the Tauri CLI.
