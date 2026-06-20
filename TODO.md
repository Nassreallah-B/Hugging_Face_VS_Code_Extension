# TODO

## Priority 1
- Move `hfaicode.apiToken` away from plain VS Code settings and into `SecretStorage`.
  Why: the current token flow is saved through configuration updates in `extension.js`, which is more exposed than VS Code secret storage.
- Add automatic cleanup for live test temp folders created by `scripts/run-vscode-live-tests.js`.
  Why: the script creates temporary workspaces, user-data directories, extension directories, and logs, but does not remove them automatically after the run.
- Add CI automation for the existing checks.
  Why: the repository exposes local scripts such as `test:anti-hallucination`, `test:cloud-smoke`, and `test:vscode-live`, but no GitHub Actions workflow is present to enforce them.

## Priority 2
- Strengthen anti-hallucination from heuristic post-validation to claim-by-claim validation.
  Current state: `lib/antiHallucination.js` validates format and evidence markers heuristically, but does not fully prove each factual claim against the code or runtime evidence.
- Add unit tests for `lib/antiHallucination.js`.
  Focus areas:
  - false positives
  - false negatives
  - strict audit formatting
  - security response validation
  - documentation-vs-implementation confusion
- Expand non-regression coverage for:
  - patch review / apply / reject
  - Docker auto-start and fallback to direct chat
  - task orchestration and subagent flows
  - persistence of response metadata in the UI

## Priority 3
- Replace the current activity-bar icon with a dedicated simplified asset designed for small monochrome or near-monochrome rendering in VS Code.
  Why: direct reuse of a photo-style asset may render as a white square or an unreadable icon in the Activity Bar.
- Add release automation around VSIX packaging and validation.
  Why: packaging works locally, but release validation is still manual.
- Add a documented test matrix for:
  - no Docker
  - Docker available
  - direct chat mode
  - agent tools mode
  - cloud executor mode

## Notes
- The anti-hallucination system is present and useful, but it should not be described as a full fact-checking engine yet.
- The current runtime is strong enough for a pragmatic v1, but some guarantees are still heuristic rather than deterministic.
