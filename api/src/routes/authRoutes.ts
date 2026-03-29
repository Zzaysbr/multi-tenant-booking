// api/src/routes/authRoutes.ts
import { forgotPassword, resetPassword } from "../controllers/authController";
import { googleAuthRedirect, googleAuthCallback } from "../controllers/oauthController";

export const authRoutes = (app: any) => {
  // Password Recovery
  app.post("/api/auth/forgot-password", forgotPassword);
  app.patch("/api/auth/reset-password", resetPassword);

  // Google OAuth
  app.get("/api/auth/google", googleAuthRedirect);
  app.get("/api/auth/google/callback", googleAuthCallback);
};