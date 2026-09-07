"use strict";

const express = require("express");
const { read, update, nextId } = require("../database/store");

const router = express.Router();
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const inventorySnapshot = () => {
	const data = read();
	const products = data.products;
	const lowStock = products.filter(product => number(product.stock) <= number(product.lowStockThreshold ?? 5));
	const outOfStock = products.filter(product => number(product.stock) <= 0);

	return {
		products,
		totalItems: products.reduce((sum, product) => sum + number(product.stock), 0),
		totalStockValue: products.reduce((sum, product) => sum + number(product.stock) * number(product.costPrice), 0),
		lowStock,
		outOfStock,
		movements: data.inventoryMovements
	};
};

router.get("/", (req, res) => {
	res.json({ success: true, inventory: inventorySnapshot() });
});

router.get("/low-stock", (req, res) => {
	const inventory = inventorySnapshot();
	res.json({ success: true, count: inventory.lowStock.length, products: inventory.lowStock, lowStock: inventory.lowStock });
});

router.get("/out-of-stock", (req, res) => {
	const inventory = inventorySnapshot();
	res.json({ success: true, count: inventory.outOfStock.length, products: inventory.outOfStock, outOfStock: inventory.outOfStock });
});

router.post("/adjust", (req, res, next) => {
	try {
		let product;
		let movement;
		const productId = String(req.body?.productId ?? "");
		const quantity = number(req.body?.quantity);

		update(data => {
			const index = data.products.findIndex(item => String(item.id) === productId);

			if (index === -1) {
				const error = new Error("Product not found");
				error.status = 404;
				throw error;
			}

			const previousStock = number(data.products[index].stock);
			const stock = Math.max(0, previousStock + quantity);
			product = { ...data.products[index], stock, updatedAt: new Date().toISOString() };
			data.products[index] = product;
			movement = {
				id: nextId(data, "inventoryMovements"),
				productId: product.id,
				quantity,
				previousStock,
				stock,
				reason: req.body?.reason || "Manual adjustment",
				createdAt: new Date().toISOString()
			};
			data.inventoryMovements.unshift(movement);
		});

		res.json({ success: true, message: "Inventory adjusted successfully", product, movement });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
