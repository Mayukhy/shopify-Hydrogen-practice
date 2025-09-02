/**
 * Vercel serverless function handler for Hydrogen app
 */
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Simple response for now to test if the function works
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hydrogen App</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>Hydrogen App is Running on Vercel!</h1>
        <p>Method: ${req.method}</p>
        <p>URL: ${req.url}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: error.stack 
    });
  }
}
