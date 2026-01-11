import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { getAllArticles, ArticleMetadata } from '@/lib/articles';

const ArticleCard: React.FC<{ article: ArticleMetadata }> = ({ article }) => {
  const { language, t } = useLanguage();
  const title = language === 'zh' ? article.titleZh : article.titleEn;
  const excerpt = language === 'zh' ? article.excerptZh : article.excerptEn;

  return (
    <Link to={`/articles/${article.slug}`}>
      <article className="group gradient-card rounded-xl p-6 shadow-card border border-border/50 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-1">
        {/* Category */}
        <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
          {article.category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {article.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime}
          </span>
        </div>

        {/* Read more indicator */}
        <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          {t('articles.readMore')}
          <ArrowRight className="w-4 h-4" />
        </div>
      </article>
    </Link>
  );
};

const ArticlesSection: React.FC = () => {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<ArticleMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const allArticles = getAllArticles();
        setArticles(allArticles);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  if (loading) {
    return (
      <section id="articles" className="py-24 relative">
        <div className="container mx-auto">
          <div className="text-center">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section id="articles" className="py-24 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4">
              {t('articles.title')}
            </h2>
            <p className="text-muted-foreground text-base">
              {t('articles.subtitle')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">No articles found. Create Markdown files in content/articles/</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="articles" className="py-24 relative">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold mb-4">
            {t('articles.title')}
          </h2>
          <p className="text-muted-foreground text-base">
            {t('articles.subtitle')}
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
