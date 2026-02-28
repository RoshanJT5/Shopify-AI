import config from '../config.js';

/**
 * Hugging Face Text-to-Image Service
 * Generates product images using AI and returns data for Shopify.
 * Falls back to picsum.photos if HF is unavailable or slow.
 */
class ImageGenerator {
  constructor() {
    this.apiKey = config.huggingface.apiKey;
    this.model = config.huggingface.model;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.timeoutMs = 25000; // 25s timeout per image — keeps total under Vercel's 60s limit
  }

  /**
   * Fetch with a timeout (AbortController)
   */
  async _fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Generate a single image from a text prompt
   * @returns {string|null} Base64-encoded image data, or null on failure
   */
  async generateImage(prompt) {
    if (!this.apiKey) {
      console.warn('HF_TOKEN not configured — skipping image generation');
      return null;
    }

    try {
      console.log(`[HF] Generating image with model: ${this.model}`);
      const response = await this._fetchWithTimeout(
        `${this.baseUrl}/${this.model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        },
        this.timeoutMs
      );

      // Model loading — don't wait, fall back immediately
      if (response.status === 503) {
        console.warn('[HF] Model is loading (cold start) — falling back to picsum');
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown');
        console.error(`[HF] API error ${response.status}: ${errorText}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('image')) {
        console.error(`[HF] Unexpected content-type: ${contentType}`);
        return null;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 1000) {
        console.error(`[HF] Image too small (${buffer.byteLength} bytes) — likely invalid`);
        return null;
      }

      console.log(`[HF] Image generated successfully (${buffer.byteLength} bytes)`);
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`[HF] Request timed out after ${this.timeoutMs}ms — falling back to picsum`);
      } else {
        console.error('[HF] Image generation failed:', error.message);
      }
      return null;
    }
  }

  /**
   * Create a picsum.photos fallback URL from a prompt
   */
  _getFallbackUrl(prompt, index) {
    const seed = prompt.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30) + `-${index}`;
    return `https://picsum.photos/seed/${seed}/800/800`;
  }

  /**
   * Generate multiple images from an array of prompts
   * @returns {Array<{attachment: string}|{src: string}>} Image objects for Shopify
   */
  async generateImages(prompts) {
    if (!prompts || prompts.length === 0) return [];

    const results = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const enhancedPrompt = `Professional product photography, studio lighting, clean white background, e-commerce catalog style: ${prompt}`;
      console.log(`[ImageGen] Processing image ${i + 1}/${prompts.length}: "${prompt.substring(0, 50)}..."`);

      const base64 = await this.generateImage(enhancedPrompt);

      if (base64) {
        results.push({ attachment: base64 });
      } else {
        // Fallback to picsum — always works
        const fallbackUrl = this._getFallbackUrl(prompt, i);
        console.log(`[ImageGen] Using fallback: ${fallbackUrl}`);
        results.push({ src: fallbackUrl });
      }
    }

    return results;
  }
}

export default new ImageGenerator();
