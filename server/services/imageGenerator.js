import config from '../config.js';

/**
 * Image Generation Service
 * 
 * Primary: picsum.photos (fast, reliable, always works)
 * Optional: Hugging Face AI generation (when HF_TOKEN is set and model is warm)
 */
class ImageGenerator {
  constructor() {
    this.apiKey = config.huggingface.apiKey;
    this.model = config.huggingface.model;
    // HF migrated from api-inference.huggingface.co → router.huggingface.co
    this.baseUrl = 'https://router.huggingface.co/hf-inference/models';
    this.timeoutMs = 20000; // 20s timeout per image
  }

  /**
   * Try to generate an image via Hugging Face
   * Returns base64 string or null on any failure
   */
  async _tryHuggingFace(prompt) {
    if (!this.apiKey || this.apiKey === 'your_huggingface_token_here') {
      return null;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const err = await response.text().catch(() => 'unknown');
        console.log(`[HF] Failed (${response.status}): ${err.substring(0, 200)}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('image')) {
        console.log(`[HF] Bad content-type: ${contentType}`);
        return null;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 1000) {
        console.log(`[HF] Image too small: ${buffer.byteLength} bytes`);
        return null;
      }

      console.log(`[HF] ✅ Generated image: ${buffer.byteLength} bytes`);
      return Buffer.from(buffer).toString('base64');
    } catch (err) {
      console.log(`[HF] ${err.name === 'AbortError' ? 'Timeout' : 'Error'}: ${err.message}`);
      return null;
    }
  }

  /**
   * Get a reliable image URL from picsum.photos
   * These return REAL images that Shopify can download
   */
  _getPicsumUrl(keyword, index) {
    // Use a numeric seed derived from the keyword for consistent images
    const seed = Math.abs([...keyword].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) + index;
    const id = (seed % 1000) + 1; // picsum has IDs from 1 to ~1000
    return `https://picsum.photos/id/${id}/800/800`;
  }

  /**
   * Generate images for product creation
   * @param {string[]} prompts - Image description prompts
   * @returns {Array<{attachment: string}|{src: string}>} Shopify-ready image objects
   */
  async generateImages(prompts) {
    if (!prompts || prompts.length === 0) return [];

    const results = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`[ImageGen] (${i + 1}/${prompts.length}) "${prompt.substring(0, 60)}..."`);

      // Try HF first
      const enhancedPrompt = `Professional product photo, studio lighting, white background, e-commerce: ${prompt}`;
      const base64 = await this._tryHuggingFace(enhancedPrompt);

      if (base64) {
        results.push({ attachment: base64 });
        console.log(`[ImageGen] ✅ Using AI-generated image`);
      } else {
        // Fallback to picsum — always works
        const url = this._getPicsumUrl(prompt, i);
        results.push({ src: url });
        console.log(`[ImageGen] 📷 Using picsum fallback: ${url}`);
      }
    }

    return results;
  }
}

export default new ImageGenerator();
