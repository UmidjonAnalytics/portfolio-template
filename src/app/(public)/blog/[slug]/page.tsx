import { BlogPostView } from "./BlogPostView";
import { PLACEHOLDER_SLUG } from "./placeholder";

// Prerender one placeholder page for static exports; on a server, other slugs still render on demand.
export function generateStaticParams() {
  return [{ slug: PLACEHOLDER_SLUG }];
}

export default function BlogPostPage() {
  return <BlogPostView />;
}
