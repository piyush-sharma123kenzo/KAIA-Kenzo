import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Router placeholder loaded' });
});

export default router;
