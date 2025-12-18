import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");

  const generateQR = async () => {
    const res = await fetch("https://qr-code-generator-blue-six.vercel.app/api/qr/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUrl: url })
    });
    const data = await res.json();
    setQr(data.qrImage);
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Non-Expiring QR Generator</h2>
      <input
        placeholder="Enter URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <button onClick={generateQR}>Generate</button>
      <br /><br />
      {qr && <img src={qr} alt="QR Code" />}
    </div>
  );
}

export default App;