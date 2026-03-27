# Installing Violyra skills for OpenCode

Add to your `opencode.json` plugins array:

```json
{
  "plugins": [
    "violyra@git+https://github.com/soasme/violyra.git"
  ]
}
```

To pin a specific version:
```json
{
  "plugins": [
    "violyra@git+https://github.com/soasme/violyra.git#v1.0.0"
  ]
}
```

Restart OpenCode to load the skills.

## Available Skills

See [docs/installation.md](../docs/installation.md) for the full skill list and usage.
