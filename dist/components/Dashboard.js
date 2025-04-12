"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, } from "firebase/firestore";
export default function Dashboard() {
    const [checkins, setCheckins] = useState([]);
    useEffect(() => {
        const fetchCheckins = async () => {
            const user = auth.currentUser;
            if (!user)
                return;
            const ref = collection(db, "users", user.uid, "checkins");
            const q = query(ref, orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const results = [];
            for (const docSnap of snap.docs) {
                const base = docSnap.data();
                const goalRef = collection(docSnap.ref, "goal");
                const goalSnap = await getDocs(goalRef);
                let goal = undefined;
                if (!goalSnap.empty) {
                    goal = goalSnap.docs[0].data();
                }
                results.push({
                    id: docSnap.id,
                    circle: base.circle,
                    message: base.message,
                    createdAt: base.createdAt,
                    goal,
                });
            }
            setCheckins(results);
        };
        fetchCheckins();
    }, []);
    return (_jsxs("div", { className: "p-4 max-w-3xl mx-auto space-y-4", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Your Progress" }), checkins.length === 0 && _jsx("p", { children: "No check-ins yet." }), checkins.map((entry) => (_jsxs("div", { className: "border p-4 rounded bg-white shadow-sm", children: [_jsxs("p", { className: "text-sm text-gray-500", children: [entry.circle, " \u2013", " ", entry.createdAt?.toDate
                                ? entry.createdAt.toDate().toLocaleDateString()
                                : "No date"] }), _jsx("p", { className: "mt-1", children: entry.message }), entry.goal && (_jsxs("div", { className: "mt-3 bg-blue-50 border-l-4 border-blue-400 p-3", children: [_jsxs("p", { className: "font-medium", children: ["\uD83C\uDFAF Goal: ", entry.goal.name] }), entry.goal.description && (_jsx("p", { className: "text-sm text-gray-700", children: entry.goal.description })), entry.goal.dueDate && (_jsxs("p", { className: "text-xs text-gray-500", children: ["Due: ", new Date(entry.goal.dueDate).toLocaleDateString()] })), entry.goal.completed && (_jsx("p", { className: "text-green-600 text-sm mt-1 font-medium", children: "\u2705 Completed" }))] }))] }, entry.id)))] }));
}
