export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          branch_id: string | null;
          created_at: string;
          display_name: string;
          is_active: boolean;
          role: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          display_name: string;
          is_active?: boolean;
          role: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          display_name?: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_profiles_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      allergens: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      branch_variant_offers: {
        Row: {
          availability_status: string;
          branch_id: string;
          created_at: string;
          is_listed: boolean;
          price_override_idr: number | null;
          stock_quantity: number | null;
          updated_at: string;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          availability_status?: string;
          branch_id: string;
          created_at?: string;
          is_listed?: boolean;
          price_override_idr?: number | null;
          stock_quantity?: number | null;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          availability_status?: string;
          branch_id?: string;
          created_at?: string;
          is_listed?: boolean;
          price_override_idr?: number | null;
          stock_quantity?: number | null;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'branch_variant_offers_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'branch_variant_offers_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      branches: {
        Row: {
          address: string | null;
          allow_delivery: boolean;
          allow_pickup: boolean;
          city: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          maps_url: string | null;
          name: string;
          sort_order: number;
          updated_at: string;
          whatsapp_number: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          allow_delivery?: boolean;
          allow_pickup?: boolean;
          city: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          maps_url?: string | null;
          name: string;
          sort_order?: number;
          updated_at?: string;
          whatsapp_number: string;
        };
        Update: {
          address?: string | null;
          allow_delivery?: boolean;
          allow_pickup?: boolean;
          city?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          maps_url?: string | null;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          whatsapp_number?: string;
        };
        Relationships: [];
      };
      bundle_fixed_components: {
        Row: {
          bundle_variant_id: string;
          component_slot: string;
          component_variant_id: string;
          created_at: string;
          id: string;
          quantity: number;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bundle_variant_id: string;
          component_slot: string;
          component_variant_id: string;
          created_at?: string;
          id?: string;
          quantity: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          bundle_variant_id?: string;
          component_slot?: string;
          component_variant_id?: string;
          created_at?: string;
          id?: string;
          quantity?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bundle_fixed_components_bundle_variant_id_fkey';
            columns: ['bundle_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_fixed_components_component_variant_id_fkey';
            columns: ['component_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      business_hours: {
        Row: {
          branch_id: string;
          closes_at: string | null;
          created_at: string;
          day_of_week: number;
          id: string;
          is_closed: boolean;
          note: string | null;
          opens_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          branch_id: string;
          closes_at?: string | null;
          created_at?: string;
          day_of_week: number;
          id?: string;
          is_closed?: boolean;
          note?: string | null;
          opens_at?: string | null;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          closes_at?: string | null;
          created_at?: string;
          day_of_week?: number;
          id?: string;
          is_closed?: boolean;
          note?: string | null;
          opens_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_hours_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          cover_image_path: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cover_image_path?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          cover_image_path?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      class_programs: {
        Row: {
          age_max: number | null;
          age_min: number | null;
          base_price_idr: number;
          cover_alt_text: string | null;
          cover_image_path: string | null;
          cover_is_approved: boolean;
          cover_storage_bucket: string;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          included_items: NonNullable<Json>;
          needs_owner_review: boolean;
          short_description: string | null;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          age_max?: number | null;
          age_min?: number | null;
          base_price_idr: number;
          cover_alt_text?: string | null;
          cover_image_path?: string | null;
          cover_is_approved?: boolean;
          cover_storage_bucket?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          included_items?: NonNullable<Json>;
          needs_owner_review?: boolean;
          short_description?: string | null;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          age_max?: number | null;
          age_min?: number | null;
          base_price_idr?: number;
          cover_alt_text?: string | null;
          cover_image_path?: string | null;
          cover_is_approved?: boolean;
          cover_storage_bucket?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          included_items?: NonNullable<Json>;
          needs_owner_review?: boolean;
          short_description?: string | null;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_sessions: {
        Row: {
          branch_id: string;
          capacity: number;
          created_at: string;
          ends_at: string;
          id: string;
          is_registration_open: boolean;
          price_override_idr: number | null;
          program_id: string;
          registration_deadline_at: string | null;
          seats_left: number | null;
          starts_at: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          branch_id: string;
          capacity: number;
          created_at?: string;
          ends_at: string;
          id?: string;
          is_registration_open?: boolean;
          price_override_idr?: number | null;
          program_id: string;
          registration_deadline_at?: string | null;
          seats_left?: number | null;
          starts_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          capacity?: number;
          created_at?: string;
          ends_at?: string;
          id?: string;
          is_registration_open?: boolean;
          price_override_idr?: number | null;
          program_id?: string;
          registration_deadline_at?: string | null;
          seats_left?: number | null;
          starts_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'class_sessions_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_sessions_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'class_programs';
            referencedColumns: ['id'];
          },
        ];
      };
      dietary_tags: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          category: string;
          created_at: string;
          id: string;
          question: string;
          sort_order: number;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          category: string;
          created_at?: string;
          id?: string;
          question: string;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category?: string;
          created_at?: string;
          id?: string;
          question?: string;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      option_choices: {
        Row: {
          component_variant_id: string | null;
          created_at: string;
          group_id: string;
          id: string;
          is_active: boolean;
          label: string;
          price_delta_idr: number;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          component_variant_id?: string | null;
          created_at?: string;
          group_id: string;
          id?: string;
          is_active?: boolean;
          label: string;
          price_delta_idr?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          component_variant_id?: string | null;
          created_at?: string;
          group_id?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          price_delta_idr?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'option_choices_component_variant_id_fkey';
            columns: ['component_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'option_choices_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'option_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      option_groups: {
        Row: {
          bundle_variant_id: string;
          created_at: string;
          id: string;
          is_required: boolean;
          max_select: number;
          min_select: number;
          name: string;
          quantity_per_selection: number;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          bundle_variant_id: string;
          created_at?: string;
          id?: string;
          is_required?: boolean;
          max_select: number;
          min_select: number;
          name: string;
          quantity_per_selection?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          bundle_variant_id?: string;
          created_at?: string;
          id?: string;
          is_required?: boolean;
          max_select?: number;
          min_select?: number;
          name?: string;
          quantity_per_selection?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'option_groups_bundle_variant_id_fkey';
            columns: ['bundle_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          category_id: string;
          created_at: string;
          is_primary: boolean;
          product_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          is_primary?: boolean;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          is_primary?: boolean;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          is_approved: boolean;
          is_primary: boolean;
          product_id: string;
          sort_order: number;
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          variant_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          is_primary?: boolean;
          product_id: string;
          sort_order?: number;
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          is_primary?: boolean;
          product_id?: string;
          sort_order?: number;
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_images_variant_id_product_id_fkey';
            columns: ['variant_id', 'product_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id', 'product_id'];
          },
        ];
      };
      product_variants: {
        Row: {
          base_price_idr: number;
          bundle_recipe: string | null;
          bundle_rules_verified: boolean;
          bundle_units_total: number | null;
          created_at: string;
          id: string;
          is_default: boolean;
          max_quantity_per_order: number;
          name: string;
          product_id: string;
          size_label: string | null;
          sku: string;
          sort_order: number;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          base_price_idr: number;
          bundle_recipe?: string | null;
          bundle_rules_verified?: boolean;
          bundle_units_total?: number | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          max_quantity_per_order?: number;
          name: string;
          product_id: string;
          size_label?: string | null;
          sku: string;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          base_price_idr?: number;
          bundle_recipe?: string | null;
          bundle_rules_verified?: boolean;
          bundle_units_total?: number | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          max_quantity_per_order?: number;
          name?: string;
          product_id?: string;
          size_label?: string | null;
          sku?: string;
          sort_order?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          ingredients_info: string | null;
          is_best_seller: boolean;
          is_featured: boolean;
          is_new: boolean;
          name: string;
          needs_owner_review: boolean;
          product_type: string;
          short_description: string | null;
          slug: string;
          sort_order: number;
          status: string;
          storage_instructions: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          ingredients_info?: string | null;
          is_best_seller?: boolean;
          is_featured?: boolean;
          is_new?: boolean;
          name: string;
          needs_owner_review?: boolean;
          product_type: string;
          short_description?: string | null;
          slug: string;
          sort_order?: number;
          status?: string;
          storage_instructions?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          ingredients_info?: string | null;
          is_best_seller?: boolean;
          is_featured?: boolean;
          is_new?: boolean;
          name?: string;
          needs_owner_review?: boolean;
          product_type?: string;
          short_description?: string | null;
          slug?: string;
          sort_order?: number;
          status?: string;
          storage_instructions?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      promotion_branches: {
        Row: {
          branch_id: string;
          created_at: string;
          promotion_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          branch_id: string;
          created_at?: string;
          promotion_id: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          promotion_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_branches_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promotion_branches_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotion_categories: {
        Row: {
          category_id: string;
          created_at: string;
          promotion_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          promotion_id: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          promotion_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promotion_categories_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotion_products: {
        Row: {
          created_at: string;
          product_id: string;
          promotion_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          product_id: string;
          promotion_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          promotion_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promotion_products_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotion_variants: {
        Row: {
          created_at: string;
          promotion_id: string;
          updated_at: string;
          variant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          promotion_id: string;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          created_at?: string;
          promotion_id?: string;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_variants_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promotion_variants_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      promotions: {
        Row: {
          banner_image_path: string | null;
          created_at: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string;
          id: string;
          is_enabled: boolean;
          is_stackable: boolean;
          max_discount_idr: number | null;
          min_spend_idr: number;
          priority: number;
          scope: string;
          slug: string;
          starts_at: string;
          status: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          banner_image_path?: string | null;
          created_at?: string;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string;
          id?: string;
          is_enabled?: boolean;
          is_stackable?: boolean;
          max_discount_idr?: number | null;
          min_spend_idr?: number;
          priority?: number;
          scope: string;
          slug: string;
          starts_at: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          banner_image_path?: string | null;
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          ends_at?: string;
          id?: string;
          is_enabled?: boolean;
          is_stackable?: boolean;
          max_discount_idr?: number | null;
          min_spend_idr?: number;
          priority?: number;
          scope?: string;
          slug?: string;
          starts_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          content_json: NonNullable<Json>;
          created_at: string;
          key: string;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          content_json: NonNullable<Json>;
          created_at?: string;
          key: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content_json?: NonNullable<Json>;
          created_at?: string;
          key?: string;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          consent_at: string | null;
          consent_reference: string | null;
          created_at: string;
          display_name: string;
          id: string;
          quote: string;
          rating: number | null;
          sort_order: number;
          source_label: string | null;
          source_url: string | null;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          consent_at?: string | null;
          consent_reference?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          quote: string;
          rating?: number | null;
          sort_order?: number;
          source_label?: string | null;
          source_url?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          consent_at?: string | null;
          consent_reference?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          quote?: string;
          rating?: number | null;
          sort_order?: number;
          source_label?: string | null;
          source_url?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      variant_allergens: {
        Row: {
          allergen_id: string;
          created_at: string;
          presence: string;
          source_note: string | null;
          updated_at: string;
          variant_id: string;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          allergen_id: string;
          created_at?: string;
          presence: string;
          source_note?: string | null;
          updated_at?: string;
          variant_id: string;
          verified_at?: string | null;
        };
        Update: {
          allergen_id?: string;
          created_at?: string;
          presence?: string;
          source_note?: string | null;
          updated_at?: string;
          variant_id?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'variant_allergens_allergen_id_fkey';
            columns: ['allergen_id'];
            isOneToOne: false;
            referencedRelation: 'allergens';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'variant_allergens_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      variant_dietary_tags: {
        Row: {
          created_at: string;
          dietary_tag_id: string;
          note: string | null;
          updated_at: string;
          variant_id: string;
          verification_status: string;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          dietary_tag_id: string;
          note?: string | null;
          updated_at?: string;
          variant_id: string;
          verification_status?: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          dietary_tag_id?: string;
          note?: string | null;
          updated_at?: string;
          variant_id?: string;
          verification_status?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'variant_dietary_tags_dietary_tag_id_fkey';
            columns: ['dietary_tag_id'];
            isOneToOne: false;
            referencedRelation: 'dietary_tags';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'variant_dietary_tags_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      read_active_branches: {
        Args: Record<PropertyKey, never>;
        Returns: {
          allow_delivery: boolean;
          allow_pickup: boolean;
          city: string;
          code: string;
          id: string;
          name: string;
          whatsapp_number: string;
        }[];
      };
      read_owner_content_audit: {
        Args: { content_key: string };
        Returns: {
          key: string;
          updated_by: string;
        }[];
      };
      read_owner_testimonial_evidence: {
        Args: { testimonial_uuid: string };
        Returns: {
          consent_at: string;
          consent_reference: string;
          id: string;
        }[];
      };
      read_owner_variant_evidence: {
        Args: { variant_uuid: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
