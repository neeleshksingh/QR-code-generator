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
// Mongo + Server Start
// =====================
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB ✅");

    app.listen(5000, () => {
      console.log("Backend running on port 5000");
    });
  } catch (error) {
    console.error("MongoDB connection failed ❌", error);
    process.exit(1);
  }
}

startServer();

// =====================
// Schema & Model
// =====================
const qrSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  redirectUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const QR = mongoose.model("QR", qrSchema);

// =====================
// Routes
// =====================
app.post("/api/qr/create", async (req, res) => {
  try {
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
    res.status(500).json({ message: "QR generation failed" });
  }
});

app.get("/q/:code", async (req, res) => {
  const qr = await QR.findOne({ code: req.params.code });
  if (!qr) return res.status(404).send("Invalid QR");
  res.redirect(qr.redirectUrl);
});
