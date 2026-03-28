# Testing

## Running Tests

```bash
pnpm test
```

This runs all `*.{test,spec}.js` and `*.__test__.js` files across the repo using Vitest.

## Test Conventions

- Test files live alongside scripts: `scripts/generate.__test__.js`
- Tests use real environment (no mocks for external APIs unless unavoidable)
- Always add or update tests when changing script behavior

## Running a Specific Skill Test

```bash
pnpm exec vitest run skills/compiling-video
pnpm exec vitest run skills/aligning-lyrics
```

## Environment

Tests that call Replicate or other APIs require `.env` to be populated:

```bash
source .env && pnpm test
```

## Adding Tests for a New Skill

1. Create `skills/<skill-name>/scripts/<action>.__test__.js`
2. Import and test the exported functions (not the CLI entry point)
3. Keep side effects in `main()`, pure logic in named functions

Example:
```js
import { describe, it, expect } from 'vitest';
import { buildFfmpegArgs } from './compile.js';

describe('buildFfmpegArgs', () => {
  it('includes audio mux flag', () => {
    const args = buildFfmpegArgs({ audioFile: 'song.mp3' });
    expect(args).toContain('-i');
  });
});
```
