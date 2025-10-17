const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const handleError = (res, status, message) => {
	res.status(status).json({ error: message });
};

app.get("/api/expenses", async (req, res) => {
	try {
		const { category } = req.query;
		const where = category && category !== "all" ? { category } : {};

		const expenses = await prisma.expense.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		res.json(expenses);
	} catch (error) {
		console.error("Error fetching expenses:", error);
		handleError(res, 500, "Failed to fetch expenses");
	}
});

app.post("/api/expenses", async (req, res) => {
	try {
		const { amount, description, category } = req.body;

		if (!amount || !description || !category) {
			return handleError(res, 400, "Missing required fields");
		}

		if (amount <= 0) {
			return handleError(res, 400, "Amount must be greater than 0");
		}

		if (description.trim().length === 0) {
			return handleError(res, 400, "Description cannot be empty");
		}

		const validCategories = ["Food", "Transport", "Shopping", "Other"];
		if (!validCategories.includes(category)) {
			return handleError(res, 400, "Invalid category");
		}

		const expense = await prisma.expense.create({
			data: {
				amount: parseFloat(amount),
				description: description.trim(),
				category,
			},
		});

		res.status(201).json(expense);
	} catch (error) {
		console.error("Error creating expense:", error);
		handleError(res, 500, "Failed to create expense");
	}
});

app.put("/api/expenses/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { amount, description, category } = req.body;

		const expenseId = parseInt(id);
		if (isNaN(expenseId)) {
			return handleError(res, 400, "Invalid expense ID");
		}

		if (amount !== undefined && amount <= 0) {
			return handleError(res, 400, "Amount must be greater than 0");
		}

		if (description !== undefined && description.trim().length === 0) {
			return handleError(res, 400, "Description cannot be empty");
		}

		if (category !== undefined) {
			const validCategories = ["Food", "Transport", "Shopping", "Other"];
			if (!validCategories.includes(category)) {
				return handleError(res, 400, "Invalid category");
			}
		}

		const updateData = {};
		if (amount !== undefined) updateData.amount = parseFloat(amount);
		if (description !== undefined) updateData.description = description.trim();
		if (category !== undefined) updateData.category = category;

		const expense = await prisma.expense.update({
			where: { id: expenseId },
			data: updateData,
		});

		res.json(expense);
	} catch (error) {
		if (error.code === "P2025") {
			return handleError(res, 404, "Expense not found");
		}
		console.error("Error updating expense:", error);
		handleError(res, 500, "Failed to update expense");
	}
});

app.delete("/api/expenses/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const expenseId = parseInt(id);

		if (isNaN(expenseId)) {
			return handleError(res, 400, "Invalid expense ID");
		}

		await prisma.expense.delete({
			where: { id: expenseId },
		});

		res.json({ message: "Expense deleted successfully" });
	} catch (error) {
		if (error.code === "P2025") {
			return handleError(res, 404, "Expense not found");
		}
		console.error("Error deleting expense:", error);
		handleError(res, 500, "Failed to delete expense");
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", async () => {
	await prisma.$disconnect();
	process.exit(0);
});
