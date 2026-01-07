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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          assigned_staff_id: string | null
          category: string | null
          client_id: string
          created_at: string | null
          desired_date: string | null
          id: string
          service_year: number | null
          status: string | null
          sub_category: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          category?: string | null
          client_id: string
          created_at?: string | null
          desired_date?: string | null
          id?: string
          service_year?: number | null
          status?: string | null
          sub_category?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          category?: string | null
          client_id?: string
          created_at?: string | null
          desired_date?: string | null
          id?: string
          service_year?: number | null
          status?: string | null
          sub_category?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          contact: string | null
          created_at: string | null
          disability_cause: string | null
          disability_grade: string | null
          disability_onset_date: string | null
          disability_type: string | null
          economic_status: string | null
          gender: string | null
          guardian_contact: string | null
          has_elevator: boolean | null
          housing_type: string | null
          id: string
          name: string
          obstacles: string | null
          registration_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          contact?: string | null
          created_at?: string | null
          disability_cause?: string | null
          disability_grade?: string | null
          disability_onset_date?: string | null
          disability_type?: string | null
          economic_status?: string | null
          gender?: string | null
          guardian_contact?: string | null
          has_elevator?: boolean | null
          housing_type?: string | null
          id?: string
          name: string
          obstacles?: string | null
          registration_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          contact?: string | null
          created_at?: string | null
          disability_cause?: string | null
          disability_grade?: string | null
          disability_onset_date?: string | null
          disability_type?: string | null
          economic_status?: string | null
          gender?: string | null
          guardian_contact?: string | null
          has_elevator?: boolean | null
          housing_type?: string | null
          id?: string
          name?: string
          obstacles?: string | null
          registration_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_make_progress: {
        Row: {
          created_at: string | null
          custom_make_id: string
          id: string
          images: string[] | null
          notes: string | null
          progress_percentage: number
          progress_status: string
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_make_id: string
          id?: string
          images?: string[] | null
          notes?: string | null
          progress_percentage: number
          progress_status: string
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_make_id?: string
          id?: string
          images?: string[] | null
          notes?: string | null
          progress_percentage?: number
          progress_status?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_make_progress_custom_make_id_fkey"
            columns: ["custom_make_id"]
            isOneToOne: false
            referencedRelation: "custom_makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_make_progress_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_makes: {
        Row: {
          actual_completion_date: string | null
          application_id: string
          assigned_staff_id: string | null
          client_id: string
          cost_equipment: number | null
          cost_labor: number | null
          cost_materials: number | null
          cost_other: number | null
          cost_total: number | null
          created_at: string | null
          delivery_date: string | null
          delivery_notes: string | null
          design_files: string[] | null
          design_start_date: string | null
          equipment_id: string | null
          equipment_type: string | null
          expected_completion_date: string | null
          id: string
          inspection_notes: string | null
          item_description: string | null
          item_name: string
          manufacturing_notes: string | null
          manufacturing_start_date: string | null
          measurements: Json | null
          progress_percentage: number | null
          progress_status: string | null
          reference_images: string[] | null
          result_images: string[] | null
          specifications: string | null
          updated_at: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          application_id: string
          assigned_staff_id?: string | null
          client_id: string
          cost_equipment?: number | null
          cost_labor?: number | null
          cost_materials?: number | null
          cost_other?: number | null
          cost_total?: number | null
          created_at?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          design_files?: string[] | null
          design_start_date?: string | null
          equipment_id?: string | null
          equipment_type?: string | null
          expected_completion_date?: string | null
          id?: string
          inspection_notes?: string | null
          item_description?: string | null
          item_name: string
          manufacturing_notes?: string | null
          manufacturing_start_date?: string | null
          measurements?: Json | null
          progress_percentage?: number | null
          progress_status?: string | null
          reference_images?: string[] | null
          result_images?: string[] | null
          specifications?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          application_id?: string
          assigned_staff_id?: string | null
          client_id?: string
          cost_equipment?: number | null
          cost_labor?: number | null
          cost_materials?: number | null
          cost_other?: number | null
          cost_total?: number | null
          created_at?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          design_files?: string[] | null
          design_start_date?: string | null
          equipment_id?: string | null
          equipment_type?: string | null
          expected_completion_date?: string | null
          id?: string
          inspection_notes?: string | null
          item_description?: string | null
          item_name?: string
          manufacturing_notes?: string | null
          manufacturing_start_date?: string | null
          measurements?: Json | null
          progress_percentage?: number | null
          progress_status?: string | null
          reference_images?: string[] | null
          result_images?: string[] | null
          specifications?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_makes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_makes_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_makes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_makes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_assessments: {
        Row: {
          application_id: string
          created_at: string | null
          domain_type: string
          evaluation_data: Json | null
          evaluation_date: string | null
          evaluator_id: string | null
          evaluator_opinion: string | null
          future_plan: string | null
          id: string
          measurements: Json | null
          recommended_device: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          domain_type: string
          evaluation_data?: Json | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          evaluator_opinion?: string | null
          future_plan?: string | null
          id?: string
          measurements?: Json | null
          recommended_device?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          domain_type?: string
          evaluation_data?: Json | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          evaluator_opinion?: string | null
          future_plan?: string | null
          id?: string
          measurements?: Json | null
          recommended_device?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_assessments_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          manager_id: string | null
          manufacturer: string | null
          model: string | null
          name: string
          serial_number: string | null
          specifications: Json | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_records: {
        Row: {
          activity_posture: string | null
          application_id: string
          body_function_data: Json | null
          cognitive_sensory_check: string[] | null
          consult_date: string | null
          consultant_id: string | null
          consultation_content: string | null
          created_at: string | null
          current_devices: Json | null
          environment_limitations: string | null
          id: string
          main_activity_place: string | null
          main_supporter: string | null
          updated_at: string | null
        }
        Insert: {
          activity_posture?: string | null
          application_id: string
          body_function_data?: Json | null
          cognitive_sensory_check?: string[] | null
          consult_date?: string | null
          consultant_id?: string | null
          consultation_content?: string | null
          created_at?: string | null
          current_devices?: Json | null
          environment_limitations?: string | null
          id?: string
          main_activity_place?: string | null
          main_supporter?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_posture?: string | null
          application_id?: string
          body_function_data?: Json | null
          cognitive_sensory_check?: string[] | null
          consult_date?: string | null
          consultant_id?: string | null
          consultation_content?: string | null
          created_at?: string | null
          current_devices?: Json | null
          environment_limitations?: string | null
          id?: string
          main_activity_place?: string | null
          main_supporter?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_records_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          asset_code: string | null
          category: string | null
          created_at: string | null
          id: string
          is_rental_available: boolean | null
          manufacturer: string | null
          model: string | null
          name: string
          purchase_date: string | null
          purchase_price: number | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_code?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_rental_available?: boolean | null
          manufacturer?: string | null
          model?: string | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_code?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_rental_available?: boolean | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      process_logs: {
        Row: {
          application_id: string
          content: string | null
          created_at: string | null
          funding_source: string | null
          id: string
          item_name: string | null
          log_date: string | null
          process_step: string | null
          remarks: string | null
          service_area: string | null
          staff_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          content?: string | null
          created_at?: string | null
          funding_source?: string | null
          id?: string
          item_name?: string | null
          log_date?: string | null
          process_step?: string | null
          remarks?: string | null
          service_area?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          content?: string | null
          created_at?: string | null
          funding_source?: string | null
          id?: string
          item_name?: string | null
          log_date?: string | null
          process_step?: string | null
          remarks?: string | null
          service_area?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          team: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          application_id: string
          client_id: string
          created_at: string | null
          extension_count: number | null
          id: string
          inventory_id: string
          rental_end_date: string
          rental_start_date: string
          return_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          client_id: string
          created_at?: string | null
          extension_count?: number | null
          id?: string
          inventory_id: string
          rental_end_date: string
          rental_start_date: string
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          client_id?: string
          created_at?: string | null
          extension_count?: number | null
          id?: string
          inventory_id?: string
          rental_end_date?: string
          rental_start_date?: string
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          address: string | null
          application_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          schedule_type: string
          scheduled_date: string
          scheduled_time: string | null
          staff_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          application_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          schedule_type: string
          scheduled_date: string
          scheduled_time?: string | null
          staff_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          application_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          schedule_type?: string
          scheduled_date?: string
          scheduled_time?: string | null
          staff_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_logs: {
        Row: {
          application_id: string
          cost_labor: number | null
          cost_materials: number | null
          cost_other: number | null
          cost_total: number | null
          created_at: string | null
          funding_detail: string | null
          funding_source: string | null
          id: string
          images_after: string[] | null
          images_before: string[] | null
          inventory_id: string | null
          item_name: string | null
          notes: string | null
          remarks: string | null
          service_area: string | null
          service_date: string | null
          service_type: string | null
          staff_id: string | null
          updated_at: string | null
          work_description: string | null
          work_result: string | null
          work_type: string | null
        }
        Insert: {
          application_id: string
          cost_labor?: number | null
          cost_materials?: number | null
          cost_other?: number | null
          cost_total?: number | null
          created_at?: string | null
          funding_detail?: string | null
          funding_source?: string | null
          id?: string
          images_after?: string[] | null
          images_before?: string[] | null
          inventory_id?: string | null
          item_name?: string | null
          notes?: string | null
          remarks?: string | null
          service_area?: string | null
          service_date?: string | null
          service_type?: string | null
          staff_id?: string | null
          updated_at?: string | null
          work_description?: string | null
          work_result?: string | null
          work_type?: string | null
        }
        Update: {
          application_id?: string
          cost_labor?: number | null
          cost_materials?: number | null
          cost_other?: number | null
          cost_total?: number | null
          created_at?: string | null
          funding_detail?: string | null
          funding_source?: string | null
          id?: string
          images_after?: string[] | null
          images_before?: string[] | null
          inventory_id?: string | null
          item_name?: string | null
          notes?: string | null
          remarks?: string | null
          service_area?: string | null
          service_date?: string | null
          service_type?: string | null
          staff_id?: string | null
          updated_at?: string | null
          work_description?: string | null
          work_result?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_logs_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
