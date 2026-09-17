export interface Category {
  id: number
  name: string
  name_kh: string
  slug: string
  count?: number
}

export interface Article {
  id: number
  title: string
  title_kh: string
  excerpt: string
  excerpt_kh: string
  content: string
  content_kh: string
  image: string
  category_id: number | null
  menu_id: number | null
  category?: Category
  author: string
  status: 'published' | 'draft'
  featured: boolean
  breaking: boolean
  show_video: boolean
  video_url: string
  published_at: string
  views: number
}

export interface ArticlesResponse {
  data: Article[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ArticleForm {
  title: string
  title_kh: string
  excerpt: string
  excerpt_kh: string
  content: string
  content_kh: string
  image: string
  category_id: number | null
  author: string
  status: 'published' | 'draft'
  featured: boolean
  breaking: boolean
  video_url: string
  show_video: boolean
  published_at: string
}

export interface User {
  id: number
  name: string
  email: string
  role: 'superAdmin' | 'admin' | 'editor'
  status: string
  created_at: string
}

export interface AuthUser extends User {}

export interface Slider {
  id:        number
  title:     string
  title_kh:  string
  image:     string
  link:      string
  order_num: number
  active:    number
}
