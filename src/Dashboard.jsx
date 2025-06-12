import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/queueStyles.css";

const BASE_URL = process.env.REACT_APP_API_URL || "https://queue-backendser.onrender.com";

// 🔧 ETC category-based time estimates
const ETC_TIMES = {
    "New Mix": 120,
    "Reorder Mix": 30,
    "Colour Code": 60,
};

const getOrderClass = (category) => {
    if (category === "New Mix") return "urgent";
    if (category === "Reorder Mix") return "warning";
    if (category === "Colour Code") return "standard";
    return "";
};

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState("User"); // Default role

    const handleLogin = () => {
        const role = prompt("Enter your role (Admin/User):");
        if (["Admin", "User"].includes(role)) {
            setUserRole(role);
        } else {
            alert("❌ Invalid role! Use 'Admin' or 'User'");
        }
    };

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${BASE_URL}/api/orders`);
            console.log("📌 Orders from API:", response.data);

            const activeOrders = response.data.filter(order => order.current_status !== "Ready");

            setOrders(response.data);
            setActiveOrdersCount(activeOrders.length);
        } catch (error) {
            setError("Error fetching orders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

const updateStatus = async (orderId, newStatus, currentColourCode, currentEmp) => {
    let employeeName = currentEmp || "Unassigned";
    let updatedColourCode = currentColourCode;

    // ✅ Assign employee if required
    if (["Re-Mixing", "Mixing", "Spraying", "Ready"].includes(newStatus)) {
        let employeeCode = prompt("🔍 Enter Employee Code to assign this order:");
        if (!employeeCode) {
            alert("❌ Employee Code is required!");
            return;
        }

        try {
            const response = await axios.get(`${BASE_URL}/api/employees?code=${employeeCode}`);
            if (!response.data?.employee_name) {
                alert("❌ Invalid Employee Code! Try again.");
                return;
            }
            employeeName = response.data.employee_name;
        } catch {
            alert("❌ Error verifying employee.");
            return;
        }
    }

    // ✅ Show custom modal for colour code if missing + status is "Ready"
    if (
        newStatus === "Ready" &&
        (!updatedColourCode || updatedColourCode.trim() === "" || updatedColourCode === "Pending")
    ) {
        updatedColourCode = await openColourModal();
        if (!updatedColourCode) return; // Cancelled or empty
    }

    // ✅ Proceed with update
    try {
        await axios.put(`${BASE_URL}/api/orders/${orderId}`, {
            current_status: newStatus,
            assigned_employee: employeeName,
            colour_code: updatedColourCode,
            userRole
        });

        console.log(`✅ Order updated: ${orderId} → ${newStatus}`);
        setTimeout(fetchOrders, 500);
    } catch (error) {
        alert("❌ Error updating order.");
        console.error(error);
    }
};

const [showColourModal, setShowColourModal] = useState(false);
const [pendingColourResolve, setPendingColourResolve] = useState(null);
const [colourInput, setColourInput] = useState("");

// Function to open modal and return a Promise
const openColourModal = () => {
    return new Promise((resolve) => {
        setColourInput(""); // Reset input
        setShowColourModal(true);
        setPendingColourResolve(() => resolve);
    });
};

const submitColourCode = () => {
    if (!colourInput.trim()) {
        alert("❌ Colour Code is required!");
        return;
    }
    setShowColourModal(false);
    pendingColourResolve(colourInput.trim());
};

const cancelColourModal = () => {
    setShowColourModal(false);
    pendingColourResolve(null);
};


    return (
        <div className="container mt-4">
            <h1 className="text-center">Paints Queue Dashboard</h1>
            <button onClick={handleLogin} className="btn btn-primary mb-3">Login as Admin</button>
            <p>Active Orders: <strong>{activeOrdersCount}</strong></p>
            {error && <div className="alert alert-danger">{error}</div>}
            <button className="btn btn-secondary mb-2" onClick={fetchOrders} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
            </button>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Col. Code</th>
                        <th>Car Details</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Customer</th>
                        <th>Order Type</th>
                        <th>Assigned To</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.transaction_id} className={getOrderClass(order.category)}>
                            <td>{order.transaction_id}</td>
                            <td>{order.colour_code}</td>
                            <td>{order.paint_type}</td>
                            <td>{order.paint_quantity}</td>
                            <td>{order.current_status}</td>
                            <td>{order.customer_name}</td>
                            <td>{order.order_type}</td>
                            <td>{order.assigned_employee || "Unassigned"}</td>
                            <td>
                                <select
                                    className="form-select"
                                    value={order.current_status}
                                    onChange={(e) => updateStatus(order.transaction_id, e.target.value, order.colour_code, order.assigned_employee)}
                                >
                                    <option value={order.current_status}>{order.current_status}</option>
                                    {order.current_status === "Waiting" && <option value="Mixing">Mixing</option>}
                                    {order.current_status === "Mixing" && <option value="Spraying">Spraying</option>}
                                    {order.current_status === "Spraying" && (
                                        <>
                                            <option value="Re-Mixing">Back to Mixing</option>
                                            <option value="Ready">Ready</option>
                                        </>
                                    )}
                                    {order.current_status === "Re-Mixing" && <option value="Spraying">Spraying</option>}
                                    {order.current_status === "Ready" && userRole === "Admin" && (
                                        <option value="Complete">Complete</option>
                                    )}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
    {showColourModal && (
    <div style={{
        position: "fixed",
        top: "30%",
        left: "35%",
        background: "#fff",
        border: "1px solid #ccc",
        padding: "20px",
        zIndex: 1000
    }}>
        <label htmlFor="colourInput">🎨 Enter Colour Code:</label><br />
        <input
            type="text"
            id="colourInput"
            value={colourInput}
            onChange={(e) => setColourInput(e.target.value)}
        />
        <br /><br />
        <button onClick={submitColourCode}>Submit</button>
        <button onClick={cancelColourModal}>Cancel</button>
    </div>
)}

        </div>
    );
};

export default Dashboard;
