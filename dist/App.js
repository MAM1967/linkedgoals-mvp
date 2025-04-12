import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, } from "firebase/firestore";
import Auth from "./Auth";
import CheckinForm from "@/components/CheckinForm";
import "./App.css";
import { FaTachometerAlt, FaBullseye, FaCheckCircle, FaUsers, } from "react-icons/fa";
function App() {
    const [user, setUser] = useState(null);
    const [goal, setGoal] = useState("");
    const [goals, setGoals] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [tab, setTab] = useState("dashboard");
    const [inviteEmail, setInviteEmail] = useState("");
    const [invites, setInvites] = useState([]);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                fetchGoals(u.uid);
                fetchCheckIns(u.uid);
                fetchInvites(u.uid);
            }
        });
        return () => unsubscribe();
    }, []);
    const fetchGoals = async (uid) => {
        const snapshot = await getDocs(collection(db, `users/${uid}/goals`));
        const fetchedGoals = snapshot.docs.map((doc) => doc.data().text);
        setGoals(fetchedGoals);
    };
    const fetchCheckIns = async (uid) => {
        const snapshot = await getDocs(query(collection(db, `users/${uid}/checkins`), orderBy("createdAt", "desc")));
        const fetchedCheckIns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCheckIns(fetchedCheckIns);
    };
    const fetchInvites = async (uid) => {
        const snapshot = await getDocs(collection(db, `users/${uid}/invites`));
        const fetched = snapshot.docs.map((doc) => doc.data().email);
        setInvites(fetched);
    };
    const handleAddGoal = async () => {
        if (goal.trim() && user) {
            await addDoc(collection(db, `users/${user.uid}/goals`), {
                text: goal,
                createdAt: serverTimestamp(),
            });
            setGoal("");
            fetchGoals(user.uid);
        }
    };
    const handleSendInvite = async () => {
        if (!inviteEmail.includes("@") || !user)
            return;
        await addDoc(collection(db, `users/${user.uid}/invites`), {
            email: inviteEmail,
            createdAt: serverTimestamp(),
        });
        setInviteEmail("");
        fetchInvites(user.uid);
    };
    if (!user)
        return _jsx(Auth, { onAuth: setUser });
    return (_jsxs("div", { className: "container", children: [_jsxs("header", { children: [_jsxs("h1", { children: ["Welcome, ", user.email] }), _jsx("button", { className: "logout", onClick: () => signOut(auth), children: "Sign Out" })] }), _jsxs("div", { className: "tabs", children: [_jsxs("button", { className: tab === "dashboard" ? "active" : "", onClick: () => setTab("dashboard"), children: [" ", _jsx(FaTachometerAlt, {}), " Dashboard "] }), _jsxs("button", { className: tab === "goals" ? "active" : "", onClick: () => setTab("goals"), children: [" ", _jsx(FaBullseye, {}), " Goals "] }), _jsxs("button", { className: tab === "checkins" ? "active" : "", onClick: () => setTab("checkins"), children: [" ", _jsx(FaCheckCircle, {}), " Check-Ins "] }), _jsxs("button", { className: tab === "circles" ? "active" : "", onClick: () => setTab("circles"), children: [" ", _jsx(FaUsers, {}), " Circles "] })] }), tab === "dashboard" && (_jsxs("section", { children: [_jsx("h2", { children: "Dashboard" }), _jsx("p", { children: "3 of 5 goals completed this month. Keep going!" })] })), tab === "goals" && (_jsxs("section", { children: [_jsx("h2", { children: "Goals" }), _jsx("input", { value: goal, onChange: (e) => setGoal(e.target.value), placeholder: "Add a new goal" }), _jsx("button", { onClick: handleAddGoal, children: "Add Goal" }), _jsx("ul", { children: goals.map((g, i) => (_jsx("li", { children: g }, i))) })] })), tab === "checkins" && (_jsxs("section", { children: [_jsx(CheckinForm, { onCheckinSaved: () => fetchCheckIns(user.uid) }), _jsx("ul", { className: "space-y-4 mt-6", children: checkIns.map((entry) => (_jsxs("li", { className: "border p-3 rounded bg-gray-50", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["\uD83C\uDF00 ", entry.circle] }), _jsx("p", { className: "font-medium", children: entry.message }), entry.goal && (_jsxs("div", { className: "mt-2 p-2 border-l-4 border-blue-300 bg-blue-50", children: [_jsxs("p", { className: "font-semibold", children: ["\uD83C\uDFAF Goal: ", entry.goal.name] }), entry.goal.description && _jsx("p", { className: "text-sm", children: entry.goal.description }), entry.goal.dueDate && (_jsxs("p", { className: "text-xs text-gray-500", children: ["Due: ", entry.goal.dueDate] })), entry.goal.completed && (_jsx("p", { className: "text-green-600 text-sm mt-1", children: "\u2705 Completed" }))] }))] }, entry.id))) })] })), tab === "circles" && (_jsxs("section", { children: [_jsx("h2", { children: "Your Accountability Circle" }), _jsx("input", { type: "email", placeholder: "Enter email to invite", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value) }), _jsx("button", { onClick: handleSendInvite, children: "Send Invite" }), invites.length === 0 ? (_jsx("p", { style: { marginTop: "1rem" }, children: "You haven\u2019t invited anyone yet." })) : (_jsx("ul", { style: { marginTop: "1rem" }, children: invites.map((email, i) => (_jsxs("li", { children: ["\u2705 ", email, " (invited)"] }, i))) }))] }))] }));
}
export default App;
