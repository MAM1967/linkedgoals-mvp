import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, } from "firebase/auth";
export default function Auth({ onAuth }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const handleAuth = async () => {
        try {
            let userCred;
            if (isRegistering) {
                userCred = await createUserWithEmailAndPassword(auth, email, password);
            }
            else {
                userCred = await signInWithEmailAndPassword(auth, email, password);
            }
            onAuth(userCred.user); // Pass user back to parent
        }
        catch (err) {
            setError(err.message);
        }
    };
    return (_jsxs("div", { style: { maxWidth: "400px", margin: "2rem auto", textAlign: "center" }, children: [_jsx("h2", { children: isRegistering ? "Register" : "Login" }), _jsx("input", { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), style: { padding: "0.5rem", marginBottom: "1rem", width: "100%" } }), _jsx("input", { type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), style: { padding: "0.5rem", marginBottom: "1rem", width: "100%" } }), _jsx("button", { onClick: handleAuth, style: { padding: "0.5rem 1rem", marginBottom: "1rem" }, children: isRegistering ? "Create Account" : "Log In" }), _jsx("div", { children: _jsx("button", { onClick: () => setIsRegistering(!isRegistering), style: { fontSize: "0.9rem" }, children: isRegistering ? "Already have an account? Log in" : "New? Create an account" }) }), error && _jsx("p", { style: { color: "red", marginTop: "1rem" }, children: error })] }));
}
