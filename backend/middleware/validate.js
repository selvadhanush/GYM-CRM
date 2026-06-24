/**
 * Generic zod request-validation middleware factory.
 *
 * Validates one or more request parts (`body`, `query`, `params`) against the
 * supplied zod schemas. On failure it responds 400 with a flattened list of
 * human-readable error messages. On success the parsed (and coerced/trimmed)
 * values are written back onto the request so downstream handlers can trust them.
 *
 * Example:
 *   const { z } = require('zod');
 *   router.post('/check-in', validate({
 *     body: z.object({ gymId: z.string().min(1) })
 *   }), checkIn);
 */
const validate = (schemas) => (req, res, next) => {
  const parts = ['body', 'query', 'params'];
  for (const part of parts) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation failed',
        errors: messages,
      });
    }
    // Replace with parsed/coerced values (e.g. trimmed strings, cast numbers).
    req[part] = result.data;
  }
  next();
};

module.exports = validate;
