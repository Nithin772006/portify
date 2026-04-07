import type { IPortfolio } from '../models/Portfolio';
import { slugify } from './portfolio3d';

const BLANK_AVATAR_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==';

type ExportAssetBundle = {
  zipFileName: string;
  rootFolder: string;
  indexHtml: string;
  readme: string;
  avatarBuffer: Buffer<ArrayBufferLike>;
};

function toNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function dataUriToBuffer(dataUri: string): Buffer<ArrayBufferLike> | null {
  const match = /^data:.*?;base64,(.+)$/i.exec(dataUri);
  if (!match) {
    return null;
  }

  try {
    return Buffer.from(match[1], 'base64');
  } catch {
    return null;
  }
}

function buildReadme(name: string): string {
  return `# ${name}'s 3D Portfolio

This export is a self-contained portfolio built by Portify.

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload the contents of this folder to the repository root
3. Open Settings -> Pages
4. Choose "Deploy from branch" and select the main branch / root folder
5. GitHub Pages will publish \`index.html\`

## Included files
- \`index.html\` - the full 3D portfolio
- \`assets/avatar.jpg\` - bundled avatar asset
- \`README.md\` - these deployment notes

## Notes
- Three.js and GSAP load from public CDNs
- The page works as static hosting with no React runtime
`;
}

export async function createPortfolioZipBundle(
  portfolio: Pick<IPortfolio, 'portfolioId' | 'generatedHTML' | 'generatedContent' | 'formData'>,
): Promise<ExportAssetBundle> {
  const generatedContent = portfolio.generatedContent && typeof portfolio.generatedContent === 'object'
    ? portfolio.generatedContent as Record<string, unknown>
    : {};

  const name = toNonEmptyString(generatedContent.name)
    || toNonEmptyString(portfolio.formData?.name)
    || 'portfolio';
  const html = toNonEmptyString(portfolio.generatedHTML);
  const slugBase = slugify(name) || slugify(portfolio.portfolioId) || 'portfolio';
  const avatarImage = toNonEmptyString(generatedContent.avatarImage);
  const avatarBuffer = dataUriToBuffer(avatarImage) || Buffer.from(BLANK_AVATAR_JPEG_BASE64, 'base64');

  return {
    zipFileName: `${slugBase}-portfolio.zip`,
    rootFolder: `portfolio-${slugBase}`,
    indexHtml: html,
    readme: buildReadme(name),
    avatarBuffer,
  };
}

