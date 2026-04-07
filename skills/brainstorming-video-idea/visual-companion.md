# Visual Companion — Video Brainstorming

A browser-based companion for showing visual options during video idea brainstorming. Available as a tool — not required for every question.

## Offering the Companion

When you anticipate questions that will involve visual comparisons, offer it once:

> "Some of what we're deciding might be easier to show than describe — visual style comparisons, character sheet options, color palettes, or sample beat-to-scene layouts. I can put together browser mockups as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)"

This offer is its own message. Do not combine it with a clarifying question.

## Starting the Server

```bash
bash skills/brainstorming-video-idea/scripts/start-server.sh --project-dir {project_dir}
```

Open the URL printed by the server in a browser. Leave it open.

## When to Use the Browser

Use the browser when the user would understand the option **better by seeing it** than by reading a description.

**Use the browser for:**
- Comparing 2–3 visual styles side-by-side (anime vs. cinematic vs. lo-fi illustration)
- Showing character sheet options (multiple trait combinations for a named character)
- Comparing color palettes
- Showing a beat-to-scene strip (song sections mapped to proposed scene thumbnails)
- Comparing candidate reference frames extracted from prior art
- Previewing thumbnail composition directions

**Use the terminal for:**
- Conceptual questions (what does "high retention" mean for this audience?)
- A/B/C/D text options (which scene pacing model?)
- Scope and platform decisions
- Any question where a list of words answers it just as well as an image

A question about a visual topic is not automatically a visual question. Use judgment.

## Writing Screens

Push a screen by writing an HTML file to the server's content directory (printed in the `screen_dir` field of the server-started JSON).

### Image Board (visual style comparison)

```html
<div class="section">
  <h2>Visual Style Options</h2>
  <p class="subtitle">Click a style to select it, then return to the terminal.</p>
  <div class="cards" data-multiselect>
    <div class="card" data-choice="anime" onclick="toggleSelect(this)">
      <div class="card-image" style="background: linear-gradient(135deg, #ff6b9d, #c44dff);">
        <span style="color:white;font-size:2rem;">🌸</span>
      </div>
      <div class="card-body">
        <h3>Anime</h3>
        <p>High-contrast linework, expressive characters, cel-shaded palette</p>
      </div>
    </div>
    <div class="card" data-choice="cinematic" onclick="toggleSelect(this)">
      <div class="card-image" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
        <span style="color:#e0c97f;font-size:2rem;">🎬</span>
      </div>
      <div class="card-body">
        <h3>Cinematic</h3>
        <p>Anamorphic lens flares, film grain, desaturated teal-and-orange grade</p>
      </div>
    </div>
    <div class="card" data-choice="lofi" onclick="toggleSelect(this)">
      <div class="card-image" style="background: linear-gradient(135deg, #ffeaa7, #dfe6e9);">
        <span style="color:#636e72;font-size:2rem;">☕</span>
      </div>
      <div class="card-body">
        <h3>Lo-Fi Illustration</h3>
        <p>Soft watercolor textures, warm neutrals, cozy interior staging</p>
      </div>
    </div>
  </div>
</div>
```

### Frame Gallery (beat-to-scene strip)

```html
<div class="section">
  <h2>Scene Progression Strip</h2>
  <p class="subtitle">Proposed scene-to-section mapping. Click any scene to flag it.</p>
  <div class="cards">
    <div class="card" data-choice="scene-1" data-scene_id="1" onclick="toggleSelect(this)">
      <div class="card-image" style="background:#2d3436; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1rem;">
        <span style="color:#636e72;font-size:0.7rem;text-transform:uppercase;letter-spacing:.1em;">Intro</span>
        <span style="color:white;font-size:0.9rem;margin-top:.5rem;text-align:center;">Wide establishing shot of the farm at dawn</span>
      </div>
      <div class="card-body">
        <h3>Scene 1</h3>
        <p>"Morning light, golden hour, no characters yet"</p>
      </div>
    </div>
  </div>
</div>
```

### Character Sheet (trait comparison)

```html
<div class="section">
  <h2>Character Options: Coofy</h2>
  <p class="subtitle">Select the visual direction for this character.</p>
  <div class="options">
    <div class="option" data-choice="coofy-a" data-character_id="coofy" onclick="toggleSelect(this)">
      <div class="letter">A</div>
      <div class="content">
        <h3>Coofy — Farm Style</h3>
        <p>Blue overalls, straw hat, round eyes, chubby limbs. Warm palette, very readable at small sizes.</p>
      </div>
    </div>
    <div class="option" data-choice="coofy-b" data-character_id="coofy" onclick="toggleSelect(this)">
      <div class="letter">B</div>
      <div class="content">
        <h3>Coofy — Adventure Style</h3>
        <p>Leather jacket, goggles, leaner silhouette. Higher energy, better for action scenes.</p>
      </div>
    </div>
  </div>
</div>
```

## Reading Selections

After the user clicks and returns to the terminal, read the events file:

```bash
cat {session_dir}/state/events
```

Each line is a JSON object: `{ "type": "click", "choice": "anime", "character_id": "coofy", ... }`

## Stopping the Server

```bash
bash skills/brainstorming-video-idea/scripts/stop-server.sh {session_dir}
```

## Optional — Per Question

Even after the user accepts the companion, decide per question whether to use the browser. The test: would seeing it help more than reading it? If not, use the terminal.
