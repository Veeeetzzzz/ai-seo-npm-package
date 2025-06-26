// Simple AI-friendly SEO utility
export function initSEO({
  pageType = 'FAQPage',
  questionType,
  answerType,
  schema
} = {}) {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') return null;

  // Allow custom schema or use the Q&A default
  const jsonLd = schema || {
    "@context": "https://schema.org",
    "@type": pageType,
    ...(questionType && answerType && {
      "mainEntity": [{
        "@type": "Question",
        "name": questionType,
        "acceptedAnswer": { "@type": "Answer", "text": answerType }
      }]
    })
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
  
  return script; // Return for potential cleanup
}

// Export a simpler alias for quick FAQ setup
export const addFAQ = (question, answer) => initSEO({ questionType: question, answerType: answer });