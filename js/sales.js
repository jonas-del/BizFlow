 "use strict";

const Sales = (() => {
    const state = {
        sales: [],
        filtered: [],
        products: [],
        customers: [],
        search: "",
        status: "",
        paymentMethod: "",
        dateFrom: "",
        dateTo: "",
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

    const getId = item =>
        item?.id ??
        item?.saleId ??
        item?._id;

    const getProductId = item =>
        item?.productId ??
        item?.product?.id ??
        item?.product?._id ??
        item?.items?.[0]?.productId ??
        item?.items?.[0]?.id;

    const getCustomerId = item =>
        item?.customerId ??
        item?.customer?.id ??
        item?.customer?._id;

    const getProductName = item =>
        item?.productName ??
        item?.product?.name ??
        item?.items?.[0]?.name ??
        item?.items?.[0]?.productName ??
        "Unknown Product";

    const getCustomerName = item =>
        item?.customerName ??
        item?.customer?.name ??
        "Walk-in Customer";

    const getQuantity = item =>
        Number(
            item?.quantity ??
            item?.qty ??
            item?.items?.[0]?.quantity ??
            item?.items?.[0]?.qty ??
            1
        ) || 0;

    const getUnitPrice = item =>
        Number(
            item?.unitPrice ??
            item?.price ??
            item?.sellingPrice ??
            item?.items?.[0]?.price ??
            item?.items?.[0]?.unitPrice ??
            item?.items?.[0]?.sellingPrice ??
            0
        ) || 0;

    const getCostPrice = item =>
        Number(
            item?.costPrice ??
            item?.cost ??
            0
        ) || 0;

    const getTotal = item => {
        if (
            item?.total !== undefined &&
            item?.total !== null
        ) {
            return Number(item.total) || 0;
        }

        return (
            getQuantity(item) *
            getUnitPrice(item)
        );
    };

    const getProfit = item => {
        if (
            item?.profit !== undefined &&
            item?.profit !== null
        ) {
            return Number(item.profit) || 0;
        }

        return (
            getQuantity(item) *
            (
                getUnitPrice(item) -
                getCostPrice(item)
            )
        );
    };

    const getStatus = item =>
        item?.status ??
        "completed";

    const getPaymentMethod = item =>
        item?.paymentMethod ??
        item?.payment ??
        "Cash";

    const getDate = item =>
        item?.date ??
        item?.saleDate ??
        item?.createdAt ??
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

    const formatDateTime = value => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat("en-KE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    };

    const loadLocalSales = () => {
        try {
            const stored =
                localStorage.getItem(
                    "bizflow_sales"
                );

            return stored
                ? JSON.parse(stored)
                : [];
        } catch {
            return [];
        }
    };

    const loadLocalProducts = () => {
        try {
            const stored =
                localStorage.getItem(
                    "bizflow_products"
                );

            return stored
                ? JSON.parse(stored)
                : [];
        } catch {
            return [];
        }
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

    const saveLocalSales = () => {
        try {
            localStorage.setItem(
                "bizflow_sales",
                JSON.stringify(
                    state.sales
                )
            );
        } catch (error) {
            console.warn(
                "Unable to save sales locally:",
                error
            );
        }
    };

    const loadProducts = async () => {
        try {
            if (
                window.API?.products?.getAll
            ) {
                const response =
                    await window.API.products.getAll();

                const data =
                    response?.data ??
                    response;

                state.products =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                              data?.products
                          )
                        ? data.products
                        : loadLocalProducts();

                return;
            }
        } catch (error) {
            console.warn(
                "Product API unavailable:",
                error
            );
        }

        state.products =
            loadLocalProducts();
    };

    const loadCustomers = async () => {
        try {
            if (
                window.API?.customers?.getAll
            ) {
                const response =
                    await window.API.customers.getAll();

                const data =
                    response?.data ??
                    response;

                state.customers =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                              data?.customers
                          )
                        ? data.customers
                        : loadLocalCustomers();

                return;
            }
        } catch (error) {
            console.warn(
                "Customer API unavailable:",
                error
            );
        }

        state.customers =
            loadLocalCustomers();
    };

    const load = async () => {
        try {
            let response = null;

            if (
                window.API?.sales?.getAll
            ) {
                response =
                    await window.API.sales.getAll();
            }

            const data =
                response?.data ??
                response;

            if (Array.isArray(data)) {
                state.sales = data;
            } else if (
                Array.isArray(data?.sales)
            ) {
                state.sales =
                    data.sales;
            } else {
                state.sales =
                    loadLocalSales();
            }
        } catch (error) {
            console.warn(
                "Sales API unavailable:",
                error
            );

            state.sales =
                loadLocalSales();
        }

        await Promise.all([
            loadProducts(),
            loadCustomers()
        ]);

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
            state.sales.filter(sale => {
                const id =
                    String(
                        getId(sale) ?? ""
                    ).toLowerCase();

                const product =
                    getProductName(sale)
                        .toLowerCase();

                const customer =
                    getCustomerName(sale)
                        .toLowerCase();

                const status =
                    getStatus(sale)
                        .toLowerCase();

                const payment =
                    getPaymentMethod(sale)
                        .toLowerCase();

                const saleDate =
                    getDate(sale);

                const matchesSearch =
                    !search ||
                    id.includes(search) ||
                    product.includes(search) ||
                    customer.includes(search) ||
                    status.includes(search) ||
                    payment.includes(search);

                const matchesStatus =
                    !state.status ||
                    getStatus(sale) ===
                        state.status;

                const matchesPayment =
                    !state.paymentMethod ||
                    getPaymentMethod(
                        sale
                    ) ===
                        state.paymentMethod;

                let matchesFrom = true;
                let matchesTo = true;

                if (
                    state.dateFrom &&
                    saleDate
                ) {
                    const date =
                        new Date(
                            saleDate
                        );

                    const from =
                        new Date(
                            `${state.dateFrom}T00:00:00`
                        );

                    matchesFrom =
                        date >= from;
                }

                if (
                    state.dateTo &&
                    saleDate
                ) {
                    const date =
                        new Date(
                            saleDate
                        );

                    const to =
                        new Date(
                            `${state.dateTo}T23:59:59`
                        );

                    matchesTo =
                        date <= to;
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPayment &&
                    matchesFrom &&
                    matchesTo
                );
            });
    };

    const render = () => {
        renderStats();
        renderTable();
        renderPagination();
    };

    const renderStats = () => {
        const sales =
            state.sales;

        const revenue =
            sales.reduce(
                (sum, sale) =>
                    sum +
                    getTotal(sale),
                0
            );

        const profit =
            sales.reduce(
                (sum, sale) =>
                    sum +
                    getProfit(sale),
                0
            );

        const units =
            sales.reduce(
                (sum, sale) =>
                    sum +
                    getQuantity(sale),
                0
            );

        const completed =
            sales.filter(
                sale =>
                    getStatus(sale) ===
                    "completed"
            ).length;

        setText(
            [
                "#totalSales",
                "#salesCount",
                "[data-sales-stat='count']"
            ],
            number(sales.length)
        );

        setText(
            [
                "#salesRevenue",
                "#totalSalesRevenue",
                "[data-sales-stat='revenue']"
            ],
            `KSh ${money(revenue)}`
        );

        setText(
            [
                "#salesProfit",
                "#totalSalesProfit",
                "[data-sales-stat='profit']"
            ],
            `KSh ${money(profit)}`
        );

        setText(
            [
                "#salesUnits",
                "#totalSalesUnits",
                "[data-sales-stat='units']"
            ],
            number(units)
        );

        setText(
            [
                "#completedSales",
                "[data-sales-stat='completed']"
            ],
            number(completed)
        );
    };

    const setText = (
        selectors,
        value
    ) => {
        for (const selector of selectors) {
            const element =
                $(selector);

            if (element) {
                element.textContent =
                    value;

                return;
            }
        }
    };

    const renderTable = () => {
        const tbody =
            $("#salesTableBody") ||
            $(".sales-table tbody") ||
            $(".data-table tbody");

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
                        colspan="9"
                        class="table-empty"
                    >
                        No sales found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            visible
                .map(sale => {
                    const status =
                        getStatus(sale);

                    const statusClass =
                        status
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                "-"
                            );

                    const id =
                        getId(sale);

                    return `
                        <tr>
                            <td>
                                <strong>
                                    #${escapeHTML(
                                        id ??
                                            "—"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    getProductName(
                                        sale
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getCustomerName(
                                        sale
                                    )
                                )}
                            </td>

                            <td>
                                ${number(
                                    getQuantity(
                                        sale
                                    )
                                )}
                            </td>

                            <td>
                                KSh ${money(
                                    getUnitPrice(
                                        sale
                                    )
                                )}
                            </td>

                            <td>
                                <strong>
                                    KSh ${money(
                                        getTotal(
                                            sale
                                        )
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    getPaymentMethod(
                                        sale
                                    )
                                )}
                            </td>

                            <td>
                                <span
                                    class="sale-status ${escapeHTML(
                                        statusClass
                                    )}"
                                >
                                    ${escapeHTML(
                                        status
                                    )}
                                </span>
                            </td>

                            <td>
                                ${formatDate(
                                    getDate(
                                        sale
                                    )
                                )}
                            </td>

                            <td>
                                <div class="table-actions">
                                    <button
                                        type="button"
                                        class="action-button view-sale"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button edit-sale"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button delete-sale"
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

        $$(".view-sale", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        view(
                            button.dataset.id
                        )
                );
            });

        $$(".edit-sale", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        edit(
                            button.dataset.id
                        )
                );
            });

        $$(".delete-sale", tbody)
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
            $("#salesPagination") ||
            $(".sales-pagination");

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
                data-sales-page="previous"
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
                data-sales-page="next"
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
            '[data-sales-page="previous"]',
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
            '[data-sales-page="next"]',
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
            $("#saleModal") ||
            $(".sale-modal");

        if (!modal) return;

        populateProductSelect();
        populateCustomerSelect();

        modal.classList.add("open");

        document.body.style.overflow =
            "hidden";
    };

    const closeModal = () => {
        const modal =
            $("#saleModal") ||
            $(".sale-modal");

        if (!modal) return;

        modal.classList.remove("open");

        document.body.style.overflow =
            "";
    };

    const clearForm = () => {
        const form =
            $("#saleForm");

        if (!form) return;

        form.reset();

        state.editingId = null;

        const title =
            $("#saleModalTitle");

        if (title) {
            title.textContent =
                "Record Sale";
        }

        updateSalePreview();
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

    const populateProductSelect = () => {
        const selects = [
            $("#saleProduct"),
            $("#productSelect")
        ].filter(Boolean);

        if (!selects.length) return;

        selects.forEach(select => {
            const current =
                select.value;

            select.innerHTML = `
                <option value="">
                    Select product
                </option>

                ${state.products
                    .map(product => {
                        const id =
                            product.id ??
                            product.productId ??
                            product._id;

                        const name =
                            product.name ??
                            product.productName ??
                            "Unnamed Product";

                        const stock =
                            Number(
                                product.stock ??
                                product.quantity ??
                                0
                            ) || 0;

                        const price =
                            Number(
                                product.price ??
                                product.sellingPrice ??
                                0
                            ) || 0;

                        return `
                            <option
                                value="${escapeHTML(
                                    id
                                )}"
                                data-price="${price}"
                                data-stock="${stock}"
                            >
                                ${escapeHTML(
                                    name
                                )}
                                — KSh ${money(
                                    price
                                )}
                                — Stock:
                                ${number(
                                    stock
                                )}
                            </option>
                        `;
                    })
                    .join("")}
            `;

            if (current) {
                select.value =
                    current;
            }
        });
    };

    const populateCustomerSelect = () => {
        const selects = [
            $("#saleCustomer"),
            $("#customerSelect")
        ].filter(Boolean);

        if (!selects.length) return;

        selects.forEach(select => {
            const current =
                select.value;

            select.innerHTML = `
                <option value="">
                    Walk-in Customer
                </option>

                ${state.customers
                    .map(customer => {
                        const id =
                            customer.id ??
                            customer.customerId ??
                            customer._id;

                        const name =
                            customer.name ??
                            customer.customerName ??
                            customer.fullName ??
                            "Unnamed Customer";

                        return `
                            <option
                                value="${escapeHTML(
                                    id
                                )}"
                            >
                                ${escapeHTML(
                                    name
                                )}
                            </option>
                        `;
                    })
                    .join("")}
            `;

            if (current) {
                select.value =
                    current;
            }
        });
    };

    const getSelectedProduct = form => {
        const select =
            form.querySelector(
                '[name="productId"]'
            ) ||
            form.querySelector(
                "#saleProduct"
            ) ||
            form.querySelector(
                "#productSelect"
            );

        if (!select) return null;

        const id =
            select.value;

        if (!id) return null;

        return (
            state.products.find(
                product =>
                    String(
                        product.id ??
                        product.productId ??
                        product._id
                    ) === String(id)
            ) || null
        );
    };

    const getSelectedCustomer = form => {
        const select =
            form.querySelector(
                '[name="customerId"]'
            ) ||
            form.querySelector(
                "#saleCustomer"
            ) ||
            form.querySelector(
                "#customerSelect"
            );

        if (!select) return null;

        const id =
            select.value;

        if (!id) return null;

        return (
            state.customers.find(
                customer =>
                    String(
                        customer.id ??
                        customer.customerId ??
                        customer._id
                    ) === String(id)
            ) || null
        );
    };

    const getFormNumber = (
        form,
        names,
        fallback = 0
    ) => {
        for (const name of names) {
            const input =
                form.querySelector(
                    `[name="${name}"]`
                );

            if (
                input &&
                input.value !== ""
            ) {
                const value =
                    Number(input.value);

                if (
                    Number.isFinite(value)
                ) {
                    return value;
                }
            }
        }

        return fallback;
    };

    const getFormString = (
        form,
        names,
        fallback = ""
    ) => {
        for (const name of names) {
            const input =
                form.querySelector(
                    `[name="${name}"]`
                );

            if (input) {
                return (
                    input.value ??
                    fallback
                );
            }
        }

        return fallback;
    };

    const updateSalePreview = () => {
        const form =
            $("#saleForm");

        if (!form) return;

        const product =
            getSelectedProduct(form);

        const quantity =
            getFormNumber(
                form,
                [
                    "quantity",
                    "qty"
                ],
                1
            );

        let price =
            getFormNumber(
                form,
                [
                    "unitPrice",
                    "price",
                    "sellingPrice"
                ],
                0
            );

        if (
            product &&
            !price
        ) {
            price =
                Number(
                    product.price ??
                    product.sellingPrice ??
                    0
                ) || 0;
        }

        const total =
            quantity * price;

        setText(
            [
                "#salePreviewTotal",
                "#previewTotal",
                "[data-sale-preview='total']"
            ],
            `KSh ${money(total)}`
        );

        setText(
            [
                "#salePreviewPrice",
                "#previewPrice",
                "[data-sale-preview='price']"
            ],
            `KSh ${money(price)}`
        );

        setText(
            [
                "#salePreviewQuantity",
                "#previewQuantity",
                "[data-sale-preview='quantity']"
            ],
            number(quantity)
        );

        setText(
            [
                "#salePreviewStock",
                "#previewStock",
                "[data-sale-preview='stock']"
            ],
            product
                ? number(
                      Number(
                          product.stock ??
                          product.quantity ??
                          0
                      )
                  )
                : "—"
        );
    };

    const validate = sale => {
        if (!sale.productId) {
            toast(
                "Please select a product.",
                "error"
            );

            return false;
        }

        if (
            !Number.isFinite(
                Number(sale.quantity)
            ) ||
            Number(sale.quantity) <= 0
        ) {
            toast(
                "Quantity must be greater than zero.",
                "error"
            );

            return false;
        }

        if (
            !Number.isFinite(
                Number(sale.unitPrice)
            ) ||
            Number(sale.unitPrice) < 0
        ) {
            toast(
                "Selling price cannot be negative.",
                "error"
            );

            return false;
        }

        if (!state.editingId) {
            const product =
                state.products.find(
                    item =>
                        String(
                            item.id ??
                            item.productId ??
                            item._id
                        ) ===
                        String(
                            sale.productId
                        )
                );

            if (product) {
                const stock =
                    Number(
                        product.stock ??
                        product.quantity ??
                        0
                    ) || 0;

                if (
                    Number(sale.quantity) >
                    stock
                ) {
                    toast(
                        `Insufficient stock. Available: ${number(
                            stock
                        )}.`,
                        "error"
                    );

                    return false;
                }
            }
        }

        return true;
    };

    const getFormData = form => {
        const product =
            getSelectedProduct(form);

        const customer =
            getSelectedCustomer(form);

        const productId =
            getFormString(
                form,
                [
                    "productId"
                ],
                product
                    ? (
                          product.id ??
                          product.productId ??
                          product._id
                      )
                    : ""
            );

        const customerId =
            getFormString(
                form,
                [
                    "customerId"
                ],
                customer
                    ? (
                          customer.id ??
                          customer.customerId ??
                          customer._id
                      )
                    : ""
            );

        const productName =
            getFormString(
                form,
                [
                    "productName"
                ],
                product
                    ? (
                          product.name ??
                          product.productName ??
                          ""
                      )
                    : ""
            );

        const customerName =
            getFormString(
                form,
                [
                    "customerName"
                ],
                customer
                    ? (
                          customer.name ??
                          customer.customerName ??
                          customer.fullName ??
                          ""
                      )
                    : "Walk-in Customer"
            );

        const quantity =
            getFormNumber(
                form,
                [
                    "quantity",
                    "qty"
                ],
                1
            );

        let unitPrice =
            getFormNumber(
                form,
                [
                    "unitPrice",
                    "price",
                    "sellingPrice"
                ],
                0
            );

        if (
            !unitPrice &&
            product
        ) {
            unitPrice =
                Number(
                    product.price ??
                    product.sellingPrice ??
                    0
                ) || 0;
        }

        const costPrice =
            Number(
                product?.costPrice ??
                product?.cost ??
                0
            ) || 0;

        const total =
            quantity *
            unitPrice;

        const profit =
            quantity *
            (
                unitPrice -
                costPrice
            );

        const paymentMethod =
            getFormString(
                form,
                [
                    "paymentMethod",
                    "payment"
                ],
                "cash"
            );

        const status =
            getFormString(
                form,
                [
                    "status"
                ],
                "completed"
            );

        const notes =
            getFormString(
                form,
                [
                    "notes",
                    "note"
                ],
                ""
            );

        const date =
            getFormString(
                form,
                [
                    "date",
                    "saleDate"
                ],
                new Date().toISOString()
            );

        return {
            productId,
            customerId:
                customerId || null,
            productName:
                productName ||
                product?.name ||
                product?.productName ||
                "Product",
            customerName:
                customerName ||
                customer?.name ||
                customer?.customerName ||
                "Walk-in Customer",
            quantity,
            unitPrice,
            costPrice,
            total,
            profit,
            paymentMethod,
            status,
            notes,
            date,

            items: [
                {
                    productId,
                    name:
                        productName ||
                        product?.name ||
                        product?.productName ||
                        "Product",
                    quantity,
                    price: unitPrice,
                    costPrice,
                    total,
                    profit
                }
            ]
        };
    };
        const updateLocalProductStock = (
        productId,
        quantityChange
    ) => {
        const index =
            state.products.findIndex(
                product =>
                    String(
                        product.id ??
                        product.productId ??
                        product._id
                    ) ===
                    String(productId)
            );

        if (index === -1) {
            return;
        }

        const product =
            state.products[index];

        const currentStock =
            Number(
                product.stock ??
                product.quantity ??
                0
            ) || 0;

        const newStock =
            Math.max(
                0,
                currentStock +
                    quantityChange
            );

        if (
            product.stock !==
            undefined
        ) {
            product.stock =
                newStock;
        } else if (
            product.quantity !==
            undefined
        ) {
            product.quantity =
                newStock;
        } else {
            product.stock =
                newStock;
        }

        saveProducts();
        populateProductSelect();
        updateSalePreview();
    };

    const saveSaleLocally = sale => {
        const index =
            state.sales.findIndex(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(
                        getId(sale)
                    )
            );

        if (index === -1) {
            state.sales.unshift(
                sale
            );
        } else {
            state.sales[index] =
                sale;
        }

        localStorage.setItem(
            "bizflow_sales",
            JSON.stringify(
                state.sales
            )
        );
    };

    const deleteSaleLocally = id => {
        const index =
            state.sales.findIndex(
                sale =>
                    String(
                        getId(sale)
                    ) ===
                    String(id)
            );

        if (index === -1) {
            return null;
        }

        const removed =
            state.sales.splice(
                index,
                1
            )[0];

        localStorage.setItem(
            "bizflow_sales",
            JSON.stringify(
                state.sales
            )
        );

        return removed;
    };

    const create = async () => {
        const form =
            $("#saleForm");

        if (!form) {
            return;
        }

        const sale =
            getFormData(form);

        const error =
            validate(sale);

        if (error) {
            toast(
                error,
                "error"
            );

            return;
        }

        const submitButton =
            form.querySelector(
                '[type="submit"]'
            );

        const originalText =
            submitButton?.textContent;

        if (submitButton) {
            submitButton.disabled =
                true;

            submitButton.textContent =
                "Saving...";
        }

        try {
            let created;

            if (
                window.API &&
                typeof API.sales?.create ===
                    "function"
            ) {
                const response =
                    await API.sales.create(
                        sale
                    );

                const data =
                    response?.data ??
                    response;

                created =
                    data?.sale ??
                    data;
            } else {
                throw new Error(
                    "Sales API is not available. Please make sure the BizFlow server is running."
                );
            }

            const backendSale =
                created || {};

            const backendItem =
                Array.isArray(
                    backendSale.items
                ) &&
                backendSale.items.length
                    ? backendSale.items[0]
                    : {};

            const normalizedSale = {
                ...sale,
                ...backendSale,

                productId:
                    backendSale.productId ??
                    backendItem.productId ??
                    sale.productId,

                productName:
                    backendSale.productName ??
                    backendItem.name ??
                    sale.productName,

                customerId:
                    backendSale.customerId ??
                    sale.customerId,

                customerName:
                    backendSale.customerName ??
                    sale.customerName,

                quantity:
                    backendSale.quantity ??
                    backendItem.quantity ??
                    sale.quantity,

                unitPrice:
                    backendSale.unitPrice ??
                    backendItem.price ??
                    sale.unitPrice,

                costPrice:
                    backendSale.costPrice ??
                    backendItem.costPrice ??
                    sale.costPrice,

                total:
                    backendSale.total ??
                    sale.total,

                profit:
                    backendSale.profit ??
                    sale.profit,

                items:
                    Array.isArray(
                        backendSale.items
                    ) &&
                    backendSale.items.length
                        ? backendSale.items
                        : sale.items
            };

            saveSaleLocally(
                normalizedSale
            );

            updateLocalProductStock(
                sale.productId,
                -sale.quantity
            );

            state.editingId = null;

            closeModal();

            form.reset();

            render();

            toast(
                "Sale recorded successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Create sale error:",
                error
            );

            toast(
                error?.message ||
                    "Failed to record sale.",
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText ||
                    "Save Sale";
            }
        }
    };

    const update = async () => {
        const form =
            $("#saleForm");

        if (
            !form ||
            state.editingId === null
        ) {
            return;
        }

        const sale =
            getFormData(form);

        const error =
            validate(sale);

        if (error) {
            toast(
                error,
                "error"
            );

            return;
        }

        const oldSale =
            state.sales.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(
                        state.editingId
                    )
            );

        if (!oldSale) {
            toast(
                "Original sale could not be found.",
                "error"
            );

            return;
        }

        const submitButton =
            form.querySelector(
                '[type="submit"]'
            );

        const originalText =
            submitButton?.textContent;

        if (submitButton) {
            submitButton.disabled =
                true;

            submitButton.textContent =
                "Updating...";
        }

        try {
            let updated;

            if (
                window.API &&
                typeof API.sales?.update ===
                    "function"
            ) {
                const response =
                    await API.sales.update(
                        state.editingId,
                        sale
                    );

                const data =
                    response?.data ??
                    response;

                updated =
                    data?.sale ??
                    data;
            } else {
                throw new Error(
                    "Sales API is not available. Please make sure the BizFlow server is running."
                );
            }

            const backendSale =
                updated || {};

            const backendItem =
                Array.isArray(
                    backendSale.items
                ) &&
                backendSale.items.length
                    ? backendSale.items[0]
                    : {};

            const normalizedSale = {
                ...oldSale,
                ...sale,
                ...backendSale,

                productId:
                    backendSale.productId ??
                    backendItem.productId ??
                    sale.productId,

                productName:
                    backendSale.productName ??
                    backendItem.name ??
                    sale.productName,

                customerId:
                    backendSale.customerId ??
                    sale.customerId,

                customerName:
                    backendSale.customerName ??
                    sale.customerName,

                quantity:
                    backendSale.quantity ??
                    backendItem.quantity ??
                    sale.quantity,

                unitPrice:
                    backendSale.unitPrice ??
                    backendItem.price ??
                    sale.unitPrice,

                costPrice:
                    backendSale.costPrice ??
                    backendItem.costPrice ??
                    sale.costPrice,

                total:
                    backendSale.total ??
                    sale.total,

                profit:
                    backendSale.profit ??
                    sale.profit,

                items:
                    Array.isArray(
                        backendSale.items
                    ) &&
                    backendSale.items.length
                        ? backendSale.items
                        : sale.items
            };

            const oldProductId =
                getProductId(
                    oldSale
                );

            const oldQuantity =
                getQuantity(
                    oldSale
                );

            const newProductId =
                getProductId(
                    normalizedSale
                );

            const newQuantity =
                getQuantity(
                    normalizedSale
                );

            if (
                oldProductId &&
                oldQuantity
            ) {
                updateLocalProductStock(
                    oldProductId,
                    oldQuantity
                );
            }

            if (
                newProductId &&
                newQuantity
            ) {
                updateLocalProductStock(
                    newProductId,
                    -newQuantity
                );
            }

            saveSaleLocally(
                normalizedSale
            );

            state.editingId = null;

            closeModal();

            form.reset();

            render();

            toast(
                "Sale updated successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Update sale error:",
                error
            );

            toast(
                error?.message ||
                    "Failed to update sale.",
                "error"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText ||
                    "Save Sale";
            }
        }
    };

    const submit = async event => {
        event.preventDefault();

        if (
            state.editingId !== null
        ) {
            await update();
        } else {
            await create();
        }
    };

    const view = async id => {
        let sale =
            state.sales.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!sale) {
            toast(
                "Sale could not be found.",
                "error"
            );

            return;
        }

        if (
            window.API &&
            typeof API.sales?.get ===
                "function"
        ) {
            try {
                const response =
                    await API.sales.get(
                        id
                    );

                const data =
                    response?.data ??
                    response;

                const remoteSale =
                    data?.sale ??
                    data;

                if (remoteSale) {
                    sale = {
                        ...sale,
                        ...remoteSale
                    };
                }
            } catch (error) {
                console.warn(
                    "Could not load sale details from API:",
                    error
                );
            }
        }

        const productName =
            getProductName(sale);

        const customerName =
            getCustomerName(sale);

        const quantity =
            getQuantity(sale);

        const unitPrice =
            getUnitPrice(sale);

        const total =
            getTotal(sale);

        const paymentMethod =
            getPaymentMethod(sale);

        const status =
            getStatus(sale);

        const date =
            getDate(sale);

        const modal =
            $("#saleViewModal") ||
            $("#viewSaleModal");

        if (modal) {
            const fields = {
                saleId:
                    `#viewSaleId`,
                product:
                    `#viewSaleProduct`,
                customer:
                    `#viewSaleCustomer`,
                quantity:
                    `#viewSaleQuantity`,
                unitPrice:
                    `#viewSaleUnitPrice`,
                total:
                    `#viewSaleTotal`,
                paymentMethod:
                    `#viewSalePaymentMethod`,
                status:
                    `#viewSaleStatus`,
                date:
                    `#viewSaleDate`,
                notes:
                    `#viewSaleNotes`
            };

            setText(
                [fields.saleId],
                `#${getId(sale)}`
            );

            setText(
                [fields.product],
                productName
            );

            setText(
                [fields.customer],
                customerName
            );

            setText(
                [fields.quantity],
                number(quantity)
            );

            setText(
                [fields.unitPrice],
                `KSh ${money(
                    unitPrice
                )}`
            );

            setText(
                [fields.total],
                `KSh ${money(
                    total
                )}`
            );

            setText(
                [fields.paymentMethod],
                paymentMethod
            );

            setText(
                [fields.status],
                status
            );

            setText(
                [fields.date],
                formatDate(date)
            );

            setText(
                [fields.notes],
                sale.notes ||
                    "No notes"
            );

            modal.classList.add(
                "open"
            );

            document.body.style.overflow =
                "hidden";

            return;
        }

        const message = [
            `Sale #${getId(sale)}`,
            `Product: ${productName}`,
            `Customer: ${customerName}`,
            `Quantity: ${number(quantity)}`,
            `Unit price: KSh ${money(unitPrice)}`,
            `Total: KSh ${money(total)}`,
            `Payment: ${paymentMethod}`,
            `Status: ${status}`,
            `Date: ${formatDate(date)}`
        ].join("\n");

        window.alert(message);
    };

    const save = async sale => {
        if (!sale) {
            return;
        }

        const editingId =
            state.editingId;

        try {
            if (
                editingId !== null
            ) {
                let updated;

                if (
                    window.API &&
                    typeof API.sales?.update ===
                        "function"
                ) {
                    const response =
                        await API.sales.update(
                            editingId,
                            sale
                        );

                    const data =
                        response?.data ??
                        response;

                    updated =
                        data?.sale ??
                        data;
                } else {
                    throw new Error(
                        "Sales API is not available. Please make sure the BizFlow server is running."
                    );
                }

                const oldSale =
                    state.sales.find(
                        item =>
                            String(
                                getId(item)
                            ) ===
                            String(
                                editingId
                            )
                    );

                const backendSale =
                    updated || {};

                const backendItem =
                    Array.isArray(
                        backendSale.items
                    ) &&
                    backendSale.items.length
                        ? backendSale.items[0]
                        : {};

                const normalizedSale = {
                    ...(oldSale || {}),
                    ...sale,
                    ...backendSale,

                    productId:
                        backendSale.productId ??
                        backendItem.productId ??
                        sale.productId,

                    productName:
                        backendSale.productName ??
                        backendItem.name ??
                        sale.productName,

                    quantity:
                        backendSale.quantity ??
                        backendItem.quantity ??
                        sale.quantity,

                    unitPrice:
                        backendSale.unitPrice ??
                        backendItem.price ??
                        sale.unitPrice,

                    costPrice:
                        backendSale.costPrice ??
                        backendItem.costPrice ??
                        sale.costPrice,

                    total:
                        backendSale.total ??
                        sale.total,

                    profit:
                        backendSale.profit ??
                        sale.profit,

                    items:
                        Array.isArray(
                            backendSale.items
                        ) &&
                        backendSale.items.length
                            ? backendSale.items
                            : sale.items
                };

                if (oldSale) {
                    const oldProductId =
                        getProductId(
                            oldSale
                        );

                    const oldQuantity =
                        getQuantity(
                            oldSale
                        );

                    if (
                        oldProductId &&
                        oldQuantity
                    ) {
                        updateLocalProductStock(
                            oldProductId,
                            oldQuantity
                        );
                    }
                }

                const newProductId =
                    getProductId(
                        normalizedSale
                    );

                const newQuantity =
                    getQuantity(
                        normalizedSale
                    );

                if (
                    newProductId &&
                    newQuantity
                ) {
                    updateLocalProductStock(
                        newProductId,
                        -newQuantity
                    );
                }

                saveSaleLocally(
                    normalizedSale
                );

                state.editingId =
                    null;

                return normalizedSale;
            }

            let created;

            if (
                window.API &&
                typeof API.sales?.create ===
                    "function"
            ) {
                const response =
                    await API.sales.create(
                        sale
                    );

                const data =
                    response?.data ??
                    response;

                created =
                    data?.sale ??
                    data;
            } else {
                throw new Error(
                    "Sales API is not available. Please make sure the BizFlow server is running."
                );
            }

            const backendSale =
                created || {};

            const backendItem =
                Array.isArray(
                    backendSale.items
                ) &&
                backendSale.items.length
                    ? backendSale.items[0]
                    : {};

            const normalizedSale = {
                ...sale,
                ...backendSale,

                productId:
                    backendSale.productId ??
                    backendItem.productId ??
                    sale.productId,

                productName:
                    backendSale.productName ??
                    backendItem.name ??
                    sale.productName,

                quantity:
                    backendSale.quantity ??
                    backendItem.quantity ??
                    sale.quantity,

                unitPrice:
                    backendSale.unitPrice ??
                    backendItem.price ??
                    sale.unitPrice,

                costPrice:
                    backendSale.costPrice ??
                    backendItem.costPrice ??
                    sale.costPrice,

                total:
                    backendSale.total ??
                    sale.total,

                profit:
                    backendSale.profit ??
                    sale.profit,

                items:
                    Array.isArray(
                        backendSale.items
                    ) &&
                    backendSale.items.length
                        ? backendSale.items
                        : sale.items
            };

            saveSaleLocally(
                normalizedSale
            );

            const productId =
                getProductId(
                    normalizedSale
                );

            const quantity =
                getQuantity(
                    normalizedSale
                );

            if (
                productId &&
                quantity
            ) {
                updateLocalProductStock(
                    productId,
                    -quantity
                );
            }

            return normalizedSale;
        } catch (error) {
            console.error(
                "Save sale error:",
                error
            );

            throw error;
        }
    };

    const remove = async id => {
        const sale =
            state.sales.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!sale) {
            toast(
                "Sale could not be found.",
                "error"
            );

            return;
        }

        const confirmed =
            window.confirm(
                `Delete sale #${getId(
                    sale
                )}? This action cannot be undone.`
            );

        if (!confirmed) {
            return;
        }

        try {
            if (
                window.API &&
                typeof API.sales?.delete ===
                    "function"
            ) {
                await API.sales.delete(
                    id
                );
            } else {
                throw new Error(
                    "Sales API is not available. Please make sure the BizFlow server is running."
                );
            }

            const productId =
                getProductId(sale);

            const quantity =
                getQuantity(sale);

            if (
                productId &&
                quantity
            ) {
                updateLocalProductStock(
                    productId,
                    quantity
                );
            }

            deleteSaleLocally(id);

            if (
                String(
                    state.editingId
                ) === String(id)
            ) {
                state.editingId =
                    null;
            }

            render();

            toast(
                "Sale deleted successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Delete sale error:",
                error
            );

            toast(
                error?.message ||
                    "Failed to delete sale.",
                "error"
            );
        }
    };

    const edit = id => {
        const sale = state.sales.find(item => String(getId(item)) === String(id));

        if (!sale) {
            toast("Sale could not be found.", "error");
            return;
        }

        const form = $("#saleForm");

        if (!form) {
            toast("The sale form is unavailable.", "error");
            return;
        }

        const item = Array.isArray(sale.items) ? sale.items[0] : null;
        state.editingId = getId(sale);

        populateProductSelect();
        populateCustomerSelect();
        setFormValue(form, "productId", sale.productId ?? item?.productId);
        setFormValue(form, "customerId", sale.customerId);
        setFormValue(form, "quantity", sale.quantity ?? item?.quantity ?? 1);
        setFormValue(form, "unitPrice", sale.unitPrice ?? item?.price ?? 0);
        setFormValue(form, "paymentMethod", sale.paymentMethod ?? "cash");
        setFormValue(form, "status", sale.status ?? "completed");
        setFormValue(form, "notes", sale.notes ?? "");

        const title = $("#saleModalTitle");
        if (title) {
            title.textContent = "Edit Sale";
        }

        updateSalePreview();
        openModal();
    };

    const showDetails = sale => {
        let modal =
            $("#saleDetailsModal");

        if (!modal) {
            modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "saleDetailsModal";

            modal.className =
                "modal sale-details-modal";

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
                            Sale Details
                        </span>

                        <h2>
                            Sale #${escapeHTML(
                                getId(sale)
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="modal-close"
                        data-close-sale-details
                    >
                        ×
                    </button>
                </div>

                <div class="sale-details-grid">
                    <div>
                        <span>
                            Product
                        </span>

                        <strong>
                            ${escapeHTML(
                                getProductName(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Customer
                        </span>

                        <strong>
                            ${escapeHTML(
                                getCustomerName(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Quantity
                        </span>

                        <strong>
                            ${number(
                                getQuantity(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Unit Price
                        </span>

                        <strong>
                            KSh ${money(
                                getUnitPrice(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Total
                        </span>

                        <strong>
                            KSh ${money(
                                getTotal(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Profit
                        </span>

                        <strong>
                            KSh ${money(
                                getProfit(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Payment
                        </span>

                        <strong>
                            ${escapeHTML(
                                getPaymentMethod(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Status
                        </span>

                        <strong>
                            ${escapeHTML(
                                getStatus(
                                    sale
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Date
                        </span>

                        <strong>
                            ${formatDateTime(
                                getDate(
                                    sale
                                )
                            )}
                        </strong>
                    </div>
                </div>

                ${
                    sale.notes
                        ? `
                            <div class="sale-notes">
                                <h3>
                                    Notes
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        sale.notes
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
                        data-close-sale-details
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        class="button primary"
                        data-edit-sale
                        data-id="${escapeHTML(
                            getId(sale)
                        )}"
                    >
                        Edit Sale
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
            "[data-close-sale-details]",
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

        $(
            "[data-edit-sale]",
            modal
        )?.addEventListener(
            "click",
            () => {
                closeDetails();

                edit(
                    getId(sale)
                );
            }
        );
    };

    const closeDetails = () => {
        const modal =
            $("#saleDetailsModal");

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "open"
        );

        document.body.style.overflow =
            "";
    };

    const setupForm = () => {
        const form =
            $("#saleForm");

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const sale =
                    getFormData(form);

                const button =
                    form.querySelector(
                        'button[type="submit"]'
                    );

                if (button) {
                    button.disabled =
                        true;

                    button.dataset.originalText =
                        button.textContent;

                    button.textContent =
                        state.editingId !== null
                            ? "Updating..."
                            : "Saving...";
                }

                try {
                    await save(sale);

                    state.editingId =
                        null;
                } catch (error) {
                    console.error(
                        "Form submission error:",
                        error
                    );

                    toast(
                        error?.message ||
                            "Unable to save sale.",
                        "error"
                    );
                } finally {
                    if (button) {
                        button.disabled =
                            false;

                        button.textContent =
                            button.dataset.originalText ||
                            "Save Sale";
                    }
                }
            }
        );

        const product =
            form.querySelector(
                '[name="productId"]'
            ) ||
            form.querySelector(
                '[name="product"]'
            );

        product?.addEventListener(
            "change",
            updateSalePreview
        );

        const quantity =
            form.querySelector(
                '[name="quantity"]'
            );

        quantity?.addEventListener(
            "input",
            updateSalePreview
        );

        const price =
            form.querySelector(
                '[name="unitPrice"]'
            );

        price?.addEventListener(
            "input",
            updateSalePreview
        );
    };

    const setupModal = () => {
        $$(
            "[data-add-sale]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    state.editingId =
                        null;

                    clearForm();

                    populateProductSelect();
                    populateCustomerSelect();

                    const title =
                        $("#saleModalTitle");

                    if (title) {
                        title.textContent =
                            "Add Sale";
                    }

                    openModal();
                }
            );
        });

        $$(
            "[data-close-sale-modal]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                closeModal
            );
        });

        const modal =
            $("#saleModal");

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
            $("#saleSearch") ||
            $("#searchSales") ||
            $(
                'input[data-sale-search]'
            );

        if (!input) {
            return;
        }

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

    const setupFilters = () => {
        const status =
            $("#saleStatusFilter");

        status?.addEventListener(
            "change",
            event => {
                state.status =
                    event.target.value;

                state.page = 1;

                applyFilters();

                renderTable();
                renderPagination();
            }
        );

        const payment =
            $("#salePaymentFilter");

        payment?.addEventListener(
            "change",
            event => {
                state.paymentMethod =
                    event.target.value;

                state.page = 1;

                applyFilters();

                renderTable();
                renderPagination();
            }
        );

        const from =
            $("#saleDateFrom");

        from?.addEventListener(
            "change",
            event => {
                state.dateFrom =
                    event.target.value;

                state.page = 1;

                applyFilters();

                renderTable();
                renderPagination();
            }
        );

        const to =
            $("#saleDateTo");

        to?.addEventListener(
            "change",
            event => {
                state.dateTo =
                    event.target.value;

                state.page = 1;

                applyFilters();

                renderTable();
                renderPagination();
            }
        );

        $$(
            "[data-clear-sale-filters]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    state.search =
                        "";

                    state.status =
                        "";

                    state.paymentMethod =
                        "";

                    state.dateFrom =
                        "";

                    state.dateTo =
                        "";

                    state.page =
                        1;

                    const search =
                        $("#saleSearch") ||
                        $("#searchSales") ||
                        $(
                            'input[data-sale-search]'
                        );

                    if (search) {
                        search.value =
                            "";
                    }

                    if (status) {
                        status.value =
                            "";
                    }

                    if (payment) {
                        payment.value =
                            "";
                    }

                    if (from) {
                        from.value =
                            "";
                    }

                    if (to) {
                        to.value =
                            "";
                    }

                    applyFilters();

                    render();
                }
            );
        });
    };

    const setupRefresh = () => {
        $$(
            "[data-sales-refresh]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    button.disabled =
                        true;

                    const originalText =
                        button.textContent;

                    button.textContent =
                        "Refreshing...";

                    try {
                        await load();

                        toast(
                            "Sales refreshed.",
                            "success"
                        );
                    } catch (error) {
                        console.error(
                            "Sales refresh error:",
                            error
                        );

                        toast(
                            error?.message ||
                                "Unable to refresh sales.",
                            "error"
                        );
                    } finally {
                        button.disabled =
                            false;

                        button.textContent =
                            originalText;
                    }
                }
            );
        });
    };

    const setupKeyboard = () => {
        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                    "Escape"
                ) {
                    closeModal();
                    closeDetails();
                }
            }
        );
    };

    const init = async () => {
        setupForm();
        setupModal();
        setupSearch();
        setupFilters();
        setupRefresh();
        setupKeyboard();

        await load();
    };
        const refresh = async () => {
        await load();
    };

    const reset = () => {
        state.editingId = null;

        clearForm();

        const title =
            $("#saleModalTitle");

        if (title) {
            title.textContent =
                "Add Sale";
        }

        updateSalePreview();
    };

    const destroy = () => {
        closeModal();
        closeDetails();

        state.editingId = null;
    };

    return {
        init,

        load,

        refresh,

        create: save,

        save,

        view,

        edit,

        delete: remove,

        reset,

        destroy,

        getState: () => ({
            ...state,

            sales: [
                ...state.sales
            ],

            filtered: [
                ...state.filtered
            ],

            products: [
                ...state.products
            ],

            customers: [
                ...state.customers
            ]
        })
    };
})();

window.Sales = Sales;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        Sales.init();
    }
);