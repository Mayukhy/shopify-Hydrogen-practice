import {createRequestHandler} from '@shopify/remix-oxygen';
import {createAppLoadContext} from '~/lib/context';

/**
 * Vercel adapter for Hydrogen app
 */
export default async function handler(request, context) {
  try {
    // Create environment from Vercel context
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
      context,
    );

    const handleRequest = createRequestHandler({
      // eslint-disable-next-line import/no-unresolved
      build: await import('virtual:react-router/server-build'),
      mode: process.env.NODE_ENV,
      getLoadContext: () => appLoadContext,
    });

    return handleRequest(request);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    return new Response('Internal Server Error', {
      status: 500,
    });
  }
}
