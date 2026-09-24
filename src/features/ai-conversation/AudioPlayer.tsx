"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { readRecording } from "./audio-storage";

export const audioTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function SavedRecording({ audioId, audioUrl, duration = 0 }: { audioId?: string; audioUrl?: string; duration?: number }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState(audioId ? "Loading recording…" : "No audio recording is available for this sample.");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    if (!audioId) return;
    readRecording(audioId).then((blob) => {
      if (!active) return;
      if (!blob) { setMessage("This recording is not available on this device."); return; }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => { if (active) setMessage("Could not open this recording."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [audioId]);
  return (url || (!audioId && audioUrl)) ? <AudioPlayer src={url || audioUrl!} duration={duration} /> : <p role="status">{message}</p>;
}

export function AudioPlayer({ src, duration = 0 }: { src: string; duration?: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(duration);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  return <div className="op-audio">
    {/* The activity requires audio-only playback; no transcript is generated. */}
    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
    <audio ref={ref} src={src} preload="metadata" onLoadedMetadata={() => { if (Number.isFinite(ref.current?.duration)) setLength(ref.current!.duration); }} onDurationChange={() => { if (Number.isFinite(ref.current?.duration)) setLength(ref.current!.duration); }} onTimeUpdate={() => setPosition(ref.current?.currentTime ?? 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError("Audio could not be loaded.")} />
    <button type="button" aria-label={playing ? "Pause recording" : "Play recording"} onClick={() => { if (playing) ref.current?.pause(); else void ref.current?.play().catch(() => setError("Audio could not be played.")); }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
    <span>{audioTime(position)} / {audioTime(length)}</span>
    <button type="button" aria-label={`Playback speed ${speed}x`} onClick={() => { const rates = [1, 1.5, 2, 0.5]; const next = rates[(rates.indexOf(speed) + 1) % rates.length]; setSpeed(next); if (ref.current) ref.current.playbackRate = next; }}>{speed}x</button>
    <input aria-label="Recording position" type="range" min={0} max={length || 1} step="0.1" value={Math.min(position, length || 1)} disabled={!length} onChange={(event) => { if (ref.current) ref.current.currentTime = Number(event.target.value); setPosition(Number(event.target.value)); }} />
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
