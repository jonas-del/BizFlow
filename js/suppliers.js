"use strict";

const SuppliersPage = (() => {
    const $ = selector => document.querySelector(selector);

    const load = async () => {
        try {
            const response = window.API?.suppliers?.getAll ? await window.API.suppliers.getAll() : null;
            const data = response?.data || response || {};
            const suppliers = Array.isArray(data) ? data : Array.isArray(data.suppliers) ? data.suppliers : [];

            const tbody = $("#suppliersTableBody");
            if (tbody) {
                if (!suppliers.length) {
                    tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No suppliers added yet.</td></tr>';
                    return;
                }

                tbody.innerHTML = suppliers.slice(0, 12).map(supplier => `
                    <tr>
                        <td>${supplier.name || "Supplier"}</td>
                        <td>${supplier.phone || "—"}</td>
                        <td>${supplier.email || "—"}</td>
                        <td>${supplier.address || "—"}</td>
                    </tr>
                `).join("");
            }
        } catch (error) {
            console.warn("Suppliers unavailable:", error);
        }
    };

    const init = async () => {
        await load();
    };

    return { init, load };
})();

document.addEventListener("DOMContentLoaded", () => {
    SuppliersPage.init();
});
