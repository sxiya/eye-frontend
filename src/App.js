
import React, { useState } from "react";
import jsPDF from "jspdf";

function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [patientID, setPatientID] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const classes = ['cataract', 'diabetic_retinopathy', 'glaucoma', 'normal'];

  const descriptions = {
    cataract: "Clouding of the eye lens leading to blurry vision.",
    diabetic_retinopathy: "Damage to retinal blood vessels due to diabetes.",
    glaucoma: "Optic nerve damage due to high eye pressure.",
    normal: "No abnormalities detected."
  };

  const getRiskLevel = (confidence) => {
    if (confidence > 0.85) return "High";
    if (confidence > 0.7) return "Medium";
    return "Low";
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map(file => URL.createObjectURL(file)));
  };

  // 🔥 REAL MODEL CALL
  const analyze = async () => {
    if (files.length === 0) {
      alert("Upload an image first");
      return;
    }

    const newResults = [];

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://<FRIEND_IP>:5000/predict", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      const probs = classes.map(cls =>
        cls === data.prediction ? data.confidence : (1 - data.confidence) / 3
      );

      newResults.push({
        prediction: data.prediction,
        confidence: data.confidence,
        probs: probs
      });
    }

    setResults(newResults);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("AI Ophthalmology Report", 20, 20);
    doc.text(`Patient ID: ${patientID}`, 20, 30);

    let y = 40;

    results.forEach((res, i) => {
      doc.text(`Image ${i + 1}`, 20, y);
      y += 10;
      doc.text(`Prediction: ${res.prediction}`, 20, y);
      y += 10;
      doc.text(`Confidence: ${(res.confidence * 100).toFixed(2)}%`, 20, y);
      y += 15;
    });

    doc.save("report.pdf");
  };

  return (
    <div style={{
      background: darkMode ? "#0f172a" : "#f1f5f9",
      minHeight: "100vh",
      padding: "30px"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "auto",
        background: darkMode ? "#1e293b" : "white",
        padding: "30px",
        borderRadius: "15px"
      }}>
        <h1 style={{ textAlign: "center" }}>
        <h1>NEW VERSION CHECK</h1>
          👁️ AI Eye Disease Detection
        </h1>

        <button onClick={() => setDarkMode(!darkMode)}>
          Toggle Mode
        </button>

        <br /><br />

        <input
          type="text"
          placeholder="Patient ID"
          value={patientID}
          onChange={(e) => setPatientID(e.target.value)}
        />

        <br /><br />

        <input type="file" multiple onChange={handleFiles} />

        <br /><br />

        <div style={{ display: "flex", gap: "10px" }}>
          {previews.map((src, i) => (
            <img key={i} src={src} width="120" />
          ))}
        </div>

        <br />

        <button onClick={analyze}>Analyze</button>

        {results.map((res, idx) => (
          <div key={idx} style={{ marginTop: "20px" }}>
            <h2>{res.prediction}</h2>
            <p>Confidence: {(res.confidence * 100).toFixed(2)}%</p>
            <p>Risk: {getRiskLevel(res.confidence)}</p>
            <p>{descriptions[res.prediction]}</p>
          </div>
        ))}

        {results.length > 0 && (
          <>
            <br />
            <button onClick={downloadPDF}>
              Download Report
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;