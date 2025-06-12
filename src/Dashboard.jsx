const updateStatus = async (orderId, newStatus, currentColourCode, currentEmp) => {
    let employeeName = currentEmp || "Unassigned";
    let updatedColourCode = currentColourCode;

    // ✅ Require Employee Assignment for these statuses
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

    // ✅ Only prompt for Colour Code if status is "Ready" AND code is missing or "Pending"
    if (
        newStatus === "Ready" &&
        (!updatedColourCode || updatedColourCode.trim() === "" || updatedColourCode === "Pending")
    ) {
        let inputCode = prompt("🎨 Please enter the **Colour Code** for this Paint:");
        if (!inputCode || inputCode.trim() === "") {
            alert("❌ Colour Code is required to mark this order as Ready!");
            return;
        }
        updatedColourCode = inputCode.trim();
    }

    // ✅ Log Payload
    console.log("📦 Sending Payload:", {
        current_status: newStatus,
        assigned_employee: employeeName,
        colour_code: updatedColourCode,
        userRole
    });

    try {
        await axios.put(`${BASE_URL}/api/orders/${orderId}`, {
            current_status: newStatus,
            assigned_employee: employeeName,
            colour_code: updatedColourCode,
            userRole
        });

        console.log(`✅ Order updated: ${orderId} → ${newStatus}, Colour Code: ${updatedColourCode}`);
        setTimeout(() => {
            fetchOrders();
        }, 500);
    } catch (error) {
        alert("❌ Error updating order status!");
        console.error("🚨 Error updating:", error);
    }
};
