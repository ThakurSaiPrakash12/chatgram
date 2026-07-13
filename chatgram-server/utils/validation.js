import mongoose from "mongoose";

/**
 * Returns true when the value is a syntactically valid MongoDB ObjectId.
 * Use this before any Model.findById() call to prevent Mongoose CastErrors
 * from surfacing as unexpected HTTP 500 responses.
 */
export const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

/**
 * Express middleware factory that validates one or more ObjectId params.
 * Usage: router.get("/:chatId", validateObjectIds("chatId"), handler)
 *
 * @param  {...string} paramNames - names from req.params to validate
 */
export const validateObjectIds = (...paramNames) =>
  (req, res, next) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (value && !isValidObjectId(value)) {
        return res.status(400).json({ message: `Invalid ${name}` });
      }
    }
    next();
  };

/**
 * Validate a Base64-encoded image string.
 * Checks the data-URI prefix for an allowed MIME type and a reasonable size.
 *
 * @param {string} base64String  - The raw value from req.body
 * @param {number} maxBytes      - Maximum allowed decoded byte size (default 5 MB)
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateBase64Image = (base64String, maxBytes = 5 * 1024 * 1024) => {
  if (!base64String) return { valid: true }; // optional field — absence is fine

  // Must start with a valid image data-URI prefix
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const match = base64String.match(/^data:([^;]+);base64,/);
  if (!match) {
    return { valid: false, message: "Invalid image format. Must be a base64 data URI." };
  }

  const mime = match[1].toLowerCase();
  if (!allowedMimes.includes(mime)) {
    return {
      valid: false,
      message: `Unsupported image type '${mime}'. Allowed: jpeg, png, gif, webp.`,
    };
  }

  // Rough decoded size estimate: base64 length * 3/4
  const base64Data = base64String.replace(/^data:[^;]+;base64,/, "");
  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, message: `Image exceeds maximum size of ${maxMb}MB.` };
  }

  return { valid: true };
};
