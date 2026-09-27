"use strict";

const { query, testConnection } = require("../config/db");
const store = require("./store");

const isSqlReady = async () => {
    try {
        return await testConnection();
    } catch (error) {
        return false;
    }
};

const readCollection = async tableName => {
    if (!(await isSqlReady())) {
        return (store.read()[tableName] || []).map(item => ({ ...item }));
    }

    const rows = await query("SELECT * FROM ?? ORDER BY id DESC", [tableName]);
    return rows.map(row => ({ ...row }));
};

const readById = async (tableName, id) => {
    if (!(await isSqlReady())) {
        const list = store.read()[tableName] || [];
        return list.find(item => String(item.id) === String(id)) || null;
    }

    const rows = await query("SELECT * FROM ?? WHERE id = ? LIMIT 1", [tableName, id]);
    return rows[0] || null;
};

const insertRow = async (tableName, payload) => {
    if (!(await isSqlReady())) {
        const data = store.read();
        const table = data[tableName] || [];
        const record = {
            id: table.length ? Math.max(...table.map(item => Number(item.id) || 0)) + 1 : 1,
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        table.unshift(record);
        data[tableName] = table;
        store.write(data);
        return record;
    }

    const entries = Object.entries(payload || {});
    const columns = entries.map(([key]) => `\`${key}\``).join(", ");
    const values = entries.map(([, value]) => value);
    const placeholders = entries.map(() => "?").join(", ");

    const result = await query(`INSERT INTO ?? (${columns}) VALUES (${placeholders})`, [tableName, ...values]);

    const insertedId = result.insertId;
    return await readById(tableName, insertedId);
};

const updateRow = async (tableName, id, payload) => {
    if (!(await isSqlReady())) {
        const data = store.read();
        const table = data[tableName] || [];
        const index = table.findIndex(item => String(item.id) === String(id));

        if (index === -1) {
            return null;
        }

        const record = {
            ...table[index],
            ...payload,
            updatedAt: new Date().toISOString()
        };

        table[index] = record;
        data[tableName] = table;
        store.write(data);
        return record;
    }

    const entries = Object.entries(payload || {});
    if (!entries.length) {
        return await readById(tableName, id);
    }

    const assignments = entries.map(([key]) => `\`${key}\` = ?`).join(", ");
    const values = entries.map(([, value]) => value);

    await query(`UPDATE ?? SET ${assignments} WHERE id = ?`, [tableName, ...values, id]);
    return await readById(tableName, id);
};

const deleteRow = async (tableName, id) => {
    if (!(await isSqlReady())) {
        const data = store.read();
        const table = data[tableName] || [];
        const index = table.findIndex(item => String(item.id) === String(id));

        if (index === -1) {
            return null;
        }

        const [record] = table.splice(index, 1);
        data[tableName] = table;
        store.write(data);
        return record;
    }

    const row = await readById(tableName, id);
    await query("DELETE FROM ?? WHERE id = ?", [tableName, id]);
    return row;
};

module.exports = {
    isSqlReady,
    readCollection,
    readById,
    insertRow,
    updateRow,
    deleteRow,
    query,
    store
};
