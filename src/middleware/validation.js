const Joi = require('joi')
const mongoose = require('mongoose')

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().max(200).optional(),
    nickname: Joi.string().max(100).optional()
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  setEmailPassword: Joi.object({
    user_hash: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  }),
  generateMigrationCode: Joi.object({
    telegram_id: Joi.string().required()
  }),
  verifyMigrationCode: Joi.object({
    code: Joi.string().pattern(/^\d{6}$/).required(),
    user_hash: Joi.string().required()
  }),
  createFeedback: Joi.object({
    type: Joi.string().required(),
    message: Joi.string().required(),
    user_hash: Joi.string().optional().allow(null)
  }),
  updateFeedback: Joi.object({
    resolved: Joi.boolean().optional(),
    message: Joi.string().optional(),
    type: Joi.string().optional()
  }),
  createDoc: Joi.object({
    title: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().required()
  }),
  updateDoc: Joi.object({
    title: Joi.string().optional(),
    text: Joi.string().optional(),
    type: Joi.string().optional()
  }),
  createResearchInvite: Joi.object({
    title: Joi.string().required(),
    message: Joi.string().required(),
    type: Joi.string().optional().allow(null),
    client: Joi.string().required(),
    link: Joi.string().required(),
    isPrivate: Joi.boolean().optional()
  }),
  updateResearchInvite: Joi.object({
    title: Joi.string().optional(),
    message: Joi.string().optional(),
    type: Joi.string().optional().allow(null),
    client: Joi.string().optional(),
    link: Joi.string().optional(),
    isPrivate: Joi.boolean().optional()
  }),
  inviteUser: Joi.object({
    user_hash: Joi.string().required()
  }),
  recordResponse: Joi.object({
    user_hash: Joi.string().required(),
    response: Joi.string().valid('yes', 'no').required()
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


