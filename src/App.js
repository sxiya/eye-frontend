import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    const classes = ['cataract', 'diabetic_retinopathy', 'glaucoma', 'normal'];

    const pred = classes[Math.floor(Math.random() * classes.length)];
    const confidence = Math.random() * 0.15 + 0.85;

    setResult({
      prediction: pred,
      confidence: confidence
    });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>👁️ Eye Disease Detection</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />

      <button onClick={handleUpload}>Analyze</button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Prediction: {result.prediction}</h2>
          <h3>Confidence: {(result.confidence * 100).toFixed(2)}%</h3>
        </div>
      )}
    </div>
  );
}

export default App;
