// src/services/version.service.js
const { appName, version, nodeEnv } = require("../config/appConfig");

function getVersionInfo() {
  return {
    name: appName,
    version: version,
    environment: nodeEnv,
  };
}

module.exports = {
  getVersionInfo,
};
