## Checking full-repo errors in VS Code

To see whole-project errors in VS Code:

1. Open the Problems panel:
   Ctrl + Shift + M

2. Run:
   Ctrl + Shift + P -> Tasks: Run Task -> Check: Full repo

Useful commands:

```bash
npm run typecheck
npm run lint:repo
npm run check
npm run check:build
```

VS Code may only show open-file errors by default. These tasks run TypeScript and ESLint across the full repo and send errors to the Problems panel.
