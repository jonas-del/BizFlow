"use strict";

const express = require("express");
const { read, update, nextId } = require("../database/store");

const router = express.Router();

const number = value => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value, fallback = "") => String(value ?? fallback).trim();

const normalizeExpense = (body, existing = {}) => {
	const description = text(body.description ?? body.name ?? existing.description);

	if (!description) {
		const error = new Error("Expense description is required");
		error.status = 400;
		throw error;
	}

	return {
		...existing,
		description,
		category: text(body.category ?? existing.category, "General"),
		amount: Math.max(0, number(body.amount ?? existing.amount)),
		date: body.date ?? existing.date ?? new Date().toISOString(),
		paymentMethod: text(body.paymentMethod ?? existing.paymentMethod, "cash"),
		notes: text(body.notes ?? existing.notes)
	};
};

router.get("/", (req, res) => {
	const expenses = read().expenses;
	const category = text(req.query.category).toLowerCase();
	const filtered = category
		? expenses.filter(item => item.category.toLowerCase() === category)
		: expenses;

	res.json({ success: true, count: filtered.length, expenses: filtered });
});

router.get("/:id", (req, res) => {
	const expense = read().expenses.find(item => String(item.id) === String(req.params.id));

	if (!expense) {
		return res.status(404).json({ success: false, message: "Expense not found" });
	}

	res.json({ success: true, expense });
});

router.post("/", (req, res, next) => {
	try {
		let expense;
		update(data => {
			const now = new Date().toISOString();
			expense = {
				id: nextId(data, "expenses"),
				...normalizeExpense(req.body || {}),
				createdAt: now,
				updatedAt: now
			};
			data.expenses.unshift(expense);
		});

		res.status(201).json({ success: true, message: "Expense created successfully", expense });
	} catch (error) {
		next(error);
	}
});

router.put("/:id", (req, res, next) => {
	try {
		let expense;
		update(data => {
			const index = data.expenses.findIndex(item => String(item.id) === String(req.params.id));

			if (index === -1) {
				const error = new Error("Expense not found");
				error.status = 404;
				throw error;
			}

			expense = {
				...normalizeExpense(req.body || {}, data.expenses[index]),
				id: data.expenses[index].id,
				createdAt: data.expenses[index].createdAt,
				updatedAt: new Date().toISOString()
			};
			data.expenses[index] = expense;
		});

		res.json({ success: true, message: "Expense updated successfully", expense });
	} catch (error) {
		next(error);
	}
});

router.delete("/:id", (req, res, next) => {
	try {
		let expense;
		update(data => {
			const index = data.expenses.findIndex(item => String(item.id) === String(req.params.id));

			if (index === -1) {
				const error = new Error("Expense not found");
				error.status = 404;
				throw error;
			}

			expense = data.expenses.splice(index, 1)[0];
		});

		res.json({ success: true, message: "Expense deleted successfully", expense });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
