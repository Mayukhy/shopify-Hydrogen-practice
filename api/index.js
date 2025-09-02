import {createRequestHandler} from '@shopify/remix-oxygen';
import {createAppLoadContext} from '../app/lib/context.js';

/**
 * Vercel serverless function handler for Hydrogen app
 */
export default async function handler(req, res) {
  try {
    // Convert Vercel request/response to standard Request/Response
    const request = new Request(`https://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Create environment from process.env
    const env = {
      SESSION_SECRET: process.env.SESSION_SECRET,
      PUBLIC_STOREFRONT_API_TOKEN: process.env.PUBLIC_STOREFRONT_API_TOKEN,
      PRIVATE_STOREFRONT_API_TOKEN: process.env.PRIVATE_STOREFRONT_API_TOKEN,
      PUBLIC_STORE_DOMAIN: process.env.PUBLIC_STORE_DOMAIN,
      PUBLIC_STOREFRONT_API_VERSION: process.env.PUBLIC_STOREFRONT_API_VERSION,
      PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
      PUBLIC_CUSTOMER_ACCOUNT_API_URL: process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
      ...process.env
    };

    const appLoadContext = await createAppLoadContext(
      request,
      env,
      {}, // execution context
    );

    const handleRequest = createRequestHandler({
      // eslint-disable-next-line import/no-unresolved
      build: await import('virtual:react-router/server-build'),
      mode: process.env.NODE_ENV || 'production',
      getLoadContext: () => appLoadContext,
    });

    const response = await handleRequest(request);
    
    // Convert Response back to Vercel format
    res.status(response.status);
    
    // Set headers
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    // Send body
    const body = await response.text();
    res.send(body);

  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
