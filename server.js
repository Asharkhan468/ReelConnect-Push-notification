const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("./firebase");
require("dotenv").config(); 

const serviceAccount = JSON.parse(
  Buffer.from(process.env.SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/send-message", async (req, res) => {
  const { receiverToken, title, body } = req.body;

  if (
    !Array.isArray(receiverToken) ||
    receiverToken.length === 0 ||
    !title ||
    !body
  ) {
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }

  const message = {
    notification: {
      title,
      body,
    },
    tokens: receiverToken,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Notification sent:", response);

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
