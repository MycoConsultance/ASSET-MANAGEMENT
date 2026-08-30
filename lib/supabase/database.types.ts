export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'INVESTOR' | 'STAFF' | 'PARTNER_VENDOR'
export type PropertyPhase = 
  | 'ACQUISTO_DEAL'
  | 'POST_ROGITO'
  | 'VALORISTRUTTURAZIONE'
  | 'GESTIONE_LOCAZIONE'
  | 'MANUTENZIONE_CARE'
  | 'REVIEW_EXIT'

export type PartnerRole = 
  | 'AGENTE' 
  | 'NOTAIO' 
  | 'BROKER' 
  | 'ARCHITETTO' 
  | 'IMPRESA_EDILE' 
  | 'MANUTENTORE' 
  | 'ASSICURATORE'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
      }
      properties: {
        Row: {
          id: string
          investor_id: string
          title: string
          address: string
          city: string
          current_phase: PropertyPhase
          phase_progress: number
          purchase_price: number
          current_market_value: number
          monthly_rent_target: number
          total_invested_capital: number
          financial_details: Json
          created_at: string
          updated_at: string
        }
      }
      partner_access_tokens: {
        Row: {
          id: string
          property_id: string
          partner_email: string
          partner_name: string | null
          partner_role: PartnerRole
          token: string
          expires_at: string
          used_at: string | null
          created_at: string
        }
      }
      property_documents: {
        Row: {
          id: string
          property_id: string
          phase: PropertyPhase
          title: string
          file_path: string
          file_size: number | null
          uploaded_by_partner_token: string | null
          uploaded_by_user_id: string | null
          created_at: string
        }
      }
    }
  }
}
