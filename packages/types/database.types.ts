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
      approval_documents: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          id?: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_signatures: {
        Row: {
          clerk_user_id: string
          created_at: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_steps: {
        Row: {
          acted_at: string | null
          acted_by: string | null
          approver_role: string
          comment: string | null
          document_id: string
          id: string
          signature_url: string | null
          status: string
          step: number
        }
        Insert: {
          acted_at?: string | null
          acted_by?: string | null
          approver_role: string
          comment?: string | null
          document_id: string
          id?: string
          signature_url?: string | null
          status?: string
          step: number
        }
        Update: {
          acted_at?: string | null
          acted_by?: string | null
          approver_role?: string
          comment?: string | null
          document_id?: string
          id?: string
          signature_url?: string | null
          status?: string
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "approval_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_channels: {
        Row: {
          channel_type: string
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          last_tested_at: string | null
          updated_at: string
        }
        Insert: {
          channel_type: string
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_tested_at?: string | null
          updated_at?: string
        }
        Update: {
          channel_type?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_tested_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          fail_count: number
          id: string
          job_name: string
          metadata: Json | null
          status: string
          success_count: number
          total_sent: number
          triggered_by: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          fail_count?: number
          id?: string
          job_name: string
          metadata?: Json | null
          status: string
          success_count?: number
          total_sent?: number
          triggered_by: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          fail_count?: number
          id?: string
          job_name?: string
          metadata?: Json | null
          status?: string
          success_count?: number
          total_sent?: number
          triggered_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          log_date: string
          q_case_management: boolean
          q_device: boolean
          q_other: boolean
          q_private_benefit: boolean
          q_public_benefit: boolean
          question_content: string | null
          requester_contact: string | null
          requester_name: string | null
          requester_region: string | null
          requester_type: string | null
          staff_name: string | null
          target_disability_severity: string | null
          target_disability_type: string | null
          target_economic_status: string | null
          target_gender: string | null
          target_name: string | null
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          log_date: string
          q_case_management?: boolean
          q_device?: boolean
          q_other?: boolean
          q_private_benefit?: boolean
          q_public_benefit?: boolean
          question_content?: string | null
          requester_contact?: string | null
          requester_name?: string | null
          requester_region?: string | null
          requester_type?: string | null
          staff_name?: string | null
          target_disability_severity?: string | null
          target_disability_type?: string | null
          target_economic_status?: string | null
          target_gender?: string | null
          target_name?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          log_date?: string
          q_case_management?: boolean
          q_device?: boolean
          q_other?: boolean
          q_private_benefit?: boolean
          q_public_benefit?: boolean
          question_content?: string | null
          requester_contact?: string | null
          requester_name?: string | null
          requester_region?: string | null
          requester_type?: string | null
          staff_name?: string | null
          target_disability_severity?: string | null
          target_disability_type?: string | null
          target_economic_status?: string | null
          target_gender?: string | null
          target_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_message_reads: {
        Row: {
          clerk_user_id: string
          id: string
          last_read_at: string
          room_id: string
        }
        Insert: {
          clerk_user_id: string
          id?: string
          last_read_at?: string
          room_id: string
        }
        Update: {
          clerk_user_id?: string
          id?: string
          last_read_at?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reads_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_deleted: boolean
          mentions: string[] | null
          reply_to_id: string | null
          room_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          mentions?: string[] | null
          reply_to_id?: string | null
          room_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          mentions?: string[] | null
          reply_to_id?: string | null
          room_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          clerk_user_id: string
          id: string
          joined_at: string
          role: string
          room_id: string
        }
        Insert: {
          clerk_user_id: string
          id?: string
          joined_at?: string
          role?: string
          room_id: string
        }
        Update: {
          clerk_user_id?: string
          id?: string
          joined_at?: string
          role?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_voc: {
        Row: {
          client_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          response: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          response?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          response?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_voc_client_id_fkey"
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
      eval_service_records: {
        Row: {
          application_no: number | null
          application_year: number | null
          birth_date: string | null
          client_id: string | null
          created_at: string | null
          disability_type: string | null
          gender: string | null
          id: string
          is_assessment: boolean | null
          is_cleaning: boolean | null
          is_closed: boolean | null
          is_consult: boolean | null
          is_custom_make: boolean | null
          is_education: boolean | null
          is_funding_secured: boolean | null
          is_grant: boolean | null
          is_info_provision: boolean | null
          is_monitoring: boolean | null
          is_other_business: boolean | null
          is_phone: boolean | null
          is_private_funding: boolean | null
          is_public_funding: boolean | null
          is_re_application: boolean | null
          is_rental: boolean | null
          is_repair: boolean | null
          is_reuse: boolean | null
          is_self_pay: boolean | null
          is_trial: boolean | null
          is_visit_in: boolean | null
          is_visit_out: boolean | null
          item_category: string | null
          name: string | null
          product_name: string | null
          received_at: string | null
          referral_type: string | null
          region: string | null
          service_area: string | null
          service_category: string | null
          service_content: string | null
          source: string | null
          staff_name: string | null
          updated_at: string | null
        }
        Insert: {
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          client_id?: string | null
          created_at?: string | null
          disability_type?: string | null
          gender?: string | null
          id?: string
          is_assessment?: boolean | null
          is_cleaning?: boolean | null
          is_closed?: boolean | null
          is_consult?: boolean | null
          is_custom_make?: boolean | null
          is_education?: boolean | null
          is_funding_secured?: boolean | null
          is_grant?: boolean | null
          is_info_provision?: boolean | null
          is_monitoring?: boolean | null
          is_other_business?: boolean | null
          is_phone?: boolean | null
          is_private_funding?: boolean | null
          is_public_funding?: boolean | null
          is_re_application?: boolean | null
          is_rental?: boolean | null
          is_repair?: boolean | null
          is_reuse?: boolean | null
          is_self_pay?: boolean | null
          is_trial?: boolean | null
          is_visit_in?: boolean | null
          is_visit_out?: boolean | null
          item_category?: string | null
          name?: string | null
          product_name?: string | null
          received_at?: string | null
          referral_type?: string | null
          region?: string | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          source?: string | null
          staff_name?: string | null
          updated_at?: string | null
        }
        Update: {
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          client_id?: string | null
          created_at?: string | null
          disability_type?: string | null
          gender?: string | null
          id?: string
          is_assessment?: boolean | null
          is_cleaning?: boolean | null
          is_closed?: boolean | null
          is_consult?: boolean | null
          is_custom_make?: boolean | null
          is_education?: boolean | null
          is_funding_secured?: boolean | null
          is_grant?: boolean | null
          is_info_provision?: boolean | null
          is_monitoring?: boolean | null
          is_other_business?: boolean | null
          is_phone?: boolean | null
          is_private_funding?: boolean | null
          is_public_funding?: boolean | null
          is_re_application?: boolean | null
          is_rental?: boolean | null
          is_repair?: boolean | null
          is_reuse?: boolean | null
          is_self_pay?: boolean | null
          is_trial?: boolean | null
          is_visit_in?: boolean | null
          is_visit_out?: boolean | null
          item_category?: string | null
          name?: string | null
          product_name?: string | null
          received_at?: string | null
          referral_type?: string | null
          region?: string | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          source?: string | null
          staff_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_service_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_sync_logs: {
        Row: {
          error_msg: string | null
          id: string
          rows_added: number | null
          rows_skipped: number | null
          sheet_type: string
          status: string
          synced_at: string | null
        }
        Insert: {
          error_msg?: string | null
          id?: string
          rows_added?: number | null
          rows_skipped?: number | null
          sheet_type: string
          status: string
          synced_at?: string | null
        }
        Update: {
          error_msg?: string | null
          id?: string
          rows_added?: number | null
          rows_skipped?: number | null
          sheet_type?: string
          status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      hr_allowance_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      hr_attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          note: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          note?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_careers: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          end_date: string | null
          id: string
          organization: string
          position: string
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          organization: string
          position: string
          start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          organization?: string
          position?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_careers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_daily_wages: {
        Row: {
          created_at: string
          deductions: Json
          employee_id: string
          gross_pay: number
          hourly_rate: number
          hours_worked: number
          id: string
          net_pay: number
          note: string | null
          work_date: string
        }
        Insert: {
          created_at?: string
          deductions?: Json
          employee_id: string
          gross_pay: number
          hourly_rate: number
          hours_worked: number
          id?: string
          net_pay: number
          note?: string | null
          work_date: string
        }
        Update: {
          created_at?: string
          deductions?: Json
          employee_id?: string
          gross_pay?: number
          hourly_rate?: number
          hours_worked?: number
          id?: string
          net_pay?: number
          note?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_daily_wages_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          clerk_user_id: string | null
          created_at: string
          department: string
          email: string
          employment_type: string
          hire_date: string
          id: string
          is_active: boolean
          leave_date: string | null
          name: string
          phone: string | null
          position: string
          updated_at: string
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          department: string
          email: string
          employment_type: string
          hire_date: string
          id?: string
          is_active?: boolean
          leave_date?: string | null
          name: string
          phone?: string | null
          position: string
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          department?: string
          email?: string
          employment_type?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          leave_date?: string | null
          name?: string
          phone?: string | null
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_leave_requests: {
        Row: {
          created_at: string
          days_used: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          days_used: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          days_used?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_salary_grades: {
        Row: {
          base_salary: number
          created_at: string
          grade_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          base_salary: number
          created_at?: string
          grade_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          grade_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hr_salary_records: {
        Row: {
          allowances: Json
          base_salary: number
          confirmed_at: string | null
          created_at: string
          deductions: Json
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          note: string | null
          salary_grade_id: string | null
          updated_at: string
          year_month: string
        }
        Insert: {
          allowances?: Json
          base_salary: number
          confirmed_at?: string | null
          created_at?: string
          deductions?: Json
          employee_id: string
          gross_pay: number
          id?: string
          net_pay: number
          note?: string | null
          salary_grade_id?: string | null
          updated_at?: string
          year_month: string
        }
        Update: {
          allowances?: Json
          base_salary?: number
          confirmed_at?: string | null
          created_at?: string
          deductions?: Json
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          note?: string | null
          salary_grade_id?: string | null
          updated_at?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_salary_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_salary_records_salary_grade_id_fkey"
            columns: ["salary_grade_id"]
            isOneToOne: false
            referencedRelation: "hr_salary_grades"
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
          barcode: string | null
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
          qr_token: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_code?: string | null
          barcode?: string | null
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
          qr_token?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_code?: string | null
          barcode?: string | null
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
          qr_token?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_custom_order_equipment: {
        Row: {
          custom_order_id: string
          equipment_id: string
          finished_at: string | null
          id: string
          notes: string | null
          started_at: string | null
        }
        Insert: {
          custom_order_id: string
          equipment_id: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
        }
        Update: {
          custom_order_id?: string
          equipment_id?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_custom_order_equipment_custom_order_id_fkey"
            columns: ["custom_order_id"]
            isOneToOne: false
            referencedRelation: "inventory_custom_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_custom_order_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "inventory_fab_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_custom_orders: {
        Row: {
          approval_id: string | null
          client_id: string
          created_at: string | null
          delivered_at: string | null
          device_id: string | null
          id: string
          notes: string | null
          requested_at: string | null
          status: string
          track_token: string | null
          updated_at: string | null
        }
        Insert: {
          approval_id?: string | null
          client_id: string
          created_at?: string | null
          delivered_at?: string | null
          device_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          status?: string
          track_token?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_id?: string | null
          client_id?: string
          created_at?: string | null
          delivered_at?: string | null
          device_id?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          status?: string
          track_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_custom_orders_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_custom_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_custom_orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_fab_equipment: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          purchased_at: string | null
          serial_number: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          purchased_at?: string | null
          serial_number?: string | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchased_at?: string | null
          serial_number?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          created_by: string | null
          device_id: string
          id: string
          notes: string | null
          performed_at: string | null
          status: string
          technician: string | null
          type: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          device_id: string
          id?: string
          notes?: string | null
          performed_at?: string | null
          status?: string
          technician?: string | null
          type: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          device_id?: string
          id?: string
          notes?: string | null
          performed_at?: string | null
          status?: string
          technician?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_maintenance_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reuse_dispatches: {
        Row: {
          approval_id: string | null
          client_id: string
          created_at: string | null
          device_id: string
          dispatched_at: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_id?: string | null
          client_id: string
          created_at?: string | null
          device_id: string
          dispatched_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_id?: string | null
          client_id?: string
          created_at?: string | null
          device_id?: string
          dispatched_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reuse_dispatches_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reuse_dispatches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reuse_dispatches_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: Json | null
          agenda: string | null
          attendees: string[] | null
          created_at: string
          created_by: string
          id: string
          meeting_type: string
          minutes: string | null
          schedule_id: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          agenda?: string | null
          attendees?: string[] | null
          created_at?: string
          created_by: string
          id?: string
          meeting_type?: string
          minutes?: string | null
          schedule_id: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          agenda?: string | null
          attendees?: string[] | null
          created_at?: string
          created_by?: string
          id?: string
          meeting_type?: string
          minutes?: string | null
          schedule_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: true
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_reads: {
        Row: {
          clerk_user_id: string
          id: string
          notice_id: string
          read_at: string
        }
        Insert: {
          clerk_user_id: string
          id?: string
          notice_id: string
          read_at?: string
        }
        Update: {
          clerk_user_id?: string
          id?: string
          notice_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
        ]
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
      regulations: {
        Row: {
          category: string | null
          chunk_index: number | null
          chunk_size: number | null
          content: string
          created_at: string | null
          embedding: Json | null
          embedding_model: string | null
          id: string
          section: string | null
          source_file: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          chunk_index?: number | null
          chunk_size?: number | null
          content: string
          created_at?: string | null
          embedding?: Json | null
          embedding_model?: string | null
          id?: string
          section?: string | null
          source_file?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          chunk_index?: number | null
          chunk_size?: number | null
          content?: string
          created_at?: string | null
          embedding?: Json | null
          embedding_model?: string | null
          id?: string
          section?: string | null
          source_file?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          application_id: string | null
          approval_id: string | null
          client_id: string
          created_at: string | null
          extension_count: number | null
          id: string
          inventory_id: string | null
          rental_end_date: string
          rental_start_date: string
          return_date: string | null
          status: string | null
          updated_at: string | null
          wait_list_checked_at: string | null
        }
        Insert: {
          application_id?: string | null
          approval_id?: string | null
          client_id: string
          created_at?: string | null
          extension_count?: number | null
          id?: string
          inventory_id?: string | null
          rental_end_date: string
          rental_start_date: string
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
          wait_list_checked_at?: string | null
        }
        Update: {
          application_id?: string | null
          approval_id?: string | null
          client_id?: string
          created_at?: string | null
          extension_count?: number | null
          id?: string
          inventory_id?: string | null
          rental_end_date?: string
          rental_start_date?: string
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
          wait_list_checked_at?: string | null
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
            foreignKeyName: "rentals_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_documents"
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
      resources: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          resource_date: string | null
          title: string
          type: string
          updated_at: string | null
          youtube_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          resource_date?: string | null
          title: string
          type: string
          updated_at?: string | null
          youtube_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          resource_date?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          youtube_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      security_logs: {
        Row: {
          blocked: boolean | null
          clerk_user_id: string | null
          created_at: string | null
          detected_pattern: string | null
          event_type: string
          id: string
          ip_address: string | null
          location: string | null
          metadata: Json | null
          notification_sent_at: string | null
          notified: boolean | null
          request_body: string | null
          request_headers: Json | null
          request_method: string | null
          request_path: string | null
          severity: string
          threat_description: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          clerk_user_id?: string | null
          created_at?: string | null
          detected_pattern?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          location?: string | null
          metadata?: Json | null
          notification_sent_at?: string | null
          notified?: boolean | null
          request_body?: string | null
          request_headers?: Json | null
          request_method?: string | null
          request_path?: string | null
          severity: string
          threat_description?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          clerk_user_id?: string | null
          created_at?: string | null
          detected_pattern?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          metadata?: Json | null
          notification_sent_at?: string | null
          notified?: boolean | null
          request_body?: string | null
          request_headers?: Json | null
          request_method?: string | null
          request_path?: string | null
          severity?: string
          threat_description?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
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
      supplies: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number
          id: string
          location: string | null
          minimum_stock: number
          name: string
          notes: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          location?: string | null
          minimum_stock?: number
          name: string
          notes?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          location?: string | null
          minimum_stock?: number
          name?: string
          notes?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      supply_transactions: {
        Row: {
          clerk_user_id: string
          created_at: string
          id: string
          quantity: number
          reason: string | null
          supply_id: string
          type: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          id?: string
          quantity: number
          reason?: string | null
          supply_id: string
          type: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          id?: string
          quantity?: number
          reason?: string | null
          supply_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_transactions_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      inventory_dispatch_summary: {
        Row: {
          approval_id: string | null
          client_id: string | null
          created_at: string | null
          device_id: string | null
          dispatch_type: string | null
          id: string | null
          status: string | null
        }
        Relationships: []
      }
      v_call_log_report: {
        Row: {
          answer: string | null
          log_date: string | null
          q_case_management: boolean | null
          q_device: boolean | null
          q_other: boolean | null
          q_private_benefit: boolean | null
          q_public_benefit: boolean | null
          question_content: string | null
          requester_contact: string | null
          requester_name: string | null
          requester_region: string | null
          requester_type: string | null
          staff_name: string | null
          target_disability_severity: string | null
          target_disability_type: string | null
          target_economic_status: string | null
          target_gender: string | null
          target_name: string | null
        }
        Insert: {
          answer?: string | null
          log_date?: string | null
          q_case_management?: boolean | null
          q_device?: boolean | null
          q_other?: boolean | null
          q_private_benefit?: boolean | null
          q_public_benefit?: boolean | null
          question_content?: string | null
          requester_contact?: string | null
          requester_name?: string | null
          requester_region?: string | null
          requester_type?: string | null
          staff_name?: string | null
          target_disability_severity?: string | null
          target_disability_type?: string | null
          target_economic_status?: string | null
          target_gender?: string | null
          target_name?: string | null
        }
        Update: {
          answer?: string | null
          log_date?: string | null
          q_case_management?: boolean | null
          q_device?: boolean | null
          q_other?: boolean | null
          q_private_benefit?: boolean | null
          q_public_benefit?: boolean | null
          question_content?: string | null
          requester_contact?: string | null
          requester_name?: string | null
          requester_region?: string | null
          requester_type?: string | null
          staff_name?: string | null
          target_disability_severity?: string | null
          target_disability_type?: string | null
          target_economic_status?: string | null
          target_gender?: string | null
          target_name?: string | null
        }
        Relationships: []
      }
      v_service_record_report: {
        Row: {
          application_no: number | null
          application_year: number | null
          birth_date: string | null
          disability_type: string | null
          gender: string | null
          is_assessment: boolean | null
          is_cleaning: boolean | null
          is_closed: boolean | null
          is_consult: boolean | null
          is_custom_make: boolean | null
          is_education: boolean | null
          is_funding_secured: boolean | null
          is_grant: boolean | null
          is_info_provision: boolean | null
          is_monitoring: boolean | null
          is_other_business: boolean | null
          is_phone: boolean | null
          is_private_funding: boolean | null
          is_public_funding: boolean | null
          is_rental: boolean | null
          is_repair: boolean | null
          is_reuse: boolean | null
          is_self_pay: boolean | null
          is_trial: boolean | null
          is_visit_in: boolean | null
          is_visit_out: boolean | null
          item_category: string | null
          name: string | null
          product_name: string | null
          received_at: string | null
          referral_type: string | null
          region: string | null
          service_area: string | null
          service_category: string | null
          service_content: string | null
          staff_name: string | null
        }
        Insert: {
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          disability_type?: string | null
          gender?: string | null
          is_assessment?: boolean | null
          is_cleaning?: boolean | null
          is_closed?: boolean | null
          is_consult?: boolean | null
          is_custom_make?: boolean | null
          is_education?: boolean | null
          is_funding_secured?: boolean | null
          is_grant?: boolean | null
          is_info_provision?: boolean | null
          is_monitoring?: boolean | null
          is_other_business?: boolean | null
          is_phone?: boolean | null
          is_private_funding?: boolean | null
          is_public_funding?: boolean | null
          is_rental?: boolean | null
          is_repair?: boolean | null
          is_reuse?: boolean | null
          is_self_pay?: boolean | null
          is_trial?: boolean | null
          is_visit_in?: boolean | null
          is_visit_out?: boolean | null
          item_category?: string | null
          name?: string | null
          product_name?: string | null
          received_at?: string | null
          referral_type?: string | null
          region?: string | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          staff_name?: string | null
        }
        Update: {
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          disability_type?: string | null
          gender?: string | null
          is_assessment?: boolean | null
          is_cleaning?: boolean | null
          is_closed?: boolean | null
          is_consult?: boolean | null
          is_custom_make?: boolean | null
          is_education?: boolean | null
          is_funding_secured?: boolean | null
          is_grant?: boolean | null
          is_info_provision?: boolean | null
          is_monitoring?: boolean | null
          is_other_business?: boolean | null
          is_phone?: boolean | null
          is_private_funding?: boolean | null
          is_public_funding?: boolean | null
          is_rental?: boolean | null
          is_repair?: boolean | null
          is_reuse?: boolean | null
          is_self_pay?: boolean | null
          is_trial?: boolean | null
          is_visit_in?: boolean | null
          is_visit_out?: boolean | null
          item_category?: string | null
          name?: string | null
          product_name?: string | null
          received_at?: string | null
          referral_type?: string | null
          region?: string | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          staff_name?: string | null
        }
        Relationships: []
      }
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
