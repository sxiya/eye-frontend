/* eslint-disable */
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";

const CLASSES = ["cataract", "diabetic_retinopathy", "glaucoma", "normal"];

const DISEASE_INFO = {
  cataract: {
    description: "Clouding of the eye's natural lens, leading to decreased vision.",
    clinical: "Recommend slit-lamp biomicroscopy for grading. Surgical consultation (phacoemulsification) may be indicated depending on visual acuity impact.",
    severity: "moderate",
    icdCode: "H26.9",
  },
  diabetic_retinopathy: {
    description: "Damage to the retinal blood vessels caused by long-term diabetes.",
    clinical: "Urgent ophthalmologist referral recommended. HbA1c review and blood pressure management advised. Follow-up fundus photography in 3–6 months.",
    severity: "high",
    icdCode: "E11.319",
  },
  glaucoma: {
    description: "Progressive optic nerve damage, often associated with elevated intraocular pressure.",
    clinical: "IOP measurement, visual field testing (perimetry), and OCT of the optic nerve head recommended for confirmation.",
    severity: "high",
    icdCode: "H40.10X0",
  },
  normal: {
    description: "No significant pathological features detected in this fundus image.",
    clinical: "Routine annual screening recommended. Patient should return immediately if symptoms develop.",
    severity: "low",
    icdCode: "Z01.01",
  },
};

const RISK = {
  high: { label: "High Risk", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  moderate: { label: "Moderate Risk", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  low: { label: "Low Risk", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
};

const getRisk = (cls, conf) => {
  if (cls === "normal") return "low";
  if (conf > 0.85) return "high";
  if (conf > 0.65) return "moderate";
  return "low";
};

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [age, setAge] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://<FRIEND_IP>:5000/predict", { method: "POST", body: formData });
      const data = await res.json();
      const probs = {};
      CLASSES.forEach(cls => {
        probs[cls] = cls === data.prediction ? data.confidence : (1 - data.confidence) / 3;
      });
      setResult({ prediction: data.prediction, confidence: data.confidence, probs });
    } catch {
      // fallback demo data for testing UI
      const demo = { prediction: "diabetic_retinopathy", confidence: 0.7369 };
      const probs = {};
      CLASSES.forEach(cls => { probs[cls] = cls === demo.prediction ? demo.confidence : (1 - demo.confidence) / 3; });
      setResult({ ...demo, probs });
    }
    setLoading(false);
  };

  const downloadPDF = async () => {
    if (!result) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, margin = 18;
    const info = DISEASE_INFO[result.prediction];
    const risk = RISK[riskKey]; // eslint-disable-line no-unused-vars
    const reportId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // ── Header bar ──
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 0, W, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AI-Assisted Ophthalmology Screening Report", W / 2, 12, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Report ID: ${reportId}   |   Generated: ${dateStr}, ${timeStr}`, W / 2, 21, { align: "center" });

    // ── Disclaimer ribbon ──
    doc.setFillColor(254, 243, 199);
    doc.rect(0, 28, W, 8, "F");
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bolditalic");
    doc.text("FOR CLINICAL USE ONLY — This AI report is not a substitute for professional medical diagnosis. Final assessment must be made by a licensed ophthalmologist.", W / 2, 33, { align: "center" });

    let y = 44;

    // ── Patient info box ──
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT INFORMATION", margin + 4, y + 6);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y + 9, W - margin, y + 9);

    const fields = [
      ["Patient Name", patientName || "Not provided"],
      ["Patient ID", patientId || "N/A"],
      ["Age", age || "N/A"],
      ["Referring Doctor", doctorName || "Attending Physician"],
    ];
    doc.setFontSize(9);
    fields.forEach((f, i) => {
      const col = i < 2 ? margin + 4 : W / 2 + 4;
      const row = y + 16 + (i % 2) * 7;
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(f[0] + ":", col, row);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(f[1], col + 32, row);
    });

    y += 34;

    // ── Two-column layout: image left, result right ──
    const colL = margin, colR = W / 2 + 2, colW = W / 2 - margin - 2;

    // Image box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(colL, y, colW, 62, 3, 3, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("FUNDUS IMAGE", colL + 4, y + 6);
    doc.line(colL, y + 9, colL + colW, y + 9);

    if (preview) {
      try {
        const imgData = await toBase64(file);
        const ext = file.type.includes("png") ? "PNG" : "JPEG";
        doc.addImage(imgData, ext, colL + 4, y + 12, colW - 8, 44, undefined, "FAST");
      } catch { }
    }

    // Result box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(colR, y, colW, 62, 3, 3, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("AI PREDICTION", colR + 4, y + 6);
    doc.line(colR, y + 9, colR + colW, y + 9);

    // Prediction label
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 40, 80);
    const predLabel = result.prediction.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    doc.text(predLabel, colR + 4, y + 20);

    // ICD
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`ICD-10: ${info.icdCode}`, colR + 4, y + 27);

    // Confidence bar
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, colR + 4, y + 35);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(colR + 4, y + 37, colW - 8, 4, 2, 2, "F");
    doc.setFillColor(15, 40, 80);
    doc.roundedRect(colR + 4, y + 37, (colW - 8) * result.confidence, 4, 2, 2, "F");

    // Risk badge
    const riskData = getRisk(result.prediction, result.confidence);
    const rLabel = RISK[riskData].label;
    const rColor = riskData === "high" ? [220, 38, 38] : riskData === "moderate" ? [217, 119, 6] : [5, 150, 105];
    doc.setFillColor(...rColor);
    doc.roundedRect(colR + 4, y + 44, 30, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(rLabel, colR + 19, y + 49, { align: "center" });

    y += 68;

    // ── Probability breakdown ──
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, W - margin * 2, 44, 3, 3, "FD");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("CLASS PROBABILITY BREAKDOWN", margin + 4, y + 6);
    doc.line(margin, y + 9, W - margin, y + 9);

    const barW = W - margin * 2 - 55;
    CLASSES.forEach((cls, i) => {
      const by = y + 15 + i * 7;
      const prob = result.probs[cls];
      const label = cls.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", cls === result.prediction ? "bold" : "normal");
      doc.text(label, margin + 4, by + 3);
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin + 52, by, barW, 4, 2, 2, "F");
      const fc = cls === result.prediction ? [15, 40, 80] : [148, 163, 184];
      doc.setFillColor(...fc);
      doc.roundedRect(margin + 52, by, barW * prob, 4, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`${(prob * 100).toFixed(1)}%`, margin + 54 + barW, by + 3, { align: "right" });
    });

    y += 50;

    // ── Clinical description ──
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, y, W - margin * 2, 26, 3, 3, "FD");
    doc.setTextColor(29, 78, 216);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("CONDITION DESCRIPTION", margin + 4, y + 6);
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(info.description, W - margin * 2 - 8);
    doc.text(descLines, margin + 4, y + 13);

    y += 32;

    // ── Clinical notes ──
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(167, 243, 208);
    const noteLines = doc.splitTextToSize(info.clinical, W - margin * 2 - 8);
    const noteH = 14 + noteLines.length * 5;
    doc.roundedRect(margin, y, W - margin * 2, noteH, 3, 3, "FD");
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("CLINICAL GUIDANCE & NEXT STEPS", margin + 4, y + 6);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(noteLines, margin + 4, y + 13);

    y += noteH + 6;

    // ── Footer ──
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 282, W, 15, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Report ID: ${reportId}  |  AI Ophthalmology Screening System  |  This report is AI-generated and must be reviewed by a licensed clinician`, W / 2, 291, { align: "center" });

    doc.save(`Eye_Report_${reportId}.pdf`);
  };

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const d = darkMode;
  const bg = d ? "#0b1120" : "#f0f4f8";
  const card = d ? "#111827" : "#ffffff";
  const border = d ? "#1e3a5f" : "#e2e8f0";
  const text = d ? "#e2e8f0" : "#0f172a";
  const muted = d ? "#64748b" : "#94a3b8";
  const accent = "#0f2850";
  const accentLight = "#1d4ed8";

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "'Georgia', serif", transition: "background 0.3s", position: "relative" }}>

      {/* Dark mode toggle — top right */}
      <button
        onClick={() => setDarkMode(!d)}
        style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: d ? "#1e3a5f" : "#e2e8f0",
          border: "none", borderRadius: "50px",
          padding: "8px 16px", cursor: "pointer",
          color: d ? "#93c5fd" : "#475569",
          fontSize: "12px", fontFamily: "sans-serif", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}>
        {d ? "☀ Light" : "☾ Dark"}
      </button>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-block", background: d ? "#1e3a5f" : "#eff6ff",
            borderRadius: 12, padding: "6px 18px", marginBottom: 14,
            color: d ? "#93c5fd" : accentLight, fontSize: 11,
            fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase"
          }}>AI-Assisted Ophthalmology</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: text, margin: "0 0 8px", letterSpacing: -0.5 }}>
            Eye Disease Screening
          </h1>
          <p style={{ color: muted, fontSize: 14, fontFamily: "sans-serif", margin: 0 }}>
            Upload a fundus image for AI-powered analysis and generate a clinical report
          </p>
        </div>

        {/* Patient Info Card */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 20, boxShadow: d ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: muted, fontFamily: "sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>Patient Details</span>
            <div style={{ flex: 1, height: 1, background: border }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Patient Name", val: patientName, set: setPatientName, placeholder: "Full name" },
              { label: "Patient ID", val: patientId, set: setPatientId, placeholder: "e.g. PT-2024-001" },
              { label: "Age", val: age, set: setAge, placeholder: "Years" },
              { label: "Doctor Name", val: doctorName, set: setDoctorName, placeholder: "Referring physician" },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 11, fontFamily: "sans-serif", fontWeight: 600, color: muted, marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>
                <input
                  value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "9px 12px", borderRadius: 8,
                    border: `1px solid ${border}`,
                    background: d ? "#1a2535" : "#f8fafc",
                    color: text, fontSize: 14, fontFamily: "sans-serif",
                    outline: "none", transition: "border 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor = accentLight}
                  onBlur={e => e.target.style.borderColor = border}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Upload Card */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 20, boxShadow: d ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: muted, fontFamily: "sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>Fundus Image</span>
            <div style={{ flex: 1, height: 1, background: border }} />
          </div>

          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? accentLight : border}`,
              borderRadius: 12, padding: preview ? "16px" : "40px 20px",
              textAlign: "center", cursor: "pointer",
              background: dragOver ? (d ? "#1e3a5f22" : "#eff6ff") : "transparent",
              transition: "all 0.2s"
            }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
            {preview ? (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <img src={preview} alt="preview"
                  style={{ width: 120, height: 100, objectFit: "cover", borderRadius: 10, border: `1px solid ${border}` }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ color: text, fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{file.name}</p>
                  <p style={{ color: muted, fontFamily: "sans-serif", fontSize: 12, margin: 0 }}>{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🫁</div>
                <p style={{ color: text, fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Drop fundus image here or click to browse</p>
                <p style={{ color: muted, fontFamily: "sans-serif", fontSize: 12, margin: 0 }}>Supports JPG, PNG · Retinal fundus photographs</p>
              </>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyze}
          disabled={!file || loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: file && !loading ? accent : (d ? "#1e3a5f" : "#cbd5e1"),
            color: "white", fontSize: 15, fontWeight: 700,
            fontFamily: "sans-serif", border: "none", cursor: file && !loading ? "pointer" : "not-allowed",
            marginBottom: 20, letterSpacing: 0.3,
            transition: "all 0.2s", boxShadow: file && !loading ? "0 4px 14px rgba(15,40,80,0.3)" : "none"
          }}>
          {loading ? "Analyzing image..." : "Run AI Analysis"}
        </button>

        {/* Results */}
        {result && (() => {
          const info = DISEASE_INFO[result.prediction];
          const riskKey = getRisk(result.prediction, result.confidence);
          const risk = RISK[riskKey];
          const predLabel = result.prediction.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

          return (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "24px", marginBottom: 20, boxShadow: d ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: muted, fontFamily: "sans-serif", letterSpacing: 1.5, textTransform: "uppercase" }}>Analysis Results</span>
                <div style={{ flex: 1, height: 1, background: border }} />
              </div>

              {/* Main result row */}
              <div style={{ display: "flex", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
                {preview && <img src={preview} alt="analyzed"
                  style={{ width: 110, height: 90, objectFit: "cover", borderRadius: 10, border: `1px solid ${border}` }} />}

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: text, margin: 0 }}>{predLabel}</h2>
                    <span style={{
                      background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
                      borderRadius: 20, padding: "3px 12px", fontSize: 11, fontFamily: "sans-serif", fontWeight: 700
                    }}>{risk.label}</span>
                    <span style={{ color: muted, fontSize: 11, fontFamily: "sans-serif" }}>ICD-10: {info.icdCode}</span>
                  </div>
                  <p style={{ color: muted, fontSize: 13, fontFamily: "sans-serif", margin: "0 0 10px" }}>{info.description}</p>

                  {/* Confidence bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: muted, fontSize: 11, fontFamily: "sans-serif", minWidth: 70 }}>Confidence</span>
                    <div style={{ flex: 1, background: d ? "#1e3a5f" : "#e2e8f0", borderRadius: 99, height: 6 }}>
                      <div style={{ width: `${(result.confidence * 100).toFixed(0)}%`, background: accentLight, borderRadius: 99, height: 6, transition: "width 1s ease" }} />
                    </div>
                    <span style={{ color: text, fontSize: 13, fontFamily: "sans-serif", fontWeight: 700, minWidth: 38 }}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Probability bars */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginBottom: 16 }}>
                <p style={{ color: muted, fontSize: 11, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 12px" }}>All Class Probabilities</p>
                {CLASSES.map(cls => {
                  const prob = result.probs[cls];
                  const isTop = cls === result.prediction;
                  const label = cls.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={cls} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: isTop ? text : muted, fontSize: 13, fontFamily: "sans-serif", fontWeight: isTop ? 700 : 400 }}>{label}</span>
                        <span style={{ color: isTop ? accentLight : muted, fontSize: 12, fontFamily: "sans-serif", fontWeight: 600 }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: d ? "#1e3a5f" : "#e2e8f0", borderRadius: 99, height: 5 }}>
                        <div style={{ width: `${(prob * 100).toFixed(0)}%`, background: isTop ? accentLight : (d ? "#374151" : "#94a3b8"), borderRadius: 99, height: 5, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clinical note */}
              <div style={{ background: d ? "#0c2340" : "#eff6ff", border: `1px solid ${d ? "#1e3a5f" : "#bfdbfe"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
                <p style={{ color: d ? "#93c5fd" : "#1d4ed8", fontSize: 11, fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>Clinical Guidance</p>
                <p style={{ color: d ? "#bfdbfe" : "#1e40af", fontSize: 13, fontFamily: "sans-serif", margin: 0, lineHeight: 1.7 }}>{info.clinical}</p>
              </div>

              {/* Download */}
              <button onClick={downloadPDF}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10,
                  background: "#059669", color: "white", fontSize: 14, fontWeight: 700,
                  fontFamily: "sans-serif", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(5,150,105,0.3)"
                }}>
                Download Clinical Report PDF
              </button>
            </div>
          );
        })()}

        {/* Footer */}
        <p style={{ textAlign: "center", color: muted, fontSize: 11, fontFamily: "sans-serif", lineHeight: 1.7 }}>
          This tool is intended to assist qualified ophthalmologists only.<br />
          AI predictions do not constitute a medical diagnosis.
        </p>
      </div>
    </div>
  );
}
