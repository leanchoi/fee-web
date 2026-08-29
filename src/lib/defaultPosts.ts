export interface PostItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_POSTS: PostItem[] = [];

