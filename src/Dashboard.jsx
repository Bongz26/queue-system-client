import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./styles/queueStyles.css";
import LoginPopup from "./LoginPopup";

const BASE_URL = process.env.REACT_APP_API_URL || "https://queue-backendser.onrender.com";

const ETC_TIMES = {
  "New Mix": 120,
  "Reorder Mix": 30,
  "Colour Code": 60,
};

const getOrderClass = (category) => {
  if (category === "New Mix") return "table-danger";
  if (category === "Reorder Mix") return "table-warning";
  if (category === "Colour Code") return "table-info";
  return "";
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [showLogin, setShowLogin] = useState(false);
const handleLogin = () => setShowLogin(true);
  

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${BASE_URL}/api/orders`);
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

    if (["Re-Mixing", "Mixing", "Spraying", "Ready"].includes(newStatus)) {
      let employeeCode = prompt("🔍 Enter Employee Code to assign this order:");
      if (!employeeCode) {
        alert("❌ Employee Code is required!");
        return;
      }

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

    if (
      newStatus === "Ready" &&
      (!updatedColourCode || updatedColourCode.trim() === "" || updatedColourCode === "Pending")
    ) {
      let inputCode = prompt("🎨 Please enter the Colour Code for this Paint:");
      if (!inputCode || inputCode.trim() === "") {
        alert("❌ Colour Code is required to mark this order as Ready!");
        return;
      }
      updatedColourCode = inputCode.trim();
    }

    try {
      await axios.put(`${BASE_URL}/api/orders/${orderId}`, {
        current_status: newStatus,
        assigned_employee: employeeName,
        colour_code: updatedColourCode,
        userRole
      });
      setTimeout(() => {
        fetchOrders();
      }, 500);
    } catch (error) {
      alert("❌ Error updating order status!");
      console.error("🚨 Error updating:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">🎨 Paints Queue Dashboard</h4>
          <button onClick={handleLogin} className="btn btn-light btn-sm">Login as Admin</button>
          {showLogin && (
  <LoginPopup
    onLogin={(role) => setUserRole(role)}
    onClose={() => setShowLogin(false)}
  />
)}
        </div>
        <div className="card-body bg-light">
          <p className="mb-2">
            <strong>Active Orders:</strong> {activeOrdersCount}
          </p>
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-secondary mb-3" onClick={fetchOrders} disabled={loading}>
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
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
                        className="form-select form-select-sm"
                        value={order.current_status}
                        onChange={(e) =>
                          updateStatus(order.transaction_id, e.target.value, order.colour_code, order.assigned_employee)
                        }
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
