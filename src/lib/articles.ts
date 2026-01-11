import matter from 'gray-matter';

export interface ArticleMetadata {
  slug: string;
  titleZh: string;
  titleEn: string;
  date: string;
  category: string;
  excerptZh: string;
  excerptEn: string;
  readTime?: string;
}

export interface Article extends ArticleMetadata {
  content: string;
}

// 使用 Vite 的 glob 导入功能读取所有 Markdown 文件
// 路径相对于当前文件位置
const articlesModules = import.meta.glob('../../content/articles/*.md', { 
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

// 解析所有文章
function loadAllArticles(): Article[] {
  const articles: Article[] = [];
  
  for (const [path, module] of Object.entries(articlesModules)) {
    try {
      const fileContent = module as string;
      const { data, content } = matter(fileContent);
      const slug = path.split('/').pop()?.replace('.md', '') || '';
      
      // 如果没有 readTime，自动计算
      const readTime = data.readTime || calculateReadTime(content);
      
      articles.push({
        slug,
        titleZh: data.titleZh || '',
        titleEn: data.titleEn || '',
        date: data.date || '',
        category: data.category || 'Uncategorized',
        excerptZh: data.excerptZh || '',
        excerptEn: data.excerptEn || '',
        readTime,
        content,
      });
    } catch (error) {
      console.error(`Error parsing article ${path}:`, error);
    }
  }
  
  // 按日期排序（最新的在前）
  articles.sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });
  
  return articles;
}

// 获取所有文章（元数据）
export function getAllArticles(): ArticleMetadata[] {
  const articles = loadAllArticles();
  return articles.map(({ content, ...metadata }) => metadata);
}

// 根据 slug 获取单篇文章
export function getArticleBySlug(slug: string): Article | null {
  const articles = loadAllArticles();
  return articles.find(article => article.slug === slug) || null;
}

// 计算阅读时间（基于中文字符数）
export function calculateReadTime(content: string): string {
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const englishWords = content.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w).length;
  // 中文字符按 300 字/分钟，英文按 200 词/分钟
  const minutes = Math.ceil((chineseChars / 300) + (englishWords / 200));
  return `${minutes} min`;
}
