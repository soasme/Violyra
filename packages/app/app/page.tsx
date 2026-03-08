import {
  type AlignedLyricLine,
  type ApproximateLyricSegment,
  loadAssetsSnapshot,
  mediaUrl,
} from "@/lib/assets";

export const dynamic = "force-dynamic";

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatSeconds(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "n/a";
  }

  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  const milliseconds = Math.round((value % 1) * 1000)
    .toString()
    .padStart(3, "0");

  return `${minutes}:${seconds}.${milliseconds}`;
}

function renderLyricRows(lines: AlignedLyricLine[], limit: number) {
  if (lines.length === 0) {
    return <p className="empty">`aligned_lyrics.json` not found.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Line</th>
          <th>Time</th>
          <th>Words</th>
          <th>Text</th>
        </tr>
      </thead>
      <tbody>
        {lines.slice(0, limit).map((line, index) => (
          <tr key={`${line.lineIndex ?? index}-${line.start ?? index}`}>
            <td>{line.lineIndex ?? "-"}</td>
            <td>
              {formatSeconds(line.start)} - {formatSeconds(line.end)}
            </td>
            <td>{line.wordCount}</td>
            <td>{line.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderApproximateRows(segments: ApproximateLyricSegment[], limit: number) {
  if (segments.length === 0) {
    return <p className="empty">`approximate-lyric-segmentation.json` not found.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Start</th>
          <th>End</th>
          <th>Words</th>
          <th>Text</th>
        </tr>
      </thead>
      <tbody>
        {segments.slice(0, limit).map((segment, index) => (
          <tr key={`${segment.start ?? index}-${segment.end ?? index}`}>
            <td>{formatSeconds(segment.start)}</td>
            <td>{formatSeconds(segment.end)}</td>
            <td>{segment.wordCount}</td>
            <td>{segment.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function HomePage() {
  const snapshot = await loadAssetsSnapshot();

  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">Preview Dashboard</p>
        <h1>assets/ content explorer</h1>
        <p>
          Generated at {formatDate(snapshot.generatedAt)}. This view scans the repository&apos;s <code>assets</code>{" "}
          folder and previews storyboards, scene clips, subtitles, lyrics alignment, and soundtrack files.
        </p>

        <div className="summary">
          <article className="metric">
            <p className="metric-label">Files</p>
            <p className="metric-value">{snapshot.totals.files}</p>
          </article>
          <article className="metric">
            <p className="metric-label">Videos</p>
            <p className="metric-value">{snapshot.totals.videos}</p>
          </article>
          <article className="metric">
            <p className="metric-label">Audio</p>
            <p className="metric-value">{snapshot.totals.audios}</p>
          </article>
          <article className="metric">
            <p className="metric-label">Subtitles</p>
            <p className="metric-value">{snapshot.totals.subtitles}</p>
          </article>
          <article className="metric">
            <p className="metric-label">JSON</p>
            <p className="metric-value">{snapshot.totals.json}</p>
          </article>
        </div>
      </header>

      <section className="section-card">
        <div className="section-head">
          <h2>Soundtrack</h2>
          <span className="small">{snapshot.audioFiles.length} file(s)</span>
        </div>

        {snapshot.audioFiles.length === 0 ? (
          <p className="empty">No audio track found in `assets/`.</p>
        ) : (
          <div className="audio-grid">
            {snapshot.audioFiles.map((file) => (
              <article className="media-card" key={file.relativePath}>
                <audio controls preload="metadata" src={mediaUrl(file.relativePath)} />
                <div className="media-meta">
                  <span>{file.relativePath}</span>
                  <span>{formatBytes(file.sizeBytes)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Storyboards</h2>
          <span className="small">{snapshot.storyboardDocs.length} file(s)</span>
        </div>

        {snapshot.storyboardDocs.length === 0 ? (
          <p className="empty">No storyboard JSON files found.</p>
        ) : (
          snapshot.storyboardDocs.map((doc) => (
            <article className="storyboard-card" key={doc.relativePath}>
              <h3 className="storyboard-title">{doc.fileName}</h3>

              <div className="pill-row">
                <span className="pill">song: {doc.songTitle ?? "n/a"}</span>
                <span className="pill">model: {doc.model ?? "n/a"}</span>
                <span className="pill">scenes: {doc.sceneCount}</span>
                <span className="pill">generated: {formatDate(doc.generatedAt)}</span>
                <span className="pill">scenes_dir: {doc.scenesDir ?? "n/a"}</span>
              </div>

              {doc.parseError ? <p className="empty">{doc.parseError}</p> : null}

              {doc.scenes.length > 0 ? (
                <div className="scene-grid">
                  {doc.scenes.map((scene, index) => (
                    <article className="scene-item" key={`${doc.fileName}-${scene.sceneId ?? index}`}>
                      <strong>
                        Scene {scene.sceneId ?? "?"}
                        {scene.section ? ` · ${scene.section}` : ""}
                      </strong>
                      <p>
                        Character: {scene.character ?? "n/a"}
                        <br />
                        Duration: {scene.duration ?? "n/a"}s
                        <br />
                        Lyrics: {scene.lyrics.join(" ") || "n/a"}
                        <br />
                        Video file: {scene.videoFile ? scene.videoFile.replace(/^assets\//, "") : "n/a"}
                      </p>
                      {scene.prompt ? (
                        <details>
                          <summary>Prompt</summary>
                          <p>{scene.prompt}</p>
                        </details>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty">No scene objects in this file.</p>
              )}
            </article>
          ))
        )}
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Scene Videos</h2>
          <span className="small">{snapshot.totals.videos} clips</span>
        </div>

        {snapshot.videoCollections.length === 0 ? (
          <p className="empty">No video files found.</p>
        ) : (
          snapshot.videoCollections.map((collection) => (
            <details
              className="collection"
              key={collection.relativePath || "assets-root"}
              open={collection.name.startsWith("scenes")}
            >
              <summary>
                {collection.relativePath || "assets root"} ({collection.videos.length})
              </summary>
              <div className="video-grid">
                {collection.videos.map((video) => (
                  <article className="media-card" key={video.relativePath}>
                    <video controls preload="metadata" src={mediaUrl(video.relativePath)} />
                    <div className="media-meta">
                      <span>{video.relativePath}</span>
                      <span>scene: {video.sceneId ?? "n/a"}</span>
                      <span>{formatBytes(video.sizeBytes)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))
        )}
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Subtitles</h2>
          <span className="small">SRT + LRC</span>
        </div>

        <div className="subtitle-columns">
          <article className="subtitle-pane">
            <h3>SRT ({snapshot.subtitleSrt.cues.length})</h3>
            {snapshot.subtitleSrt.cues.length === 0 ? (
              <p className="empty">`subtitle.srt` not found.</p>
            ) : (
              <div className="subtitle-list">
                {snapshot.subtitleSrt.cues.map((cue) => (
                  <div className="subtitle-item" key={`${cue.index}-${cue.start}`}> 
                    <p className="subtitle-time">
                      #{cue.index} · {cue.start} → {cue.end}
                    </p>
                    <p className="subtitle-text">{cue.text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="subtitle-pane">
            <h3>LRC ({snapshot.subtitleLrc.cues.length})</h3>
            {snapshot.subtitleLrc.cues.length === 0 ? (
              <p className="empty">`subtitle.lrc` not found.</p>
            ) : (
              <div className="subtitle-list">
                {snapshot.subtitleLrc.cues.map((cue) => (
                  <div className="subtitle-item" key={`${cue.line}-${cue.seconds}`}> 
                    <p className="subtitle-time">
                      line {cue.line} · {cue.timestamp}
                    </p>
                    <p className="subtitle-text">{cue.text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Lyrics Alignment</h2>
          <span className="small">
            aligned: {snapshot.alignedLyrics.length}, approximate: {snapshot.approximateSegments.length}
          </span>
        </div>

        <div className="subtitle-columns">
          <article className="subtitle-pane">
            <h3>aligned_lyrics.json (top 12)</h3>
            {renderLyricRows(snapshot.alignedLyrics, 12)}
          </article>

          <article className="subtitle-pane">
            <h3>approximate-lyric-segmentation.json (top 8)</h3>
            {renderApproximateRows(snapshot.approximateSegments, 8)}
          </article>
        </div>

        <div className="section-head" style={{ marginTop: 14 }}>
          <h2>lyrics.txt</h2>
          <span className="small">{snapshot.lyricsText.length} lines</span>
        </div>

        {snapshot.lyricsText.length === 0 ? (
          <p className="empty">`lyrics.txt` not found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.lyricsText.map((line, index) => (
                <tr key={`${index + 1}-${line}`}>
                  <td>{index + 1}</td>
                  <td>{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
