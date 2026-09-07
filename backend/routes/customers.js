"use strict";

const express = require("express");
const { read, update, nextId } = require("../database/store");

const router = express.Router();
const text = (value, fallback = "") => String(value ?? fallback).trim();

const normalizeCustomer = (body, existing = {}) => {
	const name = text(body.name ?? body.customerName ?? existing.name);
	if (!name) { const error = new Error("Customer name is required"); error.status = 400; throw error; }
	return { ...existing, name, phone: text(body.phone ?? existing.phone), email: text(body.email ?? existing.email), address: text(body.address ?? existing.address), notes: text(body.notes ?? existing.notes) };
};

router.get("/search", (req, res) => {
	const query = text(req.query.q).toLowerCase();
	const customers = read().customers.filter(customer => !query || [customer.name, customer.phone, customer.email].some(value => String(value || "").toLowerCase().includes(query)));
	res.json({ success: true, count: customers.length, customers });
});

router.get("/", (req, res) => {
	const customers = read().customers;
	res.json({ success: true, count: customers.length, customers });
});

router.get("/:id", (req, res) => {
	const customer = read().customers.find(item => String(item.id) === String(req.params.id));
	if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
	res.json({ success: true, customer });
});

router.post("/", (req, res, next) => {
	try {
		let customer;
		update(data => {
			const now = new Date().toISOString();
			customer = { id: nextId(data.customers), ...normalizeCustomer(req.body || {}), totalPurchases: 0, createdAt: now, updatedAt: now };
			data.customers.push(customer);
			return data;
		});
		res.status(201).json({ success: true, message: "Customer created successfully", customer });
	} catch (error) { next(error); }
});

router.put("/:id", (req, res, next) => {
	try {
		let customer;
		update(data => {
			const index = data.customers.findIndex(item => String(item.id) === String(req.params.id));
			if (index === -1) { const error = new Error("Customer not found"); error.status = 404; throw error; }
			customer = { ...normalizeCustomer(req.body || {}, data.customers[index]), id: data.customers[index].id, totalPurchases: data.customers[index].totalPurchases || 0, createdAt: data.customers[index].createdAt, updatedAt: new Date().toISOString() };
			data.customers[index] = customer;
			return data;
		});
		res.json({ success: true, message: "Customer updated successfully", customer });
	} catch (error) { next(error); }
});

router.delete("/:id", (req, res, next) => {
	try {
		let customer;
		update(data => {
			const index = data.customers.findIndex(item => String(item.id) === String(req.params.id));
			if (index === -1) { const error = new Error("Customer not found"); error.status = 404; throw error; }
			customer = data.customers.splice(index, 1)[0];
			return data;
		});
		res.json({ success: true, message: "Customer deleted successfully", customer });
	} catch (error) { next(error); }
});

module.exports = router;
