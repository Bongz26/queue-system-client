import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/queueStyles.css";
import { calculateETC } from "./utils/calculateETC";
import { sendWhatsAppNotification } from "./utils/sendWhatsAppNotification";

const BASE_URL = "https://queue-backendser.onrender.com";

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);

    // ✅ Fetch orders from the backend
    const fetchOrders = useCallback(async () => {
        try {
            console.log("🔄 Fetching orders...");
            const response = await axios.get(`${BASE_URL}/api/orders`);
            
            console.log("📌 Orders received from backend:", response.data);

            const updatedOrders = response.data.map(order => ({
                ...order,
                dynamicETC: calculateETC(order.category, activeOrdersCount) || "N/A"
            }));

            setOrders(updatedOrders);
        } catch (error) {
            console.error("🚨 Error fetching orders:", error);
        }
    }, [activeOrdersCount]);

    // ✅ Fetch active orders count
    const fetchActiveOrdersCount = async () => {
        try {
            console.log("🔍 Fetching active orders count...");
            const response = await axios.get(`${BASE_URL}/api/active-orders-count`);
            setActiveOrdersCount(response.data.activeOrders);
        } catch (error) {
            console.error("🚨 Error fetching active orders count:", error.message);
        }
    };

    // ✅ Calls fetching functions when the component loads
    useEffect(() => {
        fetchOrders();
        fetchActiveOrdersCount();
    }, [fetchOrders]);

    const updateStatus = async (orderId, newStatus, clientNumber, currentColourCode) => {
        console.log(`🛠 Updating order ${orderId} to ${newStatus}`);

        let employeeCode = null;
        let employeeName = null;
        let updatedColourCode = currentColourCode;

        // ✅ If "Mixing" is selected, prompt for employee code
        if (newStatus === "Mixing") {
            employeeCode = prompt("Enter Employee Code:");
            if (!employeeCode) return;

            try {
                const employeeResponse = await axios.get(`${BASE_URL}/api/employees?code=${employeeCode.trim()}`);
                console.log("📌 Employee API Response:", employeeResponse.data);

                if (!employeeResponse.data || !employeeResponse.data.employee_name) {
                    alert("❌ Invalid Employee Code!");
                    return;
                }
                employeeName = employeeResponse.data.employee_name;
                console.log("✅ Employee found:", employeeName);
            } catch (error) {
                console.error("🚨 Error validating employee code:", error);
                alert("❌ Unable to verify employee code!");
                return;
            }
        }

        // ✅ If "Ready" is selected and Colour Code is "Pending", prompt user to enter Colour Code
        if (newStatus === "Ready" && currentColourCode === "Pending") {
            updatedColourCode = prompt("Enter Colour Code:");
            if (!updatedColourCode) {
                alert("❌ Colour Code is required!");
                return;
            }
        }

        console.log("🛠 Sending update request:", { orderId, newStatus, employeeName, updatedColourCode });

        try {
            await axios.put(`${BASE_URL}/api/orders/${orderId}`, {
                current_status: newStatus,
                assigned_employee: employeeName || null,
                colour_code: updatedColourCode
            });

            console.log("✅ Order updated successfully!");
            fetchOrders();

            if (newStatus === "Ready") {
                sendWhatsAppNotification(clientNumber, orderId, calculateETC(newStatus, activeOrdersCount));
            }
        } catch (error) {
            console.error("🚨 Error updating order status:", error);
        }
       };

    return (
        <div className="container mt-4">
            <h1 className="text-center">Paints Queue Dashboard</h1>
            <p>Active Orders: <strong>{activeOrdersCount}</strong></p>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Transaction ID</th>
                        <th>Colour Code</th>
                        <th>Colour</th>
                        <th>Status</th>
                        <th>Customer</th>
                        <th>Assigned Employee</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.transaction_id} className={getOrderClass(order.category)}>
                            <td>{order.transaction_id}</td>
                            <td>{order.colour_code || "N/A"}</td>
                            <td>{order.paint_type}</td>
                            <td>{order.current_status}</td>
                            <td>{order.customer_name}</td>
                            <td>{order.assigned_employee || "Unassigned"}</td>
                            <td>
                                <button onClick={() => updateStatus(order.transaction_id, "Mixing", order.client_contact, order.colour_code)}>Mix</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ✅ Restored priority-based order styling
const getOrderClass = (category) => {
    if (category === "New Mix") return "urgent";
    if (category === "Reorder Mix") return "warning";
    if (category === "Colour Code") return "standard";
    return "";
};

export default Dashboard;
