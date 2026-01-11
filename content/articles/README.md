# 文章管理指南

## 如何添加新文章

1. **创建 Markdown 文件**
   - 在 `content/articles/` 目录下创建新的 `.md` 文件
   - 文件名建议使用英文和连字符，例如：`my-article-title.md`
   - 文件名会自动成为文章的 URL slug

2. **添加 Frontmatter**
   每个文章文件的开头必须包含以下元数据：

   ```markdown
   ---
   titleZh: "文章标题（中文）"
   titleEn: "Article Title (English)"
   date: "2024-01-15"
   category: "Tech"
   excerptZh: "文章摘要（中文）"
   excerptEn: "Article excerpt (English)"
   ---
   ```

3. **编写文章内容**
   在 frontmatter 之后，使用 Markdown 格式编写文章正文。

## Frontmatter 字段说明

- `titleZh`: 文章中文标题（必需）
- `titleEn`: 文章英文标题（必需）
- `date`: 发布日期，格式：`YYYY-MM-DD`（必需）
- `category`: 文章分类，例如：`Tech`, `Life`, `Productivity`（必需）
- `excerptZh`: 中文摘要（必需）
- `excerptEn`: 英文摘要（必需）
- `readTime`: 阅读时间，例如：`"5 min"`（可选，会自动计算）

## Markdown 支持

文章支持完整的 Markdown 语法，包括：

- **标题**：`# H1`, `## H2`, `### H3`
- **粗体/斜体**：`**bold**`, `*italic*`
- **代码块**：使用三个反引号包裹代码
- **链接**：`[文本](URL)`
- **图片**：`![alt](image-url)`
- **列表**：有序和无序列表
- **表格**：GitHub Flavored Markdown 表格
- **引用**：`> 引用内容`

## 示例文章

参考 `content/articles/` 目录下的示例文件：
- `building-personal-knowledge-system.md`
- `crossing-boundaries-programmer-comedian.md`
- `modern-web-development-best-practices.md`

## 注意事项

- 文件名中的空格会被保留，建议使用连字符 `-`
- 日期格式必须正确，否则排序可能出错
- 文章会自动按日期倒序排列（最新的在前）
- 阅读时间会自动计算，也可以手动指定
