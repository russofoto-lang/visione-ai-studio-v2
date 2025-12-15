import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Camera,
  Upload,
  Loader2,
  Aperture,
  GraduationCap,
  AlertCircle,
  Layers,
  FileImage,
  Landmark,
  Minus,
  Plus,
  Download,
  Sliders,
  HelpCircle,
  Heart,
  Sparkles,
  Brain,
} from "lucide-react";

/* ===================== PROMPT ===================== */

const CRITIC_SYSTEM_PROMPT = `Sei un Critico d'Arte Fotografica di altissimo livello...`;
const CURATOR_SYSTEM_PROMPT = `Sei un Direttore di Gallerie d'Arte...`;
const EDITING_SYSTEM_PROMPT = `Sei un Master Retoucher...`;
const EMOTIONAL_SYSTEM_PROMPT = `Sei un Poeta Visivo...`;

/* ===================== UTILS ===================== */

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result || "");
      resolve(res.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ===================== TOOLTIP ===================== */

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
      {show && (
        <div className="absolute bottom-full mb-2 w-48 p-2 bg-gray-800 text-xs text-gray-200 rounded-lg">
          {text}
        </div>
      )}
    </div>
  );
};

/* ===================== APP ===================== */

const App = () => {
  const [mode, setMode] = useState<"single" | "project" | "curator" | "editing">("single");
  const [style, setStyle] = useState<"technical" | "emotional">("technical");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionCount, setSelectionCount] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setImages([]);
    setPreviewUrls([]);
    setAnalysis(null);
    setError(null);
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    setAnalysis(null);
  };

  const analyzePhoto = async () => {
    if (!images.length) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      let finalPrompt = "";
      const emo = style === "emotional";

      if (mode === "single")
        finalPrompt = emo
          ? EMOTIONAL_SYSTEM_PROMPT
          : CRITIC_SYSTEM_PROMPT;

      if (mode === "project")
        finalPrompt = emo
          ? EMOTIONAL_SYSTEM_PROMPT
          : CRITIC_SYSTEM_PROMPT;

      if (mode === "curator")
        finalPrompt = CURATOR_SYSTEM_PROMPT.replace(
          /{N}/g,
          selectionCount.toString()
        );

      if (mode === "editing")
        finalPrompt = EDITING_SYSTEM_PROMPT;

      const imageBase64 = await fileToBase64(images[0]);

      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageBase64,
        }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Errore API");

      setAnalysis(data.result || "Nessuna analisi generata.");
    } catch (err: any) {
      setError("Errore durante l'analisi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Visione <span className="text-indigo-400">AI</span>
        </h1>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-80 border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer"
          >
            {previewUrls[0] ? (
              <img src={previewUrls[0]} className="max-h-full" />
            ) : (
              <Upload className="w-10 h-10 text-gray-500" />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={analyzePhoto}
            disabled={loading}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Analizza"}
          </button>

          {error && (
            <div className="mt-4 text-red-400 flex items-center gap-2">
              <AlertCircle /> {error}
            </div>
          )}
        </div>

        <div>
          {analysis && (
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Brain /> Risultato
              </h2>
              <pre className="whitespace-pre-wrap text-gray-300">
                {analysis}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
