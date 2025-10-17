// frontend/src/App.jsx
import { useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000/api";
const CATEGORIES = ["Food", "Transport", "Shopping", "Other"];

function App() {
	const [expenses, setExpenses] = useState([]);
	const [filteredExpenses, setFilteredExpenses] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		amount: "",
		description: "",
		category: "Food",
	});
	const [formError, setFormError] = useState("");

	// Fetch expenses
	const fetchExpenses = async () => {
		setLoading(true);
		setError("");
		try {
			const url =
				selectedCategory === "all"
					? `${API_BASE_URL}/expenses`
					: `${API_BASE_URL}/expenses?category=${selectedCategory}`;

			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to fetch expenses");

			const data = await response.json();
			setExpenses(data);
			setFilteredExpenses(data);
		} catch (err) {
			setError("Failed to load expenses");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	// Fetch on component mount and when category changes
	useEffect(() => {
		fetchExpenses();
	}, [selectedCategory]);

	// Handle form input changes
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setFormError("");
	};

	// Validate form
	const validateForm = () => {
		if (!formData.amount || !formData.description) {
			setFormError("All fields are required");
			return false;
		}

		const amount = parseFloat(formData.amount);
		if (isNaN(amount) || amount <= 0) {
			setFormError("Amount must be a valid positive number");
			return false;
		}

		if (formData.description.trim().length === 0) {
			setFormError("Description cannot be empty");
			return false;
		}

		return true;
	};

	// Add expense
	const handleAddExpense = async (e) => {
		e.preventDefault();

		if (!validateForm()) return;

		try {
			const response = await fetch(`${API_BASE_URL}/expenses`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: parseFloat(formData.amount),
					description: formData.description,
					category: formData.category,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add expense");
			}

			setFormData({ amount: "", description: "", category: "Food" });
			setFormError("");
			fetchExpenses();
		} catch (err) {
			setFormError(err.message);
		}
	};

	// Delete expense
	const handleDeleteExpense = async (id) => {
		if (!confirm("Are you sure you want to delete this expense?")) return;

		try {
			const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error("Failed to delete expense");

			fetchExpenses();
		} catch (err) {
			setError("Failed to delete expense");
			console.error(err);
		}
	};

	// Calculate total
	const total = filteredExpenses.reduce(
		(sum, expense) => sum + expense.amount,
		0
	);

	return (
		<div className="app">
			<div className="container">
				<h1>Expense</h1>

				{/* Add Expense Form */}
				<div className="card form-card">
					<h2>Add New Expense</h2>
					{formError && <div className="error-message">{formError}</div>}

					<form onSubmit={handleAddExpense}>
						<div className="form-group">
							<label htmlFor="amount">Amount</label>
							<input
								type="number"
								id="amount"
								name="amount"
								placeholder="0.00"
								step="0.01"
								value={formData.amount}
								onChange={handleInputChange}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="description">Description</label>
							<input
								type="text"
								id="description"
								name="description"
								placeholder=""
								value={formData.description}
								onChange={handleInputChange}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="category">Category</label>
							<select
								id="category"
								name="category"
								value={formData.category}
								onChange={handleInputChange}
							>
								{CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<button type="submit" className="btn btn-primary">
							Add Expense
						</button>
					</form>
				</div>

				{/* Filter Section */}
				<div className="card filter-card">
					<h2>Filter by Category</h2>
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="category-filter"
					>
						<option value="all">All Categories</option>
						{CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>

				{/* Total Display */}
				<div className="card total-card">
					<h2>
						Total: <span className="total-amount">{total.toFixed(2)}</span>
					</h2>
				</div>

				{/* Expenses List */}
				<div className="card expenses-card">
					<h2>Expenses ({filteredExpenses.length})</h2>

					{error && <div className="error-message">{error}</div>}

					{loading ? (
						<p className="loading">Loading...</p>
					) : filteredExpenses.length === 0 ? (
						<p className="empty-state">No expenses found</p>
					) : (
						<ul className="expenses-list">
							{filteredExpenses.map((expense) => (
								<li key={expense.id} className="expense-item">
									<div className="expense-info">
										<div className="expense-header">
											<span className="expense-description">
												{expense.description}
											</span>
											<span className="expense-category">
												{expense.category}
											</span>
										</div>
										<span className="expense-date">
											{new Date(expense.createdAt).toLocaleDateString()}
										</span>
									</div>
									<div className="expense-actions">
										<span className="expense-amount">
											{expense.amount.toFixed(2)}
										</span>
										<button
											className="btn btn-delete"
											onClick={() => handleDeleteExpense(expense.id)}
										>
											Delete
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
