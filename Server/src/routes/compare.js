const router = require("express").Router();
const { importCompareListing } = require("../lib/compareImport");

const SUPPORTED_CATS = new Set([
  "realestate",
  "transport",
  "phones",
  "electronics",
  "computers",
  "furniture",
]);

router.post("/import", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    const cat = String(req.body?.cat || "realestate").trim();

    if (!url) {
      return res.status(400).json({ error: "Укажите ссылку на объявление" });
    }

    if (!SUPPORTED_CATS.has(cat)) {
      return res.status(400).json({ error: "Категория сравнения не поддерживается" });
    }

    const result = await importCompareListing(url, cat);
    return res.json(result);
  } catch (err) {
    const message = err?.message || "Не удалось импортировать объявление";

    if (
      message.includes("Поддерживаются только") ||
      message.includes("Укажите") ||
      message.includes("не поддерживается")
    ) {
      return res.status(400).json({ error: message });
    }

    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "Сайт не ответил вовремя. Попробуйте ещё раз." });
    }

    console.error("COMPARE_IMPORT_ERROR:", message);
    return res.status(422).json({ error: message });
  }
});

module.exports = router;
