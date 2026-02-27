/**
 * Global error handler middleware
 */
export default function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Shopify API errors
  if (err.message?.includes('Shopify API error')) {
    return res.status(502).json({
      error: 'Shopify API error',
      message: err.message,
    });
  }

  // OpenRouter errors
  if (err.message?.includes('OpenRouter API error')) {
    return res.status(502).json({
      error: 'AI service error',
      message: err.message,
    });
  }

  // Validation errors
  if (err.message?.includes('Validation failed')) {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
    });
  }

  // Default
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
}
