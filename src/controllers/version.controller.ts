// src/controllers/version.controller.js
const versionService = require("../services/version.service");

function getVersion(req, res) {
  const info = versionService.getVersionInfo();
  res.json({ data: info });
}

module.exports = {
  getVersion,
};
