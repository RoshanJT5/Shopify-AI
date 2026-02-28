import config from '../config.js';

/**
 * Hugging Face Text-to-Image Service
 * Generates product images using AI and returns base64-encoded data.
 */
class ImageGenerator {
  constructor() {
    this.apiKey = config.huggingface.apiKey;
    this.model = config.huggingface.model;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
  }

  /**
   * Generate a single image from a text prompt
   * @param {string} prompt - Description of the image to generate
   * @returns {string|null} - Base64-encoded image data, or null on failure
   */
  async generateImage(prompt) {
    if (!this.apiKey) {
      console.warn('HF_TOKEN not configured — skipping image generation');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 768,
            height: 768,
          },
        }),
      });

      // Model might be loading (cold start) — retry once after waiting
      if (response.status === 503) {
        const retryData = await response.json().catch(() => ({}));
        const waitTime = retryData.estimated_time || 30;
        console.log(`HF model loading, waiting ${Math.min(waitTime, 60)}s...`);
        await new Promise(r => setTimeout(r, Math.min(waitTime, 60) * 1000));

        // Retry
        const retryResponse = await fetch(`${this.baseUrl}/${this.model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { width: 768, height: 768 },
          }),
        });

        if (!retryResponse.ok) {
          console.error(`HF retry failed: ${retryResponse.status}`);
          return null;
        }

        const buffer = await retryResponse.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HF API error ${response.status}: ${errorText}`);
        return null;
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('Image generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate multiple images from an array of prompts
   * @param {string[]} prompts - Array of image descriptions
   * @returns {Array<{base64: string}|{src: string}>} - Array of image objects for Shopify
   */
  async generateImages(prompts) {
    if (!prompts || prompts.length === 0) return [];
    if (!this.apiKey) {
      console.warn('HF_TOKEN not set — falling back to picsum.photos');
      return prompts.map((prompt, i) => {
        const seed = prompt.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
        return { src: `https://picsum.photos/seed/${seed}-${i}/800/800` };
      });
    }

    const results = [];
    // Generate sequentially to avoid rate limits on free tier
    for (const prompt of prompts) {
      const enhancedPrompt = `High quality professional product photography, studio lighting, white background, e-commerce style: ${prompt}`;
      console.log(`Generating image: "${prompt.substring(0, 60)}..."`);

      const base64 = await this.generateImage(enhancedPrompt);
      if (base64) {
        results.push({ attachment: base64 });
      } else {
        // Fallback to picsum
        const seed = prompt.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
        results.push({ src: `https://picsum.photos/seed/${seed}/800/800` });
      }
    }

    return results;
  }
}

export default new ImageGenerator();
