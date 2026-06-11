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
      annual_targets: {
        Row: {
          cleaning: number
          consultation: number
          created_at: string | null
          custom_make: number
          experience: number
          id: string
          professional_edu: number
          promotion: number
          rental: number
          repair: number
          reuse: number
          updated_at: string | null
          year: number
        }
        Insert: {
          cleaning?: number
          consultation?: number
          created_at?: string | null
          custom_make?: number
          experience?: number
          id?: string
          professional_edu?: number
          promotion?: number
          rental?: number
          repair?: number
          reuse?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          cleaning?: number
          consultation?: number
          created_at?: string | null
          custom_make?: number
          experience?: number
          id?: string
          professional_edu?: number
          promotion?: number
          rental?: number
          repair?: number
          reuse?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      applications: {
        Row: {
          assigned_staff_id: string | null
          category: string | null
          client_id: string
          created_at: string | null
          desired_date: string | null
          id: string
          notes: string | null
          progress_type: string | null
          referral_type: string | null
          requested_item: string | null
          service_area: string | null
          service_year: number | null
          status: string | null
          sub_category: string | null
          updated_at: string | null
          visit_type: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          category?: string | null
          client_id: string
          created_at?: string | null
          desired_date?: string | null
          id?: string
          notes?: string | null
          progress_type?: string | null
          referral_type?: string | null
          requested_item?: string | null
          service_area?: string | null
          service_year?: number | null
          status?: string | null
          sub_category?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          category?: string | null
          client_id?: string
          created_at?: string | null
          desired_date?: string | null
          id?: string
          notes?: string | null
          progress_type?: string | null
          referral_type?: string | null
          requested_item?: string | null
          service_area?: string | null
          service_year?: number | null
          status?: string | null
          sub_category?: string | null
          updated_at?: string | null
          visit_type?: string | null
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
      approval_delegations: {
        Row: {
          created_at: string
          delegatee_clerk_id: string
          delegator_clerk_id: string
          end_date: string | null
          id: string
          is_active: boolean
          note: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string
          delegatee_clerk_id: string
          delegator_clerk_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string
          delegatee_clerk_id?: string
          delegator_clerk_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          start_date?: string | null
        }
        Relationships: []
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
          is_delegated: boolean
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
          is_delegated?: boolean
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
          is_delegated?: boolean
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
      banners: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          end_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_label: string
          link_url: string | null
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_label?: string
          link_url?: string | null
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_label?: string
          link_url?: string | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
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
          assigned_staff_id: string | null
          birth_date: string | null
          care_level: string | null
          city: string | null
          contact: string | null
          created_at: string | null
          disability_cause: string | null
          disability_description: string | null
          disability_grade: string | null
          disability_onset_date: string | null
          disability_progression: string | null
          disability_type: string | null
          economic_status: string | null
          email: string | null
          floor_number: string | null
          gender: string | null
          guardian_contact: string | null
          guardian_name: string | null
          guardian_relationship: string | null
          has_elevator: boolean | null
          housing_type: string | null
          id: string
          name: string
          obstacles: string | null
          progression_cause: string | null
          registration_number: string | null
          secondary_disability_type: string | null
          source: string
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_staff_id?: string | null
          birth_date?: string | null
          care_level?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          disability_cause?: string | null
          disability_description?: string | null
          disability_grade?: string | null
          disability_onset_date?: string | null
          disability_progression?: string | null
          disability_type?: string | null
          economic_status?: string | null
          email?: string | null
          floor_number?: string | null
          gender?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          has_elevator?: boolean | null
          housing_type?: string | null
          id?: string
          name: string
          obstacles?: string | null
          progression_cause?: string | null
          registration_number?: string | null
          secondary_disability_type?: string | null
          source?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_staff_id?: string | null
          birth_date?: string | null
          care_level?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          disability_cause?: string | null
          disability_description?: string | null
          disability_grade?: string | null
          disability_onset_date?: string | null
          disability_progression?: string | null
          disability_type?: string | null
          economic_status?: string | null
          email?: string | null
          floor_number?: string | null
          gender?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          has_elevator?: boolean | null
          housing_type?: string | null
          id?: string
          name?: string
          obstacles?: string | null
          progression_cause?: string | null
          registration_number?: string | null
          secondary_disability_type?: string | null
          source?: string
          status?: string
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
      eval_cases: {
        Row: {
          case_type: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          services: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          case_type?: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          services?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          case_type?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          services?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_grant_assessments: {
        Row: {
          application_id: string | null
          assessment_month: number | null
          assessment_year: number
          change_cancel_reason: string | null
          client_id: string
          created_at: string | null
          evaluation_date: string | null
          evaluator_name: string | null
          evaluator_staff_id: string | null
          final_result: string | null
          general_opinion: string | null
          id: string
          prior_grant_records: Json | null
          referral_doc_id: string | null
          referral_org: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          assessment_month?: number | null
          assessment_year?: number
          change_cancel_reason?: string | null
          client_id: string
          created_at?: string | null
          evaluation_date?: string | null
          evaluator_name?: string | null
          evaluator_staff_id?: string | null
          final_result?: string | null
          general_opinion?: string | null
          id?: string
          prior_grant_records?: Json | null
          referral_doc_id?: string | null
          referral_org?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          assessment_month?: number | null
          assessment_year?: number
          change_cancel_reason?: string | null
          client_id?: string
          created_at?: string | null
          evaluation_date?: string | null
          evaluator_name?: string | null
          evaluator_staff_id?: string | null
          final_result?: string | null
          general_opinion?: string | null
          id?: string
          prior_grant_records?: Json | null
          referral_doc_id?: string | null
          referral_org?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_grant_assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_grant_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_grant_assessments_referral_doc_id_fkey"
            columns: ["referral_doc_id"]
            isOneToOne: false
            referencedRelation: "eval_grant_referral_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_grant_items: {
        Row: {
          assessment_id: string
          checklist_responses: Json | null
          created_at: string | null
          final_item_name: string | null
          has_self_pay: boolean | null
          id: string
          item_category: string
          item_name: string | null
          item_opinion: string | null
          item_order: number
          item_result: string | null
          recommended_model: string | null
          score_disability: number | null
          score_effectiveness: number | null
          score_env: number | null
          score_operation: number | null
          score_use_plan: number | null
          self_usage_possible: boolean | null
          support_amount: number | null
          support_person: string | null
          total_score: number | null
          updated_at: string | null
          usage_experience: boolean | null
          use_location: string | null
          use_location_detail: string | null
          use_plan: string | null
          vendor_name: string | null
          vendor_phone: string | null
        }
        Insert: {
          assessment_id: string
          checklist_responses?: Json | null
          created_at?: string | null
          final_item_name?: string | null
          has_self_pay?: boolean | null
          id?: string
          item_category: string
          item_name?: string | null
          item_opinion?: string | null
          item_order: number
          item_result?: string | null
          recommended_model?: string | null
          score_disability?: number | null
          score_effectiveness?: number | null
          score_env?: number | null
          score_operation?: number | null
          score_use_plan?: number | null
          self_usage_possible?: boolean | null
          support_amount?: number | null
          support_person?: string | null
          total_score?: number | null
          updated_at?: string | null
          usage_experience?: boolean | null
          use_location?: string | null
          use_location_detail?: string | null
          use_plan?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Update: {
          assessment_id?: string
          checklist_responses?: Json | null
          created_at?: string | null
          final_item_name?: string | null
          has_self_pay?: boolean | null
          id?: string
          item_category?: string
          item_name?: string | null
          item_opinion?: string | null
          item_order?: number
          item_result?: string | null
          recommended_model?: string | null
          score_disability?: number | null
          score_effectiveness?: number | null
          score_env?: number | null
          score_operation?: number | null
          score_use_plan?: number | null
          self_usage_possible?: boolean | null
          support_amount?: number | null
          support_person?: string | null
          total_score?: number | null
          updated_at?: string | null
          usage_experience?: boolean | null
          use_location?: string | null
          use_location_detail?: string | null
          use_plan?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_grant_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "eval_grant_assessment_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_grant_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "eval_grant_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_grant_referral_docs: {
        Row: {
          assessment_count: number | null
          assessment_items_count: number | null
          cancel_count: number | null
          created_at: string | null
          created_by: string | null
          doc_date: string | null
          doc_number: string | null
          doc_year: number
          id: string
          note: string | null
          receive_date: string | null
          referral_count: number | null
          referral_round: number | null
          result_send_date: string | null
          sending_org: string
          updated_at: string | null
        }
        Insert: {
          assessment_count?: number | null
          assessment_items_count?: number | null
          cancel_count?: number | null
          created_at?: string | null
          created_by?: string | null
          doc_date?: string | null
          doc_number?: string | null
          doc_year: number
          id?: string
          note?: string | null
          receive_date?: string | null
          referral_count?: number | null
          referral_round?: number | null
          result_send_date?: string | null
          sending_org: string
          updated_at?: string | null
        }
        Update: {
          assessment_count?: number | null
          assessment_items_count?: number | null
          cancel_count?: number | null
          created_at?: string | null
          created_by?: string | null
          doc_date?: string | null
          doc_number?: string | null
          doc_year?: number
          id?: string
          note?: string | null
          receive_date?: string | null
          referral_count?: number | null
          referral_round?: number | null
          result_send_date?: string | null
          sending_org?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      eval_ippa_assessments: {
        Row: {
          assessment_year: number
          client_id: string
          created_at: string
          id: string
          items: Json
          notes: string | null
          outcome_score: number | null
          post_date: string | null
          pre_date: string | null
          staff_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assessment_year?: number
          client_id: string
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          outcome_score?: number | null
          post_date?: string | null
          pre_date?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_year?: number
          client_id?: string
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          outcome_score?: number | null
          post_date?: string | null
          pre_date?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_ippa_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_item_checklist_templates: {
        Row: {
          created_at: string | null
          hint_text: string | null
          id: string
          is_active: boolean | null
          item_category: string
          question_id: string
          question_order: number
          question_text: string
        }
        Insert: {
          created_at?: string | null
          hint_text?: string | null
          id?: string
          is_active?: boolean | null
          item_category: string
          question_id: string
          question_order?: number
          question_text: string
        }
        Update: {
          created_at?: string | null
          hint_text?: string | null
          id?: string
          is_active?: boolean | null
          item_category?: string
          question_id?: string
          question_order?: number
          question_text?: string
        }
        Relationships: []
      }
      eval_service_records: {
        Row: {
          address: string | null
          application_id: string | null
          application_month: number | null
          application_no: number | null
          application_year: number | null
          birth_date: string | null
          client_id: string | null
          closed_at: string | null
          consultation_date: string | null
          contact: string | null
          created_at: string | null
          disability_severity: string | null
          disability_type: string | null
          economic_status: string | null
          funding_source_detail: string | null
          gender: string | null
          grant_assessment_id: string | null
          id: string
          info_provision_area: string | null
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
          manufacturing_method: string | null
          monitoring_date: string | null
          name: string | null
          performance_date: string | null
          product_name: string | null
          received_at: string | null
          record_status: string | null
          referral_type: string | null
          region: string | null
          satisfaction_comment: string | null
          satisfaction_score: number | null
          service_area: string | null
          service_category: string | null
          service_content: string | null
          service_major_category: string | null
          service_sub_category: string | null
          source: string | null
          staff_name: string | null
          trial_device_count: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          application_id?: string | null
          application_month?: number | null
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          client_id?: string | null
          closed_at?: string | null
          consultation_date?: string | null
          contact?: string | null
          created_at?: string | null
          disability_severity?: string | null
          disability_type?: string | null
          economic_status?: string | null
          funding_source_detail?: string | null
          gender?: string | null
          grant_assessment_id?: string | null
          id?: string
          info_provision_area?: string | null
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
          manufacturing_method?: string | null
          monitoring_date?: string | null
          name?: string | null
          performance_date?: string | null
          product_name?: string | null
          received_at?: string | null
          record_status?: string | null
          referral_type?: string | null
          region?: string | null
          satisfaction_comment?: string | null
          satisfaction_score?: number | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          service_major_category?: string | null
          service_sub_category?: string | null
          source?: string | null
          staff_name?: string | null
          trial_device_count?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          application_id?: string | null
          application_month?: number | null
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          client_id?: string | null
          closed_at?: string | null
          consultation_date?: string | null
          contact?: string | null
          created_at?: string | null
          disability_severity?: string | null
          disability_type?: string | null
          economic_status?: string | null
          funding_source_detail?: string | null
          gender?: string | null
          grant_assessment_id?: string | null
          id?: string
          info_provision_area?: string | null
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
          manufacturing_method?: string | null
          monitoring_date?: string | null
          name?: string | null
          performance_date?: string | null
          product_name?: string | null
          received_at?: string | null
          record_status?: string | null
          referral_type?: string | null
          region?: string | null
          satisfaction_comment?: string | null
          satisfaction_score?: number | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          service_major_category?: string | null
          service_sub_category?: string | null
          source?: string | null
          staff_name?: string | null
          trial_device_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_service_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_service_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_service_records_grant_assessment_id_fkey"
            columns: ["grant_assessment_id"]
            isOneToOne: false
            referencedRelation: "eval_grant_assessment_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_service_records_grant_assessment_id_fkey"
            columns: ["grant_assessment_id"]
            isOneToOne: false
            referencedRelation: "eval_grant_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_session_transcripts: {
        Row: {
          ai_summary: string | null
          client_id: string | null
          consent_given: boolean | null
          created_at: string | null
          duration_sec: number | null
          id: string
          key_points: Json | null
          linked_call_log_id: string | null
          linked_service_record_id: string | null
          raw_transcript: string | null
          session_date: string
          session_type: string
          staff_id: string
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          client_id?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          key_points?: Json | null
          linked_call_log_id?: string | null
          linked_service_record_id?: string | null
          raw_transcript?: string | null
          session_date?: string
          session_type: string
          staff_id: string
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          client_id?: string | null
          consent_given?: boolean | null
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          key_points?: Json | null
          linked_call_log_id?: string | null
          linked_service_record_id?: string | null
          raw_transcript?: string | null
          session_date?: string
          session_type?: string
          staff_id?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_session_transcripts_client_id_fkey"
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
      finance_budget_categories: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          order_no: number | null
          parent_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          order_no?: number | null
          parent_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          order_no?: number | null
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_budget_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_budget_categories"
            referencedColumns: ["id"]
          },
        ]
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
      hr_business_trips: {
        Row: {
          allowance: number
          created_at: string
          days: number
          destination: string
          employee_id: string
          end_date: string
          id: string
          note: string | null
          purpose: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          transport: string | null
          updated_at: string
        }
        Insert: {
          allowance?: number
          created_at?: string
          days?: number
          destination: string
          employee_id: string
          end_date: string
          id?: string
          note?: string | null
          purpose: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          transport?: string | null
          updated_at?: string
        }
        Update: {
          allowance?: number
          created_at?: string
          days?: number
          destination?: string
          employee_id?: string
          end_date?: string
          id?: string
          note?: string | null
          purpose?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          transport?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_business_trips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_business_trips_reviewed_by_fkey"
            columns: ["reviewed_by"]
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
      hr_contracts: {
        Row: {
          base_salary: number
          contract_type: string
          created_at: string
          department: string
          employee_id: string
          employment_type: string
          end_date: string | null
          id: string
          note: string | null
          position: string
          signed_at: string | null
          start_date: string
          work_hours: number
        }
        Insert: {
          base_salary?: number
          contract_type?: string
          created_at?: string
          department: string
          employee_id: string
          employment_type?: string
          end_date?: string | null
          id?: string
          note?: string | null
          position: string
          signed_at?: string | null
          start_date: string
          work_hours?: number
        }
        Update: {
          base_salary?: number
          contract_type?: string
          created_at?: string
          department?: string
          employee_id?: string
          employment_type?: string
          end_date?: string | null
          id?: string
          note?: string | null
          position?: string
          signed_at?: string | null
          start_date?: string
          work_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_daily_absences: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number
          employee_id: string
          end_time: string | null
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_time: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          duration_minutes?: number
          employee_id: string
          end_time?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number
          employee_id?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_daily_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_daily_absences_reviewed_by_fkey"
            columns: ["reviewed_by"]
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
      hr_departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_employees: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          clerk_user_id: string | null
          created_at: string
          department: string
          department_id: string | null
          email: string
          employment_type: string
          hire_date: string
          id: string
          is_active: boolean
          leave_date: string | null
          name: string
          phone: string | null
          position: string
          position_id: string | null
          salary_step_id: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          clerk_user_id?: string | null
          created_at?: string
          department: string
          department_id?: string | null
          email: string
          employment_type: string
          hire_date: string
          id?: string
          is_active?: boolean
          leave_date?: string | null
          name: string
          phone?: string | null
          position: string
          position_id?: string | null
          salary_step_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          clerk_user_id?: string | null
          created_at?: string
          department?: string
          department_id?: string | null
          email?: string
          employment_type?: string
          hire_date?: string
          id?: string
          is_active?: boolean
          leave_date?: string | null
          name?: string
          phone?: string | null
          position?: string
          position_id?: string | null
          salary_step_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "hr_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_salary_step_id_fkey"
            columns: ["salary_step_id"]
            isOneToOne: false
            referencedRelation: "hr_salary_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_evaluations: {
        Row: {
          comment: string | null
          created_at: string
          employee_id: string
          evaluator_id: string | null
          id: string
          improvements: string | null
          period: string
          rating: string | null
          score: number | null
          status: string
          strengths: string | null
          updated_at: string
          year: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          employee_id: string
          evaluator_id?: string | null
          id?: string
          improvements?: string | null
          period?: string
          rating?: string | null
          score?: number | null
          status?: string
          strengths?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          employee_id?: string
          evaluator_id?: string | null
          id?: string
          improvements?: string | null
          period?: string
          rating?: string | null
          score?: number | null
          status?: string
          strengths?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_balances: {
        Row: {
          carry_over: number
          created_at: string
          employee_id: string
          entitlement: number
          id: string
          leave_type: string
          updated_at: string
          used: number
          year: number
        }
        Insert: {
          carry_over?: number
          created_at?: string
          employee_id: string
          entitlement?: number
          id?: string
          leave_type?: string
          updated_at?: string
          used?: number
          year: number
        }
        Update: {
          carry_over?: number
          created_at?: string
          employee_id?: string
          entitlement?: number
          id?: string
          leave_type?: string
          updated_at?: string
          used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
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
      hr_overtime_records: {
        Row: {
          approved: boolean
          created_at: string
          date: string
          employee_id: string
          holiday_minutes: number
          id: string
          night_minutes: number
          note: string | null
          overtime_minutes: number
          regular_minutes: number
          total_minutes: number
        }
        Insert: {
          approved?: boolean
          created_at?: string
          date: string
          employee_id: string
          holiday_minutes?: number
          id?: string
          night_minutes?: number
          note?: string | null
          overtime_minutes?: number
          regular_minutes?: number
          total_minutes?: number
        }
        Update: {
          approved?: boolean
          created_at?: string
          date?: string
          employee_id?: string
          holiday_minutes?: number
          id?: string
          night_minutes?: number
          note?: string | null
          overtime_minutes?: number
          regular_minutes?: number
          total_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_overtime_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_pay_group_items: {
        Row: {
          group_id: string
          id: string
          pay_item_id: string
        }
        Insert: {
          group_id: string
          id?: string
          pay_item_id: string
        }
        Update: {
          group_id?: string
          id?: string
          pay_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_pay_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "hr_pay_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_pay_group_items_pay_item_id_fkey"
            columns: ["pay_item_id"]
            isOneToOne: false
            referencedRelation: "hr_pay_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_pay_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      hr_pay_items: {
        Row: {
          created_at: string
          fixed_amount: number | null
          id: string
          is_active: boolean
          is_statutory: boolean
          name: string
          rate: number | null
          type: string
        }
        Insert: {
          created_at?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          is_statutory?: boolean
          name: string
          rate?: number | null
          type: string
        }
        Update: {
          created_at?: string
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          is_statutory?: boolean
          name?: string
          rate?: number | null
          type?: string
        }
        Relationships: []
      }
      hr_positions: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          level: number
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      hr_salary_step_history: {
        Row: {
          created_at: string
          created_by: string | null
          effective_date: string
          employee_id: string
          from_step_id: string | null
          id: string
          reason: string | null
          to_step_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_date: string
          employee_id: string
          from_step_id?: string | null
          id?: string
          reason?: string | null
          to_step_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          employee_id?: string
          from_step_id?: string | null
          id?: string
          reason?: string | null
          to_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_salary_step_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_salary_step_history_from_step_id_fkey"
            columns: ["from_step_id"]
            isOneToOne: false
            referencedRelation: "hr_salary_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_salary_step_history_to_step_id_fkey"
            columns: ["to_step_id"]
            isOneToOne: false
            referencedRelation: "hr_salary_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_salary_steps: {
        Row: {
          base_amount: number
          created_at: string
          id: string
          is_active: boolean
          step_name: string | null
          step_number: number
          updated_at: string
        }
        Insert: {
          base_amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          step_name?: string | null
          step_number: number
          updated_at?: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          step_name?: string | null
          step_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      hr_severance_records: {
        Row: {
          avg_daily_wage: number
          created_at: string
          employee_id: string
          id: string
          leave_date: string
          net_severance: number
          note: string | null
          service_years: number
          severance_pay: number
          tax_deducted: number
        }
        Insert: {
          avg_daily_wage: number
          created_at?: string
          employee_id: string
          id?: string
          leave_date: string
          net_severance: number
          note?: string | null
          service_years: number
          severance_pay: number
          tax_deducted?: number
        }
        Update: {
          avg_daily_wage?: number
          created_at?: string
          employee_id?: string
          id?: string
          leave_date?: string
          net_severance?: number
          note?: string | null
          service_years?: number
          severance_pay?: number
          tax_deducted?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_severance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training_attendees: {
        Row: {
          attended: boolean
          created_at: string
          employee_id: string
          id: string
          note: string | null
          training_id: string
        }
        Insert: {
          attended?: boolean
          created_at?: string
          employee_id: string
          id?: string
          note?: string | null
          training_id: string
        }
        Update: {
          attended?: boolean
          created_at?: string
          employee_id?: string
          id?: string
          note?: string | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_training_attendees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_training_attendees_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "hr_trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_trainings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          end_date: string
          hours: number
          id: string
          provider: string | null
          start_date: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          end_date: string
          hours?: number
          id?: string
          provider?: string | null
          start_date: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string
          hours?: number
          id?: string
          provider?: string | null
          start_date?: string
          title?: string
        }
        Relationships: []
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
          application_id: string | null
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
          application_id?: string | null
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
          application_id?: string | null
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
            foreignKeyName: "inventory_custom_orders_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
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
          application_id: string | null
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
          application_id?: string | null
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
          application_id?: string | null
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
            foreignKeyName: "inventory_reuse_dispatches_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
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
      notification_logs: {
        Row: {
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_id: string
          recipient: string | null
          response_code: number | null
          retry_count: number | null
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id: string
          recipient?: string | null
          response_code?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_id?: string
          recipient?: string | null
          response_code?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: string
          clerk_user_id: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          type_filter: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel: string
          clerk_user_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          type_filter?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          clerk_user_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          type_filter?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          clerk_user_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          link: string | null
          metadata: Json | null
          priority: number | null
          read_at: string | null
          status: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          clerk_user_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          link?: string | null
          metadata?: Json | null
          priority?: number | null
          read_at?: string | null
          status?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          clerk_user_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          link?: string | null
          metadata?: Json | null
          priority?: number | null
          read_at?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
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
      schedule_categories: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          address: string | null
          application_id: string | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          education_audience_label: string | null
          education_audience_type: string | null
          education_hours: number | null
          education_title: string | null
          education_type: string | null
          id: string
          is_web_visible: boolean
          notes: string | null
          participant_count: number | null
          reception_method: string | null
          schedule_type: string
          scheduled_date: string
          scheduled_time: string | null
          staff_id: string
          status: string | null
          updated_at: string | null
          visitor_org_name: string | null
          visitor_org_type: string | null
        }
        Insert: {
          address?: string | null
          application_id?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          education_audience_label?: string | null
          education_audience_type?: string | null
          education_hours?: number | null
          education_title?: string | null
          education_type?: string | null
          id?: string
          is_web_visible?: boolean
          notes?: string | null
          participant_count?: number | null
          reception_method?: string | null
          schedule_type: string
          scheduled_date: string
          scheduled_time?: string | null
          staff_id: string
          status?: string | null
          updated_at?: string | null
          visitor_org_name?: string | null
          visitor_org_type?: string | null
        }
        Update: {
          address?: string | null
          application_id?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          education_audience_label?: string | null
          education_audience_type?: string | null
          education_hours?: number | null
          education_title?: string | null
          education_type?: string | null
          id?: string
          is_web_visible?: boolean
          notes?: string | null
          participant_count?: number | null
          reception_method?: string | null
          schedule_type?: string
          scheduled_date?: string
          scheduled_time?: string | null
          staff_id?: string
          status?: string | null
          updated_at?: string | null
          visitor_org_name?: string | null
          visitor_org_type?: string | null
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
            foreignKeyName: "schedules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "schedule_categories"
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
      stats_promotion_activities: {
        Row: {
          activity_date: string | null
          content: string
          created_at: string | null
          event_attendees: number | null
          event_count: number | null
          event_type: string | null
          id: string
          media_count: number | null
          media_type: string | null
          notes: string | null
          other_count: number | null
          other_times: number | null
          other_type: string | null
          promo_material_count: number | null
          promo_material_type: string | null
          sort_order: number | null
          total_count: number | null
          year: number
        }
        Insert: {
          activity_date?: string | null
          content: string
          created_at?: string | null
          event_attendees?: number | null
          event_count?: number | null
          event_type?: string | null
          id?: string
          media_count?: number | null
          media_type?: string | null
          notes?: string | null
          other_count?: number | null
          other_times?: number | null
          other_type?: string | null
          promo_material_count?: number | null
          promo_material_type?: string | null
          sort_order?: number | null
          total_count?: number | null
          year: number
        }
        Update: {
          activity_date?: string | null
          content?: string
          created_at?: string | null
          event_attendees?: number | null
          event_count?: number | null
          event_type?: string | null
          id?: string
          media_count?: number | null
          media_type?: string | null
          notes?: string | null
          other_count?: number | null
          other_times?: number | null
          other_type?: string | null
          promo_material_count?: number | null
          promo_material_type?: string | null
          sort_order?: number | null
          total_count?: number | null
          year?: number
        }
        Relationships: []
      }
      stats_promotion_monthly: {
        Row: {
          blog_posts: number | null
          created_at: string | null
          facebook_posts: number | null
          homepage_posts: number | null
          hp_daily_avg: number | null
          hp_gallery: number | null
          hp_gov_support: number | null
          hp_monthly_avg: number | null
          hp_notice: number | null
          hp_online_inquiry: number | null
          hp_visitor_ratio: number | null
          hp_visitor_total: number | null
          id: string
          ig_follower_ratio: number | null
          ig_non_follower_ratio: number | null
          ig_online_inquiry: number | null
          ig_post: number | null
          ig_story: number | null
          ig_top_post: string | null
          ig_total_views: number | null
          instagram_posts: number | null
          kakao_posts: number | null
          month: number
          updated_at: string | null
          year: number
        }
        Insert: {
          blog_posts?: number | null
          created_at?: string | null
          facebook_posts?: number | null
          homepage_posts?: number | null
          hp_daily_avg?: number | null
          hp_gallery?: number | null
          hp_gov_support?: number | null
          hp_monthly_avg?: number | null
          hp_notice?: number | null
          hp_online_inquiry?: number | null
          hp_visitor_ratio?: number | null
          hp_visitor_total?: number | null
          id?: string
          ig_follower_ratio?: number | null
          ig_non_follower_ratio?: number | null
          ig_online_inquiry?: number | null
          ig_post?: number | null
          ig_story?: number | null
          ig_top_post?: string | null
          ig_total_views?: number | null
          instagram_posts?: number | null
          kakao_posts?: number | null
          month: number
          updated_at?: string | null
          year: number
        }
        Update: {
          blog_posts?: number | null
          created_at?: string | null
          facebook_posts?: number | null
          homepage_posts?: number | null
          hp_daily_avg?: number | null
          hp_gallery?: number | null
          hp_gov_support?: number | null
          hp_monthly_avg?: number | null
          hp_notice?: number | null
          hp_online_inquiry?: number | null
          hp_visitor_ratio?: number | null
          hp_visitor_total?: number | null
          id?: string
          ig_follower_ratio?: number | null
          ig_non_follower_ratio?: number | null
          ig_online_inquiry?: number | null
          ig_post?: number | null
          ig_story?: number | null
          ig_top_post?: string | null
          ig_total_views?: number | null
          instagram_posts?: number | null
          kakao_posts?: number | null
          month?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
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
      eval_grant_assessment_list: {
        Row: {
          assessment_month: number | null
          assessment_year: number | null
          birth_date: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          disability_grade: string | null
          disability_type: string | null
          evaluation_date: string | null
          final_result: string | null
          id: string | null
          item_categories: string[] | null
          item_count: number | null
          referral_org: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_grant_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
          application_month: number | null
          application_no: number | null
          application_year: number | null
          birth_date: string | null
          closed_at: string | null
          consultation_date: string | null
          disability_severity: string | null
          disability_type: string | null
          economic_status: string | null
          funding_source_detail: string | null
          gender: string | null
          info_provision_area: string | null
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
          monitoring_date: string | null
          name: string | null
          performance_date: string | null
          product_name: string | null
          received_at: string | null
          record_status: string | null
          referral_type: string | null
          region: string | null
          service_area: string | null
          service_category: string | null
          service_content: string | null
          service_major_category: string | null
          service_sub_category: string | null
          staff_name: string | null
          trial_device_count: number | null
        }
        Insert: {
          application_month?: number | null
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          closed_at?: string | null
          consultation_date?: string | null
          disability_severity?: string | null
          disability_type?: string | null
          economic_status?: string | null
          funding_source_detail?: string | null
          gender?: string | null
          info_provision_area?: string | null
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
          monitoring_date?: string | null
          name?: string | null
          performance_date?: string | null
          product_name?: string | null
          received_at?: string | null
          record_status?: string | null
          referral_type?: string | null
          region?: string | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          service_major_category?: string | null
          service_sub_category?: string | null
          staff_name?: string | null
          trial_device_count?: number | null
        }
        Update: {
          application_month?: number | null
          application_no?: number | null
          application_year?: number | null
          birth_date?: string | null
          closed_at?: string | null
          consultation_date?: string | null
          disability_severity?: string | null
          disability_type?: string | null
          economic_status?: string | null
          funding_source_detail?: string | null
          gender?: string | null
          info_provision_area?: string | null
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
          monitoring_date?: string | null
          name?: string | null
          performance_date?: string | null
          product_name?: string | null
          received_at?: string | null
          record_status?: string | null
          referral_type?: string | null
          region?: string | null
          service_area?: string | null
          service_category?: string | null
          service_content?: string | null
          service_major_category?: string | null
          service_sub_category?: string | null
          staff_name?: string | null
          trial_device_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_eval_service_records: { Args: never; Returns: number }
      sync_eval_service_record: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      sync_grant_eval_service_record: {
        Args: { p_grant_id: string }
        Returns: undefined
      }
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
