"use strict";

const express = require("express");
const store = require("../database/store");

const router = express.Router();

const number = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeItems = items => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map((item, index) => {
        const quantity = number(
            item.quantity ??
            item.qty ??
            1
        );

        const price = number(
            item.price ??
            item.unitPrice ??
            item.sellingPrice ??
            0
        );

        const total = number(
            item.total ??
            item.amount ??
            quantity * price
        );

        return {
            id: item.id ?? item.productId ?? index + 1,
            productId: item.productId ?? item.id ?? null,
            name: item.name ?? item.productName ?? "Product",
            quantity,
            price,
            total
        };
    });
};

const calculateTotals = sale => {
    const items = normalizeItems(
        sale.items ??
        sale.products ??
        sale.cart ??
        []
    );

    const calculatedSubtotal = items.reduce(
        (sum, item) => sum + item.total,
        0
    );

    const subtotal = number(
        sale.subtotal ?? calculatedSubtotal
    );

    const discount = number(
        sale.discount
    );

    const tax = number(
        sale.tax ??
        sale.taxAmount
    );

    const total = number(
        sale.total ??
        sale.grandTotal ??
        subtotal - discount + tax
    );

    return {
        items,
        subtotal,
        discount,
        tax,
        total
    };
};

router.get("/", (req, res) => {
    const limit = number(req.query.limit);
    let result = [...store.read().sales];

    if (limit > 0) {
        result = result.slice(0, limit);
    }

    res.status(200).json({
        success: true,
        count: result.length,
        sales: result
    });
});

router.get("/recent", (req, res) => {
    const limit = Math.min(
        Math.max(
            number(req.query.limit) || 10,
            1
        ),
        100
    );

    const sales = store.read().sales;

    res.status(200).json({
        success: true,
        count: Math.min(sales.length, limit),
        sales: sales.slice(0, limit)
    });
});

router.get("/:id", (req, res) => {
    const id = String(req.params.id);
    const sales = store.read().sales;

    const sale = sales.find(
        item => String(item.id) === id
    );

    if (!sale) {
        return res.status(404).json({
            success: false,
            message: "Sale not found"
        });
    }

    res.status(200).json({
        success: true,
        sale
    });
});

router.post("/", (req, res) => {
    try {
        const body = req.body || {};

        const totals = calculateTotals(body);

        const sale = store.update(data => {
            const id = store.nextId(data, "sales");

            return {
                id,
            saleNumber:
                body.saleNumber ??
                `SALE-${String(id).padStart(6, "0")}`,

            customerId:
                body.customerId ??
                null,

            customerName:
                body.customerName ??
                body.customer ??
                "Walk-in Customer",

            paymentMethod:
                body.paymentMethod ??
                body.payment ??
                "cash",

            status:
                body.status ??
                "completed",

            cashier:
                body.cashier ??
                null,

            notes:
                body.notes ??
                "",

            date:
                body.date ??
                body.saleDate ??
                new Date().toISOString(),

            items: totals.items,

            subtotal: totals.subtotal,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,

            createdAt:
                new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()
            };
        });

        store.update(data => {
            data.sales.unshift(sale);
        });

        res.status(201).json({
            success: true,
            message: "Sale recorded successfully",
            sale
        });
    } catch (error) {
        console.error("Create sale error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to record sale"
        });
    }
});

router.put("/:id", (req, res) => {
    const id = String(req.params.id);
    const updatedData = req.body || {};

    const updatedSale = store.update(data => {
        const index = data.sales.findIndex(
            item => String(item.id) === id
        );

        if (index === -1) {
            return null;
        }

        const existingSale = data.sales[index];
        const totals = calculateTotals({
            ...existingSale,
            ...updatedData
        });

        const updated = {
            ...existingSale,
            ...updatedData,
            ...totals,
            id: existingSale.id,
            updatedAt: new Date().toISOString()
        };

        data.sales[index] = updated;
        return updated;
    });

    if (!updatedSale) {
        return res.status(404).json({
            success: false,
            message: "Sale not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Sale updated successfully",
        sale: updatedSale
    });
});

router.delete("/:id", (req, res) => {
    const id = String(req.params.id);

    const deletedSale = store.update(data => {
        const index = data.sales.findIndex(
            item => String(item.id) === id
        );

        if (index === -1) {
            return null;
        }

        return data.sales.splice(index, 1)[0];
    });

    if (!deletedSale) {
        return res.status(404).json({
            success: false,
            message: "Sale not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Sale deleted successfully",
        sale: deletedSale
    });
});

module.exports = router;