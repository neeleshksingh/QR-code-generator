require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// MongoDB Connection (Serverless-friendly)
// =====================
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("Connected to MongoDB ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌", error);
    throw error;
  }
}

// =====================
// Schema & Model
// =====================
const qrSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  redirectUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const QR = mongoose.models.QR || mongoose.model("QR", qrSchema);

// =====================
// Routes
// =====================

app.get('/', (req, res) => res.status(200).send('Backend OK'));

app.post("/api/qr/create", async (req, res) => {
  try {
    await connectDB();

    const { redirectUrl } = req.body;
    if (!redirectUrl) {
      return res.status(400).json({ message: "redirectUrl is required" });
    }

    const code = uuidv4();
    const qrLink = `${process.env.BASE_URL}/q/${code}`;

    await QR.create({ code, redirectUrl });

    const qrImage = await QRCode.toDataURL(qrLink);
    res.json({ qrImage, qrLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "QR generation failed" });
  }
});

app.get("/q/:code", async (req, res) => {
  try {
    console.log("➡️ Hit /q/:code", req.params.code);

    await connectDB();
    console.log("✅ DB connected");

    const qr = await QR.findOne({ code: req.params.code });
    console.log("🔍 QR found:", qr);

    if (!qr) {
      return res.status(404).send("Invalid QR");
    }

    return res.redirect(qr.redirectUrl);

  } catch (err) {
    console.error("❌ Redirect error FULL:", err);
    return res.status(500).send("Server error");
  }
});



// 404 handler - must be AFTER all routes
app.use((req, res) => res.status(404).send('API not found'));

// For local development
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(5000, () => {
      console.log("Backend running on port 5000");
    });
  });
}

// Export for Vercel serverless
module.exports = app;