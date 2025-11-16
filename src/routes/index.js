module.exports = (app) => {
  app.use('/api/auth', require('./auth'))
  app.use('/api/users', require('./user'))
  app.use('/api/checkins', require('./checkIn'))
  app.use('/api/migration', require('./migration'))
  app.use('/api/feedback', require('./feedback'))
  app.use('/api/docs', require('./doc'))
  app.use('/api/research-invites', require('./researchInvite'))
}


