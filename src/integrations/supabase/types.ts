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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_passwords: {
        Row: {
          password_hash: string
          role: Database["public"]["Enums"]["perfil_role"]
          updated_at: string
        }
        Insert: {
          password_hash: string
          role: Database["public"]["Enums"]["perfil_role"]
          updated_at?: string
        }
        Update: {
          password_hash?: string
          role?: Database["public"]["Enums"]["perfil_role"]
          updated_at?: string
        }
        Relationships: []
      }
      demandas: {
        Row: {
          aceita_em: string | null
          aceita_por: Database["public"]["Enums"]["perfil_role"] | null
          analise_resolucao: string | null
          concluida_em: string | null
          created_at: string
          data_abertura: string
          descricao: string
          equipe_destino: Database["public"]["Enums"]["equipe_destino"] | null
          foto_url: string | null
          id: string
          local_id: string | null
          local_nome: string | null
          numero: number
          prioridade: string | null
          site_id: string | null
          site_nome: string | null
          situacao_atual: Database["public"]["Enums"]["situacao_atual"]
          solicitante: string
          status: Database["public"]["Enums"]["demanda_status"]
          tag_equipamento: string
          updated_at: string
        }
        Insert: {
          aceita_em?: string | null
          aceita_por?: Database["public"]["Enums"]["perfil_role"] | null
          analise_resolucao?: string | null
          concluida_em?: string | null
          created_at?: string
          data_abertura?: string
          descricao: string
          equipe_destino?: Database["public"]["Enums"]["equipe_destino"] | null
          foto_url?: string | null
          id?: string
          local_id?: string | null
          local_nome?: string | null
          numero?: number
          prioridade?: string | null
          site_id?: string | null
          site_nome?: string | null
          situacao_atual: Database["public"]["Enums"]["situacao_atual"]
          solicitante: string
          status?: Database["public"]["Enums"]["demanda_status"]
          tag_equipamento: string
          updated_at?: string
        }
        Update: {
          aceita_em?: string | null
          aceita_por?: Database["public"]["Enums"]["perfil_role"] | null
          analise_resolucao?: string | null
          concluida_em?: string | null
          created_at?: string
          data_abertura?: string
          descricao?: string
          equipe_destino?: Database["public"]["Enums"]["equipe_destino"] | null
          foto_url?: string | null
          id?: string
          local_id?: string | null
          local_nome?: string | null
          numero?: number
          prioridade?: string | null
          site_id?: string | null
          site_nome?: string | null
          situacao_atual?: Database["public"]["Enums"]["situacao_atual"]
          solicitante?: string
          status?: Database["public"]["Enums"]["demanda_status"]
          tag_equipamento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      locais: {
        Row: {
          created_at: string
          id: string
          nome: string
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locais_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      demanda_status:
        | "aberta"
        | "aceita"
        | "direcionada"
        | "em_andamento"
        | "concluida"
        | "cancelada"
      equipe_destino: "corretiva" | "preventiva" | "inspecao" | "pcm"
      perfil_role: "planejamento" | "manutencao"
      situacao_atual: "critico" | "prioritario" | "moderado" | "leve"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      demanda_status: [
        "aberta",
        "aceita",
        "direcionada",
        "em_andamento",
        "concluida",
        "cancelada",
      ],
      equipe_destino: ["corretiva", "preventiva", "inspecao", "pcm"],
      perfil_role: ["planejamento", "manutencao"],
      situacao_atual: ["critico", "prioritario", "moderado", "leve"],
    },
  },
} as const
