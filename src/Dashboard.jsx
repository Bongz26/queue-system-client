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
    let employeeCode = null;
    let employeeName = currentEmp;
    let updatedColourCode = currentColourCode;

    // ✅ Require Employee Code for "Mixing", "Spraying", "Re-Mixing"
    if (["Mixing", "Spraying", "Re-Mixing"].includes(newStatus)) {
        employeeCode = prompt("🔍 Enter Employee Code for assignment:");
        if (!employeeCode) return;

        try {
            const employeeResponse = await axios.get(`${BASE_URL}/api/employees?code=${employeeCode}`);
            if (!employeeResponse.data || !employeeResponse.data.employee_name) {
                alert("❌ Invalid Employee Code! Try again.");
                return;
            }
            employeeName = employeeResponse.data.employee_name;
        } catch (error) {
            alert("❌ Unable to verify employee code! Please check your connection.");
            return;
        }
    }

    // ✅ Require Colour Code for "Ready"
    if (newStatus === "Ready" && (!currentColourCode || currentColourCode === "Pending")) {
        let inputCode = prompt("🎨 Please enter the **Colour Code** for this Paint:");
        if (!inputCode || inputCode.trim() === "") {
            alert("❌ Colour Code is required to mark the order as Ready!");
            return;
        }
        updatedColourCode = inputCode;
    }

    // ✅ Single API Call with Updated Fields
    try {
        await axios.put(`${BASE_URL}/api/orders/${orderId}`, {
            current_status: newStatus,
            assigned_employee: employeeName, // Ensure employee is always assigned
            colour_code: updatedColourCode,
            userRole
        });

        console.log(`✅ Order updated: ${orderId} → ${newStatus}, Colour Code: ${updatedColourCode}`);
        setTimeout(() => {
            fetchOrders();
        }, 500);
    } catch (error) {
        alert("❌ Error updating order status!");
        console.error("🚨 Error updating:", error);
    }
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
    onChange={(e) => updateStatus(order.transaction_id, e.target.value)}
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
        </div>
    );
};

export default Dashboard;
