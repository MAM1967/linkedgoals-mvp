import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Sidebar() {
    // Placeholder data; in the future, you'll fetch this from Firestore
    const circles = ["Career", "Wellness", "Spiritual"];
    return (_jsxs("aside", { className: "w-64 bg-gray-100 h-screen p-4 border-r", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Your Circles" }), _jsx("ul", { children: circles.map((circle, index) => (_jsx("li", { className: "mb-2", children: _jsx("a", { href: "#", className: "text-blue-600 hover:underline", children: circle }) }, index))) })] }));
}
