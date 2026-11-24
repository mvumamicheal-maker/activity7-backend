
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const recordsRouter = require("./routes/records");

const app = express();

// Allow requests from the frontend
app.use(cors({
    origin: process.env.CLIENT_ORIGINS
}));

// Allow the server to understand JSON request bodies
app.use(express.json());

// API home page
app.get("/", (req, res) => {
    res.json({
        project: "IT Support Request Management System",
        studentNumber: "202500736",
        description: "A REST API for managing IT support requests.",
        routes: {
            health: "/health",
            getAll: "GET /api/records",
            getOne: "GET /api/records/:id",
            create: "POST /api/records",
            update: "PUT /api/records/:id",
            delete: "DELETE /api/records/:id"
        },
        fields: ["title", "category", "description", "status"],
        allowedStatuses: ["Pending", "In progress", "Completed"]
    });
});

// Check server and database health
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            status: "OK",
            database: "Connected"
        });
    } catch (error) {
        res.status(503).json({
            status: "Unavailable",
            database: "Disconnected"
        });
    }
});

// Connect the records routes
app.use("/api/records", recordsRouter);

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found."
    });
});

// Handle malformed JSON and unexpected errors
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON request body."
        });
    }

    console.error(error);

    res.status(500).json({
        message: "Internal server error."
    });
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

