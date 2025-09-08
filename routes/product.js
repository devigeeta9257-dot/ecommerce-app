const express = require('express');
const router = express.Router();
// placeholder product routes

router.get('/', async (req, res) => {
  return res.json({ ok: true, products: [] });
});

module.exports = router;