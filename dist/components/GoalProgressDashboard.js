import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
export default function GoalProgressDashboard({ userId, }) {
    const [goalProgress, setGoalProgress] = useState({});
    useEffect(() => {
        const fetchGoalProgress = async () => {
            const user = auth.currentUser;
            if (!user)
                return;
            const goalsSnapshot = await getDocs(collection(db, `users/${user.uid}/goals`));
            const progress = {};
            for (const doc of goalsSnapshot.docs) {
                const goalId = doc.id;
                const checkinsRef = collection(db, `users/${user.uid}/checkins`);
                const checkinsQuery = query(checkinsRef, where("goalId", "==", goalId));
                const checkinsSnapshot = await getDocs(checkinsQuery);
                progress[goalId] = checkinsSnapshot.size;
            }
            setGoalProgress(progress);
        };
        fetchGoalProgress();
    }, []);
    return (_jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Goal Progress" }), _jsx("ul", { className: "list-disc pl-6", children: Object.entries(goalProgress).map(([goalId, count]) => (_jsxs("li", { children: ["Goal ID: ", goalId, " \u2013 Check-ins: ", count] }, goalId))) })] }));
}
