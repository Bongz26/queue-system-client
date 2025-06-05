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
    const [paintQuantity, setPaintQuantity] = useState("");
    const [startTime, setStartTime] = useState("");

    // ✅ Generate Date in DDMMYYYY format (Transaction ID prefix)
    const formatDateDDMMYYYY = () => { 
        const date = new Date();
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString();
        return `${day}${month}${year}`;
    };

    // ✅ Handle Transaction ID for Walk-in orders (User enters last 4 digits manually)
    const handleTransactionIDChange = (e) => {
        const userDigits = e.target.value.replace(/\D/g, "").padStart(4, "0"); // Ensures it's only numbers
        setTransactionID(formatDateDDMMYYYY() + "-" + userDigits);
    };

    useEffect(() => {
        if (orderType === "Phone Order") {
            setTransactionID(formatDateDDMMYYYY() + "-" + Math.floor(1000 + Math.random() * 9000).toString());
        } else {
            setTransactionID(""); // ✅ Walk-in allows manual entry of 4 digits
        }

        // ✅ Automatically set `start_time`
        setStartTime(new Date().toISOString());
    }, [orderType]);

    // ✅ Validate Contact Number (10 digits only)
    const validateContact = (input) => /^\d{10}$/.test(input);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateContact(clientContact)) {
            alert("❌ Contact number must be exactly 10 digits!");
            return;
        }

        if (!paintType.trim()) {
            alert("❌ Paint Type cannot be empty!");
            return;
        }

        if (!paintQuantity || !["250ml", "500ml", "1L", "2L", "4L", "5L", "10L"].includes(paintQuantity)) {
            alert("❌ Please select a valid paint quantity!");
            return;
        }

        if (transactionID.length !== 13) { // ✅ Ensures YYYYMMDD-XXXX (Total 13 characters)
            alert("❌ Walk-in orders must have a 4-digit Transaction ID!");
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
            order_type: orderType,
            start_time: startTime // ✅ Ensuring start time is stored properly
        };

        console.log("🚀 Sending order data:", newOrder);

        try {
            await axios.post(`${BASE_URL}/api/orders`, newOrder);
            console.log("✅ Order added successfully:", newOrder);
            alert("✅ Order placed successfully!");
            printReceipt(newOrder);

            // ✅ Reset Fields
            setTransactionID("");
            setClientName("");
            setClientContact("");
            setPaintType("");
            setColorCode("");
            setPaintQuantity("");
            setCategory("New Mix");
            setOrderType("Walk-in");
            setStartTime(new Date().toISOString());
        } catch (error) {
            console.error("🚨 Error adding order:", error.message);
            alert("❌ Error adding order! Please check your API connection.");
        }
    };

    // ✅ Receipt Printing
    const printReceipt = (order) => {
        console.log("🖨️ Preparing receipt for order:", order);
        const printWindow = window.open("", "_blank", "width=600,height=400");
        if (!printWindow) {
            alert("❌ Printing blocked! Enable pop-ups in your browser.");
            return;
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>Order Receipt</title>
                <style>
                    body { font-size: 14px; }
                    h2 { font-size: 16px; font-weight: bold; }
                    p { margin: 6px 0; }
                </style>
            </head>
            <body>
                <h2>PAINT QUEUE SYSTEM - ORDER RECEIPT</h2>
                <p><strong>Order No:</strong> #${order.transaction_id}</p>
                <p><strong>Client Name:</strong> ${order.customer_name}</p>
                <p><strong>Contact:</strong> ${order.client_contact}</p>
                <p><strong>Paint Type:</strong> ${order.paint_type}</p>
                <p><strong>Paint Quantity:</strong> ${order.paint_quantity}</p>
                <p><strong>Colour Code:</strong> ${order.colour_code}</p>
                <p><strong>Category:</strong> ${order.category}</p>
                <p><strong>Order Type:</strong> ${order.order_type}</p>
                <p><strong>Start Time:</strong> ${order.start_time}</p>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
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
                <input 
                    type="text"
                    className="form-control"
                    value={transactionID}
                    onChange={handleTransactionIDChange}
                    disabled={orderType === "Phone Order"} 
                    placeholder="Enter 4-digit ID for Walk-in"
                />

                <label>Client Name:</label>
                <input type="text" className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} required />

                <label>Client Contact:</label>
                <input type="text" className="form-control" value={clientContact} onChange={(e) => setClientContact(e.target.value)} required />

                <label>Paint Colour:</label>
                <input type="text" className="form-control" value={paintType} onChange={(e) => setPaintType(e.target.value)} required />

                <label>Colour Code:</label>
                <input type="text" className="form-control" value={colorCode} onChange={(e) => setColorCode(e.target.value)} disabled={category === "New Mix"} />

                <label>Paint Quantity:</label>
                <select className="form-control" value={paintQuantity} onChange={(e) => setPaintQuantity(e.target.value)} required>
                    <option value="">Select Quantity</option>
                    <option value="250ml">250ml</option>
                    <option value="500ml">500ml</option>
                    <option value="1L">1L</option>
                    <option value="2L">2L</option>
                    <option value="4L">4L</option>
                    <option value="5L">5L</option>
                    <option value="10L">10L</option>
                </select>

                <button type="submit" className="btn btn-primary mt-3">Add Order</button>
            </form>
        </div>
    );
};

export default AddOrder;
