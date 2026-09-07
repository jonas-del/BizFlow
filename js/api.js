 "use strict";

const API = (() => {
    const CONFIG = {
        baseURL: window.BIZFLOW_API_URL || "/api",
        timeout: 15000,
        credentials: "include"
    };

    const request = async (
        endpoint,
        options = {}
    ) => {
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
        inventory,
        reports,
        settings
    };
})();

window.API = API;