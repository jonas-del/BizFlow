"use strict";

const express = require("express");
const { read, update, nextId } = require("../database/store");

const router = express.Router();
const text = (value, fallback = "") => String(value ?? fallback).trim();

router.get("/", (req, res) => {
	const suppliers = read().suppliers;
	res.json({ success: true, count: suppliers.length, suppliers });
});

router.get("/:id", (req, res) => {
	const supplier = read().suppliers.find(item => String(item.id) === String(req.params.id));
	if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
	res.json({ success: true, supplier });
});

router.post("/", (req, res) => {
	let supplier;
	update(data => {
		const name = text(req.body?.name ?? req.body?.supplierName);
		if (!name) { const error = new Error("Supplier name is required"); error.status = 400; throw error; }
		const now = new Date().toISOString();
		supplier = { id: nextId(data, "suppliers"), name, phone: text(req.body?.phone), email: text(req.body?.email), address: text(req.body?.address), createdAt: now, updatedAt: now };
		data.suppliers.push(supplier);
	});
	res.status(201).json({ success: true, message: "Supplier created successfully", supplier });
});

module.exports = router;
