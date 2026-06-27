import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { readData, writeData } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Helper to check admin authorization
async function checkAdminAuth() {
  const user = await getSessionUser();
  if (!user || user.email.toLowerCase() !== 'avipro1122@gmail.com') {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 }), user: null };
  }
  return { authorized: true, response: null, user };
}

// GET: Load news articles
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const data = await readData();
    return NextResponse.json({
      success: true,
      news: data.news
    });
  } catch (error) {
    console.error("Fetch news error:", error);
    return NextResponse.json({ error: "Failed to load news" }, { status: 500 });
  }
}

// POST: Publish a news article
export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { title, content, author } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields: title, content" }, { status: 400 });
    }

    const data = await readData();
    const now = new Date().toISOString();

    const newArticle = {
      id: String(data.news.length + 1),
      title: title.trim(),
      content: content.trim(),
      author: author ? author.trim() : "UperAI News Desk",
      date: now
    };

    data.news.push(newArticle);

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "NEWS_PUBLISHED",
      details: `Published news article: ${newArticle.title}`,
      timestamp: now
    });

    await writeData(data);

    return NextResponse.json({
      success: true,
      article: newArticle
    }, { status: 201 });
  } catch (error) {
    console.error("Publish news error:", error);
    return NextResponse.json({ error: "Failed to publish news article" }, { status: 500 });
  }
}

// PUT: Update news article
export async function PUT(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { id, title, content, author } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
    }

    const data = await readData();
    const now = new Date().toISOString();

    const article = data.news.find(n => n.id === String(id));
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Update fields
    if (title) article.title = title.trim();
    if (content) article.content = content.trim();
    if (author) article.author = author.trim();

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "NEWS_UPDATED",
      details: `Updated news article: ${article.title}`,
      timestamp: now
    });

    await writeData(data);

    return NextResponse.json({
      success: true,
      article
    });
  } catch (error) {
    console.error("Update news error:", error);
    return NextResponse.json({ error: "Failed to update news article" }, { status: 500 });
  }
}

// DELETE: Remove news article
export async function DELETE(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
    }

    const data = await readData();
    const now = new Date().toISOString();

    const idx = data.news.findIndex(n => n.id === String(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const article = data.news[idx];
    data.news.splice(idx, 1);

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "NEWS_DELETED",
      details: `Deleted news article: ${article.title}`,
      timestamp: now
    });

    await writeData(data);

    return NextResponse.json({
      success: true,
      message: "News article deleted successfully"
    });
  } catch (error) {
    console.error("Delete news error:", error);
    return NextResponse.json({ error: "Failed to delete news article" }, { status: 500 });
  }
}
