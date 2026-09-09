"use strict";

const ExpensesPage = (() => {
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
            const response = window.API?.expenses?.getAll ? await window.API.expenses.getAll() : null;
            const data = response?.data || response || {};
            const items = Array.isArray(data) ? data : Array.isArray(data.expenses) ? data.expenses : [];
            const total = items.reduce((sum, item) => sum + Number(item.amount || item.total || 0), 0);
            const largest = items.length ? Math.max(...items.map(item => Number(item.amount || item.total || 0))) : 0;

            $("#expensesTotal") && ($("#expensesTotal").textContent = `KSh ${formatMoney(total)}`);
            $("#expensesCount") && ($("#expensesCount").textContent = String(items.length));
            $("#largestExpense") && ($("#largestExpense").textContent = `KSh ${formatMoney(largest)}`);

            const tbody = $("#expensesTableBody");
            if (tbody) {
                if (!items.length) {
                    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No expense records yet.</td></tr>';
                    return;
                }

                tbody.innerHTML = items.slice(0, 12).map(item => `
                    <tr>
                        <td>${item.description || "Expense"}</td>
                        <td>${item.category || "General"}</td>
                        <td>KSh ${formatMoney(item.amount || item.total || 0)}</td>
                        <td>${formatDate(item.date || item.createdAt)}</td>
                        <td>${item.paymentMethod || "Cash"}</td>
                    </tr>
                `).join("");
            }
        } catch (error) {
            console.warn("Expenses unavailable:", error);
        }
    };

    const init = async () => {
        await load();
    };

    return { init, load };
})();

document.addEventListener("DOMContentLoaded", () => {
    ExpensesPage.init();
});
