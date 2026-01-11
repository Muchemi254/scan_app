// api/convert-heic.js (ES Module version with heic-convert)
// Install: npm install express heic-convert

import express from 'express';
import convert from 'heic-convert';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directory for converted images
const TEMP_DIR = path.join(__dirname, '../temp-conversions');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Generate cache key from URL
function getCacheKey(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Clean old cached files (run periodically)
async function cleanOldFiles() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      
      // Delete files older than CACHE_DURATION
      if (now - stats.mtimeMs > CACHE_DURATION) {
        await fs.unlink(filePath);
        console.log(`Deleted old cache file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning old files:', error);
  }
}

// Run cleanup every hour
setInterval(cleanOldFiles, 60 * 60 * 1000);

// POST /api/convert-heic
// Body: { imageUrl: string }
router.post('/convert-heic', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // Check if already cached
    const cacheKey = getCacheKey(imageUrl);
    const cachedPath = path.join(TEMP_DIR, `${cacheKey}.jpg`);

    try {
      // Check if cached file exists and is not too old
      const stats = await fs.stat(cachedPath);
      const age = Date.now() - stats.mtimeMs;
      
      if (age < CACHE_DURATION) {
        console.log('Serving from cache:', cacheKey);
        const cachedImage = await fs.readFile(cachedPath);
        res.set('Content-Type', 'image/jpeg');
        res.set('X-Cache', 'HIT');
        return res.send(cachedImage);
      } else {
        // Cache expired, delete it
        await fs.unlink(cachedPath);
      }
    } catch (error) {
      // Cache miss, continue to conversion
    }

    console.log('Converting HEIC from URL:', imageUrl);

    // Fetch the HEIC image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(imageUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      console.log(`Fetched ${inputBuffer.length} bytes, converting...`);

      // Convert HEIC to JPEG using heic-convert
      const outputBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.9
      });

      console.log(`Conversion successful, output: ${outputBuffer.length} bytes`);

      // Cache the converted image
      await fs.writeFile(cachedPath, outputBuffer);
      console.log('Cached conversion:', cacheKey);

      // Send the converted image
      res.set('Content-Type', 'image/jpeg');
      res.set('X-Cache', 'MISS');
      res.send(outputBuffer);

    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: 'Failed to convert image',
      details: error.message 
    });
  }
});

// GET /api/convert-heic/:cacheKey
// Retrieve cached converted image
router.get('/convert-heic/:cacheKey', async (req, res) => {
  try {
    const { cacheKey } = req.params;
    const cachedPath = path.join(TEMP_DIR, `${cacheKey}.jpg`);

    const cachedImage = await fs.readFile(cachedPath);
    res.set('Content-Type', 'image/jpeg');
    res.send(cachedImage);

  } catch (error) {
    res.status(404).json({ error: 'Cached image not found' });
  }
});

export default router;