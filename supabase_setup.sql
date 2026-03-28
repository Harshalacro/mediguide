-- Run this in the Supabase SQL Editor to set up the MediGuide AI Storage

CREATE TABLE medical_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    risk_level TEXT,
    summary TEXT,
    results_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Turn on Row Level Security (RLS)
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own reports
CREATE POLICY "Users can insert their own reports" 
    ON medical_reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own reports
CREATE POLICY "Users can view their own reports" 
    ON medical_reports FOR SELECT 
    USING (auth.uid() = user_id);
