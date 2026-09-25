# Validation

Run these commands from the repository root:

```sh
node .agent-logs/verify.mjs
```

The record order is oldest-to-newest and covers the historical commit range captured in `manifest.json`; the ledger-adding commit is not self-recorded. If the recorded history is rewritten or historical commits are added, regenerate the ledger and update `manifest.json`.
