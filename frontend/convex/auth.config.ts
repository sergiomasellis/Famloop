// Convex auth configuration for Clerk integration
// Based on publishable key: pk_test_Y2FwaXRhbC1iYXNpbGlzay0zNS5jbGVyay5hY2NvdW50cy5kZXYk
// The domain is derived from the base64-decoded publishable key

export default {
  providers: [
    {
      // Clerk issuer URL - hardcoded based on your Clerk instance
      domain: "https://capital-basilisk-35.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
