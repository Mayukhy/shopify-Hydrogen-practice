// @ts-ignore
// Virtual entry point for the app
import * as remixBuild from '@remix-run/dev/server-build';
import {createRequestHandler} from '@remix-run/server-runtime';

import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  createCustomerAccountClient,
} from '@shopify/hydrogen';

import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

/**
 * Export a fetch handler in module format.
 */

export default async function (request) {
  try {
    /**
     * This has to be done so messy because process.env can't be destructured
     * and only variables explicitly named are present inside a Vercel Edge Function.
     * See https://github.com/vercel/next.js/pull/31237/files
     */
    const env = {
      SESSION_SECRET: '',
      PUBLIC_STOREFRONT_API_TOKEN: '',
      PRIVATE_STOREFRONT_API_TOKEN: '',
      PUBLIC_STORE_DOMAIN: '',
      PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: '',
      PUBLIC_CUSTOMER_ACCOUNT_API_URL: '',
      PUBLIC_CHECKOUT_DOMAIN: '',
    };

    env.SESSION_SECRET = process.env.SESSION_SECRET;
    env.PUBLIC_STOREFRONT_API_TOKEN = process.env.PUBLIC_STOREFRONT_API_TOKEN;
    env.PRIVATE_STOREFRONT_API_TOKEN = process.env.PRIVATE_STOREFRONT_API_TOKEN;
    env.PUBLIC_STORE_DOMAIN = process.env.PUBLIC_STORE_DOMAIN;
    env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID = process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID;
    env.PUBLIC_CUSTOMER_ACCOUNT_API_URL = process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL;
    env.PUBLIC_CHECKOUT_DOMAIN = process.env.PUBLIC_CHECKOUT_DOMAIN;

    /**
     * Open a cache instance in the worker and a custom session instance.
     */
    if (!env?.SESSION_SECRET) {
      throw new Error('SESSION_SECRET process.environment variable is not set');
    }

    const [session] = await Promise.all([
      AppSession.init(request, [process.env.SESSION_SECRET]),
    ]);

    /**
     * Create Hydrogen's Storefront client.
     */
    const {storefront} = createStorefrontClient({
      buyerIp: request.headers.get('x-forwarded-for') ?? undefined,
      i18n: {language: 'EN', country: 'US'},
      publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      storeDomain: env.PUBLIC_STORE_DOMAIN,
      // storefrontId: process.env.PUBLIC_STOREFRONT_ID,
      // requestGroupId: request.headers.get('request-id'),
    });

    /**
     * Create a client for Customer Account API.
     */
    const customerAccount = createCustomerAccountClient({
      request,
      session,
      customerAccountId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
      customerAccountUrl: env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
    });

    const cart = createCartHandler({
      storefront,
      customerAccount,
      getCartId: cartGetIdDefault(request.headers),
      setCartId: cartSetIdDefault(),
      cartQueryFragment: CART_QUERY_FRAGMENT,
    });

    const handleRequest = createRequestHandler(remixBuild, 'production');

    const response = await handleRequest(request, {
      session,
      storefront,
      customerAccount,
      cart,
      env,
      waitUntil: () => Promise.resolve(),
    });

    if (session.isPending) {
      response.headers.set(
        'Set-Cookie',
        await session.commit(),
      );
    }

    if (response.status === 404) {
      /**
       * Check for redirects only when there's a 404 from the app.
       * If the redirect doesn't exist, then `storefrontRedirect`
       * will pass through the 404 response.
       */
      // return storefrontRedirect({request, response, storefront});
    }

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return new Response('An unexpected error occurred', {status: 500});
  }
}