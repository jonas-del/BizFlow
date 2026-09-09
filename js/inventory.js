"use strict";

const InventoryPage = (() => {
    const $ = selector => document.querySelector(selector);

    const formatMoney = value => new Intl.NumberFormat("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

    const formatDate = value => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat("en-KE", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    };

    const load = async () => {
        try {
            const response = window.API?.inventory?.get ? await window.API.inventory.get() : null;
            const data = response?.data || response || {};
            const inventory = data.inventory || data;
            const products = Array.isArray(inventory.products) ? inventory.products : Array.isArray(inventory) ? inventory : [];
            const lowStock = products.filter(item => Number(item.stock ?? item.quantity ?? 0) <= Number(item.lowStockThreshold ?? item.lowStockLimit ?? 5));
            const outOfStock = products.filter(item => Number(item.stock ?? item.quantity ?? 0) <= 0);
            const totalItems = products.reduce((sum, item) => sum + Number(item.stock ?? item.quantity ?? 0), 0);
            const stockValue = products.reduce((sum, item) => sum + (Number(item.stock ?? item.quantity ?? 0) * Number(item.costPrice ?? item.cost ?? 0)), 0);

            $("#inventoryTotalItems") && ($("#inventoryTotalItems").textContent = String(totalItems));
            $("#inventoryLowStock") && ($("#inventoryLowStock").textContent = String(lowStock.length));
            $("#inventoryOutOfStock") && ($("#inventoryOutOfStock").textContent = String(outOfStock.length));
            $("#inventoryValue") && ($("#inventoryValue").textContent = `KSh ${formatMoney(stockValue)}`);

            const table = $("#inventoryTableBody");
            if (table) {
                if (!products.length) {
                    table.innerHTML = '<tr><td colspan="4" class="table-empty">No inventory movements yet.</td></tr>';
                    return;
                }

                table.innerHTML = products.slice(0, 12).map(item => {
                    const quantity = Number(item.stock ?? item.quantity ?? 0);
                    const reason = item.reason || item.note || "Stock update";
                    return `
                        <tr>
                            <td>${item.name || item.productName || "Unnamed product"}</td>
                            <td>${quantity}</td>
                            <td>${reason}</td>
                            <td>${formatDate(item.updatedAt || item.createdAt)}</td>
                        </tr>
                    `;
                }).join("");
            }
        } catch (error) {
            console.warn("Inventory unavailable:", error);
        }
    };

    const init = async () => {
        await load();
    };

    return { init, load };
})();

document.addEventListener("DOMContentLoaded", () => {
    InventoryPage.init();
});
