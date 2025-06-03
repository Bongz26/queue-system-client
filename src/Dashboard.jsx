import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/queueStyles.css"; // ✅ Ensure this file exists
import { calculateETC } from "./utils/calculateETC"; 
import { sendWhatsAppNotification } from "./utils/sendWhatsAppNotification"; 

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0); 

    // ✅ Fetch orders with debugging
   const fetchOrders = useCallback(async () => {
    try {
        console.log("🔄 Fetching orders from API...");
        const response = await axios.get("https://queue-backendser.onrender.com/api/orders");
        console.log("✅ Full API Orders Data:", JSON.stringify(response.data, null, 2)); // Debugging API response

        const updatedOrders = response.data.map(order => ({
            ...order,
            dynamicETC: calculateETC(order.category, activeOrdersCount) || "N/A"
        }));

        setOrders(updatedOrders); // ✅ Directly set orders in state
        console.log("✅ Orders have been set in React state:", updatedOrders); // Debugging state after update
    } catch (error) {
        console.error("🚨 Error fetching orders:", error);
    }
}, [activeOrdersCount]);

    // ✅ Fetch active orders count
    const fetchActiveOrdersCount = async () => {
        try {
            console.log("🔍 Fetching active orders count...");
            const response = await axios.get("https://queue-backendser.onrender.com/api/active-orders-count", { timeout: 10000 });
            setActiveOrdersCount(response.data.activeOrders);
            console.log("✅ Active orders count:", response.data.activeOrders);
        } catch (error) {
            console.error("🚨 Error fetching active orders count:", error.message);
        }
    };

    // ✅ Calls fetching functions when the component loads
    useEffect(() => {
        fetchOrders();
        fetchActiveOrdersCount();
    }, [fetchOrders]);

    const updateStatus = async (orderId, newStatus, clientNumber) => {
        console.log(`🛠 Updating order ${orderId} to ${newStatus}`);
        try {
            await axios.put(`https://queue-backendser.onrender.com/api/orders/${orderId}`, { current_status: newStatus });
            console.log("✅ Order updated successfully!");
            fetchOrders();

            if (newStatus === "Ready") {
                sendWhatsAppNotification(clientNumber, orderId, calculateETC(newStatus, activeOrdersCount));
            }
        } catch (error) {
            console.error("🚨 Error updating order status:", error);
        }
    };

    console.log("🛠 Orders State in React CC:", orders.map(order => ({
    
        id: order.id,
    transaction_id: order.transaction_id,
    colour_code: order.colour_code || "Missing"
})));

    return (
        <div className="container mt-4">
            <h1 className="text-center">Paints Queue Dashboard</h1>
            <p>Active Orders: <strong>{activeOrdersCount}</strong></p> 

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Color Code</th> 
                        <th>Paint Type</th>
                        <th>Start Time</th>
                        <th>ETC</th>
                        <th>Status</th>
                        <th>Customer</th>
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
                            <td>{order.customer_name}</td>
                            <td>
                                <select
                                    className="form-select"
                                    onChange={(e) => updateStatus(order.id, e.target.value, order.client_contact)}
                                >
                                    {order.current_status && !["Mixing", "Ready"].includes(order.current_status) && (
                                        <option value={order.current_status}>{order.current_status}</option> 
                                    )}
                                    <option value="Mixing">Mixing</option> 
                                    <option value="Testing">Sprying</option>
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

// ✅ Color coding for priority-based orders
const getOrderClass = (category) => {
    if (category === "New Mix") return "urgent";  
    if (category === "Reorder Mix") return "warning"; 
    if (category === "Colour Code") return "standard"; 
    return ""; 
};

export default Dashboard;
