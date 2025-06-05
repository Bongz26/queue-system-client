import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/queueStyles.css";
import { calculateETC } from "./utils/calculateETC";
import { sendWhatsAppNotification } from "./utils/sendWhatsAppNotification";

// Use environment variable or relative URL for API
const BASE_URL = process.env.REACT_APP_API_URL || "";

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

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${BASE_URL}/api/orders`);
            const updatedOrders = response.data.map(order => ({
                ...order,
                dynamicETC: calculateETC(order.category, activeOrdersCount) || "N/A"
            }));
            setOrders(updatedOrders);
        } catch (error) {
            setError("Error fetching orders.");
        } finally {
            setLoading(false);
        }
    }, [activeOrdersCount]);

    // Fetch active orders count
    const fetchActiveOrdersCount = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/active-orders-count`);
            setActiveOrdersCount(response.data.activeOrders);
        } catch (error) {
            setError("Error fetching active orders count.");
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchActiveOrdersCount();
    }, [fetchOrders]);

    const updateStatus = async (orderId, newStatus, clientNumber) => {
        try {
            await axios.put(`${BASE_URL}/api/orders/${orderId}`, { current_status: newStatus });
            fetchOrders();
            if (newStatus === "Ready") {
                sendWhatsAppNotification(clientNumber, orderId, calculateETC(newStatus, activeOrdersCount));
            }
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
                        <th>Color Code</th>
                        <th>Paint Type</th>
                        <th>Start Time</th>
                        <th>ETC</th>
                        <th>Status</th>
                        <th>Client Contact</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} className={getOrderClass(order.category)}>
                            <td>{order.transaction_id}</td>
                            <td>{order.colour_code !== undefined ? order.colour_code : "N/A"}</td>
                            <td>{order.paint_type}</td>
                            <td>{order.start_time}</td>
                            <td>{order.dynamicETC}</td>
                            <td>{order.current_status}</td>
                            <td>{order.client_contact}</td>
                            <td>
                                <select
                                    className="form-select"
                                    value={order.current_status}
                                    onChange={(e) => updateStatus(order.id, e.target.value, order.client_contact)}
                                >
                                    <option value={order.current_status}>{order.current_status}</option>
                                    {!["Mixing", "Ready"].includes(order.current_status) && (
                                        <>
                                            <option value="Mixing">Mixing</option>
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
