import {
  type AlignedLyricLine,
  type ApproximateLyricSegment,
  loadAssetsSnapshot,
  mediaUrl,
} from "@/lib/assets";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = sizeBytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(1)} ${units[i]}`;
}

function formatDate(value: string | null): string {
  if (!value) return "n/a";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function formatSeconds(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "n/a";
  const m = Math.floor(value / 60).toString().padStart(2, "0");
  const s = Math.floor(value % 60).toString().padStart(2, "0");
  const ms = Math.round((value % 1) * 1000).toString().padStart(3, "0");
  return `${m}:${s}.${ms}`;
}

function LyricTable({ lines, limit }: { lines: AlignedLyricLine[]; limit: number }) {
  if (lines.length === 0) return <p className="text-sm text-muted-foreground">aligned_lyrics.json not found.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Line</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Words</TableHead>
          <TableHead>Text</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.slice(0, limit).map((line, i) => (
          <TableRow key={`${line.lineIndex ?? i}-${line.start ?? i}`}>
            <TableCell className="font-mono text-xs text-muted-foreground">{line.lineIndex ?? "-"}</TableCell>
            <TableCell className="font-mono text-xs whitespace-nowrap">{formatSeconds(line.start)} – {formatSeconds(line.end)}</TableCell>
            <TableCell>{line.wordCount}</TableCell>
            <TableCell>{line.text}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ApproxTable({ segments, limit }: { segments: ApproximateLyricSegment[]; limit: number }) {
  if (segments.length === 0) return <p className="text-sm text-muted-foreground">approximate-lyric-segmentation.json not found.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead>Words</TableHead>
          <TableHead>Text</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {segments.slice(0, limit).map((seg, i) => (
          <TableRow key={`${seg.start ?? i}-${seg.end ?? i}`}>
            <TableCell className="font-mono text-xs">{formatSeconds(seg.start)}</TableCell>
            <TableCell className="font-mono text-xs">{formatSeconds(seg.end)}</TableCell>
            <TableCell>{seg.wordCount}</TableCell>
            <TableCell>{seg.text}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function HomePage() {
  const snapshot = await loadAssetsSnapshot();

  return (
    <>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-6 px-4">
          <span className="text-sm font-semibold tracking-tight">Vima</span>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex gap-1 text-sm text-muted-foreground">
            {["soundtrack", "storyboards", "videos", "subtitles", "lyrics"].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded px-2 py-1 capitalize hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {id}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">assets/ content explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generated at {formatDate(snapshot.generatedAt)}. Scans{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">assets/</code> and
            previews storyboards, scene clips, subtitles, lyrics, and soundtrack.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {[
              ["Files", snapshot.totals.files],
              ["Videos", snapshot.totals.videos],
              ["Audio", snapshot.totals.audios],
              ["Subtitles", snapshot.totals.subtitles],
              ["JSON", snapshot.totals.json],
            ].map(([label, value]) => (
              <Card key={label as string} className="w-28">
                <CardContent className="pt-4 pb-3 px-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="mt-0.5 text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Soundtrack */}
        <Card id="soundtrack" className="scroll-mt-14">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Soundtrack</CardTitle>
              <Badge variant="secondary">{snapshot.audioFiles.length} file(s)</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {snapshot.audioFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audio track found in <code className="rounded bg-muted px-1 font-mono text-xs">assets/</code>.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {snapshot.audioFiles.map((file) => (
                  <div key={file.relativePath} className="rounded-lg border p-3 space-y-2">
                    <audio controls preload="metadata" src={mediaUrl(file.relativePath)} className="w-full" />
                    <div className="space-y-0.5">
                      <p className="truncate font-mono text-xs font-medium">{file.relativePath}</p>
                      <p className="font-mono text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storyboards */}
        <Card id="storyboards" className="scroll-mt-14">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Storyboards</CardTitle>
              <Badge variant="secondary">{snapshot.storyboardDocs.length} file(s)</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.storyboardDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No storyboard JSON files found.</p>
            ) : (
              snapshot.storyboardDocs.map((doc) => (
                <div key={doc.relativePath} className="rounded-lg border p-4 space-y-3">
                  <p className="font-mono text-sm font-semibold">{doc.fileName}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ["song", doc.songTitle],
                      ["model", doc.model],
                      ["scenes", doc.sceneCount],
                      ["generated", formatDate(doc.generatedAt)],
                      ["scenes_dir", doc.scenesDir],
                    ].map(([k, v]) => (
                      <Badge key={k as string} variant="outline" className="font-mono text-xs">
                        {k}: {v ?? "n/a"}
                      </Badge>
                    ))}
                  </div>

                  {doc.parseError && (
                    <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">{doc.parseError}</p>
                  )}

                  {doc.scenes.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {doc.scenes.map((scene, i) => (
                        <div key={`${doc.fileName}-${scene.sceneId ?? i}`} className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
                          <p className="font-semibold text-xs">
                            Scene {scene.sceneId ?? "?"}
                            {scene.section && <span className="font-normal text-muted-foreground"> · {scene.section}</span>}
                          </p>
                          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-mono text-xs">
                            <dt className="text-muted-foreground">character</dt>
                            <dd className="truncate">{scene.character ?? "n/a"}</dd>
                            <dt className="text-muted-foreground">duration</dt>
                            <dd>{scene.duration != null ? `${scene.duration}s` : "n/a"}</dd>
                            <dt className="text-muted-foreground">lyrics</dt>
                            <dd className="truncate">{scene.lyrics.join(" ") || "n/a"}</dd>
                            <dt className="text-muted-foreground">video</dt>
                            <dd className="truncate">{scene.videoFile ? scene.videoFile.replace(/^assets\//, "") : "n/a"}</dd>
                          </dl>
                          {scene.prompt && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Prompt</summary>
                              <p className="mt-1 text-foreground leading-relaxed">{scene.prompt}</p>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No scene objects in this file.</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Scene Videos */}
        <Card id="videos" className="scroll-mt-14">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Scene Videos</CardTitle>
              <Badge variant="secondary">{snapshot.totals.videos} clips</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {snapshot.videoCollections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No video files found.</p>
            ) : (
              snapshot.videoCollections.map((col) => (
                <details
                  key={col.relativePath || "assets-root"}
                  className="rounded-lg border"
                  open={col.name.startsWith("scenes")}
                >
                  <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors">
                    <span className="font-mono text-sm">{col.relativePath || "assets root"}</span>
                    <Badge variant="outline" className="font-mono text-xs">{col.videos.length}</Badge>
                  </summary>
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {col.videos.map((video) => (
                      <div key={video.relativePath} className="rounded-lg border bg-muted/20 p-2 space-y-2">
                        <video controls preload="metadata" src={mediaUrl(video.relativePath)} className="w-full rounded" />
                        <div className="space-y-0.5">
                          <p className="truncate font-mono text-xs font-medium">{video.relativePath}</p>
                          <p className="font-mono text-xs text-muted-foreground">scene {video.sceneId ?? "n/a"} · {formatBytes(video.sizeBytes)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))
            )}
          </CardContent>
        </Card>

        {/* Subtitles */}
        <Card id="subtitles" className="scroll-mt-14">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subtitles</CardTitle>
              <Badge variant="secondary">SRT + LRC</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* SRT */}
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">SRT</p>
                  <Badge variant="secondary" className="font-mono text-xs">{snapshot.subtitleSrt.cues.length}</Badge>
                </div>
                {snapshot.subtitleSrt.cues.length === 0 ? (
                  <p className="text-xs text-muted-foreground">subtitle.srt not found.</p>
                ) : (
                  <div className="max-h-72 overflow-auto space-y-2">
                    {snapshot.subtitleSrt.cues.map((cue) => (
                      <div key={`${cue.index}-${cue.start}`} className="border-b pb-2 last:border-0 last:pb-0">
                        <p className="font-mono text-xs text-muted-foreground">#{cue.index} · {cue.start} → {cue.end}</p>
                        <p className="text-sm">{cue.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LRC */}
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">LRC</p>
                  <Badge variant="secondary" className="font-mono text-xs">{snapshot.subtitleLrc.cues.length}</Badge>
                </div>
                {snapshot.subtitleLrc.cues.length === 0 ? (
                  <p className="text-xs text-muted-foreground">subtitle.lrc not found.</p>
                ) : (
                  <div className="max-h-72 overflow-auto space-y-2">
                    {snapshot.subtitleLrc.cues.map((cue) => (
                      <div key={`${cue.line}-${cue.seconds}`} className="border-b pb-2 last:border-0 last:pb-0">
                        <p className="font-mono text-xs text-muted-foreground">line {cue.line} · {cue.timestamp}</p>
                        <p className="text-sm">{cue.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lyrics Alignment */}
        <Card id="lyrics" className="scroll-mt-14">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lyrics Alignment</CardTitle>
              <span className="font-mono text-xs text-muted-foreground">
                aligned: {snapshot.alignedLyrics.length} · approx: {snapshot.approximateSegments.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">aligned_lyrics.json <span className="text-muted-foreground font-normal">(top 12)</span></p>
                <LyricTable lines={snapshot.alignedLyrics} limit={12} />
              </div>
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">approximate-lyric-segmentation.json <span className="text-muted-foreground font-normal">(top 8)</span></p>
                <ApproxTable segments={snapshot.approximateSegments} limit={8} />
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">lyrics.txt</p>
                <Badge variant="secondary" className="font-mono text-xs">{snapshot.lyricsText.length} lines</Badge>
              </div>
              {snapshot.lyricsText.length === 0 ? (
                <p className="text-sm text-muted-foreground">lyrics.txt not found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Line</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.lyricsText.map((line, i) => (
                      <TableRow key={`${i + 1}-${line}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>{line}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
