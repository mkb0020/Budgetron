This folder needs the actual bundle icons (32x32.png, 128x128.png, 128x128@2x.png,
icon.icns, icon.ico) before you can build a release bundle.

Once you have `public/images/icon.png` in place (should be at least 1024x1024 for
best results), generate all of these in one shot from the project root:

    npm run tauri icon public/images/icon.png

That populates this folder automatically and wires up the paths already referenced
in tauri.conf.json's bundle.icon array. Until then, `npm run tauri dev` still works
fine — this only matters for `tauri build`.
