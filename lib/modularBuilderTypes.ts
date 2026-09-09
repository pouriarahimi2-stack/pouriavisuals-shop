export type BlockType = 
  | "header_nav"
  | "hero_banner"
  | "features_grid"
  | "product_showcase"
  | "accordion_faq"
  | "cta_banner"
  | "rich_text"
  | "footer_block";

export interface StyleConfig {
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: number;
  maxWidth?: "full" | "7xl" | "5xl" | "3xl";
  borderRadius?: "none" | "lg" | "2xl" | "3xl" | "full";
  borderWidth?: number;
  borderColor?: string;
  textAlign?: "right" | "center" | "left";
  shadow?: "none" | "md" | "xl" | "2xl";
}

export interface PageBlock {
  id: string;
  type: BlockType;
  title: string;
  isVisible: boolean;
  styles: StyleConfig;
  data: Record<string, any>;
}

export interface ModularPageDocument {
  id: string;
  slug: string;
  title: string;
  meta_description?: string;
  blocks: PageBlock[];
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}
