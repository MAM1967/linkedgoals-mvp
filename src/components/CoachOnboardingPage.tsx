import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import LinkedInLogin from "./LinkedInLogin"; // Import the actual LinkedInLogin component
import "./CoachOnboardingPage.css"; // We will create this CSS file

const CoachOnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const inviterId = searchParams.get("inviterId");
  const goalId = searchParams.get("goalId");
  const inviterName = searchParams.get("inviterName");
  const decodedInviterName = inviterName
    ? decodeURIComponent(inviterName)
    : "Someone";

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true); // Start with loading true to check auth state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessingLink, setIsProcessingLink] = useState(false); // To prevent multiple link processing attempts
  const [goalDescription, setGoalDescription] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Auth state confirmed
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch goal description once params are available
  useEffect(() => {
    if (inviterId && goalId && !goalDescription) {
      const fetchGoal = async () => {
        try {
          const goalRef = doc(db, `users/${inviterId}/goals`, goalId);
          const goalSnap = await getDoc(goalRef);
          if (goalSnap.exists()) {
            setGoalDescription(goalSnap.data().description);
          } else {
            setError(
              "The goal you were invited to coach no longer exists or the link is invalid."
            );
          }
        } catch (err) {
          console.error("Error fetching goal for onboarding:", err);
          setError("Could not retrieve goal details.");
        }
      };
      fetchGoal();
    }
  }, [inviterId, goalId, goalDescription]);

  // Effect to link coach once user is authenticated and params are valid
  useEffect(() => {
    if (
      currentUser &&
      inviterId &&
      goalId &&
      !isProcessingLink &&
      !successMessage &&
      !error &&
      goalDescription
    ) {
      setIsProcessingLink(true);
      setLoading(true);

      if (currentUser.uid === inviterId) {
        setError("You cannot accept an invitation to coach yourself.");
        setLoading(false);
        setIsProcessingLink(false);
        return;
      }

      const linkCoach = async () => {
        try {
          const goalRef = doc(db, `users/${inviterId}/goals`, goalId);
          // Check if goal still exists (though fetchGoal effect also does this)
          const goalSnap = await getDoc(goalRef);
          if (!goalSnap.exists()) {
            setError("The goal you were invited to coach no longer exists.");
            setLoading(false);
            setIsProcessingLink(false);
            return;
          }
          // Check if already coached
          if (goalSnap.data().coachUid) {
            if (goalSnap.data().coachUid === currentUser.uid) {
              setSuccessMessage(
                `You are already coaching ${decodedInviterName} for the goal: "${goalDescription}".`
              );
            } else {
              setError(`This goal is already being coached by someone else.`);
            }
            setLoading(false);
            setIsProcessingLink(false);
            return;
          }

          await updateDoc(goalRef, {
            coachUid: currentUser.uid,
            coachName: currentUser.displayName || "Coach",
            coachStatus: "accepted",
            coachedAt: serverTimestamp(),
          });
          setSuccessMessage(
            `Thank you for accepting, ${
              currentUser.displayName || "Coach"
            }! You are now coaching ${decodedInviterName} for the goal: "${goalDescription}". ` +
              `We recommend reaching out to them on LinkedIn to connect and discuss next steps.`
          );
        } catch (err) {
          console.error("Error linking coach to goal:", err);
          setError("Failed to accept the invitation. Please try again.");
        }
        setLoading(false);
        setIsProcessingLink(false);
      };

      linkCoach();
    }
  }, [
    currentUser,
    inviterId,
    goalId,
    isProcessingLink,
    successMessage,
    error,
    decodedInviterName,
    goalDescription,
  ]);

  if (loading && !currentUser && !successMessage && !error) {
    // Initial loading while auth state is being determined, or goal is loading
    return (
      <div className="coach-onboarding-container">
        <p>Loading invitation...</p>
      </div>
    );
  }

  return (
    <div className="coach-onboarding-container">
      <h1>Coach Onboarding</h1>

      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {!currentUser && !successMessage && !error && inviterId && goalId && (
        <>
          <p>
            Welcome! <strong>{decodedInviterName}</strong> has invited you to be
            their accountability coach for the goal:
            <br />
            <em>"{goalDescription || "Loading goal details..."}"</em>
          </p>
          <p>
            To accept this invitation, please sign in or sign up with LinkedIn.
          </p>
          <div className="login-action-area">
            <LinkedInLogin />
          </div>
        </>
      )}

      {currentUser &&
        !successMessage &&
        !error &&
        !isProcessingLink &&
        inviterId &&
        goalId && (
          // This state might be brief as the useEffect for linking should kick in.
          // Or if linking is blocked (e.g. self-coaching attempt already errored out before this render)
          <p>Verifying your invitation...</p>
        )}

      {(!inviterId || !goalId) && !error && !successMessage && (
        <p className="error-message">
          Invalid or incomplete invitation link. Please ensure you have the
          correct link from the inviter.
        </p>
      )}

      {(successMessage ||
        (error &&
          error !== "Could not retrieve goal details." &&
          error !==
            "The goal you were invited to coach no longer exists or the link is invalid.")) && (
        <button onClick={() => navigate("/")} className="btn btn-primary mt-4">
          Go to Dashboard
        </button>
      )}
    </div>
  );
};

export default CoachOnboardingPage;
