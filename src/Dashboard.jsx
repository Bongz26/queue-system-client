import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/queueStyles.css";

const BASE_URL = process.env.REACT_APP_API_URL || "https://queue-backendser.onrender.com";

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Fetch active orders
    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${BASE_URL}/api/orders/active`);
            setOrders(response.data);
        } catch (error) {
            setError("Error fetching orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // ✅ Update order status
    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${BASE_URL}/api/orders/${orderId}`, { current_status: newStatus });
            fetchOrders(); // Refresh orders after update
        } catch (error) {
            setError("Error updating order.");
        }
    };

    return (
        <div className="container mt-4">
            <h1 className="text-center">Paints Queue Dashboard</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            <button className="btn btn-secondary mb-2" onClick={fetchOrders} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
            </button>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.transaction_id}>
                            <td>{order.transaction_id}</td>
                            <td>{order.current_status}</td>
                            <td>
                                <select
                                    className="form-select"
                                    value={order.current_status}
                                    onChange={(e) => updateStatus(order.transaction_id, e.target.value)}
                                >
                                    <option value="Waiting">Waiting</option>
                                    <option value="Mixing">Mixing</option>
                                    <option value="Spraying">Spraying</option>
                                    <option value="Ready">Ready</option>
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
