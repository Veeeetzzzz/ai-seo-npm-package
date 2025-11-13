// HTMLParser - v1.12.0
// Parse HTML and extract metadata for schema generation

/**
 * HTMLParser
 * 
 * Extracts structured content and metadata from HTML documents.
 * Supports meta tags, OpenGraph, Twitter Cards, and existing schemas.
 * 
 * @example
 * const parsed = HTMLParser.parse(html, url);
 * console.log(parsed.title); // Page title
 */
export class HTMLParser {
  /**
   * Parse HTML and extract all metadata
   * 
   * @param {string} html - Raw HTML content
   * @param {string} url - Source URL
   * @returns {Object} Parsed content and metadata
   */
  static parse(html, url) {
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid HTML content');
    }

    try {
      return {
        url,
        title: this._extractTitle(html),
        description: this._extractDescription(html),
        content: this._extractMainContent(html),
        images: this._extractImages(html, url),
        meta: this._extractMetaTags(html),
        openGraph: this._extractOpenGraph(html),
        twitterCard: this._extractTwitterCard(html),
        existing: this._extractExistingSchemas(html),
        structured: this._extractStructuredData(html)
      };
    } catch (error) {
      throw new Error(`HTML parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract page title
   * @private
   */
  static _extractTitle(html) {
    // Try <title> tag first
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    if (titleMatch && titleMatch[1]) {
      return this._cleanText(titleMatch[1]);
    }

    // Try og:title
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    if (ogTitle && ogTitle[1]) {
      return this._cleanText(ogTitle[1]);
    }

    // Try h1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    if (h1Match && h1Match[1]) {
      return this._cleanText(h1Match[1]);
    }

    return '';
  }

  /**
   * Extract meta description
   * @private
   */
  static _extractDescription(html) {
    // Try meta description
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (metaDesc && metaDesc[1]) {
      return this._cleanText(metaDesc[1]);
    }

    // Try og:description
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    if (ogDesc && ogDesc[1]) {
      return this._cleanText(ogDesc[1]);
    }

    return '';
  }

  /**
   * Extract main content text
   * @private
   */
  static _extractMainContent(html) {
    // Remove script and style tags
    let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Try to find main content area
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      content.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      content.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    
    if (mainMatch && mainMatch[1]) {
      content = mainMatch[1];
    }

    // Remove all HTML tags
    content = content.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit length
    return content.substring(0, 5000);
  }

  /**
   * Extract images from HTML
   * @private
   */
  static _extractImages(html, baseUrl) {
    const images = [];
    const imageRegex = /<img[^>]*src=["']([^"']*)["']/gi;
    let match;

    while ((match = imageRegex.exec(html)) !== null) {
      if (match[1]) {
        images.push(this._resolveUrl(match[1], baseUrl));
      }
    }

    // Also check og:image
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    if (ogImage && ogImage[1]) {
      images.unshift(this._resolveUrl(ogImage[1], baseUrl));
    }

    // Remove duplicates
    return [...new Set(images)];
  }

  /**
   * Extract all meta tags
   * @private
   */
  static _extractMetaTags(html) {
    const meta = {};
    const metaRegex = /<meta[^>]*>/gi;
    let match;

    while ((match = metaRegex.exec(html)) !== null) {
      const tag = match[0];
      
      // Extract name/property and content
      const nameMatch = tag.match(/(?:name|property)=["']([^"']*)["']/i);
      const contentMatch = tag.match(/content=["']([^"']*)["']/i);
      
      if (nameMatch && contentMatch) {
        const key = nameMatch[1].toLowerCase();
        meta[key] = contentMatch[1];
      }
    }

    return meta;
  }

  /**
   * Extract OpenGraph tags
   * @private
   */
  static _extractOpenGraph(html) {
    const og = {};
    const ogRegex = /<meta[^>]*property=["']og:([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
    let match;

    while ((match = ogRegex.exec(html)) !== null) {
      og[match[1]] = match[2];
    }

    return og;
  }

  /**
   * Extract Twitter Card tags
   * @private
   */
  static _extractTwitterCard(html) {
    const twitter = {};
    const twitterRegex = /<meta[^>]*name=["']twitter:([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
    let match;

    while ((match = twitterRegex.exec(html)) !== null) {
      twitter[match[1]] = match[2];
    }

    return twitter;
  }

  /**
   * Extract existing JSON-LD schemas
   * @private
   */
  static _extractExistingSchemas(html) {
    const schemas = [];
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const schema = JSON.parse(match[1]);
        schemas.push(schema);
      } catch (error) {
        // Invalid JSON, skip
      }
    }

    return schemas;
  }

  /**
   * Extract microdata and RDFa
   * @private
   */
  static _extractStructuredData(html) {
    const structured = [];

    // Look for itemscope (microdata)
    const itemscopeRegex = /<[^>]*itemscope[^>]*itemtype=["']([^"']*)["'][^>]*>([\s\S]*?)<\/[^>]*>/gi;
    let match;

    while ((match = itemscopeRegex.exec(html)) !== null) {
      structured.push({
        type: 'microdata',
        itemType: match[1]
      });
    }

    return structured;
  }

  /**
   * Resolve relative URLs to absolute
   * @private
   */
  static _resolveUrl(url, baseUrl) {
    if (!url) return '';
    
    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Protocol-relative
    if (url.startsWith('//')) {
      return 'https:' + url;
    }

    // Absolute path
    if (url.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${url}`;
      } catch {
        return url;
      }
    }

    // Relative path
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Clean text content
   * @private
   */
  static _cleanText(text) {
    if (!text) return '';
    
    // Remove HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
}

