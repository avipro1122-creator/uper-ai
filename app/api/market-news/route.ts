import { NextResponse } from 'next/server';
import { readData } from '../../../lib/db';

export const dynamic = 'force-dynamic';

interface FormattedArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const snippetCount = searchParams.get('snippetCount') || '50';
  const region = searchParams.get('region') || 'US';

  const host = process.env.RAPIDAPI_HOST || 'yahoo-finance166.p.rapidapi.com';
  const key = process.env.RAPIDAPI_KEY || 'b69624333bmsh8a4f04783b6ec1ap1b832fjsna65cd7bb6419';

  const url = `https://yahoo-finance166.p.rapidapi.com/api/news/list?snippetCount=${snippetCount}&region=${region}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
      next: { revalidate: 300 }, // Cache on the server for 5 minutes
    });

    if (!res.ok) {
      throw new Error(`RapidAPI News returned status ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const dataBlock = json?.data;
    
    // Extract from both stream containers (ntk and main)
    const ntkStream = dataBlock?.ntk?.stream || [];
    const mainStream = dataBlock?.main?.stream || [];
    const rawArticles = [...ntkStream, ...mainStream];

    const formattedArticles: FormattedArticle[] = rawArticles
      .map((item: any) => {
        const content = item?.content || item?.editorialContent?.content || item?.editorialContent || item;
        if (!content || (!content.title && !content.summary)) return null;

        return {
          id: content.id || item.id || String(Math.random()),
          title: content.title || 'Untitled Article',
          summary: content.summary || '',
          source: content.provider?.displayName || 'Unknown Source',
          publishedAt: content.pubDate || content.displayTime || content.publishTime || new Date().toISOString(),
          url: content.canonicalUrl?.url || content.clickThroughUrl?.url || '',
        };
      })
      .filter((article: FormattedArticle | null): article is FormattedArticle => article !== null);

    return NextResponse.json({
      success: true,
      source: 'RapidAPI (Yahoo Finance)',
      articles: formattedArticles,
    });
  } catch (error: any) {
    console.error('RapidAPI News list fetch error, serving local fallback news:', error);

    // Fallback: load news from local mock JSON database
    try {
      const localData = readData();
      const fallbackArticles: FormattedArticle[] = localData.news.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.content,
        source: item.author || 'UperAI News Desk',
        publishedAt: item.date || new Date().toISOString(),
        url: '',
      }));

      return NextResponse.json({
        success: true,
        source: 'Local Fallback Database',
        articles: fallbackArticles,
        error: error.message || 'External API failure',
      });
    } catch (dbError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve news from both API and local database',
        },
        { status: 500 }
      );
    }
  }
}
