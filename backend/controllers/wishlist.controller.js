// KAIA Controller
export const getWishlist = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Controller placeholder loaded' });
  } catch (err) {
    next(err);
  }
};
