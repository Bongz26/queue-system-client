import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/queueStyles.css";

const BASE_URL = process.env.REACT_APP_API_URL || "https://queue-backendser.onrender.com";

const getOrderClass = (category) => {
    if (category === "New Mix") return "urgent";  // 🔴 Restored styling
    if (category === "Reorder Mix") return "warning"; // 🟠 Restored styling
    if (category === "Colour Code") return "standard"; // 🔵 Restored styling
    return "";
};

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Fetch active orders excluding "Ready" status
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${BASE_URL}/api/orders`);
            console.log("📌 Orders from API:", response.data);

            setOrders(response.data);

            // ✅ Count only orders NOT in "Ready" status
            const activeCount = response.data.filter(order => order.current_status !== "Ready").length;
            setActiveOrdersCount(activeCount);
        } catch (error) {
            setError("Error fetching orders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ✅ Restore Employee Authentication logic
    const updateStatus = async (orderId, newStatus, clientNumber) => {
        let employeeCode = null;
        let employeeName = null;

        if (["Mixing", "Spraying"].includes(newStatus)) {
            employeeCode = prompt("Enter Employee Code:");
            if (!employeeCode) return;

            try {
                const employeeResponse = await axios.get(`${BASE_URL}/api/employees?code=${employeeCode}`);
                if (!employeeResponse.data || !employeeResponse.data.employee_name) {
                    alert("❌ Invalid Employee Code!");
                    return;
                }
                employeeName = employeeResponse.data.employee_name;
            } catch (error) {
                alert("❌ Unable to verify employee code!");
                return;
            }
        }

        try {
            await axios.put(`${BASE_URL}/api/orders/${orderId}`, {
                current_status: newStatus,
                assigned_employee: employeeName || null
            });

            console.log(`✅ Order updated: ${orderId} → ${newStatus}`);

            setTimeout(() => {
                fetchOrders(); // Ensure UI refreshes properly after update
            }, 500);
        } catch (error) {
            setError("Error updating order status.");
        }
    };

    return (
        <div className="container mt-4">
            <h1 className="text-center">Paints Queue Dashboard</h1>
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
                        <th>Paint Colour</th>
                        <th>Start Time</th>
                        <th>Status</th>
                        <th>Customer</th>
                        <th>Assigned Employee</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.transaction_id} className={getOrderClass(order.category)}> {/* 🔥 Restored category-based styling */}
                            <td>{order.transaction_id}</td>
                            <td>{order.colour_code}</td>
                            <td>{order.paint_type}</td>
                            <td>{order.start_time}</td>
                            <td>{order.current_status}</td>
                            <td>{order.customer_name}</td>
                            <td>{order.assigned_employee || "Unassigned"}</td>
                            <td>
                                <select
                                    className="form-select"
                                    value={order.current_status}
                                    onChange={(e) => updateStatus(order.transaction_id, e.target.value, order.client_contact)}
                                >
                                    <option value={order.current_status}>{order.current_status}</option>
                                    {order.current_status === "Waiting" && <option value="Mixing">Mixing</option>}
                                    {order.current_status === "Mixing" && <option value="Spraying">Spraying</option>}
                                    {order.current_status === "Spraying" && (
                                        <>
                                            <option value="Mixing">Back to Mixing</option>
                                            <option value="Ready">Ready</option>
                                        </>
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
