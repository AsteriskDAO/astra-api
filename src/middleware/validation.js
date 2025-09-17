const Joi = require('joi')

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().optional(),
    nickname: Joi.string().optional()
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
}

const validate = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName]
  if (!schema) return next()
  const { error, value } = schema.validate(req.body)
  if (error) return res.status(400).json({ error: error.message })
  req.body = value
  next()
}

module.exports = { validate }


