import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { inputType, value } = await request.json();

    if (!value) {
      return NextResponse.json({ error: 'Input value is required.' }, { status: 400 });
    }

    let sourceText = '';

    if (inputType === 'url') {
      try {
        // Add a 7-second timeout to prevent slow URLs from hanging the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(value, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove non-content elements
        $('script, style, nav, footer, header, noscript').remove();

        // Extract primary headings and paragraph text
        const title = $('title').text();
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const bodyText = $('p, h1, h2, h3')
          .map((_, el) => $(el).text())
          .get()
          .join(' ');

        // Trim source text to 2000 characters for lightning-fast model processing
        sourceText = `Title: ${title}\nExisting Meta: ${metaDesc}\nContent: ${bodyText.substring(0, 2000)}`;
      } catch (err) {
        return NextResponse.json(
          { error: `Could not scrape the webpage: ${err.message}` },
          { status: 400 }
        );
      }
    } else {
      sourceText = value;
    }

    const prompt = `
You are an expert SEO copywriter. Analyze the following content and generate a high-converting, engaging SEO meta description. 
Requirements:
1. Length MUST be strictly between 130 and 160 characters.
2. Include a clear call to action (CTA).
3. Naturally integrate high-relevance search keywords.
4. Output ONLY the meta description text with no surrounding quotes or extra commentary.

Content to analyze:
${sourceText}
    `;

    const modelResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        maxOutputTokens: 100, // Forces the model to finish early and return immediately
        temperature: 0.3,     // Lower temperature for faster, deterministic output
      },
    });

    const description = modelResponse.text ? modelResponse.text.trim() : '';

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Generation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating SEO description.' },
      { status: 500 }
    );
  }
}