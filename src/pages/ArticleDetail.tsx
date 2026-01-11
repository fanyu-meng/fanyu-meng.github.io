import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getArticleBySlug, Article } from '@/lib/articles';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';
import 'highlight.js/styles/github-dark.css';

const ArticleDetailContent: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const articleData = getArticleBySlug(slug);
      setArticle(articleData);
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const title = language === 'zh' ? article.titleZh : article.titleEn;
  const excerpt = language === 'zh' ? article.excerptZh : article.excerptEn;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-20 pb-24">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Back Button */}
          <Link
            to="/#articles"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
              {article.category}
            </span>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            {excerpt && (
              <p className="text-base text-muted-foreground mb-6">{excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {article.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-secondary">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // 自定义代码块样式
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <pre className="bg-secondary rounded-lg p-4 overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-secondary px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
                // 自定义链接样式
                a({ node, children, ...props }) {
                  return (
                    <a
                      className="text-primary hover:text-primary/80 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const ArticleDetail: React.FC = () => {
  return (
    <LanguageProvider>
      <ArticleDetailContent />
    </LanguageProvider>
  );
};

export default ArticleDetail;
