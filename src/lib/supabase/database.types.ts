export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          subtitle: string;
          price: number;
          description: string;
          image: string;
          gallery: string[];
          category: string;
          stock: number;
          dimensions: string | null;
          material: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          subtitle: string;
          price: number;
          description: string;
          image: string;
          gallery?: string[];
          category: string;
          stock: number;
          dimensions?: string | null;
          material?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      cms_documents: {
        Row: {
          doc_key: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          doc_key: string;
          payload: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cms_documents"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
