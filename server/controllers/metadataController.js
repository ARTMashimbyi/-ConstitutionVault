// server/controllers/metadataController.js

const { db } = require("../config/firebaseAdmin");

exports.getUniqueMetadataValues = async (req, res) => {
  const type = req.params.type;
  const validTypes = ["author", "category", "keywords", "institution"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid metadata type" });
  }

  try {
    const snapshot = await db.collection("constitutionalDocuments").get();
    const valuesSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data[type]) {
        if (Array.isArray(data[type])) {
          data[type].forEach(item => valuesSet.add(item));
        } else {
          valuesSet.add(data[type]);
        }
      }
    });

    res.json({ items: Array.from(valuesSet).sort() });
  } catch (err) {
    console.error("Error fetching metadata:", err);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
};
