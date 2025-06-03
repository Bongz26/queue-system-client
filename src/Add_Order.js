import React, { useState } from "react";
import axios from "axios";

// ✅ Ensure `calculateETC()` returns ONLY a number (not "40 mins")
const calculateETC = (category) => {
    if (category === "New Mix") return  120; // 40 minutes
    if (category === "Reorder Mix") return 20; // 20 minutes
    if (category === "Colour Code") return 60; // 15 minutes
    return 0;// Fallback value
};

const BASE_URL = "https://queue-backendser.onrender.com";

    const AddOrder = () => {
    const [transactionID, setTransactionID] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientContact, setClientContact] = useState("");
    const [category, setCategory] = useState("New Mix");
    const [paintType, setPaintType] = useState("");
    const [colorCode, setColorCode] = useState("");

    // ✅ Generate Transaction ID (YYYYMMDD + 4 digits)
    const generateTransactionID = (input) => {
        const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD format
        return `${currentDate}-${input.padStart(4, "0")}`;
    };

    // ✅ Validate Contact Number (Only 10 digits)
    const validateContact = (input) => {
        return /^\d{10}$/.test(input);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (transactionID.length !== 4) {
            alert("❌ Transaction ID must be exactly 4 digits!");
            return;
        }

        if (!validateContact(clientContact)) {
            alert("❌ Contact number must be exactly 10 digits!");
            return;
        }

        if (paintType.trim() === "") {
            alert("❌ Paint Colour cannot be empty!");
            return;
        }

        try {
            // ⏰ Wake backend to reduce cold start delay
            await axios.get(BASE_URL);

            const existingOrderCheck = await axios.get(`${BASE_URL}/api/check-duplicate`, {
                params: { customer_name: clientName, client_contact: clientContact, paint_type: paintType, category },
                timeout: 20000
            });

            if (existingOrderCheck.data.exists) {
                alert("❌ This order already exists! Duplicate entries are not allowed.");
                return;
            }
        } catch (error) {
            console.error("🚨 Error checking for duplicate orders:", error.message);
        }

        const adjustedStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // ✅ Adjust UTC time by 2 hours
        const formattedStartTime = adjustedStartTime.toLocaleString("en-GB", {
                timeZone: "Africa/Johannesburg",
                hour12: false
            }).replace(/\//g, "-").slice(0, -3); 
        const formattedTransactionID = generateTransactionID(transactionID);
        const estimatedMinutes = calculateETC(category);// ✅ Ensure a number is returned
        const estimatedCompletionTime = new Date(Date.now() + estimatedMinutes * 60 * 1000 + 2 * 60 * 60 * 1000); // ✅ Convert to utc+ 2 timestamp
        const formattedETC = estimatedCompletionTime.toISOString().replace("T", " ").split(".")[0]; // ✅ Fix formatting

        const newOrder = {
            transaction_id: formattedTransactionID,
            customer_name: clientName,
            client_contact: clientContact,
            paint_type: paintType,
            colour_code: category === "New Mix" ? "Pending" : colorCode || "N/A",
            category,
            start_time: formattedStartTime,
            estimated_completion: formattedETC, // ✅ Properly formatted timestamp
            current_status: "Waiting"
        };

        console.log("🚀 Debugging order data:", JSON.stringify(newOrder, null, 2)); // ✅ Log before sending

        try {
            const response = await axios.post(`${BASE_URL}/api/orders`, newOrder);

            if (!response.data || !response.data.transaction_id) {
                console.error("🚨 Error: Order data missing in response!");
                return;
            }

            console.log("✅ Order added successfully:", response.data);

            setTimeout(() => {
                printReceipt(response.data);
            }, 500);

            // ✅ Clear form after successful submission
            setTransactionID("");
            setClientName("");
            setClientContact("");
            setPaintType("");
            setColorCode("");
            setCategory("New Mix");

        } catch (error) {
            console.error("🚨 Error adding order:", error.message);
            if (error.message.includes("Network Error")) {
                alert("❌ Network error! Please check your internet or try again shortly.");
            }
        }
    };

    // ✅ Receipt Printing Function
    const printReceipt = (order) => {
        console.log("🖨️ Preparing receipt for order:", order);

        const printWindow = window.open("", "_blank", "width=600,height=400");
        if (!printWindow) {
            console.error("🚨 Error: Unable to open print window!");
            alert("❌ Printing blocked! Enable pop-ups in your browser.");
            return;
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>Order Receipt</title>
                <style>
                    body { font-size: 10px; }
                    h2 { font-size: 12px; font-weight: bold; }
                    p { margin: 2px 0; }
                </style>
            </head>
            <body>
                <h2>PAINT QUEUE SYSTEM - ORDER RECEIPT</h2>
                <p><strong>Order No:</strong> #${order.transaction_id}</p>
                <p><strong>Client Name:</strong> ${order.customer_name}</p>
                <p><strong>Contact:</strong> ${order.client_contact}</p>
                <p><strong>Paint Colour:</strong> ${order.paint_type}</p>
                <p><strong>ETC:</strong> ${order.estimated_completion}</p>
                <p><strong>TrackID:</strong> TRK-${order.transaction_id}</p>
                <p><strong>WhatsApp Support:</strong> 083 579 6982</p>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus(); // ✅ Ensure window is focused before printing
        printWindow.print();
    };

    return (
        <div className="container mt-4">
            <h2>Add New Order</h2>
            <form onSubmit={handleSubmit}>
                <label>Transaction ID:</label>
                <input type="text" className="form-control" value={transactionID} onChange={(e) => setTransactionID(e.target.value)} />

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

                <button type="submit" className="btn btn-primary mt-3">Add Order</button>
            </form>
        </div>
    );
};

export default AddOrder;
