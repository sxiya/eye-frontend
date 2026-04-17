import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setResult(data);
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
