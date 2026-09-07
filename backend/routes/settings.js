"use strict";

const express = require("express");
const { read, update } = require("../database/store");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ success: true, settings: read().settings });
});

router.put("/", (req, res) => {
    let settings;
    update(data => {
        data.settings = { ...data.settings, ...(req.body || {}) };
        settings = data.settings;
    });
    res.json({ success: true, message: "Settings updated successfully", settings });
});

module.exports = router;