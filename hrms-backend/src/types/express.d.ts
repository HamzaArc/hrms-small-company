// hrms-backend/src/types/express.d.ts

// This interface defines the shape of the user object that our JwtStrategy returns.
interface UserPayload {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

// This uses declaration merging to add the custom 'user' property to Express's Request interface.
declare namespace Express {
  export interface Request {
    user?: UserPayload; // The '?' makes it an optional property.
  }
}