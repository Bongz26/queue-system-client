import React, { useState } from "react";
import axios from "axios";

const BASE_URL = "https://queue-backendser.onrender.com";

const AddOrder = () => {
    const [transactionID, setTransactionID] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [category, setCategory] = useState("New Mix");
    const [paintType, setPaintType] = useState("");
    const [colorCode, setColorCode] = useState("");
    const [paintQuantity, setPaintQuantity] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!clientName.trim() || !paintType.trim()) {
            alert("❌ Client Name and Paint Type cannot be empty!");
            return;
        }

        const newOrder = {
            transaction_id: transactionID,
            customer_name: clientName,
            client_contact: clientContact,
            paint_type: paintType,
            colour_code: category === "New Mix" ? "Pending" : colorCode || "N/A",
            category,
            paint_quantity: paintQuantity,
            current_status: "Waiting",
            order_type: "Paid"
        };

        try {
            await axios.post(`${BASE_URL}/api/orders`, newOrder);
            alert("✅ Order placed successfully!");
        } catch (error) {
            alert("❌ Error adding order! Please check your API connection.");
        }
    };

    return (
        <div className="container mt-4">
            <h2>Add New Order</h2>
            <form onSubmit={handleSubmit}>
                <label>Client Name:</label>
                <input type="text" className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} required />

                <label>Car Details:</label>
                <input type="text" className="form-control" value={paintType} onChange={(e) => setPaintType(e.target.value)} required />

                <label>Colour Code:</label>
                <input type="text" className="form-control" value={colorCode} onChange={(e) => setColorCode(e.target.value)} disabled={category === "New Mix"} />

                <button type="submit" className="btn btn-primary mt-3">Add Order</button>
            </form>
        </div>
    );
};

export default AddOrder;
