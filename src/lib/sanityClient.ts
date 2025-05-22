import { createClient } from 'next-sanity';

// Create a Sanity client with the project ID and dataset
export const sanityClient = createClient({
  projectId: 'whff3nvn', // From sanity.config.ts
  dataset: 'production', // From sanity.config.ts
  apiVersion: '2023-05-22', // Use today's date or a fixed version
  useCdn: process.env.NODE_ENV === 'production', // Use CDN in production for better performance
  // If a token is provided, use it for authentication (needed for private datasets)
  token: process.env.SANITY_API_READ_TOKEN,
});

// Helper function to build GROQ queries
export const groq = String.raw;
