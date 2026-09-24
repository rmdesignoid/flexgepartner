"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Mic, Plus, Star, TrendingUp, RotateCcw, Square, X } from "lucide-react";
import { Button } from "../../design-system";
import { INITIAL_STATE, readState, saveState, STORAGE_KEY, hasSubmitted, responseTime, sampleEvaluation, type Attempt, type Practice } from "./types";
import { saveRecording } from "./audio-storage";
import { AudioPlayer, audioTime } from "./AudioPlayer";
import "./ai-conversation.css";
import "./mobile-preview.css";
import "./oral-production-revision.css";

type Screen = "home" | "record" | "feedback";

export default function StudentConversation({ preview = false }: { preview?: boolean }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [screen, setScreen] = useState<Screen>(preview ? "record" : "home");
  const [practiceId, setPracticeId] = useState("practice-restaurant");
  const [studentName, setStudentName] = useState("Anna Johnson");
  const [isPreview, setIsPreview] = useState(preview);
  const [ready, setReady] = useState(false);
  const [completedSubmission, setCompletedSubmission] = useState<Attempt | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requesting = useRef(false);
  const startedAt = useRef(0);
  const [duration, setDuration] = useState(0);
  const chunks = useRef<Blob[]>([]);
  const urlRef = useRef("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [requestingMic, setRequestingMic] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const [reRecorded, setReRecorded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Browser storage is loaded after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    mounted.current = true;
    const params = new URLSearchParams(window.location.search);
    const demo = preview || params.get("preview") === "1";
    setState(readState({ persistMigration: !demo }));
    setIsPreview(demo);
    if (demo) setScreen("record");
    if (params.get("practiceId")) setPracticeId(params.get("practiceId")!);
    if (params.get("student")) setStudentName(params.get("student")!);
    setReady(true);
    const sync = (event: StorageEvent) => { if (!event.key || event.key === STORAGE_KEY) setState(readState({ persistMigration: !demo })); };
    window.addEventListener("storage", sync);
    return () => { mounted.current = false; if (recorderRef.current) recorderRef.current.onstop = null; window.removeEventListener("storage", sync); streamRef.current?.getTracks().forEach((track) => track.stop()); if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, [preview]);

  const practice = state.practices.find((item) => item.id === practiceId);
  const maxSeconds = (practice?.maxResponseTime ?? 2) * 60;
  const minSeconds = (practice?.minResponseTime ?? 1) * 60;
  useEffect(() => {
    if (!recording) return;
    const tick = window.setInterval(() => {
      const seconds = Math.floor((performance.now() - startedAt.current) / 1000);
      setElapsed(Math.min(seconds, maxSeconds));
      if (seconds >= maxSeconds) {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [recording, maxSeconds, isPreview]);

  function reset() {
    setRecordedAudio(null); setElapsed(0); setError("");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = ""; setRecordingUrl(""); setDuration(0);
  }
  function begin(item: Practice) {
    if (item.status !== "Published" || (!isPreview && hasSubmitted(readState(), item.id, studentName))) return;
    reset(); setReRecorded(false); setCompletedSubmission(null); setPracticeId(item.id); setScreen("record");
  }
  async function handleStartRecording() {
    if (requesting.current || recording || !practice || (!isPreview && hasSubmitted(readState(), practice.id, studentName))) return;
    setError("");
    // Event handler only: the compiler incorrectly treats this async callback as render code.
    // eslint-disable-next-line react-hooks/purity
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Audio recording is not supported by this browser."); return; }
    requesting.current = true; setRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop()); streamRef.current = null;
        const recordedSeconds = Math.min(maxSeconds, Math.round((performance.now() - startedAt.current) / 1000));
        setDuration(recordedSeconds);
        if (blob.size && recordedSeconds >= minSeconds) {
          urlRef.current = URL.createObjectURL(blob); setRecordingUrl(urlRef.current); setRecordedAudio(blob);
        } else { setError(`Record at least ${practice.minResponseTime ?? 1} minute(s) before submitting.`); }
        setRecording(false);
      };
      recorder.onerror = () => { stream.getTracks().forEach((track) => track.stop()); setError("Recording failed. Please try again."); setRecording(false); };
      // Timestamp is captured after microphone permission, only in the start handler.
      // eslint-disable-next-line react-hooks/purity
      recorderRef.current = recorder; startedAt.current = performance.now(); setElapsed(0); recorder.start(); setRecording(true);
    } catch { streamRef.current?.getTracks().forEach((track) => track.stop()); setError("Allow microphone access in your browser to record your answer."); }
    finally { requesting.current = false; if (mounted.current) setRequestingMic(false); }
  }
  function stopRecording() {
    if (elapsed >= minSeconds && recorderRef.current?.state === "recording") recorderRef.current.stop();
  }
  async function submit() {
    if (!recordedAudio || saving || !practice) return;
    setSaving(true); setError("");
    try {
      const id = `response-${globalThis.crypto.randomUUID()}`;
      const submission: Attempt = { id, practiceId: practice.id, student: studentName, completedAt: new Date().toISOString(), duration: audioTime(duration), completed: true, transcript: [], reviewStatus: "Pending" };
      if (isPreview) {
        submission.evaluation = INITIAL_STATE.attempts.find((item) => item.practiceId === practice.id)?.evaluation ?? sampleEvaluation();
      } else {
        const current = readState();
        if (hasSubmitted(current, practice.id, studentName)) { setError("You have already submitted this activity."); return; }
        await saveRecording(id, recordedAudio!);
        const latest = readState();
        if (hasSubmitted(latest, practice.id, studentName)) { setError("You have already submitted this activity."); return; }
        submission.audioId = id;
        const next = { ...latest, attempts: [submission, ...latest.attempts] };
        saveState(next); setState(next);
      }
      setCompletedSubmission(submission); setScreen("feedback");
      contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
    } catch { setError("Your recording could not be saved. Please try again."); }
    finally { setSaving(false); }
  }
  function done() { reset(); setReRecorded(false); setCompletedSubmission(null); setScreen(isPreview ? "record" : "home"); }

  if (!ready) return <main className="ai-student-app"><p role="status">Loading activity…</p></main>;
  if (!practice || practice.status !== "Published" || (!isPreview && !practice.students.includes(studentName))) return <main className="ai-student-app"><div className="ai-student-content"><h1>Activity unavailable</h1><p>This activity is not published or has not been assigned to you.</p><Link href="/">Teacher dashboard</Link></div></main>;
  const submitted = hasSubmitted(state, practice.id, studentName);
  const feedback = completedSubmission?.evaluation;
  const available = state.practices.filter((item) => item.status === "Published" && item.students.includes(studentName));
  return <main className={`ai-student-app${isPreview ? " ai-student-app--preview" : ""}`}>
    <header className="ai-student-header"><Link href="/" aria-label="Close activity and return to dashboard"><X size={20} /></Link><span>{practice.title}</span></header>
    <div className="ai-student-content" ref={contentRef}>
      {isPreview ? <p className="op-preview-caption">Try as student <span>Nothing is saved</span></p> : null}
      {screen === "home" ? <><div className="ai-student-welcome"><span className="ai-step-label">HOMEWORKS</span><h1>Your speaking practice</h1><p>Read the instructions, then record your response.</p></div>{available.map((item) => { const response = state.attempts.find((entry) => entry.practiceId === item.id && entry.student === studentName && entry.completed !== false); return <article key={item.id} className="ai-student-activity"><h2>{item.title}</h2><p>{item.activityInstructions || item.goal}</p><p>{item.level} · {responseTime(item)}</p>{response ? <><strong><Check size={15} /> Completed</strong>{response.teacherComment ? <div><h3>Teacher feedback</h3><p>{response.teacherComment}</p></div> : <p>Your teacher will review your response.</p>}</> : <Button onClick={() => begin(item)}>Open activity <ArrowRight size={16} /></Button>}</article>; })}</> : null}
      {screen === "record" ? <div className="ai-student-record op-screen-enter"><span className="ai-step-label">ORAL PRODUCTION · {practice.level}</span><h1>{practice.title}</h1><p>{practice.activityInstructions || practice.goal}</p><p className="op-preview-time"><Clock3 size={16} />Response time: {responseTime(practice)}</p>{practice.imageDataUrl ? <img className="ai-student-record__image" src={practice.imageDataUrl} alt="Visual prompt for this activity" /> : null}
        {recordingUrl ? <AudioPlayer key={recordingUrl} src={recordingUrl} duration={duration} /> : null}
        {error ? <p role="alert" className="ai-student-record__error">{error}</p> : null}
        <div className="ai-student-record__actions">{!isPreview && submitted ? <><p>You have already submitted this activity.</p><Button onClick={done}>Done</Button></> : recordedAudio ? <><Button disabled={saving} onClick={submit}>{saving ? "Saving…" : "Submit recording"}<ArrowRight size={16} /></Button>{!reRecorded ? <><Button variant="secondary" onClick={() => { reset(); setReRecorded(true); }}><RotateCcw size={15} />Record again</Button><small>You can record again only once.</small></> : <small>You have used your re-recording. Submit this response to finish.</small>}</> : <><div className={`op-recorder${recording ? " is-recording" : ""}`}>
          <div className="op-record-orbit"><button className="op-record-button" type="button" aria-label={requestingMic ? "Opening microphone" : recording ? "Stop recording" : "Start recording"} disabled={requestingMic || (recording && elapsed < minSeconds)} onClick={() => { if (recording) stopRecording(); else void handleStartRecording(); }}>{recording ? <Square size={26} fill="currentColor" /> : <Mic size={30} strokeWidth={1.8} />}</button></div>
          <strong>{requestingMic ? "Opening microphone…" : recording ? "Recording your response" : "Ready when you are"}</strong>
          <span className="op-record-timer">{audioTime(elapsed)} <span>/ {audioTime(maxSeconds)}</span></span>
          <span className="ai-student-record__status" role="status">{recording ? elapsed < minSeconds ? `Keep speaking · minimum ${audioTime(minSeconds)}` : "Tap to finish your recording" : "Tap the microphone to start"}</span>
          <div className="op-record-progress" role="progressbar" aria-label="Recording time" aria-valuemin={0} aria-valuemax={maxSeconds} aria-valuenow={elapsed}><span style={{ width: `${elapsed / maxSeconds * 100}%` }} /></div>
        </div></>}</div>
      </div> : null}
      {screen === "feedback" ? <div className="ai-student-feedback op-screen-enter"><span className="ai-feedback-success"><Check size={25} /></span><span className="ai-step-label">PRACTICE COMPLETE</span><h1>Thanks for practicing</h1><p>{isPreview ? "Your practice is complete. Take a moment to review your feedback." : "Your recording has been saved for your teacher to review."}</p>{practice.instantFeedback && feedback ? <><span className="ai-report-simulated">Sample feedback</span><article><span className="ai-feedback-icon"><Mic size={20} /></span><div><h2>Summary</h2><p>{feedback.summary}</p></div></article>{[["How you did", feedback.howYouDid], ["What you did well", feedback.strengths], ["Areas for improvement", feedback.growthAreas]].map(([title, items]) => <article key={title as string}><span className="ai-feedback-icon">{title === "How you did" ? <Star size={20} /> : title === "What you did well" ? <Check size={20} /> : <Plus size={20} />}</span><div><h2>{title as string}</h2><ul>{Array.isArray(items) ? items.map((item) => <li key={item}>{item}</li>) : null}</ul></div></article>)}<article><span className="ai-feedback-icon"><TrendingUp size={20} /></span><div><h2>Growth opportunities</h2><p>{feedback.growthOpportunities}</p></div></article></> : <article><span className="ai-feedback-icon"><Mic size={20} /></span><div><h2>Recording submitted</h2><p>{practice.instantFeedback ? "Your response is ready for teacher review. Automatic feedback is not available for this recording." : "Your teacher will review your response and share feedback."}</p></div></article>}<div className="ai-feedback-completion"><span><Check size={15} />Practice submitted</span><span><Clock3 size={15} />{completedSubmission?.duration}</span></div><Button size="lg" onClick={done}>Done</Button></div> : null}
    </div>
  </main>;
}
