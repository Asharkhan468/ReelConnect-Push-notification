const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();
const admin = require("firebase-admin");

// Decode base64 service account from env
const serviceAccount = JSON.parse(
  Buffer.from(process.env.SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8")
);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Your Route
app.post("/send-message", async (req, res) => {
  const { receiverToken, title, body } = req.body;

  if (!Array.isArray(receiverToken) || !title || !body) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      tokens: receiverToken,
    });

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);

// ✅ Run locally if not on Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
  });
}
