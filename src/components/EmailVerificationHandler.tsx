import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";

const EmailVerificationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("Invalid verification link");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        setStatus("Verifying your email address...");

        // Call the Cloud Function using httpsCallable
        const functions = getFunctions();
        const verifyEmail = httpsCallable(functions, "verifyEmail");
        const result = await verifyEmail({ token });

        if (result.data && (result.data as { success?: boolean }).success) {
          setStatus("Email verified successfully! Redirecting to dashboard...");
          setTimeout(() => navigate("/?emailVerified=true"), 2000);
        } else {
          setStatus("Verification failed. Please try again.");
          setTimeout(() => navigate("/"), 5000);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("Verification failed. Please try again.");
        setTimeout(() => navigate("/"), 5000);
      }
    };

    handleVerification();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          padding: "40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "20px" }}>📧</div>
        <h2 style={{ color: "#333", marginBottom: "20px" }}>
          Email Verification
        </h2>
        <p style={{ color: "#666", lineHeight: "1.6" }}>{status}</p>
        {status.includes("Verifying") && (
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #0066cc",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "20px auto",
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationHandler;
