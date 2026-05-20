# snpalways

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

---

## Git / PR Rules

- **Never merge to `main` without explicit user instruction.**
- **Never delete any branch without explicit user instruction.**
- When creating PR, always pass `--delete-branch=false` to `gh pr merge`.
- GitHub repo may have "Automatically delete head branches" enabled — disable it in Settings → General to prevent silent branch deletion after merge.
- If `develop` loses upstream tracking after a merge, restore with:
  ```bash
  git branch --set-upstream-to=origin/develop develop
  ```
