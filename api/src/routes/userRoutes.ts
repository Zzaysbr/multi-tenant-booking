// api/src/routes/userRoutes.ts
import { Elysia, t } from "elysia";
import { updateProfile, uploadAvatar } from "../controllers/userController";
import { tenantAuthMiddleware } from "../middlewares/tenantAuth";

export const userRoutes = (app: Elysia) => 
  app
    .use(tenantAuthMiddleware) // ✅ ฉีด middleware เข้าไปในกลุ่มนี้
    .group("/api/user", (group) => 
      group
        // --- 📝 อัปเดตโปรไฟล์ ---
        .patch("/profile", ({ body, currentUser }) => {
          if (!currentUser) throw new Error("Unauthorized"); // Guard: ต้องล็อกอินเท่านั้น
          return updateProfile({ body, currentUser });
        })
        
        // --- 📸 อัปโหลดรูป (รับไฟล์แบบ Multipart) ---
        .post("/upload-avatar", ({ request, currentUser }) => {
          if (!currentUser) throw new Error("Unauthorized");
          return uploadAvatar({ request, currentUser });
        })
    );