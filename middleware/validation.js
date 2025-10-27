import Joi from "joi";

export const validateSearchQuery = (req, res, next) => {
  const schema = Joi.object({
    query: Joi.string().trim().min(1).max(200).required(),
    limit: Joi.number().integer().min(1).max(50).optional(),
    type: Joi.string()
      .valid("song", "album", "video", "playlist", "artist")
      .optional(),
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details.map((detail) => detail.message),
    });
  }

  req.validatedQuery = value;
  next();
};

export const validateVideoId = (req, res, next) => {
  const schema = Joi.object({
    videoId: Joi.string().alphanum().min(11).max(11).required(),
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(400).json({ error: "Invalid video ID" });
  }
  next();
};
