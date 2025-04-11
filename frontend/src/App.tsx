import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import Auth from "./Auth";
import "./App.css";

import {
  FaTachometerAlt,
  FaBullseye,
  FaCheckCircle,
  FaUsers,
} from "react-icons/fa";

function App() {
  const [user, setUser] = useState<any>(null);
  const [goal, setGoal] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkIns, setCheckIns] = useState<string[]>([]);
  const [tab, setTab] = useState<"dashboard" | "goals" | "checkins" | "circles">("dashboard");

  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<string[]>([]);

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

  const fetchGoals = async (uid: string) => {
    const snapshot = await getDocs(collection(db, `users/${uid}/goals`));
    const fetchedGoals = snapshot.docs.map((doc) => doc.data().text);
    setGoals(fetchedGoals);
  };

  const fetchCheckIns = async (uid: string) => {
    const snapshot = await getDocs(
      query(collection(db, `users/${uid}/checkins`), orderBy("createdAt", "desc"))
    );
    const fetchedCheckIns = snapshot.docs.map((doc) => doc.data().text);
    setCheckIns(fetchedCheckIns);
  };

  const fetchInvites = async (uid: string) => {
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

  const handleAddCheckIn = async () => {
    if (checkIn.trim() && user) {
      await addDoc(collection(db, `users/${user.uid}/checkins`), {
        text: checkIn,
        createdAt: serverTimestamp(),
      });
      setCheckIn("");
      fetchCheckIns(user.uid);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.includes("@") || !user) return;

    await addDoc(collection(db, `users/${user.uid}/invites`), {
      email: inviteEmail,
      createdAt: serverTimestamp(),
    });

    setInviteEmail("");
    fetchInvites(user.uid);
  };

  if (!user) return <Auth onAuth={setUser} />;

  return (
    <div className="container">
      <header>
        <h1>Welcome, {user.email}</h1>
        <button className="logout" onClick={() => signOut(auth)}>Sign Out</button>
      </header>

      <div className="tabs">
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
          <FaTachometerAlt /> Dashboard
        </button>
        <button className={tab === "goals" ? "active" : ""} onClick={() => setTab("goals")}>
          <FaBullseye /> Goals
        </button>
        <button className={tab === "checkins" ? "active" : ""} onClick={() => setTab("checkins")}>
          <FaCheckCircle /> Check-Ins
        </button>
        <button className={tab === "circles" ? "active" : ""} onClick={() => setTab("circles")}>
          <FaUsers /> Circles
        </button>
      </div>

      {tab === "dashboard" && (
        <section>
          <h2>Dashboard</h2>
          <p>3 of 5 goals completed this month. Keep going!</p>
        </section>
      )}

      {tab === "goals" && (
        <section>
          <h2>Goals</h2>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Add a new goal"
          />
          <button onClick={handleAddGoal}>Add Goal</button>
          <ul>
            {goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "checkins" && (
        <section>
          <h2>Weekly Check-In</h2>
          <textarea
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            placeholder="What did you accomplish this week? What's next?"
          />
          <button onClick={handleAddCheckIn}>Submit Check-In</button>
          <ul>
            {checkIns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {tab === "circles" && (
        <section>
          <h2>Your Accountability Circle</h2>

          <input
            type="email"
            placeholder="Enter email to invite"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button onClick={handleSendInvite}>Send Invite</button>

          {invites.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>You haven’t invited anyone yet.</p>
          ) : (
            <ul style={{ marginTop: "1rem" }}>
              {invites.map((email, i) => (
                <li key={i}>✅ {email} (invited)</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default App;

