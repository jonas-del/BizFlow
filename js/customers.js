 "use strict";

const Customers = (() => {
    const state = {
        customers: [],
        filtered: [],
        search: "",
        page: 1,
        perPage: 10,
        editingId: null
    };

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const escapeHTML = value =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const money = value =>
        new Intl.NumberFormat("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);

    const number = value =>
        new Intl.NumberFormat("en-KE").format(
            Number(value) || 0
        );

    const toast = (message, type = "success") => {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }

        let container = $(".toast-container");

        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const item = document.createElement("div");

        item.className = `toast ${type}`;
        item.textContent = message;

        container.appendChild(item);

        setTimeout(() => {
            item.remove();
        }, 3500);
    };

    const getId = customer =>
        customer.id ??
        customer.customerId ??
        customer._id;

    const getName = customer => {
        const fullName = `${customer.firstName ?? ""} ${
            customer.lastName ?? ""
        }`.trim();

        return customer.name || customer.fullName || fullName || "Unnamed Customer";
    };

    const getEmail = customer =>
        customer.email ??
        customer.emailAddress ??
        "—";

    const getPhone = customer =>
        customer.phone ??
        customer.phoneNumber ??
        customer.mobile ??
        "—";

    const getAddress = customer =>
        customer.address ??
        customer.location ??
        "—";

    const getTotalSpent = customer =>
        Number(
            customer.totalSpent ??
            customer.totalPurchases ??
            customer.totalAmount ??
            customer.spending ??
            0
        ) || 0;

    const getOrders = customer =>
        Number(
            customer.orders ??
            customer.orderCount ??
            customer.totalOrders ??
            customer.purchases ??
            0
        ) || 0;

    const getCreatedAt = customer =>
        customer.createdAt ??
        customer.dateCreated ??
        customer.joinedAt ??
        "";

    const formatDate = value => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat("en-KE", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(date);
    };

    const loadLocalCustomers = () => {
        try {
            const stored =
                localStorage.getItem(
                    "bizflow_customers"
                );

            return stored
                ? JSON.parse(stored)
                : [];
        } catch {
            return [];
        }
    };

    const saveLocalCustomers = () => {
        try {
            localStorage.setItem(
                "bizflow_customers",
                JSON.stringify(
                    state.customers
                )
            );
        } catch (error) {
            console.warn(
                "Unable to save customers locally:",
                error
            );
        }
    };

    const load = async () => {
        try {
            let response = null;

            if (
                window.API?.customers?.getAll
            ) {
                response =
                    await window.API.customers.getAll();
            }

            const data =
                response?.data ??
                response;

            if (Array.isArray(data)) {
                state.customers = data;
            } else if (
                Array.isArray(
                    data?.customers
                )
            ) {
                state.customers =
                    data.customers;
            } else {
                state.customers =
                    loadLocalCustomers();
            }
        } catch (error) {
            console.warn(
                "Customer API unavailable:",
                error
            );

            state.customers =
                loadLocalCustomers();
        }

        state.page = 1;

        applyFilters();
        render();
    };

    const applyFilters = () => {
        const search =
            state.search
                .trim()
                .toLowerCase();

        state.filtered =
            state.customers.filter(
                customer => {
                    if (!search) {
                        return true;
                    }

                    const name =
                        getName(
                            customer
                        ).toLowerCase();

                    const email =
                        getEmail(
                            customer
                        ).toLowerCase();

                    const phone =
                        getPhone(
                            customer
                        ).toLowerCase();

                    return (
                        name.includes(search) ||
                        email.includes(search) ||
                        phone.includes(search)
                    );
                }
            );
    };

    const render = () => {
        renderStats();
        renderTable();
        renderPagination();
    };

    const renderStats = () => {
        const customers =
            state.customers;

        const total =
            customers.length;

        const spending =
            customers.reduce(
                (sum, customer) =>
                    sum +
                    getTotalSpent(
                        customer
                    ),
                0
            );

        const orders =
            customers.reduce(
                (sum, customer) =>
                    sum +
                    getOrders(
                        customer
                    ),
                0
            );

        const average =
            orders > 0
                ? spending / orders
                : 0;

        setText(
            [
                "#totalCustomers",
                "#customersCount",
                "[data-customer-stat='total']"
            ],
            number(total)
        );

        setText(
            [
                "#customerSpending",
                "#totalCustomerSpending",
                "[data-customer-stat='spending']"
            ],
            `KSh ${money(spending)}`
        );

        setText(
            [
                "#customerOrders",
                "#totalCustomerOrders",
                "[data-customer-stat='orders']"
            ],
            number(orders)
        );

        setText(
            [
                "#averageCustomerOrder",
                "[data-customer-stat='average']"
            ],
            `KSh ${money(average)}`
        );
    };

    const setText = (
        selectors,
        value
    ) => {
        for (const selector of selectors) {
            const elements =
                document.querySelectorAll(selector);

            elements.forEach(element => {
                element.textContent = value;
            });
        }
    };

    const renderTable = () => {
        const tbody =
            $(
                "#customerTableBody"
            ) ||
            $(
                "#customersTableBody"
            ) ||
            $(
                ".customers-table tbody"
            ) ||
            $(
                ".data-table tbody"
            );

        if (!tbody) return;

        const start =
            (state.page - 1) *
            state.perPage;

        const visible =
            state.filtered.slice(
                start,
                start +
                    state.perPage
            );

        if (!visible.length) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="table-empty"
                    >
                        No customers found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            visible
                .map(customer => {
                    const id =
                        getId(customer);

                    return `
                        <tr>
                            <td>
                                <div class="customer-cell">
                                    <div class="customer-avatar">
                                        ${escapeHTML(
                                            getName(
                                                customer
                                            )
                                                .charAt(0)
                                                .toUpperCase()
                                        )}
                                    </div>

                                    <div>
                                        <strong>
                                            ${escapeHTML(
                                                getName(
                                                    customer
                                                )
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                getEmail(
                                                    customer
                                                )
                                            )}
                                        </small>
                                    </div>
                                </div>
                            </td>

                            <td>
                                ${escapeHTML(
                                    getPhone(
                                        customer
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getAddress(
                                        customer
                                    )
                                )}
                            </td>

                            <td>
                                ${number(
                                    getOrders(
                                        customer
                                    )
                                )}
                            </td>

                            <td>
                                KSh ${money(
                                    getTotalSpent(
                                        customer
                                    )
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    getCreatedAt(
                                        customer
                                    )
                                )}
                            </td>

                            <td>
                                <div class="table-actions">
                                    <button
                                        type="button"
                                        class="action-button view-customer"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button edit-customer"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button delete-customer"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                })
                .join("");

        $$(".view-customer", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        view(
                            button.dataset.id
                        )
                );
            });

        $$(".edit-customer", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        edit(
                            button.dataset.id
                        )
                );
            });

        $$(".delete-customer", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        remove(
                            button.dataset.id
                        )
                );
            });
    };

    const renderPagination = () => {
        const container =
            $(
                "#customerPagination"
            ) ||
            $(
                "#customersPagination"
            ) ||
            $(
                ".customers-pagination"
            );

        if (!container) return;

        const pages =
            Math.max(
                1,
                Math.ceil(
                    state.filtered.length /
                        state.perPage
                )
            );

        if (state.page > pages) {
            state.page = pages;
        }

        container.innerHTML = `
            <button
                type="button"
                class="pagination-button"
                data-customer-page="previous"
                ${
                    state.page <= 1
                        ? "disabled"
                        : ""
                }
            >
                Previous
            </button>

            <span class="pagination-info">
                Page ${state.page}
                of ${pages}
            </span>

            <button
                type="button"
                class="pagination-button"
                data-customer-page="next"
                ${
                    state.page >= pages
                        ? "disabled"
                        : ""
                }
            >
                Next
            </button>
        `;

        $(
            '[data-customer-page="previous"]',
            container
        )?.addEventListener(
            "click",
            () => {
                if (state.page > 1) {
                    state.page--;

                    renderTable();
                    renderPagination();
                }
            }
        );

        $(
            '[data-customer-page="next"]',
            container
        )?.addEventListener(
            "click",
            () => {
                if (state.page < pages) {
                    state.page++;

                    renderTable();
                    renderPagination();
                }
            }
        );
    };

    const openModal = () => {
        const modal =
            $("#customerModal") ||
            $(".customer-modal");

        if (!modal) return;

        modal.classList.add("open");

        document.body.style.overflow =
            "hidden";
    };

    const closeModal = () => {
        const modal =
            $("#customerModal") ||
            $(".customer-modal");

        if (!modal) return;

        modal.classList.remove("open");

        document.body.style.overflow =
            "";
    };

    const clearForm = () => {
        const form =
            $("#customerForm");

        if (!form) return;

        form.reset();

        state.editingId = null;

        const title =
            $("#customerModalTitle");

        if (title) {
            title.textContent =
                "Add Customer";
        }
    };

    const setFormValue = (
        form,
        name,
        value
    ) => {
        const input =
            form.querySelector(
                `[name="${name}"]`
            );

        if (input) {
            input.value =
                value ?? "";
        }
    };

    const edit = id => {
        const customer =
            state.customers.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!customer) {
            toast(
                "Customer could not be found.",
                "error"
            );

            return;
        }

        state.editingId =
            getId(customer);

        const form =
            $("#customerForm");

        if (!form) return;

        const fullName =
            getName(customer);

        const nameParts =
            fullName.split(" ");

        setFormValue(
            form,
            "name",
            fullName
        );

        setFormValue(
            form,
            "firstName",
            customer.firstName ??
                nameParts.shift() ??
                ""
        );

        setFormValue(
            form,
            "lastName",
            customer.lastName ??
                nameParts.join(" ")
        );

        setFormValue(
            form,
            "email",
            getEmail(customer) ===
                "—"
                ? ""
                : getEmail(customer)
        );

        setFormValue(
            form,
            "phone",
            getPhone(customer) ===
                "—"
                ? ""
                : getPhone(customer)
        );

        setFormValue(
            form,
            "address",
            getAddress(customer) ===
                "—"
                ? ""
                : getAddress(customer)
        );

        setFormValue(
            form,
            "notes",
            customer.notes ??
                ""
        );

        const title =
            $("#customerModalTitle");

        if (title) {
            title.textContent =
                "Edit Customer";
        }

        openModal();
    };

    const getFormData = form => {
        const data =
            new FormData(form);

        const firstName =
            String(
                data.get(
                    "firstName"
                ) || ""
            ).trim();

        const lastName =
            String(
                data.get(
                    "lastName"
                ) || ""
            ).trim();

        const nameField =
            String(
                data.get(
                    "name"
                ) || ""
            ).trim();

        const name =
            nameField ||
            `${firstName} ${lastName}`.trim();

        return {
            name,

            firstName,

            lastName,

            email:
                String(
                    data.get(
                        "email"
                    ) || ""
                ).trim(),

            phone:
                String(
                    data.get(
                        "phone"
                    ) || ""
                ).trim(),

            address:
                String(
                    data.get(
                        "address"
                    ) || ""
                ).trim(),

            notes:
                String(
                    data.get(
                        "notes"
                    ) || ""
                ).trim()
        };
    };

    const validate = customer => {
        if (!customer.name) {
            return "Customer name is required.";
        }

        if (
            customer.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                customer.email
            )
        ) {
            return "Please enter a valid email address.";
        }

        if (
            !customer.phone
        ) {
            return "Phone number is required.";
        }

        return null;
    };

    const save = async customer => {
        const validation =
            validate(customer);

        if (validation) {
            toast(
                validation,
                "error"
            );

            return false;
        }

        try {
            if (
                state.editingId !==
                null
            ) {
                if (
                    window.API?.customers
                        ?.update
                ) {
                    await window.API.customers.update(
                        state.editingId,
                        customer
                    );
                }

                const index =
                    state.customers.findIndex(
                        item =>
                            String(
                                getId(item)
                            ) ===
                            String(
                                state.editingId
                            )
                    );

                if (index !== -1) {
                    state.customers[
                        index
                    ] = {
                        ...state.customers[
                            index
                        ],
                        ...customer,
                        id:
                            state.editingId
                    };
                }

                toast(
                    "Customer updated successfully."
                );
            } else {
                let created = null;

                if (
                    window.API?.customers
                        ?.create
                ) {
                    const response =
                        await window.API.customers.create(
                            customer
                        );

                    created =
                        response?.data ??
                        response;
                }

                state.customers.unshift(
                    created || {
                        ...customer,

                        id:
                            `local-${Date.now()}`,

                        orders: 0,

                        totalSpent: 0,

                        createdAt:
                            new Date().toISOString()
                    }
                );

                toast(
                    "Customer added successfully."
                );
            }

            saveLocalCustomers();

            applyFilters();
            render();

            closeModal();
            clearForm();

            return true;
        } catch (error) {
            console.error(
                "Customer save error:",
                error
            );

            toast(
                error.message ||
                    "Unable to save customer.",
                "error"
            );

            return false;
        }
    };

    const remove = async id => {
        const customer =
            state.customers.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!customer) return;

        const confirmed =
            window.confirm(
                `Delete "${getName(
                    customer
                )}"? This action cannot be undone.`
            );

        if (!confirmed) return;

        try {
            if (
                window.API?.customers
                    ?.delete
            ) {
                await window.API.customers.delete(
                    id
                );
            }

            state.customers =
                state.customers.filter(
                    item =>
                        String(
                            getId(item)
                        ) !==
                        String(id)
                );

            saveLocalCustomers();

            applyFilters();
            render();

            toast(
                "Customer deleted successfully."
            );
        } catch (error) {
            console.error(
                "Customer deletion error:",
                error
            );

            toast(
                error.message ||
                    "Unable to delete customer.",
                "error"
            );
        }
    };

    const view = async id => {
        let customer =
            state.customers.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!customer) return;

        try {
            if (
                window.API?.customers?.get
            ) {
                const response =
                    await window.API.customers.get(
                        id
                    );

                const data =
                    response?.data ??
                    response;

                if (data) {
                    customer =
                        data.customer ??
                        data;
                }
            }
        } catch (error) {
            console.warn(
                "Unable to load customer details:",
                error
            );
        }

        showDetails(customer);
    };

    const showDetails = customer => {
        let modal =
            $("#customerDetailsModal");

        if (!modal) {
            modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "customerDetailsModal";

            modal.className =
                "modal customer-details-modal";

            document.body.appendChild(
                modal
            );
        }

        modal.innerHTML = `
            <div class="modal-overlay"></div>

            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <span class="modal-eyebrow">
                            Customer Profile
                        </span>

                        <h2>
                            ${escapeHTML(
                                getName(
                                    customer
                                )
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="modal-close"
                        data-close-customer-details
                    >
                        ×
                    </button>
                </div>

                <div class="customer-profile">
                    <div class="customer-avatar large">
                        ${escapeHTML(
                            getName(
                                customer
                            )
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>
                        <h3>
                            ${escapeHTML(
                                getName(
                                    customer
                                )
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                getEmail(
                                    customer
                                )
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                getPhone(
                                    customer
                                )
                            )}
                        </p>
                    </div>
                </div>

                <div class="customer-details-grid">
                    <div>
                        <span>
                            Total Orders
                        </span>

                        <strong>
                            ${number(
                                getOrders(
                                    customer
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Total Spent
                        </span>

                        <strong>
                            KSh ${money(
                                getTotalSpent(
                                    customer
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Address
                        </span>

                        <strong>
                            ${escapeHTML(
                                getAddress(
                                    customer
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Customer Since
                        </span>

                        <strong>
                            ${formatDate(
                                getCreatedAt(
                                    customer
                                )
                            )}
                        </strong>
                    </div>
                </div>

                ${
                    customer.notes
                        ? `
                            <div class="customer-notes">
                                <h3>
                                    Notes
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        customer.notes
                                    )}
                                </p>
                            </div>
                        `
                        : ""
                }

                <div class="modal-footer">
                    <button
                        type="button"
                        class="button secondary"
                        data-close-customer-details
                    >
                        Close
                    </button>
                </div>
            </div>
        `;

        modal.classList.add(
            "open"
        );

        document.body.style.overflow =
            "hidden";

        $$(
            "[data-close-customer-details]",
            modal
        ).forEach(button => {
            button.addEventListener(
                "click",
                closeDetails
            );
        });

        $(
            ".modal-overlay",
            modal
        )?.addEventListener(
            "click",
            closeDetails
        );
    };

    const closeDetails = () => {
        const modal =
            $("#customerDetailsModal");

        if (!modal) return;

        modal.classList.remove(
            "open"
        );

        document.body.style.overflow =
            "";
    };

    const setupForm = () => {
        const form =
            $("#customerForm");

        if (!form) return;

        form.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const customer =
                    getFormData(
                        form
                    );

                const button =
                    form.querySelector(
                        'button[type="submit"]'
                    );

                if (button) {
                    button.disabled =
                        true;
                }

                await save(
                    customer
                );

                if (button) {
                    button.disabled =
                        false;
                }
            }
        );
    };

    const setupModal = () => {
        $$(
            "[data-add-customer]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    clearForm();
                    openModal();
                }
            );
        });

        $$(
            "[data-close-customer-modal]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                closeModal
            );
        });

        const modal =
            $("#customerModal");

        modal?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    modal
                ) {
                    closeModal();
                }
            }
        );
    };

    const setupSearch = () => {
        const input =
            $("#customerSearch") ||
            $("#searchCustomers") ||
            $(
                'input[data-customer-search]'
            );

        if (!input) return;

        input.addEventListener(
            "input",
            event => {
                state.search =
                    event.target.value;

                state.page = 1;

                applyFilters();
                renderTable();
                renderPagination();
            }
        );
    };

    const setupRefresh = () => {
        $$(
            "[data-customers-refresh]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    await load();

                    toast(
                        "Customers refreshed."
                    );
                }
            );
        });
    };

    const init = async () => {
        setupForm();
        setupModal();
        setupSearch();
        setupRefresh();

        await load();
    };

    return {
        init,
        load,
        refresh: load,
        create: save,
        view,
        edit,
        delete: remove,

        getState: () => ({
            ...state,
            customers: [
                ...state.customers
            ],
            filtered: [
                ...state.filtered
            ]
        })
    };
})();

window.Customers = Customers;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        Customers.init();
    }
);