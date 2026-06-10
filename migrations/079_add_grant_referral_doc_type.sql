-- Migration: 079_add_grant_referral_doc_type
-- App: approval + eval
-- Created: 2026-06-10
-- Purpose: 교부사업 접수공문 결재 타입 추가

-- approval_documents.type CHECK 제약에 'grant_referral' 추가
ALTER TABLE approval_documents
  DROP CONSTRAINT IF EXISTS approval_documents_type_check;

ALTER TABLE approval_documents
  ADD CONSTRAINT approval_documents_type_check
  CHECK (type IN (
    'expenditure',
    'leave',
    'business_report',
    'rental',
    'custom_make',
    'reuse',
    'grant_referral'
  ));
