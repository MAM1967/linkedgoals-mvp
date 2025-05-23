/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, config, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
// Keep axios import in case we revert, but it won't be used in this simplified version
// import axios, { AxiosError } from "axios";
import * as functions from "firebase-functions";

admin.initializeApp();

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInProfileResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
}

interface LinkedInEmailResponse {
  elements: Array<{
    handle: {
      emailAddress: string;
    };
  }>;
}

interface ErrorResponse {
  data: unknown;
  status: number;
  headers: Record<string, string>;
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const linkedinLogin2 = onCall(
  {
    maxInstances: 10,
  },
  async (request: {
    data: unknown;
  }): Promise<{ message: string; receivedData: unknown }> => {
    console.log("--- LinkedIn Login SIMPLIFIED v1 --- ");
    console.log(
      "Raw request.data received by simplified function:",
      JSON.stringify(request.data)
    );

    const receivedData = request.data;

    if (!receivedData) {
      console.error("Simplified function: No data received in request.data");
      throw new HttpsError("invalid-argument", "No data received.");
    }

    // For now, just acknowledge receipt
    return {
      message: "Simplified function executed successfully.",
      receivedData: receivedData,
    };
  }
);
