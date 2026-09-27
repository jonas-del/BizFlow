"use strict";

const express = require("express");
const { query, testConnection } = require("../config/db");
const { read, update } = require("../database/store");

const router = express.Router();

const isMySqlAvailable = async () => {
    try {
        return await testConnection();
    } catch (error) {
        return false;
    }
};

const normalizeUser = row => ({
    id: row.id,
    name: row.name || "BizFlow User",
    email: row.email,
    role: row.role || "admin",
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
});

router.post("/login", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (await isMySqlAvailable()) {
        const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const passwordMatches = String(user.password_hash || "") === String(password);

        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const normalizedUser = normalizeUser(user);

        return res.json({
            success: true,
            message: "Login successful",
            user: normalizedUser,
            token: "bizflow-demo-session"
        });
    }

    const data = read();
    const user = { ...data.user, email: data.user.email || email };

    return res.json({
        success: true,
        message: "Login successful",
        user,
        token: "bizflow-demo-session"
    });
});

router.post("/register", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const name = String(req.body?.name || req.body?.fullName || "").trim();
    const password = String(req.body?.password || "");

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (await isMySqlAvailable()) {
        const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

        if (existing.length) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const created = await query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name || "Business Admin", email, password, "admin"]
        );

        const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [created.insertId]);
        const user = normalizeUser(rows[0]);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user,
            token: "bizflow-demo-session"
        });
    }

    const user = update(data => {
        data.user = {
            ...data.user,
            name: name || "Business Admin",
            email,
            updatedAt: new Date().toISOString()
        };

        return data.user;
    });

    return res.status(201).json({
        success: true,
        message: "Registration successful",
        user,
        token: "bizflow-demo-session"
    });
});

router.get("/me", async (req, res) => {
    if (await isMySqlAvailable()) {
        const rows = await query("SELECT * FROM users ORDER BY id DESC LIMIT 1");
        const user = rows[0] ? normalizeUser(rows[0]) : null;
        return res.json({ success: true, user });
    }

    return res.json({ success: true, user: read().user });
});

router.post("/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
});

router.post("/refresh", async (req, res) => {
    if (await isMySqlAvailable()) {
        const rows = await query("SELECT * FROM users ORDER BY id DESC LIMIT 1");
        const user = rows[0] ? normalizeUser(rows[0]) : null;
        return res.json({ success: true, token: "bizflow-demo-session", user });
    }

    return res.json({ success: true, token: "bizflow-demo-session", user: read().user });
});

module.exports = router;
