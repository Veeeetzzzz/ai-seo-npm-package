# 🧠 AI-SEO (NPM Package)

[![npm version](https://badge.fury.io/js/ai-seo.svg)](https://badge.fury.io/js/ai-seo)
[![npm downloads](https://img.shields.io/npm/dm/ai-seo.svg)](https://www.npmjs.com/package/ai-seo)
[![license](https://img.shields.io/npm/l/ai-seo.svg)](https://github.com/Veeeetzzzz/ai-seo-npm-package/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/ai-seo)](https://bundlephobia.com/package/ai-seo)
[![zero dependencies](https://img.shields.io/badge/dependencies-zero-green.svg)](https://www.npmjs.com/package/ai-seo)

**AI-SEO** is a minimal, zero-dependency JavaScript utility for injecting AI-friendly JSON-LD structured data into your pages. Optimized for AI-powered search engines like ChatGPT, Bing Chat, Google Gemini, and traditional SEO.

> 💡 **Looking for a CDN/no-install version?** Check out [easy-ai-seo](https://github.com/Veeeetzzzz/easy-ai-seo) for direct script tag usage!

## ✨ Features

- ✅ **Zero dependencies** - Minimal footprint
- ✅ **SSR/SSG safe** - Works with Next.js, Nuxt, and other frameworks
- ✅ **TypeScript support** - Full type definitions included
- ✅ **Flexible API** - Custom schemas or simplified FAQ setup
- ✅ **Framework agnostic** - Works with React, Vue, Svelte, vanilla JS
- ✅ **Tree-shakeable** - Only bundle what you use
- ✅ **Schema.org compliant** - Follows structured data standards

## 📦 Installation

```bash
npm install ai-seo
```

## 🚀 Quick Start

### Simple FAQ Setup (New in v1.0.2!)

```js
import { addFAQ } from 'ai-seo';

// One-liner for FAQ pages
addFAQ('What is AI SEO?', 'AI SEO optimizes content for AI-powered search engines.');
```

### Full API

```js
import { initSEO } from 'ai-seo';

initSEO({
  pageType: 'FAQPage',
  questionType: "How do I use the ai-seo npm package?",
  answerType: "Install the package with npm, import initSEO, and call it with your structured content."
});
```

### Custom Schema

```js
import { initSEO } from 'ai-seo';

// Inject any custom JSON-LD schema
initSEO({
  schema: {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "My Product",
    "description": "Product description..."
  }
});
```

## 🔧 Framework Examples

### React/Next.js

```jsx
import React, { useEffect } from 'react';
import { addFAQ } from 'ai-seo';

const FAQPage = () => {
  useEffect(() => {
    addFAQ(
      'How fast is this package?',
      'Ultra-fast! Zero dependencies and minimal code footprint.'
    );
  }, []);

  return <h1>FAQ Page</h1>;
};
```

### Vue 3

```vue
<script setup>
import { onMounted } from 'vue';
import { addFAQ } from 'ai-seo';

onMounted(() => {
  addFAQ('Is this Vue compatible?', 'Yes! Works with any framework.');
});
</script>

<template>
  <h1>Vue FAQ Page</h1>
</template>
```

### Svelte

```svelte
<script>
import { onMount } from 'svelte';
import { addFAQ } from 'ai-seo';

onMount(() => {
  addFAQ('Does this work with Svelte?', 'Absolutely! Framework agnostic design.');
});
</script>

<h1>Svelte FAQ Page</h1>
```

## 📋 API Reference

### `initSEO(options)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageType` | `string` | `'FAQPage'` | Schema.org page type |
| `questionType` | `string` | `undefined` | FAQ question text |
| `answerType` | `string` | `undefined` | FAQ answer text |
| `schema` | `object` | `undefined` | Custom JSON-LD schema object |

**Returns:** `HTMLScriptElement | null` - The injected script element or null if not in browser

### `addFAQ(question, answer)`

Simplified helper for FAQ setup.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The FAQ question |
| `answer` | `string` | The FAQ answer |

**Returns:** `HTMLScriptElement | null`

## 🧪 Output Example

The package injects this JSON-LD into your page head:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is AI SEO?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "AI SEO optimizes content for AI-powered search engines."
    }
  }]
}
```

## 📈 Release Notes

### v1.0.2 (Latest)
- ✨ **New `addFAQ()` helper** - One-liner for FAQ setup
- 🛡️ **SSR/SSG safety** - Automatic browser environment detection
- 🔧 **Flexible schema support** - Custom JSON-LD schemas
- 📦 **Better packaging** - Added TypeScript definitions
- 🎯 **Default values** - `pageType` defaults to `'FAQPage'`
- 🔄 **Return values** - Script element returned for cleanup
- 📚 **Improved docs** - Better examples and API reference

### v1.0.1
- 🐛 Bug fixes and stability improvements

### v1.0.0
- 🎉 Initial release with core FAQ functionality

## 🔍 Related Projects

- **[easy-ai-seo](https://github.com/Veeeetzzzz/easy-ai-seo)** - CDN version for direct script tag usage
- Perfect for projects that don't use npm or prefer CDN delivery

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/Veeeetzzzz/ai-seo-npm-package.git

# Install dependencies (there are none! 🎉)
cd ai-seo-npm-package

# The package is ready to use
```

## ✅ Validation Tools

Verify your structured data with:

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [Google Search Console](https://search.google.com/search-console)

## 🧪 AI Testing

Test if AI models can understand your content:

> **Prompt:** "Can you summarize the content from [your-website.com]? What questions does it answer?"

Try this in ChatGPT, Gemini, or Bing Chat to verify AI readability.

## 📘 License

MIT License. Free for personal and commercial use.

## 🙋 Support & Contributions

- 🐛 [Report bugs](https://github.com/Veeeetzzzz/ai-seo-npm-package/issues)
- 💡 [Request features](https://github.com/Veeeetzzzz/ai-seo-npm-package/issues)
- 🤝 [Contribute](https://github.com/Veeeetzzzz/ai-seo-npm-package/pulls)

Created with ♥ to help the web evolve with AI-driven search.
