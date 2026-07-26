declare global {
  namespace Express {
    interface Request {
      userId?: string;
      csrfToken?: string;
    }
  }
}

export {};
