"use strict";

(() => {
    const modal = document.createElement("div");
    modal.className = "modal module-action-modal";
    modal.innerHTML = `
        <div class="modal-overlay" data-action-close></div>
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <span class="modal-eyebrow" data-action-eyebrow>WORKSPACE ACTION</span>
                    <h2 data-action-title></h2>
                </div>
                <button type="button" class="modal-close" data-action-close aria-label="Close">×</button>
            </div>
            <form class="form-grid" data-action-form></form>
        </div>
    `;
    document.body.appendChild(modal);

    const form = modal.querySelector("[data-action-form]");
    const title = modal.querySelector("[data-action-title]");
    const eyebrow = modal.querySelector("[data-action-eyebrow]");

    const definitions = {
        expense: {
            title: "Add expense",
            eyebrow: "EXPENSE TRACKING",
            fields: [
                ["description", "Description", "text", "What was this expense for?", true],
                ["category", "Category", "text", "e.g. Transport", true],
                ["amount", "Amount (KSh)", "number", "0.00", true],
                ["date", "Date", "date", "", true],
                ["paymentMethod", "Payment method", "select", "", true]
            ],
            api: data => window.API?.expenses?.create(data),
            storage: "bizflow_expenses"
        },
        supplier: {
            title: "Add supplier",
            eyebrow: "SUPPLIER NETWORK",
            fields: [
                ["name", "Supplier name", "text", "Business or contact name", true],
                ["phone", "Phone", "tel", "+254...", false],
                ["email", "Email", "email", "supplier@example.com", false],
                ["address", "Address", "text", "Location or address", false]
            ],
            api: data => window.API?.suppliers?.create(data),
            storage: "bizflow_suppliers"
        },
        stock: {
            title: "Adjust stock",
            eyebrow: "INVENTORY CONTROL",
            fields: [
                ["productId", "Product", "select", "", true],
                ["quantity", "Quantity change", "number", "Use a negative number to reduce stock", true],
                ["reason", "Reason", "text", "e.g. Received delivery", true]
            ],
            api: data => window.API?.inventory?.adjust(data.productId, data.quantity, data.reason)
        }
    };

    const escape = value => String(value ?? "").replace(/[&<>\"]/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[character]));
    const close = () => {
        modal.classList.remove("open");
        document.body.style.overflow = "";
    };

    const open = async type => {
        const definition = definitions[type];
        if (!definition) return;

        title.textContent = definition.title;
        eyebrow.textContent = definition.eyebrow;
        form.innerHTML = definition.fields.map(([name, label, inputType, placeholder, required]) => {
            if (inputType === "select") {
                const options = name === "paymentMethod"
                    ? `<option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer</option><option value="card">Card</option>`
                    : `<option value="">Choose a product</option>`;
                return `<div class="form-group"><label for="action-${name}">${label}</label><select id="action-${name}" name="${name}" ${required ? "required" : ""}>${options}</select></div>`;
            }
            return `<div class="form-group"><label for="action-${name}">${label}</label><input id="action-${name}" name="${name}" type="${inputType}" placeholder="${escape(placeholder)}" ${required ? "required" : ""}></div>`;
        }).join("") + `<div class="modal-footer full-width"><button type="button" class="button secondary" data-action-close>Cancel</button><button type="submit" class="button primary">Save</button></div>`;

        if (type === "stock") {
            const products = await loadProducts();
            const select = form.elements.productId;
            select.innerHTML = `<option value="">Choose a product</option>` + products.map(product => `<option value="${escape(product.id)}">${escape(product.name || product.productName)} (${Number(product.stock ?? product.quantity ?? 0)} in stock)</option>`).join("");
        }

        if (type === "expense") form.elements.date.value = new Date().toISOString().slice(0, 10);
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
        form.elements[0]?.focus();
    };

    const loadProducts = async () => {
        try {
            const response = await window.API?.products?.getAll();
            const data = response?.data ?? response;
            return Array.isArray(data) ? data : data?.products || [];
        } catch {
            try { return JSON.parse(localStorage.getItem("bizflow_products") || "[]"); } catch { return []; }
        }
    };

    const saveLocal = (key, value) => {
        try {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            items.unshift({ ...value, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(items));
        } catch { /* Local persistence is optional when the API is available. */ }
    };

    modal.addEventListener("click", event => {
        if (event.target.closest("[data-action-close]")) close();
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const type = modal.dataset.actionType;
        const definition = definitions[type];
        const data = Object.fromEntries(new FormData(form).entries());
        if (type === "expense") data.amount = Number(data.amount);
        if (type === "stock") data.quantity = Number(data.quantity);
        const submit = form.querySelector("[type=submit]");
        submit.disabled = true;
        try {
            const response = await definition.api(data);
            if (!response && definition.storage) saveLocal(definition.storage, data);
            window.showToast?.(`${definition.title.replace("Add ", "")} saved successfully.`);
            close();
            window[`${type === "stock" ? "InventoryPage" : type === "expense" ? "ExpensesPage" : "SuppliersPage"}`]?.load();
        } catch (error) {
            if (definition.storage) {
                saveLocal(definition.storage, data);
                window.showToast?.(`${definition.title.replace("Add ", "")} saved locally.`);
                close();
            } else {
                window.showToast?.(error.message || "Unable to save this action.", "error");
            }
        } finally { submit.disabled = false; }
    });

    document.addEventListener("click", event => {
        const button = event.target.closest("[data-adjust-stock], [data-add-expense], [data-add-supplier]");
        if (!button) return;
        const type = button.hasAttribute("data-adjust-stock") ? "stock" : button.hasAttribute("data-add-expense") ? "expense" : "supplier";
        modal.dataset.actionType = type;
        open(type);
    });
})();
