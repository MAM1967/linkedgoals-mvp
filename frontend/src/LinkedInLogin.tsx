//
//  LinkedInLogin.tsx
//  
//
//  Created by Michael McDermott on 4/10/25.
//
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signInWithCustomToken } from "firebase/auth";

export default function LinkedInLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        console.error("No LinkedIn OAuth code found in URL");
        return;
      }

        try {
          const res = await fetch("https://linkedinlogin-adhk2oqdsq-uc.a.run.app/?code=" + code);

          if (!res.ok) {
            const text = await res.text(); // try to read the error message
            throw new Error(`Server error: ${res.status} – ${text}`);
          }

          const data = await res.json();
          console.log("Function response:", data);

          if (!data.token) throw new Error("Missing token");

          await signInWithCustomToken(auth, data.token);
          console.log("Signed in successfully");
          navigate("/");
        } catch (err) {
          console.error("LinkedIn login failed:", err);
        }
    };

    handleLogin();
  }, [navigate]);

  return <p>Signing you in with LinkedIn...</p>;
}




