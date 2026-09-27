"use strict";

const mysql = require("mysql2/promise");
require("dotenv").config();

const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bizflow_db",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    charset: "utf8mb4",
    multipleStatements: false
};

let pool = null;

const createPool = () => {
    if (!pool) {
        pool = mysql.createPool(config);
    }

    return pool;
};

const getPool = () => createPool();

const testConnection = async () => {
    try {
        const connection = await getPool().getConnection();
        connection.release();
        return true;
    } catch (error) {
        return false;
    }
};

const query = async (sql, params = []) => {
    const connection = await getPool().getConnection();

    try {
        const [rows] = await connection.execute(sql, params);
        return rows;
    } finally {
        connection.release();
    }
};

const normalizeRow = row => {
    if (!row || typeof row !== "object") {
        return row;
    }

    const normalized = { ...row };

    Object.keys(normalized).forEach(key => {
        if (key.endsWith("_at") && normalized[key] instanceof Date) {
            normalized[key] = normalized[key].toISOString();
        }
    });

    return normalized;
};

module.exports = {
    config,
    createPool,
    getPool,
    testConnection,
    query,
    normalizeRow
};
