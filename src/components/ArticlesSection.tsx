import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Article {
  id: string;
  titleZh: string;
  titleEn: string;
  excerptZh: string;
  excerptEn: string;
  contentZh: string;
  contentEn: string;
  date: string;
  readTime: string;
  category: string;
}

const articles: Article[] = [
  {
    id: '1',
    titleZh: '构建高效的个人知识管理系统',
    titleEn: 'Building an Efficient Personal Knowledge Management System',
    excerptZh: '如何用现代工具搭建属于自己的第二大脑，让知识为你所用...',
    excerptEn: 'How to build your second brain with modern tools, making knowledge work for you...',
    contentZh: '在信息爆炸的时代，如何有效地管理和利用知识成为一项核心能力。本文将分享我搭建个人知识管理系统的完整方法论，包括信息输入、处理、存储和输出的全流程。\n\n首先，我们需要建立清晰的信息筛选机制。不是所有信息都值得我们投入时间，学会区分"有趣"和"有用"是第一步。\n\n其次，选择合适的工具至关重要。无论是 Notion、Obsidian 还是其他工具，关键是找到适合自己工作流程的那一个。\n\n最后，坚持实践和迭代。任何系统都需要在实际使用中不断优化。',
    contentEn: 'In the age of information explosion, effectively managing and utilizing knowledge has become a core competency. This article shares my complete methodology for building a personal knowledge management system, covering the entire process from information input, processing, storage, to output.\n\nFirst, we need to establish a clear information filtering mechanism. Not all information deserves our time investment - learning to distinguish between "interesting" and "useful" is the first step.\n\nSecond, choosing the right tools is crucial. Whether it\'s Notion, Obsidian, or other tools, the key is finding one that fits your workflow.\n\nFinally, persist in practice and iteration. Any system needs continuous optimization through actual use.',
    date: '2024-01-15',
    readTime: '8 min',
    category: 'Productivity',
  },
  {
    id: '2',
    titleZh: '从程序员到脱口秀演员：跨界的思考',
    titleEn: 'From Programmer to Stand-up Comedian: Thoughts on Crossing Boundaries',
    excerptZh: '技术思维和幽默表达如何相互成就，以及在跨界中获得的意外收获...',
    excerptEn: 'How technical thinking and humor expression complement each other, and unexpected gains from crossing boundaries...',
    contentZh: '很多人问我，作为一个程序员为什么会去讲脱口秀？其实这两者有很多相似之处。\n\n编程需要逻辑，而好的段子同样需要缜密的逻辑来铺垫和反转。debug 的过程和打磨段子的过程也惊人地相似——都是在不断测试、发现问题、修复问题。\n\n跨界让我获得了全新的视角。当你同时在两个看似无关的领域深耕，你会发现它们之间存在着意想不到的连接。这种连接本身就是创造力的来源。',
    contentEn: 'Many people ask me, why would a programmer do stand-up comedy? Actually, these two have a lot in common.\n\nProgramming requires logic, and good jokes also need rigorous logic for setup and punchlines. The debugging process is surprisingly similar to polishing jokes—both involve constant testing, finding problems, and fixing them.\n\nCrossing boundaries gave me a completely new perspective. When you dive deep into two seemingly unrelated fields simultaneously, you discover unexpected connections between them. These connections themselves are sources of creativity.',
    date: '2024-01-08',
    readTime: '6 min',
    category: 'Life',
  },
  {
    id: '3',
    titleZh: '现代 Web 开发的最佳实践',
    titleEn: 'Best Practices in Modern Web Development',
    excerptZh: '从架构设计到代码质量，分享我在实际项目中总结的经验...',
    excerptEn: 'From architecture design to code quality, sharing experiences from real projects...',
    contentZh: '在过去几年的开发实践中，我总结了一些提升代码质量和开发效率的方法。\n\n类型安全是现代开发的基础。TypeScript 不仅能帮助我们在编译时捕获错误，更重要的是它能作为文档使用，提高代码的可读性和可维护性。\n\n组件化思维需要贯穿始终。好的组件应该是独立的、可复用的、易于测试的。当你发现一个组件变得过于复杂时，可能是时候拆分它了。\n\n自动化测试不是可选项。在快速迭代的环境中，没有测试的代码就像没有安全网的走钢丝。',
    contentEn: 'Over the past few years of development practice, I\'ve summarized some methods to improve code quality and development efficiency.\n\nType safety is the foundation of modern development. TypeScript not only helps us catch errors at compile time, but more importantly, it serves as documentation, improving code readability and maintainability.\n\nComponent-based thinking should be throughout. Good components should be independent, reusable, and easy to test. When you find a component becoming too complex, it might be time to split it.\n\nAutomated testing is not optional. In a fast-iterating environment, code without tests is like tightrope walking without a safety net.',
    date: '2024-01-01',
    readTime: '10 min',
    category: 'Tech',
  },
];

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  const { language, t } = useLanguage();
  const title = language === 'zh' ? article.titleZh : article.titleEn;
  const excerpt = language === 'zh' ? article.excerptZh : article.excerptEn;
  const content = language === 'zh' ? article.contentZh : article.contentEn;

  return (
    <Dialog>
      <DialogTrigger asChild>
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
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto gradient-card border-border/50">
        <DialogHeader>
          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-2 w-fit">
            {article.category}
          </span>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {article.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.readTime}
            </span>
          </div>
        </DialogHeader>
        <div className="mt-6 prose prose-invert max-w-none">
          {content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-muted-foreground leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ArticlesSection: React.FC = () => {
  const { t } = useLanguage();

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
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
