const core = require('@actions/core');
const run = require('./run')

run.run().then(
  (resolve) => {},
  (error) => { core.setFailed(error.message); });
