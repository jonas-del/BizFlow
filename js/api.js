 "use strict";

const API = (() => {
    const isLocalDevelopmentHost =
        ["localhost", "127.0.0.1"].includes(
            window.location.hostname
        );

    const baseURL =
        window.BIZFLOW_API_URL ||
        (isLocalDevelopmentHost &&
        window.location.port &&
        window.location.port !== "5050"
            ? "http://localhost:5050/api"
            : "/api");

    const CONFIG = {
        baseURL,
        timeout: 15000,
        credentials: "include"
    };

    const isBrowserDemo =
        !isLocalDevelopmentHost &&
        !window.BIZFLOW_API_URL;

    const DEMO_STORAGE_KEY = "bizflow_demo_data";

    const createDemoData = () => {
        const now = Date.now();
        const daysAgo = days =>
            new Date(now - days * 86400000).toISOString();

        return {
            products: [
                { id: 1, name: "House Blend Coffee", sku: "DRK-001", category: "Beverages", description: "Medium roast, 250g", costPrice: 420, sellingPrice: 650, stock: 32, lowStockThreshold: 8, unit: "bags", active: true, createdAt: daysAgo(20), updatedAt: daysAgo(2) },
                { id: 2, name: "Canvas Tote Bag", sku: "ACC-014", category: "Accessories", description: "Reusable cotton tote", costPrice: 500, sellingPrice: 900, stock: 4, lowStockThreshold: 6, unit: "pcs", active: true, createdAt: daysAgo(14), updatedAt: daysAgo(1) },
                { id: 3, name: "Ceramic Travel Mug", sku: "HOM-023", category: "Homeware", description: "Insulated 350ml mug", costPrice: 800, sellingPrice: 1450, stock: 18, lowStockThreshold: 5, unit: "pcs", active: true, createdAt: daysAgo(10), updatedAt: daysAgo(3) },
                { id: 4, name: "Lemon Shortbread", sku: "FOO-008", category: "Food", description: "Pack of six", costPrice: 180, sellingPrice: 320, stock: 0, lowStockThreshold: 10, unit: "packs", active: true, createdAt: daysAgo(8), updatedAt: daysAgo(1) }
            ],
            sales: [
                { id: 3, saleNumber: "SALE-000003", customerId: 2, customerName: "Amina Njoroge", paymentMethod: "M-Pesa", status: "completed", cashier: "Demo User", notes: "", date: daysAgo(1), items: [{ id: 1, productId: 1, name: "House Blend Coffee", quantity: 2, price: 650, total: 1300 }], subtotal: 1300, discount: 0, tax: 0, total: 1300, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
                { id: 2, saleNumber: "SALE-000002", customerId: 1, customerName: "James Mwangi", paymentMethod: "Cash", status: "completed", cashier: "Demo User", notes: "", date: daysAgo(3), items: [{ id: 3, productId: 3, name: "Ceramic Travel Mug", quantity: 1, price: 1450, total: 1450 }], subtotal: 1450, discount: 0, tax: 0, total: 1450, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
                { id: 1, saleNumber: "SALE-000001", customerId: null, customerName: "Walk-in Customer", paymentMethod: "Cash", status: "completed", cashier: "Demo User", notes: "", date: daysAgo(5), items: [{ id: 1, productId: 1, name: "House Blend Coffee", quantity: 1, price: 650, total: 650 }], subtotal: 650, discount: 0, tax: 0, total: 650, createdAt: daysAgo(5), updatedAt: daysAgo(5) }
            ],
            customers: [
                { id: 1, name: "James Mwangi", phone: "+254 712 345 678", email: "james@example.com", address: "Westlands, Nairobi", notes: "", totalPurchases: 1450, createdAt: daysAgo(18), updatedAt: daysAgo(3) },
                { id: 2, name: "Amina Njoroge", phone: "+254 723 456 789", email: "amina@example.com", address: "Kilimani, Nairobi", notes: "", totalPurchases: 1300, createdAt: daysAgo(12), updatedAt: daysAgo(1) },
                { id: 3, name: "Peter Otieno", phone: "+254 734 567 890", email: "peter@example.com", address: "Lavington, Nairobi", notes: "", totalPurchases: 0, createdAt: daysAgo(6), updatedAt: daysAgo(6) }
            ],
            expenses: [
                { id: 2, description: "Packaging supplies", category: "Supplies", amount: 2400, date: daysAgo(2), paymentMethod: "M-Pesa", notes: "", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
                { id: 1, description: "Shop internet", category: "Utilities", amount: 3500, date: daysAgo(6), paymentMethod: "M-Pesa", notes: "Monthly plan", createdAt: daysAgo(6), updatedAt: daysAgo(6) }
            ],
            suppliers: [
                { id: 1, name: "Highland Coffee Co.", phone: "+254 711 222 333", email: "orders@highland.example", address: "Nyeri", createdAt: daysAgo(16), updatedAt: daysAgo(4) },
                { id: 2, name: "Everyday Packaging", phone: "+254 722 333 444", email: "hello@everyday.example", address: "Nairobi", createdAt: daysAgo(9), updatedAt: daysAgo(9) }
            ],
            inventoryMovements: [
                { id: 2, productId: 2, quantity: -2, previousStock: 6, stock: 4, reason: "Sale", createdAt: daysAgo(1) },
                { id: 1, productId: 1, quantity: 12, previousStock: 20, stock: 32, reason: "Restock", createdAt: daysAgo(2) }
            ],
            settings: {
                businessName: "The Daily Goods Co.", businessType: "Retail", currency: "KES", currencySymbol: "KSh",
                timezone: "Africa/Nairobi", notifications: true, lowStockAlerts: true, emailReports: false, compactMode: false
            },
            user: { id: 1, name: "Demo User", email: "demo@bizflow.local", role: "owner" }
        };
    };

    const readDemoData = () => {
        try {
            const saved = localStorage.getItem(DEMO_STORAGE_KEY);
            return saved ? JSON.parse(saved) : createDemoData();
        } catch (error) {
            return createDemoData();
        }
    };

    const saveDemoData = data => {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    };

    const demoRequest = (endpoint, options = {}) => {
        const url = new URL(endpoint, window.location.origin);
        const path = url.pathname.replace(/^\/api(?=\/|$)/, "").replace(/\/$/, "") || "/";
        const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
        const method = (options.method || "GET").toUpperCase();
        const body = options.body ? JSON.parse(options.body) : {};
        const query = url.searchParams;
        const data = readDemoData();
        const now = new Date().toISOString();
        const fail = message => { throw new Error(message); };
        const nextId = collection => Math.max(0, ...collection.map(item => Number(item.id) || 0)) + 1;
        const byId = (collection, id) => collection.find(item => String(item.id) === String(id));
        const findIndex = (collection, id) => collection.findIndex(item => String(item.id) === String(id));
        const matchSearch = (items, fields) => {
            const term = String(query.get("q") || query.get("search") || "").toLowerCase();
            return term ? items.filter(item => fields.some(field => String(item[field] || "").toLowerCase().includes(term))) : items;
        };
        const collectionResponse = (name, collection) => ({ success: true, count: collection.length, [name]: collection });
        const persist = response => {
            saveDemoData(data);
            return response;
        };
        const dateInRange = value => {
            const date = new Date(value);
            const from = query.get("from");
            const to = query.get("to");
            if (Number.isNaN(date.getTime())) return false;
            if (from && date < new Date(from)) return false;
            if (to) {
                const end = new Date(to);
                end.setHours(23, 59, 59, 999);
                if (date > end) return false;
            }
            return true;
        };

        if (parts[0] === "health") return { success: true, message: "BizFlow browser demo is ready" };
        if (parts[0] === "auth") {
            if (parts[1] === "login" || parts[1] === "register") {
                if (!body.email || !body.password) fail("Email and password are required");
                data.user = { ...data.user, email: String(body.email).trim().toLowerCase(), name: body.name || body.fullName || data.user.name };
                return persist({ success: true, message: "Login successful", user: data.user, token: "bizflow-browser-demo" });
            }
            if (parts[1] === "me" || parts[1] === "refresh") {
                return { success: true, user: data.user, ...(parts[1] === "refresh" ? { token: "bizflow-browser-demo" } : {}) };
            }
            if (parts[1] === "logout") return { success: true, message: "Logged out successfully" };
        }
        if (parts[0] === "dashboard") {
            const revenue = data.sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
            const expenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
            const lowStockProducts = data.products.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5));
            const summary = { revenue, expenses, profit: revenue - expenses, salesCount: data.sales.length, customersCount: data.customers.length, products: data.products.length, productsCount: data.products.length, lowStockCount: lowStockProducts.length, outOfStock: data.products.filter(product => Number(product.stock || 0) <= 0).length, recentSales: data.sales.slice(0, 10), lowStockProducts, topProducts: [] };
            return { success: true, dashboard: summary, summary, stats: summary, ...summary };
        }
        if (parts[0] === "products" || parts[0] === "customers" || parts[0] === "expenses" || parts[0] === "suppliers") {
            const name = parts[0];
            const collection = data[name];
            const singular = name.slice(0, -1);
            const fields = name === "products" ? ["name", "sku", "category"] : name === "customers" ? ["name", "phone", "email"] : ["name", "description", "category"];
            if (parts[1] === "search" || !parts[1]) {
                if (method === "GET") {
                    const results = name === "products" || name === "customers" ? matchSearch(collection, fields) : collection;
                    const limited = query.has("limit") ? results.slice(0, Number(query.get("limit")) || results.length) : results;
                    return collectionResponse(name, limited);
                }
                if (method === "POST") {
                    const label = body.name || body.productName || body.customerName || body.supplierName || body.description;
                    if (!label) fail(`${singular} name is required`);
                    const record = { ...body, id: nextId(collection), createdAt: now, updatedAt: now };
                    if (name === "expenses") record.description = body.description || body.name;
                    if (name === "customers") record.totalPurchases = 0;
                    collection.push(record);
                    return persist({ success: true, message: `${singular} created successfully`, [singular]: record });
                }
            }
            if (parts[1] && parts[1] !== "search") {
                const id = parts[1];
                const index = findIndex(collection, id);
                if (method === "GET") {
                    if (index < 0) fail(`${singular} not found`);
                    return { success: true, [singular]: collection[index] };
                }
                if (method === "PUT" || method === "PATCH") {
                    if (index < 0) fail(`${singular} not found`);
                    collection[index] = { ...collection[index], ...body, updatedAt: now };
                    return persist({ success: true, message: `${singular} updated successfully`, [singular]: collection[index] });
                }
                if (method === "DELETE") {
                    if (index < 0) fail(`${singular} not found`);
                    const [record] = collection.splice(index, 1);
                    return persist({ success: true, message: `${singular} deleted successfully`, [singular]: record });
                }
            }
        }
        if (parts[0] === "sales") {
            if (parts[1] === "recent" || !parts[1]) {
                const limit = Number(query.get("limit")) || data.sales.length;
                return collectionResponse("sales", data.sales.slice(0, limit));
            }
            const index = findIndex(data.sales, parts[1]);
            if (method === "GET") {
                if (index < 0) fail("Sale not found");
                return { success: true, sale: data.sales[index] };
            }
            if (method === "DELETE") {
                if (index < 0) fail("Sale not found");
                const [sale] = data.sales.splice(index, 1);
                return persist({ success: true, message: "Sale deleted successfully", sale });
            }
            if (method === "POST" || method === "PUT") {
                const items = body.items || body.products || body.cart || [];
                const normalizedItems = items.map((item, itemIndex) => {
                    const quantity = Number(item.quantity ?? item.qty ?? 1);
                    const price = Number(item.price ?? item.unitPrice ?? item.sellingPrice ?? 0);
                    return { id: item.id ?? item.productId ?? itemIndex + 1, productId: item.productId ?? item.id ?? null, name: item.name ?? item.productName ?? "Product", quantity, price, total: Number(item.total ?? item.amount ?? quantity * price) };
                });
                const subtotal = Number(body.subtotal ?? normalizedItems.reduce((sum, item) => sum + item.total, 0));
                const saleId = method === "POST" ? nextId(data.sales) : Number(parts[1]);
                const sale = { ...(index >= 0 ? data.sales[index] : {}), ...body, id: saleId, saleNumber: body.saleNumber || `SALE-${String(saleId).padStart(6, "0")}`, customerName: body.customerName || body.customer || "Walk-in Customer", paymentMethod: body.paymentMethod || body.payment || "cash", status: body.status || "completed", date: body.date || body.saleDate || now, items: normalizedItems, subtotal, discount: Number(body.discount || 0), tax: Number(body.tax ?? body.taxAmount ?? 0), total: Number(body.total ?? body.grandTotal ?? subtotal - Number(body.discount || 0) + Number(body.tax ?? body.taxAmount ?? 0)), createdAt: index >= 0 ? data.sales[index].createdAt : now, updatedAt: now };
                if (method === "POST") data.sales.unshift(sale);
                else if (index >= 0) data.sales[index] = sale;
                else fail("Sale not found");
                return persist({ success: true, message: method === "POST" ? "Sale recorded successfully" : "Sale updated successfully", sale });
            }
        }
        if (parts[0] === "inventory") {
            const lowStock = data.products.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5));
            const outOfStock = data.products.filter(product => Number(product.stock || 0) <= 0);
            const inventory = { products: data.products, totalItems: data.products.reduce((sum, product) => sum + Number(product.stock || 0), 0), totalStockValue: data.products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.costPrice || 0), 0), lowStock, outOfStock, movements: data.inventoryMovements };
            if (parts[1] === "low-stock") return { success: true, count: lowStock.length, products: lowStock, lowStock };
            if (parts[1] === "out-of-stock") return { success: true, count: outOfStock.length, products: outOfStock, outOfStock };
            if (parts[1] === "adjust" && method === "POST") {
                const product = byId(data.products, body.productId);
                if (!product) fail("Product not found");
                const previousStock = Number(product.stock || 0);
                product.stock = Math.max(0, previousStock + Number(body.quantity || 0));
                product.updatedAt = now;
                const movement = { id: nextId(data.inventoryMovements), productId: product.id, quantity: Number(body.quantity || 0), previousStock, stock: product.stock, reason: body.reason || "Manual adjustment", createdAt: now };
                data.inventoryMovements.unshift(movement);
                return persist({ success: true, message: "Inventory adjusted successfully", product, movement });
            }
            return { success: true, inventory };
        }
        if (parts[0] === "settings") {
            if (method === "PUT") data.settings = { ...data.settings, ...body };
            return persist({ success: true, settings: data.settings, ...(method === "PUT" ? { message: "Settings updated successfully" } : {}) });
        }
        if (parts[0] === "reports") {
            const sales = data.sales.filter(item => dateInRange(item.date || item.createdAt));
            const expenses = data.expenses.filter(item => dateInRange(item.date || item.createdAt));
            const revenue = sales.reduce((sum, item) => sum + Number(item.total || 0), 0);
            const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            if (parts[1] === "sales") return { success: true, count: sales.length, sales, revenue, total: revenue };
            if (parts[1] === "revenue") return { success: true, revenue, total: revenue, salesCount: sales.length };
            if (parts[1] === "expenses") return { success: true, count: expenses.length, expenses, total: expenseTotal };
            if (parts[1] === "profit") return { success: true, revenue, expenses: expenseTotal, profit: revenue - expenseTotal };
            if (parts[1] === "inventory") return { success: true, count: data.products.length, products: data.products, totalValue: data.products.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.costPrice || 0), 0) };
        }
        fail(`Demo API route not found: ${method} ${path}`);
    };

    const request = async (
        endpoint,
        options = {}
    ) => {
        if (isBrowserDemo) {
            return demoRequest(endpoint, options);
        }

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            CONFIG.timeout
        );

        try {
            const requestOptions = {
                credentials: CONFIG.credentials,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    ...(options.headers || {})
                },
                ...options,
                signal: controller.signal
            };

            const response = await fetch(
                `${CONFIG.baseURL}${endpoint}`,
                requestOptions
            );

            const contentType =
                response.headers.get("content-type") || "";

            let data = null;

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const message =
                    data?.message ||
                    data?.error ||
                    `Request failed with status ${response.status}`;

                throw new Error(message);
            }

            return data;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    "The server took too long to respond."
                );
            }

            if (
                error instanceof TypeError &&
                error.message.toLowerCase().includes("fetch")
            ) {
                throw new Error(
                    "Unable to connect to the BizFlow backend. Make sure the backend server is running on port 5050."
                );
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    };

    const get = (
        endpoint,
        params = {}
    ) => {
        const query = new URLSearchParams();

        Object.entries(params).forEach(
            ([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    query.set(key, value);
                }
            }
        );

        const queryString = query.toString();

        return request(
            queryString
                ? `${endpoint}?${queryString}`
                : endpoint,
            {
                method: "GET"
            }
        );
    };

    const post = (
        endpoint,
        body = {}
    ) => {
        return request(
            endpoint,
            {
                method: "POST",
                body: JSON.stringify(body)
            }
        );
    };

    const put = (
        endpoint,
        body = {}
    ) => {
        return request(
            endpoint,
            {
                method: "PUT",
                body: JSON.stringify(body)
            }
        );
    };

    const patch = (
        endpoint,
        body = {}
    ) => {
        return request(
            endpoint,
            {
                method: "PATCH",
                body: JSON.stringify(body)
            }
        );
    };

    const remove = endpoint => {
        return request(
            endpoint,
            {
                method: "DELETE"
            }
        );
    };

    const auth = {
        login: credentials =>
            post(
                "/auth/login",
                credentials
            ),

        register: user =>
            post(
                "/auth/register",
                user
            ),

        logout: () =>
            post(
                "/auth/logout"
            ),

        me: () =>
            get(
                "/auth/me"
            ),

        refresh: () =>
            post(
                "/auth/refresh"
            )
    };

    const dashboard = {
        get: params =>
            get(
                "/dashboard",
                params
            ),

        summary: params =>
            get(
                "/dashboard/summary",
                params
            ),

        getSummary: params =>
            get(
                "/dashboard/summary",
                params
            ),

        getStats: params =>
            get(
                "/dashboard/stats",
                params
            )
    };

    const products = {
        getAll: params =>
            get(
                "/products",
                params
            ),

        get: id =>
            get(
                `/products/${encodeURIComponent(id)}`
            ),

        create: product =>
            post(
                "/products",
                product
            ),

        update: (
            id,
            product
        ) =>
            put(
                `/products/${encodeURIComponent(id)}`,
                product
            ),

        updateStock: (
            id,
            stock
        ) =>
            patch(
                `/products/${encodeURIComponent(id)}/stock`,
                {
                    stock
                }
            ),

        delete: id =>
            remove(
                `/products/${encodeURIComponent(id)}`
            ),

        search: query =>
            get(
                "/products/search",
                {
                    q: query
                }
            )
    };

    const sales = {
        getAll: params =>
            get(
                "/sales",
                params
            ),

        get: id =>
            get(
                `/sales/${encodeURIComponent(id)}`
            ),

        create: sale =>
            post(
                "/sales",
                sale
            ),

        update: (
            id,
            sale
        ) =>
            put(
                `/sales/${encodeURIComponent(id)}`,
                sale
            ),

        delete: id =>
            remove(
                `/sales/${encodeURIComponent(id)}`
            ),

        recent: limit =>
            get(
                "/sales/recent",
                {
                    limit
                }
            )
    };

    const customers = {
        getAll: params =>
            get(
                "/customers",
                params
            ),

        get: id =>
            get(
                `/customers/${encodeURIComponent(id)}`
            ),

        create: customer =>
            post(
                "/customers",
                customer
            ),

        update: (
            id,
            customer
        ) =>
            put(
                `/customers/${encodeURIComponent(id)}`,
                customer
            ),

        delete: id =>
            remove(
                `/customers/${encodeURIComponent(id)}`
            ),

        search: query =>
            get(
                "/customers/search",
                {
                    q: query
                }
            )
    };

    const expenses = {
        getAll: params =>
            get(
                "/expenses",
                params
            ),

        get: id =>
            get(
                `/expenses/${encodeURIComponent(id)}`
            ),

        create: expense =>
            post(
                "/expenses",
                expense
            ),

        update: (
            id,
            expense
        ) =>
            put(
                `/expenses/${encodeURIComponent(id)}`,
                expense
            ),

        delete: id =>
            remove(
                `/expenses/${encodeURIComponent(id)}`
            )
    };

    const suppliers = {
        getAll: params =>
            get(
                "/suppliers",
                params
            ),

        get: id =>
            get(
                `/suppliers/${encodeURIComponent(id)}`
            ),

        create: supplier =>
            post(
                "/suppliers",
                supplier
            ),

        update: (
            id,
            supplier
        ) =>
            put(
                `/suppliers/${encodeURIComponent(id)}`,
                supplier
            ),

        delete: id =>
            remove(
                `/suppliers/${encodeURIComponent(id)}`
            )
    };

    const inventory = {
        get: params =>
            get(
                "/inventory",
                params
            ),

        lowStock: () =>
            get(
                "/inventory/low-stock"
            ),

        outOfStock: () =>
            get(
                "/inventory/out-of-stock"
            ),

        adjust: (
            productId,
            quantity,
            reason
        ) =>
            post(
                "/inventory/adjust",
                {
                    productId,
                    quantity,
                    reason
                }
            )
    };

    const reports = {
        sales: params =>
            get(
                "/reports/sales",
                params
            ),

        revenue: params =>
            get(
                "/reports/revenue",
                params
            ),

        expenses: params =>
            get(
                "/reports/expenses",
                params
            ),

        profit: params =>
            get(
                "/reports/profit",
                params
            ),

        inventory: params =>
            get(
                "/reports/inventory",
                params
            )
    };

    const settings = {
        get: () =>
            get(
                "/settings"
            ),

        update: data =>
            put(
                "/settings",
                data
            )
    };

    const upload = async (
        endpoint,
        formData
    ) => {
        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            CONFIG.timeout
        );

        try {
            const response = await fetch(
                `${CONFIG.baseURL}${endpoint}`,
                {
                    method: "POST",
                    credentials: CONFIG.credentials,
                    body: formData,
                    signal: controller.signal
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            const data =
                contentType.includes("application/json")
                    ? await response.json()
                    : await response.text();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Upload failed with status ${response.status}.`
                );
            }

            return data;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error(
                    "The upload took too long to complete."
                );
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    };

    const configure = options => {
        if (
            options &&
            typeof options === "object"
        ) {
            if (
                typeof options.baseURL === "string"
            ) {
                CONFIG.baseURL =
                    options.baseURL.replace(
                        /\/$/,
                        ""
                    );
            }

            if (
                Number.isFinite(options.timeout)
            ) {
                CONFIG.timeout = options.timeout;
            }

            if (
                typeof options.credentials === "string"
            ) {
                CONFIG.credentials =
                    options.credentials;
            }
        }

        return {
            ...CONFIG
        };
    };

    const health = async () => {
        try {
            const result = await get("/health");

            return {
                online: true,
                ...result
            };
        } catch (error) {
            return {
                online: false,
                message: error.message
            };
        }
    };

    return {
        request,
        get,
        post,
        put,
        patch,
        delete: remove,
        upload,
        configure,
        health,

        auth,
        dashboard,
        products,
        sales,
        customers,
        expenses,
        suppliers,
        inventory,
        reports,
        settings
    };
})();

window.API = API;