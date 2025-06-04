import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "https://queue-backendser.onrender.com";

const AddOrder = () => {
    const [orderType, setOrderType] = useState("Walk-in");
    const [transactionID, setTransactionID] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [category, setCategory] = useState("New Mix");
    const [paintType, setPaintType] = useState("");
    const [colorCode, setColorCode] = useState("");
    const [paintQuantity, setPaintQuantity] = useState(""); // ✅ New state variable

    const generateTransactionID = () => {
        const date = new Date();
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString();
        const currentDate = `${day}${month}${year}`;
        const randomSequence = Math.floor(Math.random() * 10000).toString().padStart(4, "0");

        return `${currentDate}-${randomSequence}`;
    };

    useEffect(() => {
        if (orderType === "Phone Order") {
            setTransactionID(generateTransactionID());
        } else {
            setTransactionID(""); 
        }
    }, [orderType]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (paintQuantity.trim() === "" || isNaN(paintQuantity) || parseFloat(paintQuantity) <= 0) {
            alert("❌ Please enter a valid paint quantity!");
            return;
        }

        const newOrder = {
            transaction_id: transactionID,
            customer_name: clientName,
            client_contact: clientContact,
            paint_type: paintType,
            colour_code: category === "New Mix" ? "Pending" : colorCode || "N/A",
            category,
            paint_quantity: paintQuantity, // ✅ Added paint quantity to order
            current_status: "Waiting",
            order_type: orderType,
        };

        try {
            await axios.post(`${BASE_URL}/api/orders`, newOrder);
            alert("✅ Order placed successfully!");
            setTransactionID("");
            setClientName("");
            setClientContact("");
            setPaintType("");
            setColorCode("");
            setPaintQuantity(""); // ✅ Reset paint quantity after submission
            setCategory("New Mix");
            setOrderType("Walk-in");
        } catch (error) {
            alert("❌ Error adding order!");
        }
    };

    return (
        <div className="container mt-4">
            <h2>Add New Order</h2>
            <form onSubmit={handleSubmit}>
                <label>Order Type:</label>
                <select className="form-control" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option>Walk-in</option>
                    <option>Phone Order</option>
                </select>

                <label>Transaction ID:</label>
                <input type="text" className="form-control" value={transactionID} disabled={orderType === "Phone Order"} />

                <label>Client Name:</label>
                <input type="text" className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} required />

                <label>Client Contact:</label>
                <input type="text" className="form-control" value={clientContact} onChange={(e) => setClientContact(e.target.value)} required />

                <label>Category:</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>New Mix</option>
                    <option>Reorder Mix</option>
                    <option>Colour Code</option>
                </select>

                <label>Paint Colour:</label>
                <input type="text" className="form-control" value={paintType} onChange={(e) => setPaintType(e.target.value)} required />

                <label>Colour Code:</label>
                <input type="text" className="form-control" value={colorCode} onChange={(e) => setColorCode(e.target.value)} disabled={category === "New Mix"} />

                <label>Paint Quantity (Liters):</label>
                <input type="number" className="form-control" value={paintQuantity} onChange={(e) => setPaintQuantity(e.target.value)} required />

                <button type="submit" className="btn btn-primary mt-3">Add Order</button>
            </form>
        </div>
    );
};

export default AddOrder;
