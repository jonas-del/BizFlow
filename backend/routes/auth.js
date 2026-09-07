"use strict";

const express = require("express");
const { read } = require("../database/store");

const router = express.Router();

router.post("/login", (req, res) => {
	const email = String(req.body?.email || "").trim().toLowerCase();
	const password = String(req.body?.password || "");

	if (!email || !password) {
		return res.status(400).json({ success: false, message: "Email and password are required" });
	}

	const data = read();
	const user = { ...data.user, email: data.user.email || email };

	res.json({
		success: true,
		message: "Login successful",
		user,
		token: "bizflow-demo-session"
	});
});

router.post("/register", (req, res) => {
	const email = String(req.body?.email || "").trim().toLowerCase();
	const name = String(req.body?.name || req.body?.fullName || "").trim();

	if (!email || !req.body?.password) {
		return res.status(400).json({ success: false, message: "Email and password are required" });
	}

	res.status(201).json({
		success: true,
		message: "Registration successful",
		user: { ...read().user, name: name || "Business Admin", email },
		token: "bizflow-demo-session"
	});
});

router.get("/me", (req, res) => {
	res.json({ success: true, user: read().user });
});

router.post("/logout", (req, res) => {
	res.json({ success: true, message: "Logged out successfully" });
});

router.post("/refresh", (req, res) => {
	res.json({ success: true, token: "bizflow-demo-session", user: read().user });
});

module.exports = router;
