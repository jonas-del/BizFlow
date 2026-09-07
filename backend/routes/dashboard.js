"use strict";

const express = require("express");
const { read } = require("../database/store");

const router = express.Router();
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const getSummary = () => {
    const data = read();
    const revenue = data.sales.reduce((sum, sale) => sum + number(sale.total), 0);
    const expenses = data.expenses.reduce((sum, expense) => sum + number(expense.amount), 0);
    const lowStock = data.products.filter(product => number(product.stock) <= number(product.lowStockThreshold ?? 5));

    return {
        revenue,
        expenses,
        profit: revenue - expenses,
        salesCount: data.sales.length,
        customersCount: data.customers.length,
        productsCount: data.products.length,
        lowStockCount: lowStock.length,
        recentSales: data.sales.slice(0, 10),
        lowStockProducts: lowStock,
        topProducts: []
    };
};

router.get("/", (req, res) => {
    res.json({ success: true, dashboard: getSummary(), ...getSummary() });
});

router.get("/summary", (req, res) => {
    res.json({ success: true, summary: getSummary(), ...getSummary() });
});

router.get("/stats", (req, res) => {
    res.json({ success: true, stats: getSummary(), ...getSummary() });
});

module.exports = router;