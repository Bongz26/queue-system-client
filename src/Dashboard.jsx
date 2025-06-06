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

    const updateStatus = async (orderId, newStatus) => {
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
                fetchOrders();
            }, 500);
        } catch (error) {
            setError("Error updating order status.");
        }
    };

    const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
//${year}-${month}-${day}  
    return `${hours}:${minutes}`;
};


    // 🔧 ETC calculation: sum of ETCs of all earlier non-ready orders
    const calculateETCPerOrder = () => {
        let totalTime = 0;
        return orders.map(order => {
            if (order.current_status === "Ready") {
                return { ...order, etc: 0 };
            }
            const orderETC = ETC_TIMES[order.category] || 0;
            const etcValue = totalTime;
            totalTime += orderETC;
            return { ...order, etc: etcValue };
        });
    };

    const ordersWithETC = calculateETCPerOrder();

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
                        <th>Car Details</th>
                        <th>Amount</th>
                        <th>Start Time</th>
                        <th>Status</th>
                        <th>Customer</th>
                        <th>Order Type</th>
                        <th>Assigned To</th>
                        <th>ETC (min)</th> {/* 🔧 Added ETC column */}
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {ordersWithETC.map(order => (
                        <tr key={order.transaction_id} className={getOrderClass(order.category)}>
                            <td>{order.transaction_id}</td>
                            <td>{order.colour_code}</td>
                            <td>{order.paint_type}</td>  {/*vehicle Details*/}
                            <td>{order.paint_quantity}</td>
                            <td>{formatDateTime(order.start_time)}</td>
                            <td>{order.current_status}</td>
                            <td>{order.customer_name}</td>
                            <td>{order.order_type}</td>
                            <td>{order.assigned_employee || "Unassigned"}</td>
                            <td>{order.etc} min</td> {/* 🔧 Display ETC */}
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
