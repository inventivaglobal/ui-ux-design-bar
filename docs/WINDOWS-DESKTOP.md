# B.A.R for Windows

The desktop edition adds a graphical interface to B.A.R's existing engine. It is
not a separate audit engine or a claim that every CLI feature has a GUI.

## Install and use

1. Download the **Windows x64 setup EXE** from the official GitHub release. Check
   its SHA-256 against that release's `SHA256SUMS` if your organization requires it.
2. Run the installer. It installs for your Windows account, not all users. No
   separate Node.js, npm, terminal setup, administrator rights, or PATH edits are
   required. Your organization's device policies may still restrict installation.
3. Open **B.A.R** from the Start menu. Choose a local project/source folder.
4. Run the source or CSS audit and review findings. Export a JSON report when
   needed. Reports can contain source paths and snippets; review before sharing.
5. Preview supported source repairs before applying them. Applying and undoing
   require confirmation. Keep your normal source-control backup. CSS audits are
   report-only: duplicate candidates are not automatically deleted.

Use **Settings → Apps → Installed apps → B.A.R → Uninstall** to remove the app.
Uninstall does not delete your projects, exported reports, repair journals in
projects, or user preferences. The app does not start automatically with Windows.

### Signing status

The initial build is **unsigned**. Windows may show an unknown-publisher or
SmartScreen warning, or an organizational policy may block execution. A checksum
checks artifact integrity; it is not a publisher signature. Do not disable
SmartScreen, antivirus, or organizational controls. On a managed device, ask your
administrator to approve it or wait for a signed distribution. Code signing needs
a separately approved publisher identity/certificate or signing service; none is
purchased or configured by this build.

## Scope and safety

- Windows 10/11 x64 is the target. Windows ARM64/native ARM, 32-bit Windows,
  macOS, and Linux installers are not provided by this workflow.
- Source/CSS scans read local files; they do not execute project imports or upload
  your source. Audit errors/limits are not clean passes.
- Renderer code is local, sandboxed, context-isolated, and has no Node integration.
  The main process owns the selected root, retained repair plan and filesystem
  operations. IPC exposes specific operations rather than commands or filesystem
  access. Navigation and permissions are blocked.
- Cancellation is for read-only work. Repair writes cannot be interrupted from
  the interface; let them finish before closing the app.
- Existing repair limits and hash/path checks still apply. Unsupported repairs
  remain suggestions; unrelated business logic is not rewritten.
- Electron embeds Chromium to display the interface. That does **not** install
  Playwright's browser runtime or expose all configured-route browser auditing in
  this first interface. Advanced browser/QA/MCP/CLI workflows remain documented
  in the core guide; no browser is downloaded silently for source scans.

## Build and verification

The lockfile pins Electron **45.1.0** (embedded Node **24.22.1**) and
electron-builder **26.18.0**. The embedded runtime meets the core engine's Node
requirement. On Windows, run:

```powershell
npm ci
npm run dist:windows
./scripts/windows-installer-smoke.ps1
```

The `B.A.R Windows desktop` GitHub Actions workflow builds on Windows, installs
the actual EXE, drives the installed GUI using Playwright's Electron integration,
and uninstalls it. It verifies current-user registration, unchanged PATH, and
project-file preservation. The hosted runner may be elevated; this is not a claim
of a separately provisioned standard-user acceptance test. The smoke script
refuses an account that already has B.A.R installed. It publishes CI artifacts
only, not a GitHub release. Test
screenshots/results are separate artifacts. Public release publication is a
separate owner-approved action after these checks pass.

The artifact contains the unsigned setup EXE, SHA256SUMS, build provenance and a
corresponding-source ZIP of the exact commit. Build inputs are pinned and the
process is repeatable, but timestamps and platform tooling mean byte-for-byte
reproducibility is **not** claimed. Preserve the source ZIP and license notices
when redistributing this GPL-3.0-only application. Electron's own license and
Chromium third-party license files are included by its packager; npm dependency
licenses remain inside the application archive.

Official references: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security),
[Electron 45.1.0 runtime versions](https://releases.electronjs.org/release/v45.1.0),
[NSIS configuration](https://www.electron.build/nsis/),
[code signing](https://www.electronjs.org/docs/latest/tutorial/code-signing).
