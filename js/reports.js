"use strict";

const ReportsPage = (() => {
    const $ = selector => document.querySelector(selector);

    const formatMoney = value => new Intl.NumberFormat("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

    const load = async () => {
        try {
            const summary = window.API?.dashboard?.summary ? await window.API.dashboard.summary() : null;
            const data = summary?.data || summary || {};
            const stats = data.summary || data.stats || data.dashboard || data;

            const revenue = Number(stats.revenue || 0);
            const expenses = Number(stats.expenses || 0);
            const profit = Number(stats.profit || revenue - expenses);
            const sales = Number(stats.salesCount || 0);

            const revenueEl = $("#reportRevenue");
            if (revenueEl) revenueEl.textContent = `KSh ${formatMoney(revenue)}`;
            const expenseEl = $("#reportExpenses");
            if (expenseEl) expenseEl.textContent = `KSh ${formatMoney(expenses)}`;
            const profitEl = $("#reportProfit");
            if (profitEl) profitEl.textContent = `KSh ${formatMoney(profit)}`;
            const salesEl = $("#reportSales");
            if (salesEl) salesEl.textContent = String(sales);

            const rows = [
                ["Revenue", `KSh ${formatMoney(revenue)}`, "Healthy"],
                ["Expenses", `KSh ${formatMoney(expenses)}`, "Tracked"],
                ["Profit", `KSh ${formatMoney(profit)}`, profit >= 0 ? "Positive" : "Watch"]
            ];

            const tbody = $("#reportsTableBody");
            if (tbody) {
                tbody.innerHTML = rows.map(([metric, value, status]) => `
                    <tr>
                        <td>${metric}</td>
                        <td>${value}</td>
                        <td>${status}</td>
                    </tr>
                `).join("");
            }
        } catch (error) {
            console.warn("Reports unavailable:", error);
        }
    };

    const init = async () => {
        await load();
    };

    return { init, load };
})();

document.addEventListener("DOMContentLoaded", () => {
    ReportsPage.init();
});
