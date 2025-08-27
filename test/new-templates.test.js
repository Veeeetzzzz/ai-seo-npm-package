import { describe, it } from 'node:test';
import assert from 'node:assert';
import './setup.js';
import { Templates } from '../index.js';

describe('New Templates v1.4.0', () => {
  describe('Job Templates', () => {
    it('should create a job posting schema', () => {
      const jobData = {
        title: 'Senior JavaScript Developer',
        description: 'Build amazing web applications',
        company: 'Tech Corp',
        companyWebsite: 'https://techcorp.com',
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'US'
        },
        salary: {
          min: 120000,
          max: 160000,
          currency: 'USD',
          period: 'YEAR'
        },
        employmentType: 'FULL_TIME',
        remote: true,
        requirements: ['5+ years JavaScript', 'React experience'],
        skills: ['JavaScript', 'React', 'Node.js']
      };

      const schema = Templates.jobs.jobPosting(jobData);
      
      assert.strictEqual(schema['@type'], 'JobPosting');
      assert.strictEqual(schema.name, 'Senior JavaScript Developer');
      assert.strictEqual(schema.hiringOrganization.name, 'Tech Corp');
      assert.strictEqual(schema.baseSalary.currency, 'USD');
      assert.strictEqual(schema.workFromHome, true);
    });

    it('should create a company profile schema', () => {
      const companyData = {
        name: 'Innovative Tech',
        description: 'Leading technology company',
        website: 'https://innovativetech.com',
        industry: 'Technology',
        employeeCount: '201-500'
      };

      const schema = Templates.jobs.company(companyData);
      
      assert.strictEqual(schema['@type'], 'Organization');
      assert.strictEqual(schema.name, 'Innovative Tech');
      assert.strictEqual(schema.industry, 'Technology');
    });
  });

  describe('Recipe Templates', () => {
    it('should create a recipe schema', () => {
      const recipeData = {
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        author: 'Chef John',
        servings: '24 cookies',
        prepTime: 'PT15M',
        cookTime: 'PT12M',
        ingredients: ['2 cups flour', '1 cup butter', '1 cup chocolate chips'],
        instructions: [
          { text: 'Preheat oven to 375°F' },
          { text: 'Mix ingredients' },
          { text: 'Bake for 12 minutes' }
        ],
        rating: 4.8,
        reviewCount: 150
      };

      const schema = Templates.recipe.recipe(recipeData);
      
      assert.strictEqual(schema['@type'], 'Recipe');
      assert.strictEqual(schema.name, 'Chocolate Chip Cookies');
      assert.strictEqual(schema.recipeYield, '24 cookies');
      assert.strictEqual(schema.prepTime, 'PT15M');
      assert.ok(Array.isArray(schema.recipeIngredient));
      assert.ok(Array.isArray(schema.recipeInstructions));
    });
  });

  describe('Media Templates', () => {
    it('should create a video schema', () => {
      const videoData = {
        title: 'How to Code JavaScript',
        description: 'Learn JavaScript fundamentals',
        videoUrl: 'https://example.com/video.mp4',
        thumbnail: 'https://example.com/thumb.jpg',
        duration: 'PT10M30S',
        creator: 'Code Teacher',
        uploadDate: '2024-01-15T10:00:00Z',
        viewCount: 50000,
        likeCount: 1200
      };

      const schema = Templates.media.video(videoData);
      
      assert.strictEqual(schema['@type'], 'VideoObject');
      assert.strictEqual(schema.name, 'How to Code JavaScript');
      assert.strictEqual(schema.duration, 'PT10M30S');
      assert.strictEqual(schema.creator.name, 'Code Teacher');
      assert.ok(Array.isArray(schema.interactionStatistic));
    });

    it('should create a podcast episode schema', () => {
      const episodeData = {
        title: 'JavaScript Tips Episode 5',
        description: 'Advanced JavaScript techniques',
        episodeNumber: 5,
        seasonNumber: 1,
        duration: 'PT45M',
        audioUrl: 'https://example.com/episode5.mp3',
        podcastName: 'JS Mastery Podcast',
        hosts: [{ name: 'John Doe', url: 'https://johndoe.com' }]
      };

      const schema = Templates.media.podcast(episodeData);
      
      assert.strictEqual(schema['@type'], 'PodcastEpisode');
      assert.strictEqual(schema.episodeNumber, 5);
      assert.strictEqual(schema.partOfSeries.name, 'JS Mastery Podcast');
    });

    it('should create a software application schema', () => {
      const appData = {
        name: 'Code Editor Pro',
        description: 'Professional code editor',
        category: 'DeveloperApplication',
        version: '2.1.0',
        developer: 'Dev Tools Inc',
        price: 49.99,
        currency: 'USD',
        rating: 4.5,
        reviewCount: 2500,
        operatingSystems: ['Windows', 'macOS', 'Linux']
      };

      const schema = Templates.media.software(appData);
      
      assert.strictEqual(schema['@type'], 'SoftwareApplication');
      assert.strictEqual(schema.name, 'Code Editor Pro');
      assert.strictEqual(schema.softwareVersion, '2.1.0');
      assert.strictEqual(schema.offers.price, 49.99);
    });
  });
});
