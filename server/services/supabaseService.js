import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let warnedDisabled = false;

function serviceError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return null;

  supabaseClient = createClient(url, key);
  return supabaseClient;
}

function warnDisabledOnce() {
  if (warnedDisabled) return;
  warnedDisabled = true;
  console.warn('[supabase] SUPABASE_URL or SUPABASE_ANON_KEY is missing, persistence is disabled.');
}

export async function saveStockAnalysis({ symbol, stockData, analysis }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    warnDisabledOnce();
    return;
  }
  const { error } = await supabase.from('stock_analyses').insert({
    symbol,
    stock_data: stockData,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    risk_level: analysis.risk_level,
  });

  if (error) throw serviceError(`Supabase insert failed: ${error.message}`, 502);
}

export async function getRecentAnalyses() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    warnDisabledOnce();
    return [];
  }
  const { data, error } = await supabase
    .from('stock_analyses')
    .select('id,symbol,summary,sentiment,risk_level,created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw serviceError(`Supabase query failed: ${error.message}`, 502);
  return data || [];
}
