import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  DocumentData,
  Timestamp,
  addDoc, // Import addDoc for adding new documents
} from "firebase/firestore";

interface SmartGoal {
  id: string;
  specific: string;
  measurable: {
    type: string;
    targetValue: number | string | boolean | null;
    currentValue: number | string | boolean | null;
  };
  achievable: string;
  relevant: string;
  timeBound: string;
  userId: string;
  creationDate: string;
  lastUpdatedDate: string;
  isShareable?: boolean;
  sharingId?: string;
}

interface Comment {
  id: string;
  goalId: string; // Link to the goal
  commenterName?: string; // Optional name
  commentText: string;
  createdAt: Timestamp; // Use Timestamp for Firebase date
}

const SharedGoalView: React.FC = () => {
  const { sharingId } = useParams<{ sharingId: string }>();
  const [goal, setGoal] = useState<SmartGoal | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for comment form inputs
  const [commenterName, setCommenterName] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');


  useEffect(() => {
    const fetchSharedGoalAndComments = async () => {
      if (!sharingId) {
        setError("Invalid sharing ID.");
        setLoading(false);
        return;
      }

      try {
        // Fetch Goal
        const goalsRef = collection(db, "goals");
        const qGoal = query(goalsRef, where("sharingId", "==", sharingId));
        const querySnapshotGoal = await getDocs(qGoal);

        if (querySnapshotGoal.empty) {
          setError("Goal not found or is not shareable.");
          setLoading(false);
          return;
        }

        const docGoal = querySnapshotGoal.docs[0];
        const fetchedGoal = {
          id: docGoal.id,
          ...docGoal.data() as SmartGoal,
        };
        setGoal(fetchedGoal);

        // Fetch Comments for this goal
        const commentsRef = collection(db, "comments");
        const qComments = query(commentsRef, where("goalId", "==", fetchedGoal.id), orderBy("createdAt", "asc"));
        const querySnapshotComments = await getDocs(qComments);

        const fetchedComments: Comment[] = [];
        querySnapshotComments.forEach((doc) => {
          fetchedComments.push({
            id: doc.id,
            ...doc.data() as Comment,
          });
        });
        setComments(fetchedComments);


        setLoading(false);

      } catch (error) {
        console.error("Error fetching shared goal and comments:", error);
        setError("An error occurred while fetching the goal and comments.");
        setLoading(false);
      }
    };

    fetchSharedGoalAndComments();
  }, [sharingId]);


  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission

    if (!goal) {
      alert("Goal not loaded yet.");
      return;
    }

    if (!commentText.trim()) {
      alert("Comment text cannot be empty.");
      return;
    }

    try {
      const newComment: Omit<Comment, 'id'> = { // Omit 'id' as Firebase will generate it
        goalId: goal.id,
        commenterName: commenterName.trim() || undefined, // Use undefined if name is empty
        commentText: commentText.trim(),
        createdAt: Timestamp.now(), // Use Firebase server timestamp
      };

      // Add the new comment to the 'comments' collection
      await addDoc(collection(db, "comments"), newComment);

      // Clear the form
      setCommenterName('');
      setCommentText('');

      // Optionally, refetch comments to display the new one immediately
      // This is a simple way to refresh, for more complex apps you might
      // want to update the local state directly.
      const commentsRef = collection(db, "comments");
      const qComments = query(commentsRef, where("goalId", "==", goal.id), orderBy("createdAt", "asc"));
      const querySnapshotComments = await getDocs(qComments);

      const fetchedComments: Comment[] = [];
      querySnapshotComments.forEach((doc) => {
        fetchedComments.push({
          id: doc.id,
          ...doc.data() as Comment,
        });
      });
      setComments(fetchedComments);


    } catch (error) {
      console.error("Error adding comment:", error);
      alert("An error occurred while adding your comment.");
    }
  };


  if (loading) {
    return <div className="text-center mt-8">Loading goal...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">Error: {error}</div>;
  }

  if (!goal) {
      return <div className="text-center mt-8 text-gray-600">Goal not found.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Shared SMART Goal</h2>

      {/* Display Goal Details */}
       <div key={goal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="font-semibold text-xl text-gray-900 mb-3">{goal.specific}</h3>

              <div className="space-y-2 text-gray-700 text-base">
                {/* Measurable */}
                <div>
                  <p className="font-medium text-gray-800">Measurable ({goal.measurable.type}):</p>
                  {goal.measurable.type === 'Number' && (
                      <div>
                        <p className="ml-2">Target: <span className="font-semibold">{goal.measurable.targetValue}</span> | Current: <span className="font-semibold">{goal.measurable.currentValue}</span></p>
                        {/* Progress Bar Container */}
                        {goal.measurable.targetValue !== null && goal.measurable.currentValue !== null && typeof goal.measurable.targetValue === 'number' && typeof goal.measurable.currentValue === 'number' && goal.measurable.targetValue > 0 && (
                           <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                             <div
                               className="bg-blue-600 h-3 rounded-full text-xs text-white text-center transition-all duration-500 ease-in-out"
                               style={{ width: `${Math.min((goal.measurable.currentValue / goal.measurable.targetValue) * 100, 100)}%` }}
                             >
                                {Math.min((goal.measurable.currentValue / goal.measurable.targetValue) * 100, 100).toFixed(0)}%
                             </div>
                           </div>
                         )}
                         {/* Handle case where target is 0 or null */}
                         {goal.measurable.type === 'Number' && (goal.measurable.targetValue === 0 || goal.measurable.targetValue === null) && (
                            <p className="ml-2 text-gray-500">Target not set or is 0.</p>
                          )}
                      </div>
                    )}
                    {goal.measurable.type === 'Date' && (
                       <p className="ml-2">Target: <span className="font-semibold">{new Date(goal.measurable.targetValue as string).toLocaleDateString()}</span> | Current: <span className="font-semibold">{new Date(goal.measurable.currentValue as string).toLocaleDateString()}</span></p>
                    )}
                    {goal.measurable.type === 'Yes/No' && (
                       <p className="ml-2">Status: <span className="font-semibold">{goal.measurable.currentValue === true ? 'Completed' : 'In Progress'}</span></p>
                    )}
                </div>

                {/* Achievable */}
                <div>
                  <p className="font-medium text-gray-800">Achievable:</p>
                  <p className="ml-2">{goal.achievable}</p>
                </div>

                {/* Relevant */}
                <div>
                   <p className="font-medium text-gray-800">Relevant:</p>
                  <p className="ml-2">{goal.relevant}</p>
                </div>

                {/* Time-bound */}
                <div>
                   <p className="font-medium text-gray-800">Time-bound:</p>
                  <p className="ml-2"><span className="font-semibold">{new Date(goal.timeBound).toLocaleDateString()}</span></p>
                </div>

                 {/* Created and Last Updated Dates (Optional) */}
                 {/*
                 <div>
                    <p className="font-medium text-gray-800">Created:</p>
                   <p className="ml-2 text-xs text-gray-500">{new Date(goal.creationDate).toLocaleString()}</p>
                 </div>
                 <div>
                    <p className="font-medium text-gray-800">Last Updated:</p>
                   <p className="ml-2 text-xs text-gray-500">{new Date(goal.lastUpdatedDate).toLocaleString()}</p>
                 </div>
                 */}

              </div>
            </div>
          </div>

        {/* Commenting Section */}
         <div className="mt-8 border-t pt-4">
            <h3 className="text-xl font-semibold mb-4">Comments</h3>
            {comments.length === 0 ? (
                <p className="text-gray-600">No comments yet.</p>
            ) : (
                <div className="space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="bg-gray-100 p-3 rounded-md">
                            <p className="text-sm font-semibold text-gray-800">
                                {comment.commenterName || "Anonymous"} -{" "}
                                {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : "No date"}
                            </p>
                            <p className="text-gray-700 mt-1">{comment.commentText}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Comment Form */}
             <div className="mt-6">
                <h4 className="text-lg font-medium mb-2">Add a Comment</h4>
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="commenterName" className="block text-sm font-medium text-gray-700">Your Name (Optional)</label>
                        <input
                            type="text"
                            id="commenterName"
                            value={commenterName}
                            onChange={(e) => setCommenterName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                    </div>
                     <div>
                        <label htmlFor="commentText" className="block text-sm font-medium text-gray-700">Comment *</label>
                        <textarea
                            id="commentText"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={3}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Post Comment
                    </button>
                </form>
            </div>
         </div>

    </div>
  );
};

export default SharedGoalView;
