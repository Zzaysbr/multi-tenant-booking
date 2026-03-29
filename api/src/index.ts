import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from '@elysiajs/static';

// Middlewares
import { tenantAuthMiddleware } from "./middlewares/tenantAuth";

// Modules / Routes
import { authModule } from "./modules/auth"; 
import { userRoutes } from "./routes/userRoutes"; 
import { ownerModule } from "./modules/owner";
import { bookingModule } from "./modules/booking";
import { paymentModule } from "./modules/payment";
import { queueModule } from "./modules/queue";
import { businessHoursModule } from "./modules/business_hours";
import { adminModule } from "./modules/admin";

const app = new Elysia()
  // --- 1. Global Setup ---
  .use(cors({
    // เช็ค Origin ที่ส่งมา
    origin: (request) => {
      const origin = request.headers.get('origin');
      const allowedOrigins = [
        'http://localhost:5173', 
        process.env.FRONTEND_URL
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        return true;
      }
      return false;
    },
    credentials: true, // สำหรับส่ง Cookie หรือ Header Authorization
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'], // ต้องมี OPTIONS สำหรับ Preflight
    preflight: true // บังคับให้จัดการ Preflight (Status 204)
  }))
  
  // แก้ static ให้เข้าถึงโฟลเดอร์ public (เพื่อรูปโปรไฟล์และรูปอื่นๆ)
  .use(staticPlugin({ 
    assets: 'public', 
    prefix: '' 
  }))

  // --- Global Auth Routes (ไม่ต้องมี tenantPath) ---
  .use(authModule)  
  .use(userRoutes)  
  .use(adminModule)

  // --- Tenant Specific Routes ---
  .group("/api/:tenantPath", (apiGroup) => 
    apiGroup
      .use(tenantAuthMiddleware)
      
      .get("/config", async ({ currentTenant }: any) => {
        return { config: currentTenant };
      })
      
      .use(businessHoursModule)
      .use(queueModule)
      .use(ownerModule)
      .use(bookingModule)
      .use(paymentModule)
  )
  
  // --- Start ---
  .listen(process.env.PORT || 3000);

console.log(`🦊 Cozy Backend is online at port ${app.server?.port}`);