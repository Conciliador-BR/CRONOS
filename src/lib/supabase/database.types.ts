export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      acquirer_documents: {
        Row: {
          acquirer_id: string
          created_at: string
          file_name: string
          id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          acquirer_id: string
          created_at?: string
          file_name: string
          id?: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          acquirer_id?: string
          created_at?: string
          file_name?: string
          id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acquirer_documents_acquirer_id_fkey"
            columns: ["acquirer_id"]
            isOneToOne: false
            referencedRelation: "acquirers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquirer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquirer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      acquirer_notes: {
        Row: {
          acquirer_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acquirer_id: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acquirer_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acquirer_notes_acquirer_id_fkey"
            columns: ["acquirer_id"]
            isOneToOne: false
            referencedRelation: "acquirers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquirer_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquirer_notes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      acquirers: {
        Row: {
          color: string
          created_at: string
          id: string
          logo_path: string | null
          name: string
          position: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          logo_path?: string | null
          name: string
          position?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          logo_path?: string | null
          name?: string
          position?: number
        }
        Relationships: []
      }
      board_lists: {
        Row: {
          board_id: string
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_lists_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          background: string
          background_image_path: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          position: number
        }
        Insert: {
          background?: string
          background_image_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          position?: number
        }
        Update: {
          background?: string
          background_image_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      card_assignees: {
        Row: {
          card_id: string
          profile_id: string
        }
        Insert: {
          card_id: string
          profile_id: string
        }
        Update: {
          card_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_assignees_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      card_attachments: {
        Row: {
          card_id: string
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          card_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          card_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_attachments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      card_checklist_items: {
        Row: {
          card_id: string
          content: string
          done: boolean
          id: string
          position: number
        }
        Insert: {
          card_id: string
          content: string
          done?: boolean
          id?: string
          position?: number
        }
        Update: {
          card_id?: string
          content?: string
          done?: boolean
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_checklist_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_labels: {
        Row: {
          card_id: string
          label_id: string
        }
        Insert: {
          card_id: string
          label_id: string
        }
        Update: {
          card_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_labels_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          archived: boolean
          board_id: string
          completed: boolean
          cover_attachment_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          list_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          board_id: string
          completed?: boolean
          cover_attachment_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          list_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          board_id?: string
          completed?: boolean
          cover_attachment_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          list_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_cover_attachment_id_fkey"
            columns: ["cover_attachment_id", "id"]
            isOneToOne: false
            referencedRelation: "card_attachments"
            referencedColumns: ["id", "card_id"]
          },
          {
            foreignKeyName: "cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cards_list_board_fkey"
            columns: ["list_id", "board_id"]
            isOneToOne: false
            referencedRelation: "board_lists"
            referencedColumns: ["id", "board_id"]
          },
          {
            foreignKeyName: "cards_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "board_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      companies: {
        Row: {
          cep: string | null
          city: string | null
          client_id: string | null
          cnae: string | null
          cnae_description: string | null
          cnpj: string
          complement: string | null
          created_at: string
          created_by: string | null
          district: string | null
          id: string
          latitude: number | null
          legal_name: string
          longitude: number | null
          market_name: string | null
          number: string | null
          parent_company_id: string | null
          street: string | null
          trade_name: string | null
          uf: string
          updated_at: string
        }
        Insert: {
          cep?: string | null
          city?: string | null
          client_id?: string | null
          cnae?: string | null
          cnae_description?: string | null
          cnpj: string
          complement?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          latitude?: number | null
          legal_name: string
          longitude?: number | null
          market_name?: string | null
          number?: string | null
          parent_company_id?: string | null
          street?: string | null
          trade_name?: string | null
          uf: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          city?: string | null
          client_id?: string | null
          cnae?: string | null
          cnae_description?: string | null
          cnpj?: string
          complement?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          latitude?: number | null
          legal_name?: string
          longitude?: number | null
          market_name?: string | null
          number?: string | null
          parent_company_id?: string | null
          street?: string | null
          trade_name?: string | null
          uf?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_bank_accounts: {
        Row: {
          account: string
          account_type: string | null
          agency: string
          bank: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          account: string
          account_type?: string | null
          agency: string
          bank: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          account?: string
          account_type?: string | null
          agency?: string
          bank?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          id?: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      company_ec_numbers: {
        Row: {
          acquirer: string
          company_id: string
          created_at: string
          ec_number: string
          id: string
        }
        Insert: {
          acquirer: string
          company_id: string
          created_at?: string
          ec_number: string
          id?: string
        }
        Update: {
          acquirer?: string
          company_id?: string
          created_at?: string
          ec_number?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ec_numbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          id: string
          position: number
          title: string
        }
        Insert: {
          course_id: string
          id?: string
          position?: number
          title: string
        }
        Update: {
          course_id?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          published: boolean
          title: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          published?: boolean
          title: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          published?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          event_id: string
          profile_id: string
        }
        Insert: {
          event_id: string
          profile_id: string
        }
        Update: {
          event_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          lead_id: string | null
          location: string | null
          meeting_url: string | null
          starts_at: string
          title: string
        }
        Insert: {
          all_day?: boolean
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          starts_at: string
          title: string
        }
        Update: {
          all_day?: boolean
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          board_id: string
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          board_id: string
          color: string
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          board_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          from_stage_id: string | null
          id: string
          lead_id: string
          to_stage: Database["public"]["Enums"]["pipeline_stage"]
          to_stage_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          from_stage_id?: string | null
          id?: string
          lead_id: string
          to_stage: Database["public"]["Enums"]["pipeline_stage"]
          to_stage_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          from_stage_id?: string | null
          id?: string
          lead_id?: string
          to_stage?: Database["public"]["Enums"]["pipeline_stage"]
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "lead_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          closed_at: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          deal_value_cents: number | null
          description: string | null
          email: string | null
          id: string
          lost_reason: string | null
          name: string
          owner_id: string | null
          phone: string | null
          position: number
          referrer_name: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["pipeline_stage"]
          stage_id: string
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deal_value_cents?: number | null
          description?: string | null
          email?: string | null
          id?: string
          lost_reason?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          position?: number
          referrer_name?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          stage_id: string
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          deal_value_cents?: number | null
          description?: string | null
          email?: string | null
          id?: string
          lost_reason?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          position?: number
          referrer_name?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          stage_id?: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          lesson_id: string
          profile_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: string
          profile_id?: string
        }
        Update: {
          completed_at?: string
          lesson_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      lessons: {
        Row: {
          description: string | null
          duration_seconds: number | null
          id: string
          module_id: string
          position: number
          source: Database["public"]["Enums"]["video_source"]
          title: string
          video_path: string | null
          video_url: string | null
        }
        Insert: {
          description?: string | null
          duration_seconds?: number | null
          id?: string
          module_id: string
          position?: number
          source: Database["public"]["Enums"]["video_source"]
          title: string
          video_path?: string | null
          video_url?: string | null
        }
        Update: {
          description?: string | null
          duration_seconds?: number | null
          id?: string
          module_id?: string
          position?: number
          source?: Database["public"]["Enums"]["video_source"]
          title?: string
          video_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stage_labels: {
        Row: {
          label: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          label: string
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          label?: string
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_labels_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stage_labels_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          label: string
          legacy_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          label: string
          legacy_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          label?: string
          legacy_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_path: string | null
          commission_rate: number
          created_at: string
          email: string
          full_name: string
          id: string
          job_title: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_path?: string | null
          commission_rate?: number
          created_at?: string
          email?: string
          full_name?: string
          id: string
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_path?: string | null
          commission_rate?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_goals: {
        Row: {
          created_at: string
          goal_cents: number
          id: string
          month: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          goal_cents: number
          id?: string
          month: string
          profile_id: string
        }
        Update: {
          created_at?: string
          goal_cents?: number
          id?: string
          month?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          missions_wallpaper_path: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          missions_wallpaper_path?: string | null
          profile_id?: string
          updated_at?: string
        }
        Update: {
          missions_wallpaper_path?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "seller_performance"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Views: {
      seller_performance: {
        Row: {
          avatar_path: string | null
          commission_cents: number | null
          commission_rate: number | null
          full_name: string | null
          lost_count: number | null
          profile_id: string | null
          revenue_cents: number | null
          team_id: string | null
          won_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cronos_needs_setup: { Args: never; Returns: boolean }
      delete_pipeline_stage: {
        Args: { p_move_to?: string; p_stage_id: string }
        Returns: number
      }
      has_role: {
        Args: { roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      is_member: { Args: never; Returns: boolean }
      promote_bootstrap_admin: {
        Args: { confirmed_at: string; user_email: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "funcionario"
      deal_type: "consultoria_avancada" | "somente_sistema"
      lead_source: "marketing" | "venda" | "indicacao" | "outro"
      lead_temperature: "quente" | "frio"
      pipeline_stage:
        | "lead_recebido"
        | "diagnostico_feito"
        | "reuniao_marcada"
        | "follow_up"
        | "cliente_fechado"
        | "cliente_perdido"
      video_source: "upload" | "drive" | "youtube"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "funcionario"],
      deal_type: ["consultoria_avancada", "somente_sistema"],
      lead_source: ["marketing", "venda", "indicacao", "outro"],
      lead_temperature: ["quente", "frio"],
      pipeline_stage: [
        "lead_recebido",
        "diagnostico_feito",
        "reuniao_marcada",
        "follow_up",
        "cliente_fechado",
        "cliente_perdido",
      ],
      video_source: ["upload", "drive", "youtube"],
    },
  },
} as const
