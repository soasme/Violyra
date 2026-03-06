# Storyboard Format

Use this contract for both `assets/storyboard.json` and `assets/storyboard.js`.

## Root Object

```json
{
  "model": "seedance15",
  "song_title": "string",
  "scenes": []
}
```

## Scene Object

Required fields:

1. `scene_id` (integer): unique, increasing, starts at `1`.
2. `section` (string): lyric section label such as `Intro`, `Verse 1`, `Chorus 1`, `Bridge`, `Outro`.
3. `character` (string): primary subject for the scene, or `All`/ensemble label.
4. `lyrics` (string[]): one or more lyric lines mapped to this scene.
5. `prompt` (string): motion-first visual prompt with camera direction.

Optional fields:

1. `duration` (integer): include only when scene duration differs from default pipeline duration.

## Prompt Quality Checklist

1. Include subject action.
2. Include environment movement or reaction.
3. Include camera movement.
4. Keep action sequence concrete and visually direct.
5. Avoid abstract-only language and avoid static descriptions.

## JS Output Form

When user explicitly asks for JS output:

```js
module.exports = {
  model: "seedance15",
  song_title: "Example",
  scenes: [
    {
      scene_id: 1,
      section: "Intro",
      character: "Lead",
      lyrics: ["Line 1"],
      prompt: "Camera pushes in as the lead steps forward and confetti lifts in wind."
    }
  ]
};
```
