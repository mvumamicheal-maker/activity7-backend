
const express = require("express");
const pool = require("../db");

const router = express.Router();

const allowedStatuses = [
    "Pending",
    "In progress",
    "Completed"
];

// Validate the request data
function validateRecord(body) {
    const { title, category, description, status } = body;

    if (
        typeof title !== "string" ||
        typeof category !== "string" ||
        typeof description !== "string" ||
        typeof status !== "string"
    ) {
        return "All fields must be text.";
    }

    const clean = {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        status: status.trim()
    };

    if (clean.title.length < 3 || clean.title.length > 80) {
        return "Title must be 3 to 80 characters.";
    }

    if (clean.category.length < 2 || clean.category.length > 40) {
        return "Category must be 2 to 40 characters.";
    }

    if (clean.description.length < 5 || clean.description.length > 300) {
        return "Description must be 5 to 300 characters.";
    }

    if (!allowedStatuses.includes(clean.status)) {
        return "Status must be Pending, In progress, or Completed.";
    }

    return clean;
}

// GET all records
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT * FROM records ORDER BY id ASC"
        );

        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// GET one record
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid record ID." });
        }

        const result = await pool.query(
            "SELECT * FROM records WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST create a record
router.post("/", async (req, res, next) => {
    try {
        const record = validateRecord(req.body);

        if (typeof record === "string") {
            return res.status(400).json({ message: record });
        }

        const result = await pool.query(
            `INSERT INTO records (title, category, description, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                record.title,
                record.category,
                record.description,
                record.status
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT update a record
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid record ID." });
        }

        const record = validateRecord(req.body);

        if (typeof record === "string") {
            return res.status(400).json({ message: record });
        }

        const result = await pool.query(
            `UPDATE records
             SET title = $1, category = $2, description = $3, status = $4
             WHERE id = $5
             RETURNING *`,
            [
                record.title,
                record.category,
                record.description,
                record.status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE a record
router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid record ID." });
        }

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Record not found." });
        }

        res.status(200).json({ message: "Record deleted." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

