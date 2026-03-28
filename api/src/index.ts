import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import { authModule } from "./modules/auth";
import { tenantAuthMiddleware } from "./middlewares/tenantAuth";
import { ownerModule } from "./modules/owner";
import { bookingModule } from "./modules/booking";
import staticPlugin from '@elysiajs/static';
import { paymentModule } from "./modules/payment";

const app = new Elysia()
  .use(cors({ origin: '*', allowedHeaders: ['Content-Type', 'Authorization'] }))
  .use(staticPlugin({ assets: 'uploads', prefix: '/uploads'}))
  // .use(swagger({ path: '/docs' }))
  
  // โซน Auth ปกติ (สมัคร/ล็อกอิน)
  .use(authModule)
  
  .group("/api/:tenantPath", (apiGroup) => 
    apiGroup
      .use(tenantAuthMiddleware)
      .use(ownerModule)
      .use(bookingModule)
      .use(paymentModule)
  )
  .listen(3000);

console.log(`🚀 Backend is running at ${app.server?.hostname}:${app.server?.port}`);