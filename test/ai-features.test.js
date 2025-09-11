import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AI } from '../index.js';

describe('AI Features - V1.6.0', () => {
  describe('AI.optimizeForLLM', () => {
    test('should optimize schema for LLM understanding', () => {
      const baseSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Amazing Headphones',
        'description': 'High-quality wireless headphones'
      };

      const optimized = AI.optimizeForLLM(baseSchema, {
        target: ['chatgpt', 'bard'],
        semanticEnhancement: true
      });

      assert.ok(Array.isArray(optimized['@context']));
      assert.ok(optimized.alternateName);
      assert.ok(optimized.description.includes('This is'));
      assert.ok(optimized.additionalProperty);
      assert.equal(optimized.additionalProperty[0].name, 'ai-optimized');
    });

    test('should add voice optimization when enabled', () => {
      const baseSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Test Product'
      };

      const optimized = AI.optimizeForLLM(baseSchema, {
        voiceOptimization: true
      });

      assert.ok(optimized.potentialAction);
      assert.equal(optimized.potentialAction[0]['@type'], 'SearchAction');
    });

    test('should throw error for invalid schema', () => {
      assert.throws(() => {
        AI.optimizeForLLM(null);
      }, /AI\.optimizeForLLM requires a valid schema object/);
    });
  });

  describe('AI.generateFromContent', () => {
    test('should generate product schema from product content', () => {
      const content = 'Amazing wireless headphones with great sound quality. Price: $199.99. Brand: AudioTech. Buy now with free shipping!';
      
      const result = AI.generateFromContent(content, {
        confidence: 0.1, // Lower threshold for testing
        multipleTypes: false
      });

      assert.ok(result);
      assert.ok(result.schema);
      assert.equal(result.schema['@type'], 'Product');
      assert.ok(result.confidence > 0);
      assert.ok(result.schema.name);
      assert.ok(result.schema.description);
    });

    test('should generate article schema from article content', () => {
      const content = 'This is a blog post about technology trends. Published by John Doe. The article discusses the latest developments in AI and machine learning.';
      
      const result = AI.generateFromContent(content, {
        confidence: 0.1,
        multipleTypes: false
      });

      assert.ok(result);
      if (result.schema['@type'] === 'Article') {
        assert.ok(result.schema.headline);
        assert.ok(result.schema.articleBody);
        assert.ok(result.schema.wordCount);
      }
    });

    test('should return multiple schemas when enabled', () => {
      const content = 'Visit our restaurant located at 123 Main Street. We serve amazing food and have great reviews. Call us to make a reservation!';
      
      const results = AI.generateFromContent(content, {
        confidence: 0.01, // Very low threshold for testing
        multipleTypes: true
      });

      assert.ok(results !== null);
      assert.ok(Array.isArray(results));
      assert.ok(results.length >= 1);
      results.forEach(result => {
        assert.ok(result.schema);
        assert.ok(result.confidence);
        assert.ok(result.type);
      });
    });

    test('should throw error for invalid content', () => {
      assert.throws(() => {
        AI.generateFromContent(null);
      }, /AI\.generateFromContent requires valid content string/);
    });
  });

  describe('AI.analyzeContent', () => {
    test('should analyze content and return type scores', () => {
      const content = 'This is a product description for wireless headphones. Price: $199. Great brand and quality.';
      
      const analysis = AI.analyzeContent(content);

      assert.ok(analysis);
      assert.ok(analysis.typeScores);
      assert.ok(typeof analysis.confidence === 'number');
      assert.ok(analysis.recommendedType);
      assert.ok(analysis.keywords);
    });

    test('should include entities when requested', () => {
      const content = 'John Smith works at Apple Inc in Cupertino, California.';
      
      const analysis = AI.analyzeContent(content, {
        includeEntities: true
      });

      assert.ok(analysis.entities);
      assert.ok(analysis.entities.people);
      assert.ok(analysis.entities.organizations);
    });

    test('should include sentiment when requested', () => {
      const content = 'This is an amazing product! Great quality and excellent service.';
      
      const analysis = AI.analyzeContent(content, {
        includeSentiment: true
      });

      assert.ok(analysis.sentiment);
      assert.ok(typeof analysis.sentiment.score === 'number');
      assert.ok(['positive', 'negative', 'neutral'].includes(analysis.sentiment.label));
    });

    test('should return null for empty content', () => {
      const analysis = AI.analyzeContent('');
      assert.equal(analysis, null);
    });
  });

  describe('AI.optimizeForVoiceSearch', () => {
    test('should add FAQ questions for voice queries', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Wireless Headphones',
        'description': 'High-quality audio device',
        'offers': {
          'price': 199.99,
          'priceCurrency': 'USD'
        }
      };

      const optimized = AI.optimizeForVoiceSearch(schema, {
        includeQA: true
      });

      assert.ok(optimized.mainEntity);
      assert.ok(Array.isArray(optimized.mainEntity));
      assert.ok(optimized.mainEntity.length > 0);
      assert.equal(optimized.mainEntity[0]['@type'], 'Question');
    });

    test('should convert description to natural language', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'description': 'This is a great product.'
      };

      const optimized = AI.optimizeForVoiceSearch(schema, {
        naturalLanguage: true
      });

      assert.ok(optimized.description.includes('naturally'));
      assert.ok(optimized.description.includes('voice search'));
    });

    test('should add conversational actions', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Test Product'
      };

      const optimized = AI.optimizeForVoiceSearch(schema, {
        conversational: true
      });

      assert.ok(optimized.potentialAction);
      const askAction = optimized.potentialAction.find(action => action['@type'] === 'AskAction');
      assert.ok(askAction);
    });
  });

  describe('AI Helper Functions', () => {
    test('should extract keywords from content', () => {
      const content = 'This amazing product has great quality and excellent features for everyone.';
      const keywords = AI._extractKeywords(content);

      assert.ok(Array.isArray(keywords));
      assert.ok(keywords.length > 0);
      assert.ok(keywords.includes('amazing') || keywords.includes('product') || keywords.includes('great'));
    });

    test('should calculate readability score', () => {
      const sentences = ['This is a simple sentence.', 'Here is another one.'];
      const words = ['this', 'is', 'a', 'simple', 'sentence', 'here', 'is', 'another', 'one'];
      
      const score = AI._calculateReadability(sentences, words);
      assert.ok(typeof score === 'number');
      assert.ok(score >= 0 && score <= 100);
    });

    test('should generate alternate names', () => {
      const name = 'Artificial Intelligence';
      const alternates = AI._generateAlternateNames(name);

      assert.ok(Array.isArray(alternates));
      assert.ok(alternates.includes('ArtificialIntelligence'));
      assert.ok(alternates.includes('Artificial-Intelligence'));
      assert.ok(alternates.includes('AI'));
    });

    test('should extract title from content', () => {
      const content = 'Amazing Product Title\nThis is the description of the product...';
      const title = AI._extractTitle(content);

      assert.equal(title, 'Amazing Product Title');
    });

    test('should extract description with length limit', () => {
      const content = 'This is a very long description that should be truncated at some point because it exceeds the maximum length that we want to allow for descriptions.';
      const description = AI._extractDescription(content, 50);

      assert.ok(description.length <= 50);
      assert.ok(description.endsWith('...'));
    });

    test('should categorize content correctly', () => {
      const electronicsContent = 'This laptop computer has great performance';
      const category = AI._extractCategory(electronicsContent);
      assert.equal(category, 'Electronics');

      const generalContent = 'This is some general content without specific category keywords';
      const generalCategory = AI._extractCategory(generalContent);
      assert.equal(generalCategory, 'General');
    });
  });
});
