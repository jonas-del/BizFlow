 "use strict";

const Products = (() => {
    const state = {
        products: [],
        filtered: [],
        search: "",
        category: "",
        stockStatus: "",
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

    const getId = product =>
        product.id ??
        product.productId ??
        product._id;

    const getName = product =>
        product.name ??
        product.productName ??
        "Unnamed Product";

    const getSKU = product =>
        product.sku ??
        product.code ??
        product.productCode ??
        "—";

    const getCategory = product =>
        product.categoryName ??
        product.category ??
        "Uncategorized";

    const getPrice = product =>
        Number(
            product.price ??
            product.sellingPrice ??
            product.salePrice ??
            0
        ) || 0;

    const getCost = product =>
        Number(
            product.costPrice ??
            product.cost ??
            purchasePrice(product) ??
            0
        ) || 0;

    const purchasePrice = product =>
        Number(
            product.buyingPrice ??
            product.purchasePrice ??
            0
        ) || 0;

    const getStock = product =>
        Number(
            product.stock ??
            product.quantity ??
            product.stockQuantity ??
            0
        ) || 0;

    const getLowStockLimit = product =>
        Number(
            product.lowStockLimit ??
            product.reorderLevel ??
            product.minimumStock ??
            5
        ) || 0;

    const getUnit = product =>
        product.unit ??
        product.measurementUnit ??
        "pcs";

    const getDescription = product =>
        product.description ??
        "";

    const getStatus = product => {
        const stock = getStock(product);
        const limit = getLowStockLimit(product);

        if (stock <= 0) {
            return "out";
        }

        if (stock <= limit) {
            return "low";
        }

        return "in";
    };

    const getCreatedAt = product =>
        product.createdAt ??
        product.dateCreated ??
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

    const saveLocalProducts = () => {
        try {
            localStorage.setItem(
                "bizflow_products",
                JSON.stringify(state.products)
            );
        } catch (error) {
            console.warn(
                "Unable to save products locally:",
                error
            );
        }
    };

    const load = async () => {
        try {
            let response = null;

            if (
                window.API?.products?.getAll
            ) {
                response =
                    await window.API.products.getAll();
            }

            const data =
                response?.data ??
                response;

            if (Array.isArray(data)) {
                state.products = data;
            } else if (
                Array.isArray(data?.products)
            ) {
                state.products =
                    data.products;
            } else {
                state.products =
                    loadLocalProducts();
            }
        } catch (error) {
            console.warn(
                "Product API unavailable:",
                error
            );

            state.products =
                loadLocalProducts();
        }

        state.page = 1;

        populateCategories();
        applyFilters();
        render();
    };

    const populateCategories = () => {
        const selects = [
            $("#productCategoryFilter"),
            $("#productsCategory"),
            $("#productCategory")
        ].filter(Boolean);

        if (!selects.length) return;

        const categories = [
            ...new Set(
                state.products
                    .map(getCategory)
                    .filter(Boolean)
            )
        ].sort();

        selects.forEach(select => {
            const current = select.value;

            const firstOption =
                select.querySelector(
                    "option:first-child"
                );

            const firstText =
                firstOption?.textContent ||
                "All Categories";

            select.innerHTML = `
                <option value="">
                    ${escapeHTML(firstText)}
                </option>

                ${categories
                    .map(
                        category => `
                            <option value="${escapeHTML(
                                category
                            )}">
                                ${escapeHTML(
                                    category
                                )}
                            </option>
                        `
                    )
                    .join("")}
            `;

            if (
                categories.includes(current)
            ) {
                select.value = current;
            }
        });
    };

    const applyFilters = () => {
        const search =
            state.search
                .trim()
                .toLowerCase();

        state.filtered =
            state.products.filter(product => {
                const name =
                    getName(product)
                        .toLowerCase();

                const sku =
                    getSKU(product)
                        .toLowerCase();

                const category =
                    getCategory(product)
                        .toLowerCase();

                const stockStatus =
                    getStatus(product);

                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    sku.includes(search) ||
                    category.includes(search);

                const matchesCategory =
                    !state.category ||
                    getCategory(product) ===
                        state.category;

                const matchesStock =
                    !state.stockStatus ||
                    stockStatus ===
                        state.stockStatus;

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStock
                );
            });
    };

    const render = () => {
        renderStats();
        renderTable();
        renderPagination();
    };

    const renderStats = () => {
        const total =
            state.products.length;

        const stockUnits =
            state.products.reduce(
                (sum, product) =>
                    sum +
                    getStock(product),
                0
            );

        const inventoryValue =
            state.products.reduce(
                (sum, product) =>
                    sum +
                    getStock(product) *
                        getCost(product),
                0
            );

        const lowStock =
            state.products.filter(
                product =>
                    getStatus(product) ===
                    "low"
            ).length;

        const outOfStock =
            state.products.filter(
                product =>
                    getStatus(product) ===
                    "out"
            ).length;

        setText(
            [
                "#totalProducts",
                "#productsCount",
                "[data-product-stat='total']"
            ],
            number(total)
        );

        setText(
            [
                "#totalStock",
                "#stockUnits",
                "[data-product-stat='stock']"
            ],
            number(stockUnits)
        );

        setText(
            [
                "#inventoryValue",
                "#productsValue",
                "[data-product-stat='value']"
            ],
            `KSh ${money(inventoryValue)}`
        );

        setText(
            [
                "#lowStockProducts",
                "[data-product-stat='low']"
            ],
            number(lowStock)
        );

        setText(
            [
                "#outOfStockProducts",
                "[data-product-stat='out']"
            ],
            number(outOfStock)
        );
    };

    const setText = (
        selectors,
        value
    ) => {
        for (const selector of selectors) {
            const element = $(selector);

            if (element) {
                element.textContent =
                    value;

                return;
            }
        }
    };

    const renderTable = () => {
        const tbody =
            $("#productsTableBody") ||
            $(".products-table tbody") ||
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
                        No products found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            visible
                .map(product => {
                    const status =
                        getStatus(product);

                    const statusLabel =
                        status === "in"
                            ? "In Stock"
                            : status === "low"
                            ? "Low Stock"
                            : "Out of Stock";

                    const id =
                        getId(product);

                    return `
                        <tr>
                            <td>
                                <div class="product-cell">
                                    ${
                                        product.image
                                            ? `
                                                <img
                                                    src="${escapeHTML(
                                                        product.image
                                                    )}"
                                                    alt="${escapeHTML(
                                                        getName(
                                                            product
                                                        )
                                                    )}"
                                                    class="product-image"
                                                >
                                            `
                                            : `
                                                <div class="product-image placeholder">
                                                    ${escapeHTML(
                                                        getName(
                                                            product
                                                        )
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                    )}
                                                </div>
                                            `
                                    }

                                    <div>
                                        <strong>
                                            ${escapeHTML(
                                                getName(
                                                    product
                                                )
                                            )}
                                        </strong>

                                        <small>
                                            SKU:
                                            ${escapeHTML(
                                                getSKU(
                                                    product
                                                )
                                            )}
                                        </small>
                                    </div>
                                </div>
                            </td>

                            <td>
                                ${escapeHTML(
                                    getCategory(
                                        product
                                    )
                                )}
                            </td>

                            <td>
                                KSh ${money(
                                    getPrice(
                                        product
                                    )
                                )}
                            </td>

                            <td>
                                KSh ${money(
                                    getCost(
                                        product
                                    )
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${number(
                                        getStock(
                                            product
                                        )
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        getUnit(
                                            product
                                        )
                                    )}
                                </small>
                            </td>

                            <td>
                                <span
                                    class="stock-status ${escapeHTML(
                                        status
                                    )}"
                                >
                                    ${escapeHTML(
                                        statusLabel
                                    )}
                                </span>
                            </td>

                            <td>
                                ${formatDate(
                                    getCreatedAt(
                                        product
                                    )
                                )}
                            </td>

                            <td>
                                <div class="table-actions">
                                    <button
                                        type="button"
                                        class="action-button view-product"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button edit-product"
                                        data-id="${escapeHTML(
                                            id
                                        )}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="action-button delete-product"
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

        $$(".view-product", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        view(
                            button.dataset.id
                        )
                );
            });

        $$(".edit-product", tbody)
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () =>
                        edit(
                            button.dataset.id
                        )
                );
            });

        $$(".delete-product", tbody)
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
            $("#productsPagination") ||
            $(".products-pagination");

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
                data-product-page="previous"
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
                data-product-page="next"
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
            '[data-product-page="previous"]',
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
            '[data-product-page="next"]',
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
            $("#productModal") ||
            $(".product-modal");

        if (!modal) return;

        modal.classList.add("open");

        document.body.style.overflow =
            "hidden";
    };

    const closeModal = () => {
        const modal =
            $("#productModal") ||
            $(".product-modal");

        if (!modal) return;

        modal.classList.remove("open");

        document.body.style.overflow =
            "";
    };

    const clearForm = () => {
        const form =
            $("#productForm");

        if (!form) return;

        form.reset();

        state.editingId = null;

        const title =
            $("#productModalTitle");

        if (title) {
            title.textContent =
                "Add Product";
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
        const product =
            state.products.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!product) {
            toast(
                "Product could not be found.",
                "error"
            );

            return;
        }

        state.editingId =
            getId(product);

        const form =
            $("#productForm");

        if (!form) return;

        setFormValue(
            form,
            "name",
            getName(product)
        );

        setFormValue(
            form,
            "productName",
            getName(product)
        );

        setFormValue(
            form,
            "sku",
            getSKU(product) === "—"
                ? ""
                : getSKU(product)
        );

        setFormValue(
            form,
            "category",
            getCategory(product)
        );

        setFormValue(
            form,
            "price",
            getPrice(product)
        );

        setFormValue(
            form,
            "sellingPrice",
            getPrice(product)
        );

        setFormValue(
            form,
            "cost",
            getCost(product)
        );

        setFormValue(
            form,
            "costPrice",
            getCost(product)
        );

        setFormValue(
            form,
            "stock",
            getStock(product)
        );

        setFormValue(
            form,
            "quantity",
            getStock(product)
        );

        setFormValue(
            form,
            "lowStockLimit",
            getLowStockLimit(product)
        );

        setFormValue(
            form,
            "reorderLevel",
            getLowStockLimit(product)
        );

        setFormValue(
            form,
            "unit",
            getUnit(product)
        );

        setFormValue(
            form,
            "description",
            getDescription(product)
        );

        setFormValue(
            form,
            "image",
            product.image ?? ""
        );

        const title =
            $("#productModalTitle");

        if (title) {
            title.textContent =
                "Edit Product";
        }

        openModal();
    };

    const getFormData = form => {
        const data =
            new FormData(form);

        const value = name =>
            String(
                data.get(name) || ""
            ).trim();

        const numeric = name =>
            Number(
                data.get(name) || 0
            );

        return {
            name:
                value("name") ||
                value("productName"),

            sku:
                value("sku"),

            category:
                value("category"),

            price:
                numeric("price") ||
                numeric("sellingPrice"),

            costPrice:
                numeric("costPrice") ||
                numeric("cost"),

            stock:
                numeric("stock") ||
                numeric("quantity"),

            lowStockLimit:
                numeric(
                    "lowStockLimit"
                ) ||
                numeric(
                    "reorderLevel"
                ) ||
                5,

            unit:
                value("unit") ||
                "pcs",

            description:
                value("description"),

            image:
                value("image")
        };
    };

    const validate = product => {
        if (!product.name) {
            return "Product name is required.";
        }

        if (!product.category) {
            return "Product category is required.";
        }

        if (
            !Number.isFinite(
                product.price
            ) ||
            product.price < 0
        ) {
            return "Please enter a valid selling price.";
        }

        if (
            !Number.isFinite(
                product.costPrice
            ) ||
            product.costPrice < 0
        ) {
            return "Please enter a valid cost price.";
        }

        if (
            !Number.isFinite(
                product.stock
            ) ||
            product.stock < 0
        ) {
            return "Stock cannot be negative.";
        }

        return null;
    };

    const save = async product => {
        const validation =
            validate(product);

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
                    window.API?.products
                        ?.update
                ) {
                    await window.API.products.update(
                        state.editingId,
                        product
                    );
                }

                const index =
                    state.products.findIndex(
                        item =>
                            String(
                                getId(item)
                            ) ===
                            String(
                                state.editingId
                            )
                    );

                if (index !== -1) {
                    state.products[
                        index
                    ] = {
                        ...state.products[
                            index
                        ],
                        ...product,
                        id:
                            state.editingId
                    };
                }

                toast(
                    "Product updated successfully."
                );
            } else {
                let created = null;

                if (
                    window.API?.products
                        ?.create
                ) {
                    const response =
                        await window.API.products.create(
                            product
                        );

                    created =
                        response?.data ??
                        response;
                }

                state.products.unshift(
                    created || {
                        ...product,

                        id:
                            `local-${Date.now()}`,

                        createdAt:
                            new Date().toISOString()
                    }
                );

                toast(
                    "Product added successfully."
                );
            }

            saveLocalProducts();

            populateCategories();

            applyFilters();
            render();

            closeModal();
            clearForm();

            return true;
        } catch (error) {
            console.error(
                "Product save error:",
                error
            );

            toast(
                error.message ||
                    "Unable to save product.",
                "error"
            );

            return false;
        }
    };

    const remove = async id => {
        const product =
            state.products.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!product) return;

        const confirmed =
            window.confirm(
                `Delete "${getName(
                    product
                )}"? This action cannot be undone.`
            );

        if (!confirmed) return;

        try {
            if (
                window.API?.products
                    ?.delete
            ) {
                await window.API.products.delete(
                    id
                );
            }

            state.products =
                state.products.filter(
                    item =>
                        String(
                            getId(item)
                        ) !==
                        String(id)
                );

            saveLocalProducts();

            applyFilters();
            render();

            toast(
                "Product deleted successfully."
            );
        } catch (error) {
            console.error(
                "Product deletion error:",
                error
            );

            toast(
                error.message ||
                    "Unable to delete product.",
                "error"
            );
        }
    };

    const view = async id => {
        let product =
            state.products.find(
                item =>
                    String(
                        getId(item)
                    ) ===
                    String(id)
            );

        if (!product) return;

        try {
            if (
                window.API?.products?.get
            ) {
                const response =
                    await window.API.products.get(
                        id
                    );

                const data =
                    response?.data ??
                    response;

                if (data) {
                    product =
                        data.product ??
                        data;
                }
            }
        } catch (error) {
            console.warn(
                "Unable to load product details:",
                error
            );
        }

        showDetails(product);
    };

    const showDetails = product => {
        let modal =
            $("#productDetailsModal");

        if (!modal) {
            modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "productDetailsModal";

            modal.className =
                "modal product-details-modal";

            document.body.appendChild(
                modal
            );
        }

        const stockStatus =
            getStatus(product);

        const statusLabel =
            stockStatus === "in"
                ? "In Stock"
                : stockStatus === "low"
                ? "Low Stock"
                : "Out of Stock";

        const profit =
            getPrice(product) -
            getCost(product);

        modal.innerHTML = `
            <div class="modal-overlay"></div>

            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <span class="modal-eyebrow">
                            Product Details
                        </span>

                        <h2>
                            ${escapeHTML(
                                getName(
                                    product
                                )
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="modal-close"
                        data-close-product-details
                    >
                        ×
                    </button>
                </div>

                <div class="product-profile">
                    ${
                        product.image
                            ? `
                                <img
                                    src="${escapeHTML(
                                        product.image
                                    )}"
                                    alt="${escapeHTML(
                                        getName(
                                            product
                                        )
                                    )}"
                                    class="product-detail-image"
                                >
                            `
                            : `
                                <div class="product-detail-image placeholder">
                                    ${escapeHTML(
                                        getName(
                                            product
                                        )
                                            .charAt(
                                                0
                                            )
                                            .toUpperCase()
                                    )}
                                </div>
                            `
                    }

                    <div>
                        <h3>
                            ${escapeHTML(
                                getName(
                                    product
                                )
                            )}
                        </h3>

                        <p>
                            SKU:
                            ${escapeHTML(
                                getSKU(
                                    product
                                )
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                getDescription(
                                    product
                                ) ||
                                "No description available."
                            )}
                        </p>
                    </div>
                </div>

                <div class="product-details-grid">
                    <div>
                        <span>
                            Category
                        </span>

                        <strong>
                            ${escapeHTML(
                                getCategory(
                                    product
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Selling Price
                        </span>

                        <strong>
                            KSh ${money(
                                getPrice(
                                    product
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Cost Price
                        </span>

                        <strong>
                            KSh ${money(
                                getCost(
                                    product
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Unit Profit
                        </span>

                        <strong>
                            KSh ${money(
                                profit
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Current Stock
                        </span>

                        <strong>
                            ${number(
                                getStock(
                                    product
                                )
                            )}
                            ${escapeHTML(
                                getUnit(
                                    product
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Stock Status
                        </span>

                        <strong>
                            ${escapeHTML(
                                statusLabel
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Reorder Level
                        </span>

                        <strong>
                            ${number(
                                getLowStockLimit(
                                    product
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Added
                        </span>

                        <strong>
                            ${formatDate(
                                getCreatedAt(
                                    product
                                )
                            )}
                        </strong>
                    </div>
                </div>

                <div class="modal-footer">
                    <button
                        type="button"
                        class="button secondary"
                        data-close-product-details
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        class="button primary"
                        data-edit-product
                        data-id="${escapeHTML(
                            getId(product)
                        )}"
                    >
                        Edit Product
                    </button>
                </div>
            </div>
        `;

        modal.classList.add("open");

        document.body.style.overflow =
            "hidden";

        $$(
            "[data-close-product-details]",
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
            "[data-edit-product]",
            modal
        )?.addEventListener(
            "click",
            () => {
                closeDetails();

                edit(
                    getId(product)
                );
            }
        );
    };

    const closeDetails = () => {
        const modal =
            $("#productDetailsModal");

        if (!modal) return;

        modal.classList.remove(
            "open"
        );

        document.body.style.overflow =
            "";
    };

    const setupForm = () => {
        const form =
            $("#productForm");

        if (!form) return;

        form.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const product =
                    getFormData(form);

                const button =
                    form.querySelector(
                        'button[type="submit"]'
                    );

                if (button) {
                    button.disabled =
                        true;
                }

                await save(product);

                if (button) {
                    button.disabled =
                        false;
                }
            }
        );
    };

    const setupModal = () => {
        $$(
            "[data-add-product]"
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
            "[data-close-product-modal]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                closeModal
            );
        });

        const modal =
            $("#productModal");

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
            $("#productSearch") ||
            $("#searchProducts") ||
            $(
                'input[data-product-search]'
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

    const setupFilters = () => {
        const category =
            $("#productCategoryFilter");

        category?.addEventListener(
            "change",
            event => {
                state.category =
                    event.target.value;

                state.page = 1;

                applyFilters();
                renderTable();
                renderPagination();
            }
        );

        const stock =
            $("#productStockFilter");

        stock?.addEventListener(
            "change",
            event => {
                state.stockStatus =
                    event.target.value;

                state.page = 1;

                applyFilters();
                renderTable();
                renderPagination();
            }
        );

        $$(
            "[data-clear-product-filters]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    state.search = "";
                    state.category = "";
                    state.stockStatus = "";
                    state.page = 1;

                    const search =
                        $(
                            "#productSearch"
                        );

                    if (search) {
                        search.value =
                            "";
                    }

                    if (category) {
                        category.value =
                            "";
                    }

                    if (stock) {
                        stock.value =
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
            "[data-products-refresh]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                async () => {
                    await load();

                    toast(
                        "Products refreshed."
                    );
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
            products: [
                ...state.products
            ],
            filtered: [
                ...state.filtered
            ]
        })
    };
})();

window.Products = Products;

document.addEventListener(
    "DOMContentLoaded",
    () => {
        Products.init();
    }
);