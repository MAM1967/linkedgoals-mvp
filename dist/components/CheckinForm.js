"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { saveCheckin } from "@/lib/firestore";
console.log("🧠 Using the NEW CheckinForm with dropdowns!");
const defaultCircles = [
    { name: "Career", icon: "🏆" },
    { name: "Leadership", icon: "🧠" },
    { name: "Productivity", icon: "⚙️" },
];
export default function CheckinForm({ onCheckinSaved }) {
    const [selectedCircle, setSelectedCircle] = useState(defaultCircles[0].name);
    const [message, setMessage] = useState("");
    const [goalName, setGoalName] = useState("");
    const [goalDescription, setGoalDescription] = useState("");
    const [goalDueDate, setGoalDueDate] = useState("");
    const [goalComplete, setGoalComplete] = useState(false);
    const [status, setStatus] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        const user = auth.currentUser;
        if (!user) {
            setStatus("error");
            return console.error("User not signed in.");
        }
        const data = {
            circle: selectedCircle,
            message,
            goal: goalName
                ? {
                    name: goalName,
                    description: goalDescription,
                    dueDate: goalDueDate || undefined,
                    completed: goalComplete,
                }
                : undefined,
        };
        try {
            await saveCheckin(user.uid, data);
            setStatus("success");
            setMessage("");
            setGoalName("");
            setGoalDescription("");
            setGoalDueDate("");
            setGoalComplete(false);
            if (onCheckinSaved)
                onCheckinSaved();
        }
        catch (err) {
            console.error("Error saving check-in:", err);
            setStatus("error");
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 p-4 max-w-md mx-auto", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Daily Check-In" }), _jsx("select", { value: selectedCircle, onChange: (e) => setSelectedCircle(e.target.value), className: "w-full p-2 border rounded", children: defaultCircles.map(({ name, icon }) => (_jsxs("option", { value: name, children: [icon, " ", name] }, name))) }), _jsx("textarea", { value: message, onChange: (e) => setMessage(e.target.value), placeholder: "What's on your mind today?", rows: 4, className: "w-full p-2 border rounded", required: true }), _jsxs("div", { className: "bg-gray-50 p-3 rounded border", children: [_jsx("h3", { className: "font-medium", children: "SMART Goal (optional)" }), _jsx("input", { type: "text", placeholder: "Goal name", value: goalName, onChange: (e) => setGoalName(e.target.value), className: "w-full p-2 border rounded mt-2" }), _jsx("textarea", { placeholder: "Goal description or success criteria", value: goalDescription, onChange: (e) => setGoalDescription(e.target.value), rows: 2, className: "w-full p-2 border rounded mt-2" }), _jsx("input", { type: "date", value: goalDueDate, onChange: (e) => setGoalDueDate(e.target.value), className: "w-full p-2 border rounded mt-2" }), _jsxs("label", { className: "flex items-center mt-2", children: [_jsx("input", { type: "checkbox", checked: goalComplete, onChange: (e) => setGoalComplete(e.target.checked), className: "mr-2" }), "Mark as completed"] })] }), _jsx("button", { type: "submit", className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition", children: status === "saving" ? "Saving..." : "Submit Check-In" }), status === "success" && (_jsx("p", { className: "text-green-600", children: "Check-in saved!" })), status === "error" && (_jsx("p", { className: "text-red-600", children: "Failed to save check-in." }))] }));
}
