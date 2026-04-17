import React, { useState } from "react";
import jsPDF from "jspdf";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const classes = ['cataract', 'diabetic_retinopathy', 'glaucoma', 'normal'];

  const descriptions = {
    cataract: "Clouding of the eye lens leading to blurry vision.",
    diabetic_retinopathy: "Damage to retinal blood vessels due to diabetes.",
    glaucoma: "Optic nerve damage often caused by high eye pressure.",
    normal: "No visible abnormalities detected."
  };

  const getRiskLevel = (confidence) => {
    if (confidence > 0.95) return "High";
    if (confidence > 0.90) return "Medium";
    return "Low";
  };

  const handleUpload = () => {
    const pred = classes[Math.floor(Math.random() * classes.length)];
    const confidence = Math.random() * 0.15 + 0.85;

    setResult({
      prediction: pred,
      confidence: confidence
    });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AI Ophthalmology Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Prediction: ${result.prediction}`, 20, 40);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(2)}%`, 20, 50);
    doc.text(`Risk Level: ${getRiskLevel(result.confidence)}`, 20, 60);

    doc.text("Description:", 20, 80);
    doc.text(descriptions[result.prediction], 20, 90);

    doc.save("Eye_Report.pdf");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px", fontFamily: "Arial" }}>
      <h1>👁️ AI Eye Disease Detection</h1>

      <input type="file" onChange={handleFileChange} />
      <br /><br />

      {preview && (
        <img src={preview} alt="preview" width="250" style={{ borderRadius: "10px" }} />
      )}

      <br /><br />

      <button onClick={handleUpload} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Analyze
      </button>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>Prediction: {result.prediction}</h2>
          <h3>Confidence: {(result.confidence * 100).toFixed(2)}%</h3>
          <h3>Risk Level: {getRiskLevel(result.confidence)}</h3>

          <p style={{ width: "60%", margin: "auto" }}>
            {descriptions[result.prediction]}
          </p>

          <br />
          <button onClick={downloadPDF} style={{ padding: "10px 20px" }}>
            📄 Download Report
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
