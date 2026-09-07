"use strict";

const express = require("express");
const { read } = require("../database/store");

const router = express.Router();
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const dateInRange = (value, query) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return false;
	if (query.from && date < new Date(query.from)) return false;
	if (query.to) {
		const end = new Date(query.to);
		end.setHours(23, 59, 59, 999);
		if (date > end) return false;
	}
	return true;
};

router.get("/sales", (req, res) => {
	const sales = read().sales.filter(item => dateInRange(item.date ?? item.createdAt, req.query));
	const revenue = sales.reduce((sum, item) => sum + number(item.total), 0);
	res.json({ success: true, count: sales.length, sales, revenue, total: revenue });
});

router.get("/revenue", (req, res) => {
	const sales = read().sales.filter(item => dateInRange(item.date ?? item.createdAt, req.query));
	const revenue = sales.reduce((sum, item) => sum + number(item.total), 0);
	res.json({ success: true, revenue, total: revenue, salesCount: sales.length });
});

router.get("/expenses", (req, res) => {
	const expenses = read().expenses.filter(item => dateInRange(item.date ?? item.createdAt, req.query));
	const total = expenses.reduce((sum, item) => sum + number(item.amount), 0);
	res.json({ success: true, count: expenses.length, expenses, total });
});

router.get("/profit", (req, res) => {
	const data = read();
	const revenue = data.sales.filter(item => dateInRange(item.date ?? item.createdAt, req.query)).reduce((sum, item) => sum + number(item.total), 0);
	const expenses = data.expenses.filter(item => dateInRange(item.date ?? item.createdAt, req.query)).reduce((sum, item) => sum + number(item.amount), 0);
	res.json({ success: true, revenue, expenses, profit: revenue - expenses });
});

router.get("/inventory", (req, res) => {
	const products = read().products;
	const totalValue = products.reduce((sum, item) => sum + number(item.stock) * number(item.costPrice), 0);
	res.json({ success: true, count: products.length, products, totalValue });
});

module.exports = router;
