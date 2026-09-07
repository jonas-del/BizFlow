 "use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");

const salesRoutes = require("./routes/sales");
const productsRoutes = require("./routes/products");
const customersRoutes = require("./routes/customers");
const expensesRoutes = require("./routes/expenses");
const inventoryRoutes = require("./routes/inventory");
const reportsRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const supplierRoutes = require("./routes/supplier");

const app = express();

const PORT = process.env.PORT || 5050;
const allowedOrigin = process.env.CORS_ORIGIN || true;

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..")));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BizFlow API is running",
        timestamp: new Date().toISOString()
    });
});

app.get("/api", (req, res) => {
    res.status(200).json({
        success: true,
        name: "BizFlow API",
        version: "1.0.0",
        status: "online"
    });
});

app.use("/api/sales", salesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/suppliers", supplierRoutes);

app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }

    res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((err, req, res, next) => {
    console.error("BizFlow API Error:", err);

    if (err instanceof SyntaxError && err.status === 400) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log("");
        console.log("========================================");
        console.log("          BIZFLOW API SERVER");
        console.log("========================================");
        console.log(`Server running on port ${PORT}`);
        console.log(`API: http://localhost:${PORT}/api`);
        console.log(`Health: http://localhost:${PORT}/api/health`);
        console.log(`Sales: http://localhost:${PORT}/api/sales`);
        console.log("========================================");
        console.log("");
    });
}

module.exports = app;