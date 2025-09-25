/**
 * Health check endpoint for monitoring and deployment verification
 */

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LEAPS Opportunity Screener API',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        screener: '/api/screener',
        health: '/api/health'
      }
    };

    return res.status(200).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}