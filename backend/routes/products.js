"use strict";

const express = require("express");
const { read, update, nextId } = require("../database/store");

const router = express.Router();

const number = value => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value, fallback = "") => String(value ?? fallback).trim();

const normalizeProduct = (body, existing = {}) => {
	const name = text(body.name ?? body.productName ?? existing.name);

	if (!name) {
		const error = new Error("Product name is required");
		error.status = 400;
		throw error;
	}

	return {
		...existing,
		name,
		sku: text(body.sku ?? existing.sku),
		category: text(body.category ?? existing.category, "General"),
		description: text(body.description ?? existing.description),
		costPrice: number(body.costPrice ?? body.cost ?? existing.costPrice),
		sellingPrice: number(body.sellingPrice ?? body.price ?? existing.sellingPrice),
		stock: Math.max(0, number(body.stock ?? body.quantity ?? existing.stock)),
		lowStockThreshold: Math.max(0, number(body.lowStockThreshold ?? body.reorderLevel ?? existing.lowStockThreshold ?? 5)),
		unit: text(body.unit ?? existing.unit, "pcs"),
		active: body.active ?? existing.active ?? true
	};
};

router.get("/search", (req, res) => {
	const query = text(req.query.q).toLowerCase();
	const products = read().products.filter(product =>
		!query || [product.name, product.sku, product.category]
			.some(value => String(value || "").toLowerCase().includes(query))
	);
	res.json({ success: true, count: products.length, products });
});

router.get("/", (req, res) => {
	const query = text(req.query.search ?? req.query.q).toLowerCase();
	const products = read().products.filter(product =>
		!query || [product.name, product.sku, product.category]
			.some(value => String(value || "").toLowerCase().includes(query))
	);
	res.json({ success: true, count: products.length, products });
});

router.get("/:id", (req, res) => {
	const product = read().products.find(item => String(item.id) === String(req.params.id));
	if (!product) return res.status(404).json({ success: false, message: "Product not found" });
	res.json({ success: true, product });
});

router.post("/", (req, res, next) => {
	try {
		let product;
		update(data => {
			const now = new Date().toISOString();
			product = { id: nextId(data.products), ...normalizeProduct(req.body || {}), createdAt: now, updatedAt: now };
			data.products.push(product);
			return data;
		});
		res.status(201).json({ success: true, message: "Product created successfully", product });
	} catch (error) { next(error); }
});

router.put("/:id", (req, res, next) => {
	try {
		let product;
		update(data => {
			const index = data.products.findIndex(item => String(item.id) === String(req.params.id));
			if (index === -1) { const error = new Error("Product not found"); error.status = 404; throw error; }
			product = { ...normalizeProduct(req.body || {}, data.products[index]), id: data.products[index].id, createdAt: data.products[index].createdAt, updatedAt: new Date().toISOString() };
			data.products[index] = product;
			return data;
		});
		res.json({ success: true, message: "Product updated successfully", product });
	} catch (error) { next(error); }
});

router.patch("/:id/stock", (req, res, next) => {
	try {
		let product;
		update(data => {
			const index = data.products.findIndex(item => String(item.id) === String(req.params.id));
			if (index === -1) { const error = new Error("Product not found"); error.status = 404; throw error; }
			const previousStock = number(data.products[index].stock);
			const stock = Math.max(0, number(req.body?.stock));
			product = { ...data.products[index], stock, updatedAt: new Date().toISOString() };
			data.products[index] = product;
			data.inventoryMovements.push({ id: nextId(data.inventoryMovements), productId: product.id, quantity: stock - previousStock, reason: "Stock update", createdAt: new Date().toISOString() });
			return data;
		});
		res.json({ success: true, message: "Stock updated successfully", product });
	} catch (error) { next(error); }
});

router.delete("/:id", (req, res, next) => {
	try {
		let product;
		update(data => {
			const index = data.products.findIndex(item => String(item.id) === String(req.params.id));
			if (index === -1) { const error = new Error("Product not found"); error.status = 404; throw error; }
			product = data.products.splice(index, 1)[0];
			return data;
		});
		res.json({ success: true, message: "Product deleted successfully", product });
	} catch (error) { next(error); }
});

module.exports = router;
