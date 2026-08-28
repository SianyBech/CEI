import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import pg from 'pg';
import { randomUUID } from 'crypto';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import fetch from 'node-fetch';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getUserRole, hasPermission } from './auth.js';
import { fileURLToPath } from 'url';
import { resumirQualquerDocumento, resumirTextoSimples } from './aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extrai o Pool de dentro do pacote 'pg' em ES Modules
const { Pool } = pg;

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const rootPath = path.resolve(__dirname);
const storageRoot = process.env.STORAGE_PATH ? path.resolve(process.env.STORAGE_PATH) : path.join(rootPath, 'storage');
const tempDir = path.join(storageRoot, 'tmp');


function getResponsavel(user) {
    if (!user) return 'Equipe CEI';

    // 1. Tenta pegar o nome direto dos metadados da conta (cadastrado pelo admin)
    if (user.user_metadata && user.user_metadata.nome) {
        return user.user_metadata.nome;
    }

    // 2. Se por acaso não tiver nome (conta muito antiga), usa o pedaço antes do @ do e-mail
    if (user.email) {
        return user.email.split('@')[0];
    }

    return 'Equipe CEI';
}

fs.mkdirSync(tempDir, { recursive: true });

let pool = null;
let dbReady = false;
let supabaseClient = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_ANON_KEY || supabaseServiceRoleKey;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'evidencias';

const dbClient = {
  async query(text, params = []) {
    if (!dbReady || !pool) {
      throw new Error('Banco PostgreSQL não inicializado.');
    }

    return pool.query(text, params);
  },

  async many(text, params = []) {
    const result = await this.query(text, params);
    return result.rows;
  },

  async one(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  },

  async run(text, params = []) {
    const result = await this.query(text, params);
    return { rowCount: result.rowCount, rows: result.rows };
  }
};

function buildPostgresConfig() {
  const ssl = process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false };

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl };
  }

  return {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    ssl
  };
}

async function initPostgresPool() {
  const config = buildPostgresConfig();
  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('[DB] Erro inesperado no pool do PostgreSQL:', err);
  });

  try {
    await pool.query('SELECT 1');
    console.log('[DB] Conectado ao PostgreSQL.');
  } catch (error) {
    console.error('[DB] Falha ao conectar ao PostgreSQL:', error);
    throw error;
  }

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.evidences (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "titulo" text,
      "nome" text NOT NULL,
      "tipo" text,
      "data" text,
      "evento" text,
      "categoria" text,
      "categorias" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "responsavel" text,
      "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "resumo" text,
      "textoExtraido" text,
      "caminhoArquivo" text,
      "criadoEm" text NOT NULL
    )
  `;

  try {
    await pool.query(createTableSQL);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_evidences_tags ON public.evidences USING gin ("tags")');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "storage_path" text');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "storage_filename" text');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "original_filename" text');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "mime_type" text');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "file_size" bigint');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "created_by" text');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "updated_by" text');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "created_at" timestamptz');
    await pool.query('ALTER TABLE public.evidences ADD COLUMN IF NOT EXISTS "updated_at" timestamptz');
    await pool.query('UPDATE public.evidences SET "original_filename" = COALESCE("original_filename", "nome") WHERE "original_filename" IS NULL');
    await pool.query('UPDATE public.evidences SET "storage_filename" = COALESCE("storage_filename", "nome") WHERE "storage_filename" IS NULL');
    await pool.query('UPDATE public.evidences SET "mime_type" = COALESCE("mime_type", CASE WHEN "tipo" = \'pdf\' THEN \'application/pdf\' ELSE \'application/octet-stream\' END) WHERE "mime_type" IS NULL');
    await pool.query('UPDATE public.evidences SET "file_size" = COALESCE("file_size", 0) WHERE "file_size" IS NULL');
    await pool.query('UPDATE public.evidences SET "created_at" = COALESCE("created_at", NOW()) WHERE "created_at" IS NULL');
    await pool.query('UPDATE public.evidences SET "updated_at" = COALESCE("updated_at", "created_at") WHERE "updated_at" IS NULL');

       await pool.query(`
      UPDATE public.evidences 
      SET "categorias" = jsonb_build_array("categoria") 
      WHERE ("categorias" IS NULL OR "categorias" = '[]'::jsonb) 
        AND "categoria" IS NOT NULL AND "categoria" != ''
    `);

    const defaultCategories = ['Capacitação', 'Planejamento', 'Gestão', 'Assessoria', 'Sustentabilidade', 'Qualificação'];
    const defaultTags = ['CERNE', 'Gestão', 'Capacitação', 'Assessoria', 'Sustentabilidade', 'Qualificação', 'Ata', 'Reunião', 'Workshop', 'Contrato', 'Relatório', 'Certificado'];

    await ensureAppSetting(pool, 'categories', defaultCategories);
    await ensureAppSetting(pool, 'tags', defaultTags);

    dbReady = true;
    console.log('[DB] Tabela public.evidences pronta.');
  } catch (error) {
    console.error('[DB] Erro ao criar a tabela evidences:', error);
    throw error;
  }
}

const upload = multer({
  dest: tempDir,
  limits: { fileSize: 30 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeType = (file.mimetype || '').toLowerCase();

    if (isForbiddenFile(file.originalname, mimeType)) {
      return cb(new Error('Tipo de arquivo não permitido por segurança.'));
    }

    cb(null, true);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// 1. Serve arquivos estáticos da raiz e da pasta 'src' (se houver scripts lá)
app.use(express.static(rootPath));
app.use('/src', express.static(path.join(rootPath, 'src')));

// 2. Rota explícita para entregar a página inicial (index.html) do CEI/UFRGS
app.get('/', (req, res) => {
  res.sendFile(path.join(rootPath, 'index.html'));
});

function buildDownloadUrl(req, evidenceId) {
  return `/api/file/${encodeURIComponent(evidenceId)}`;
}

function sanitizeFileName(fileName) {
  const baseName = path.basename(fileName || 'arquivo');
  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'arquivo';
}

async function extractTextFromLink(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Servidor respondeu com status ${response.status}`);
    
    const html = await response.text();

    // 1. TENTA CAPTURAR A LEGENDA VIA META TAG (Ideal para Instagram, LinkedIn e Twitter/X)
    const ogDescMatch = 
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

    if (ogDescMatch && ogDescMatch[1]) {
      const ogText = ogDescMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();

      if (ogText.length > 30) {
        console.log('[SCRAPER] Legenda capturada com sucesso via Meta Tag Open Graph!');
        return ogText;
      }
    }

    // 2. FALLBACK PADRÃO PARA PÁGINAS WEB TRADICIONAIS
    const cleanText = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, ' ')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    return cleanText.substring(0, 15000); 
  } catch (error) {
    console.error('[SCRAPER] Erro ao extrair texto do link:', error.message);
    return 'Conteúdo da web indisponível para leitura automática, mas o link foi salvo com sucesso.';
  }
}

async function ensureAppSetting(poolInstance, key, defaultValue) {
  const result = await poolInstance.query('SELECT 1 FROM public.app_settings WHERE key = $1 LIMIT 1', [key]);
  if (result.rowCount === 0) {
    await poolInstance.query('INSERT INTO public.app_settings (key, value) VALUES ($1, $2)', [key, JSON.stringify(defaultValue)]);
  }
}

async function getAppSetting(key, fallback = []) {
  const result = await pool.query('SELECT value FROM public.app_settings WHERE key = $1 LIMIT 1', [key]);
  if (!result || result.rowCount === 0) {
    return fallback;
  }

  try {
    const parsed = result.rows[0].value;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

async function setAppSetting(key, value) {
  const normalized = Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
  await pool.query(
    'INSERT INTO public.app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    [key, JSON.stringify(normalized)]
  );
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? normalizeTags(parsed) : [];
    } catch (error) {
      return [];
    }
  }

  if (value && typeof value === 'object') {
    return normalizeTags(Array.isArray(value) ? value : Object.values(value));
  }

  return [];
}

function normalizeCategories(value, fallbackCategory = 'Geral') {
  if (Array.isArray(value)) {
    const list = value
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim());
    if (list.length > 0) return list;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeCategories(parsed, fallbackCategory);
    } catch (e) {
      return [value.trim()];
    }
    return [value.trim()];
  }
  return fallbackCategory ? [fallbackCategory] : ['Geral'];
}

function serializeRow(row, req) {
  if (!row) return null;

   const categoriesList = normalizeCategories(row.categorias, row.categoria);

  return {
    id: row.id,
    titulo: row.titulo || row.nome,
    nome: row.nome,
    tipo: row.tipo,
    data: row.data,
    evento: row.evento,
    categoria: categoriesList[0] || row.categoria || 'Geral', // Mantém retrocompatibilidade
    categorias: categoriesList,                               // Novo campo com array
    responsavel: row.responsavel,
    tags: normalizeTags(row.tags),
    resumo: row.resumo,
    textoExtraido: row.textoExtraido,
    caminhoArquivo: row.caminhoArquivo,
    storagePath: row.storage_path || null,
    storageFilename: row.storage_filename || null,
    originalFilename: row.original_filename || row.nome || null,
    mimeType: row.mime_type || null,
    fileSize: row.file_size || null,
    link: row.link || null,
    criadoEm: row.criadoEm,
    downloadUrl: buildDownloadUrl(req, row.id)
  };
}

function getFileExtension(fileName = '') {
  return path.extname(fileName || '').slice(1).toLowerCase();
}

function getMimeType(fileName = '', fallback = 'application/octet-stream') {
  const extension = getFileExtension(fileName);
  const map = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain'
  };

  return map[extension] || fallback;
}

const forbiddenExtensions = new Set(['exe', 'dll', 'bat', 'cmd', 'com', 'msi', 'apk', 'sh', 'ps1', 'scr']);

function isForbiddenFile(fileName = '', mimeType = '') {
  const extension = getFileExtension(fileName);
  const normalizedMime = String(mimeType || '').toLowerCase();
  const dangerousMimeTypes = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-msi',
    'application/x-ms-shortcut',
    'application/x-dosexec'
  ];

  return forbiddenExtensions.has(extension) || dangerousMimeTypes.includes(normalizedMime);
}

function sanitizeStoragePathSegment(value = '') {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80) || 'arquivo';
}

function buildStoragePath(fileName = '') {
  const safeBaseName = sanitizeStoragePathSegment(path.basename(fileName || 'arquivo'));
  const extension = path.posix.extname(safeBaseName).toLowerCase();
  const safeExtension = extension && extension.length <= 8 ? extension : '';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const objectName = `${Date.now()}-${randomUUID().replace(/-/g, '')}${safeExtension}`;
  const normalizedPath = `${objectName}`
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');

  return normalizedPath;
}

function getSupabaseClient() {
  if (!supabaseClient && supabaseUrl && supabaseServiceRoleKey) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseClient;
}

function getSupabaseAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.split(';').reduce((accumulator, rawCookie) => {
    const [name, ...rest] = rawCookie.trim().split('=');
    if (!name) return accumulator;
    accumulator[name] = decodeURIComponent(rest.join('='));
    return accumulator;
  }, {});
}

function setSessionCookies(res, session) {
  if (!session?.access_token) {
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction
  };

  res.cookie('sb-access-token', session.access_token, cookieOptions);
  if (session.refresh_token) {
    res.cookie('sb-refresh-token', session.refresh_token, cookieOptions);
  }
}

function clearSessionCookies(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction
  };

  res.cookie('sb-access-token', '', { ...cookieOptions, maxAge: 0 });
  res.cookie('sb-refresh-token', '', { ...cookieOptions, maxAge: 0 });
}

async function authenticateRequest(req, res) {
  const cookies = parseCookies(req);
  const accessToken = cookies['sb-access-token'];
  const refreshToken = cookies['sb-refresh-token'];

  if (!accessToken) {
    return null;
  }

  const client = getSupabaseAuthClient();
  if (!client) {
    return null;
  }

  try {
    const sessionPayload = refreshToken ? { access_token: accessToken, refresh_token: refreshToken } : { access_token: accessToken };
    const { data: sessionData, error: sessionError } = await client.auth.setSession(sessionPayload);

    if (sessionError && refreshToken) {
      const { data: refreshedSession, error: refreshError } = await client.auth.refreshSession({ refresh_token: refreshToken });
      if (refreshError || !refreshedSession?.session?.access_token) {
        clearSessionCookies(res);
        return null;
      }

      setSessionCookies(res, refreshedSession.session);
      return { user: refreshedSession.user || null, session: refreshedSession.session };
    }

    if (sessionData?.session?.access_token) {
      setSessionCookies(res, sessionData.session);
    }

    const { data: userData, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      clearSessionCookies(res);
      return null;
    }

    return { user: userData.user, session: sessionData?.session || null };
  } catch (error) {
    console.error('[AUTH] Falha ao validar sessão:', error);
    clearSessionCookies(res);
    return null;
  }
}

function requirePermission(permission = 'view') {
  return async function authMiddleware(req, res, next) {
    const authContext = await authenticateRequest(req, res);
    if (!authContext?.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    req.user = authContext.user;
    req.userRole = getUserRole(authContext.user);
    req.permissions = [req.userRole];

    console.log(`[AUTH] role=${req.userRole} permission=${permission} email=${authContext.user?.email || 'sem-email'}`);

    if (!hasPermission(authContext.user, permission)) {
      console.warn(`[AUTH] Bloqueado role=${req.userRole} permission=${permission} email=${authContext.user?.email || 'sem-email'}`);
      return res.status(403).json({ error: 'Permissão insuficiente.' });
    }

    next();
  };
}

async function attachAuthContext(req, res, next) {
  const authContext = await authenticateRequest(req, res);
  if (authContext?.user) {
    req.user = authContext.user;
    req.userRole = getUserRole(authContext.user);
    req.permissions = [req.userRole];
  }

  next();
}

async function uploadFileToSupabase(filePath, storagePath, originalName, mimeType) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Configuração do Supabase Storage indisponível.');
  }

console.log('[SUPABASE] Bucket:', supabaseBucket);
console.log('[SUPABASE] Storage path:', storagePath);
console.log('[SUPABASE] File path:', filePath);

  const fileBuffer = await fs.promises.readFile(filePath);
  const { data, error } = await client.storage.from(supabaseBucket).upload(storagePath, fileBuffer, {
    contentType: mimeType || getMimeType(originalName),
    upsert: false,
    cacheControl: '3600'
  });

  if (error) {
    throw error;
  }

  return data;
}

async function createSignedUrl(storagePath) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Configuração do Supabase Storage indisponível.');
  }

  const { data, error } = await client.storage.from(supabaseBucket).createSignedUrl(storagePath, 60 * 60);
  if (error) {
    throw error;
  }

  return data?.signedUrl || null;
}

async function deleteFileFromSupabase(storagePath) {
  const client = getSupabaseClient();
  if (!client || !storagePath) {
    return;
  }

  const { error } = await client.storage.from(supabaseBucket).remove([storagePath]);
  if (error) {
    console.error('[UPLOAD] Falha ao remover arquivo do Supabase Storage:', error);
  }
}

async function removeTemporaryFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.rm(filePath, { force: true });
    }
  } catch (error) {
    console.error('[UPLOAD] Falha ao remover arquivo temporário:', error);
  }
}

async function moveFile(sourcePath, destinationPath) {
  try {
    await fs.promises.rename(sourcePath, destinationPath);
  } catch (error) {
    if (error.code === 'EXDEV') {
      await fs.promises.copyFile(sourcePath, destinationPath);
      await fs.promises.unlink(sourcePath);
      return;
    }

    throw error;
  }
}

async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
    console.error('[OCR] Erro ao extrair texto de DOCX:', error);
    return '';
  }
}

function extractTextFromPptx(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const slides = zip.getEntries().filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'));
    return slides
      .map((entry) => entry.getData().toString('utf8'))
      .join('\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('[OCR] Erro ao extrair texto de PPTX:', error);
    return '';
  }
}

async function extractText(filePath, extension) {
  const buffer = await fs.promises.readFile(filePath);

  if (extension === 'pdf') {
    try {
      const data = await pdfParse(buffer);
      return (data.text || '').trim();
    } catch (error) {
      console.error('[OCR] Erro ao processar PDF:', error);
      return '';
    }
  }

  if (['png', 'jpg', 'jpeg'].includes(extension)) {
    try {
      const result = await Tesseract.recognize(buffer, 'por', { logger: () => {} });
      if (result && result.data && typeof result.data.text === 'string') {
        return result.data.text.trim();
      }
      return '';
    } catch (error) {
      console.error('[OCR] Erro ao processar imagem:', error);
      return '';
    }
  }

  if (extension === 'docx') {
    return (await extractTextFromDocx(filePath)).trim();
  }

  if (extension === 'pptx') {
    return extractTextFromPptx(filePath).trim();
  }

  return '';
}

async function generateMetadata(tempPath, originalName, extension, dbCategories, dbTags) {
  const extensoesSuportadas = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'pptx', 'xlsx', 'xls', 'txt'];

  if (!extensoesSuportadas.includes(extension)) {
    return {
      titulo: originalName,
      evento: 'Registro Interno',
      resumo: 'Formato não suportado para processamento automático de texto pela IA.',
      categoriasSugeridas: [],
      tagsSugeridas: [],
      textoExtraido: ''
    };
  }

try {
    // AQUI ESTÁ A CORREÇÃO: Passando o "extension" como segundo argumento!
    const resultado = await resumirQualquerDocumento(tempPath, extension, dbCategories, dbTags);
    return resultado;
  } catch (err) {
    // Agora, se der erro, você vai ver o motivo real no terminal do servidor!
    console.error('[ERRO IA] Falha ao processar arquivo:', err.message);

    return {
      titulo: originalName,
      evento: 'Sem Evento',
      resumo: 'Não foi possível extrair texto ou gerar o resumo automático para este arquivo.',
      categoriasSugeridas: [],
      tagsSugeridas: [],
      textoExtraido: ''
    };
  }
}

// ==========================================================================
// ROTAS DE GERENCIAMENTO DE MEMBROS DA EQUIPE CEI
// ==========================================================================

// 1. GET: Busca e lista todos os membros cadastrados no banco de dados
app.get('/api/admin/users', requirePermission('view'), async (req, res) => {
  try {
    const rows = await dbClient.many(`
      SELECT "id", "nome", "email", "cargo", "role", "created_at"
      FROM public.usuarios 
      ORDER BY "nome" ASC
    `);
    res.json(rows || []);
  } catch (error) {
    console.error('[ADMIN] Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar membros da equipe.' });
  }
});

// 2. POST: Cadastra um novo membro via Supabase Admin SDK e atualiza perfil
app.post('/api/admin/users', requirePermission('settings'), async (req, res) => {
  try {
    const { email, password, nome, cargo, role } = req.body;

    if (!email || !password || !nome) {
      return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' });
    }

    const client = getSupabaseClient(); // Usa a service_role key
    if (!client) {
      return res.status(500).json({ error: 'Cliente Supabase Admin indisponível.' });
    }

    // Cria o usuário na Auth do Supabase
    const { data: authUser, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Já confirma o e-mail automaticamente
      user_metadata: { nome, cargo }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Atualiza/Garante o registro na tabela public.usuarios
    await dbClient.run(`
      INSERT INTO public.usuarios ("id", "email", "nome", "cargo", "role")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("id") DO UPDATE 
      SET "nome" = EXCLUDED."nome", "cargo" = EXCLUDED."cargo", "role" = EXCLUDED."role"
    `, [authUser.user.id, email, nome, cargo || 'Analista CEI', role || 'membro']);

    res.json({ success: true, user: authUser.user });
  } catch (error) {
    console.error('[ADMIN] Erro ao criar usuário:', error);
    res.status(500).json({ error: error.message || 'Erro ao cadastrar usuário.' });
  }
});

app.delete('/api/admin/users/:id', requirePermission('settings'), async (req, res) => {
  try {
    const { id } = req.params;

    // Regra de segurança: impede que o admin exclua a si mesmo
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta de administrador.' });
    }

    // 1. Tenta remover do Supabase Auth em bloco isolado
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.admin.deleteUser(id);
      } catch (authErr) {
        console.warn('[ADMIN] Usuário não encontrado no Supabase Auth:', authErr.message);
      }
    }

    // 2. Tenta remover da tabela public.usuarios (pode já ter sido removido por CASCADE)
    await dbClient.run(`DELETE FROM public.usuarios WHERE "id" = $1`, [id]);

    // Retorna sucesso independente de rowCount ser 0 ou 1, pois o usuário não está mais lá!
    return res.json({ success: true, message: 'Membro removido com sucesso.' });
    
  } catch (error) {
    console.error('[ADMIN] Erro ao excluir membro:', error);
    return res.status(500).json({ error: 'Falha ao remover o membro do banco de dados.' });
  }
});

// No seu server.js, atualize a rota PATCH de usuários:
app.patch('/api/admin/users/:id', requirePermission('settings'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cargo, role } = req.body; // <--- ADICIONAMOS role AQUI

    if (!nome || !cargo) {
      return res.status(400).json({ error: 'Nome e cargo são obrigatórios.' });
    }

    // 1. Atualiza no PostgreSQL incluindo a coluna role
    const result = await dbClient.run(`
      UPDATE public.usuarios 
      SET "nome" = $1, "cargo" = $2, "role" = $3
      WHERE "id" = $4
    `, [nome, cargo, role || 'membro', id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }

    // 2. Atualiza os metadados silenciosamente no Supabase Auth
    const client = getSupabaseClient();
    if (client) {
      await client.auth.admin.updateUserById(id, { user_metadata: { nome, cargo } }).catch(() => {});
    }

    return res.json({ success: true, message: 'Dados atualizados com sucesso.' });
  } catch (error) {
    console.error('[ADMIN] Erro ao atualizar membro:', error);
    return res.status(500).json({ error: 'Falha ao atualizar o membro.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const client = getSupabaseAuthClient();
    if (!client) {
      return res.status(500).json({ error: 'Configuração do Supabase Auth indisponível.' });
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data?.session?.access_token) {
      return res.status(401).json({ error: error?.message || 'Credenciais inválidas.' });
    }

    setSessionCookies(res, data.session);
    return res.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('[AUTH] Erro no login:', error);
    return res.status(500).json({ error: error.message || 'Falha ao autenticar.' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  clearSessionCookies(res);
  return res.json({ success: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Informe seu e-mail.' });
    }

    const client = getSupabaseAuthClient();
    if (!client) {
      return res.status(500).json({ error: 'Configuração do Supabase Auth indisponível.' });
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/`
    });

    if (error) {
      return res.status(400).json({ error: error.message || 'Falha ao recuperar a senha.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Erro na recuperação de senha:', error);
    return res.status(500).json({ error: error.message || 'Falha ao recuperar a senha.' });
  }
});

app.post('/api/auth/change-password', requirePermission('view'), async (req, res) => {
  try {
    const { newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const client = getSupabaseClient();
    if (!client) {
      return res.status(500).json({ error: 'Serviço de autenticação indisponível.' });
    }

    // Atualiza a senha do usuário autenticado no Supabase Auth
    const { error } = await client.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ error: error.message || 'Falha ao alterar senha.' });
    }

    return res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('[AUTH] Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro interno ao alterar senha.' });
  }
});



app.get('/api/auth/session', async (req, res) => {
  const authContext = await authenticateRequest(req, res);
  if (!authContext?.user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  return res.json({ user: authContext.user, session: authContext.session });
});

app.use(attachAuthContext);

app.get('/api/evidences', requirePermission('view'), async (req, res, next) => {
  try {
    console.log('[EVIDENCES] Buscando evidências...');
    const rows = await dbClient.many(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "categorias", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "link", "criadoEm" FROM public.evidences ORDER BY "criadoEm" DESC`);
    res.json((rows || []).map((row) => serializeRow(row, req)));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao buscar evidências:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar evidências.' });
  }
});

app.get('/api/evidences/:id', requirePermission('view'), async (req, res, next) => {
  try {
    const row = await dbClient.one(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "categorias", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "link", "criadoEm" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!row) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    res.json(serializeRow(row, req));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao buscar evidência:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar evidência.' });
  }
});

app.get('/api/settings', requirePermission('settings'), async (req, res, next) => {
  try {
    const categories = await getAppSetting('categories', ['Capacitação', 'Planejamento', 'Gestão', 'Assessoria', 'Sustentabilidade', 'Qualificação']);
    const tags = await getAppSetting('tags', ['CERNE', 'Gestão', 'Capacitação', 'Assessoria', 'Sustentabilidade', 'Qualificação']);
    res.json({ categories, tags });
  } catch (error) {
    console.error('[SETTINGS] Erro ao buscar configurações:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar configurações.' });
  }
});

// ==========================================================================
// ROTAS DE PERFIL E CONFIGURAÇÕES DO USUÁRIO CEI (ADICIONAR AQUI)
// ==========================================================================

// GET: Busca os dados do usuário autenticado no Supabase
app.get('/api/user/profile', requirePermission('view'), async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    let user = null;

    // 1. Tenta buscar o usuário no banco sem estourar exceção se ele não existir
    try {
      const result = await dbClient.query(
        `SELECT "id", "nome", "email", "cargo", "role", "configuracoes" FROM public.usuarios WHERE "id" = $1`,
        [userId]
      );
      user = result.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : result);
    } catch (dbQueryErr) {
      console.warn('[PROFILE] Tabela public.usuarios inacessível ou incompleta:', dbQueryErr.message);
    }

    // 2. Fallback: Se o usuário não existir no banco local, tenta cadastrar o registro inicial
    if (!user) {
      const email = req.user.email || '';
      const nome = req.user.user_metadata?.nome || req.user.user_metadata?.full_name || email.split('@')[0] || 'Usuário CEI';
      const cargo = req.user.user_metadata?.cargo || 'Analista CEI';

      try {
        await dbClient.query(
          `INSERT INTO public.usuarios ("id", "email", "nome", "cargo") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [userId, email, nome, cargo]
        );

        const result = await dbClient.query(
          `SELECT "id", "nome", "email", "cargo", "role", "configuracoes" FROM public.usuarios WHERE "id" = $1`,
          [userId]
        );
        user = result.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : result);
      } catch (insertErr) {
        console.warn('[PROFILE] Não foi possível inserir usuário local:', insertErr.message);
      }
    }

    // 3. Resposta consolidada com valores padrão seguros
    return res.json({
      id: userId,
      nome: user?.nome || req.user.user_metadata?.nome || req.user.email?.split('@')[0] || 'Usuário CEI',
      email: user?.email || req.user.email || '',
      cargo: user?.cargo || 'Analista CEI',
      role: user?.role || req.user.role || 'membro',
      configuracoes: user?.configuracoes || { defaultView: 'table', itemsPerPage: 8 }
    });

  } catch (error) {
    console.error('[PROFILE] Erro inesperado ao buscar perfil:', error);
    
    // Resposta de emergência: impede que o front-end receba 500 e trave a interface
    return res.json({
      id: req.user?.id || 'unknown',
      nome: req.user?.email?.split('@')[0] || 'Usuário CEI',
      email: req.user?.email || '',
      cargo: 'Analista CEI',
      role: 'membro',
      configuracoes: { defaultView: 'table', itemsPerPage: 8 }
    });
  }
});

// PATCH: Atualiza o nome, cargo e configurações visuais do usuário
app.patch('/api/user/profile', requirePermission('view'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { nome, cargo, configuracoes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    await dbClient.run(
      `UPDATE public.usuarios 
       SET "nome" = COALESCE($1, "nome"),
           "cargo" = COALESCE($2, "cargo"),
           "configuracoes" = COALESCE($3::jsonb, "configuracoes")
       WHERE "id" = $4`,
      [
        nome || null,
        cargo || null,
        configuracoes ? JSON.stringify(configuracoes) : null,
        userId
      ]
    );

    const updatedUser = await dbClient.one(
      `SELECT "id", "nome", "email", "cargo", "role", "configuracoes" FROM public.usuarios WHERE "id" = $1`,
      [userId]
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('[PROFILE] Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações do usuário.' });
  }
});

app.patch('/api/settings', requirePermission('settings'), async (req, res, next) => {
  try {
    const { categories, tags } = req.body;
    if (categories === undefined && tags === undefined) {
      return res.status(400).json({ error: 'É necessário enviar categories ou tags.' });
    }

    if (categories !== undefined) {
      await setAppSetting('categories', normalizeStringArray(categories));
    }
    if (tags !== undefined) {
      await setAppSetting('tags', normalizeStringArray(tags));
    }

    const updatedCategories = await getAppSetting('categories', []);
    const updatedTags = await getAppSetting('tags', []);
    res.json({ categories: updatedCategories, tags: updatedTags });
  } catch (error) {
    console.error('[SETTINGS] Erro ao atualizar configurações:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar configurações.' });
  }
});

app.get('/api/file/:id', requirePermission('view'), async (req, res, next) => {
  try {
    const row = await dbClient.one(`SELECT "storage_path", "storage_filename", "original_filename" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!row || !row.storage_path) {
      return res.status(404).send('Arquivo não encontrado.');
    }

    const signedUrl = await createSignedUrl(row.storage_path);
    if (!signedUrl) {
      return res.status(500).send('Erro ao gerar link temporário.');
    }

    return res.redirect(signedUrl);
  } catch (error) {
    console.error('[FILE] Erro ao buscar arquivo:', error);
    res.status(500).send('Erro ao buscar arquivo.');
  }
});

app.get('/api/preview/:id', requirePermission('view'), async (req, res, next) => {
  try {
    const row = await dbClient.one(`SELECT "storage_path", "original_filename" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!row || !row.storage_path) {
      return res.status(404).send('Arquivo não encontrado.');
    }

    const signedUrl = await createSignedUrl(row.storage_path);
    if (!signedUrl) {
      return res.status(500).send('Erro ao gerar link temporário.');
    }

    return res.redirect(signedUrl);
  } catch (error) {
    console.error('[PREVIEW] Erro ao abrir preview:', error);
    res.status(500).send('Erro ao abrir preview do arquivo.');
  }
});

app.patch('/api/evidences/:id', requirePermission('edit'), async (req, res, next) => {
  try {
    const { titulo, evento, categorias, categoria, responsavel, tags, resumo, data } = req.body;

    if (!titulo || !evento || !responsavel || !Array.isArray(tags) || !resumo || !data) {
      return res.status(400).json({ error: 'Dados incompletos para atualização de metadados.' });
    }

    const categoriesList = normalizeCategories(categorias, categoria);

    const primaryCategory = categoriesList[0] || 'Geral';

    const tagsList = normalizeTags(tags);

    const result = await dbClient.run(`
      UPDATE public.evidences 
      SET "titulo" = $1, 
          "evento" = $2, 
          "categoria" = $3, 
          "categorias" = $4::jsonb, 
          "responsavel" = $5, 
          "tags" = $6::jsonb, 
          "resumo" = $7, 
          "data" = $8 
      WHERE "id" = $9
    `, [
      titulo,
      evento,
      primaryCategory,
      JSON.stringify(categoriesList),
      responsavel,
      JSON.stringify(tagsList),
      resumo,
      data,
      req.params.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    const updatedRow = await dbClient.one(`
      SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "categorias", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "criadoEm"
      FROM public.evidences WHERE "id" = $1
    `, [req.params.id]);

    res.json(serializeRow(updatedRow, req));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao atualizar evidência:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar metadados.' });
  }
});

app.delete('/api/evidences/:id', requirePermission('delete'), async (req, res, next) => {
  try {
    const evidenceRow = await dbClient.one(`SELECT "storage_path" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!evidenceRow) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    // Delete file from Supabase Storage if it exists
    if (evidenceRow.storage_path) {
      await deleteFileFromSupabase(evidenceRow.storage_path);
      console.log(`[DELETE] Arquivo removido do Supabase: ${evidenceRow.storage_path}`);
    }

    // Delete record from database
    const result = await dbClient.run(`DELETE FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    console.log(`[DELETE] Evidência excluída: ${req.params.id}`);
    res.json({ success: true, message: 'Evidência excluída com sucesso.' });
  } catch (error) {
    console.error('[EVIDENCES] Erro ao excluir evidência:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir evidência.' });
  }
});

app.post('/api/upload', requirePermission('upload'), (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    // 1. Tratamento de erros iniciais (Multer)
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'O tamanho máximo permitido é de 30 MB.' });
      }
      if (err.message === 'Tipo de arquivo não permitido por segurança.') {
        return res.status(400).json({ error: 'Tipo de arquivo não permitido por segurança.' });
      }
      console.error('[UPLOAD] Erro ao processar multipart:', err);
      return res.status(400).json({ error: 'Erro ao receber os dados enviados.' });
    }

    // 2. Validação: Exige obrigatoriamente um arquivo OU um link
    const linkEnviado = req.body.link ? req.body.link.trim() : null;
    if (!req.file && !linkEnviado) {
      return res.status(400).json({ error: 'Envie um arquivo ou cole um link válido.' });
    }

    try {
      // 3. Preparação das variáveis consolidadas (usadas por ambos os fluxos)
      const responsavel = getResponsavel(req.user);
      const createdAt = new Date().toISOString();
      let dbCategories = [];
      let dbTags = [];
      
      try {
        dbCategories = await getAppSetting('categories', ['Capacitação', 'Planejamento', 'Gestão', 'Assessoria', 'Sustentabilidade', 'Qualificação']);
        dbTags = await getAppSetting('tags', ['CERNE', 'Gestão', 'Capacitação', 'Assessoria', 'Sustentabilidade', 'Qualificação']);
      } catch (settingsErr) {
        console.warn('[UPLOAD] Erro ao buscar configurações do banco, usando fallback local:', settingsErr.message);
      }

      let metadata = {};
      let tituloFinal = '';
      let eventoFinal = 'Sem Evento';
      let originalName = '';
      let tipo = '';
      let mimeType = null;
      let fileSize = 0;
      let storagePath = null;
      let textoExtraido = '';

     // ==========================================
      // FLUXO A: PROCESSAMENTO DE LINK (CORRIGIDO)
      // ==========================================
      if (linkEnviado && !req.file) {
        console.log(`[UPLOAD] Iniciando processamento de Link: ${linkEnviado}`);
        tipo = 'link';
        originalName = linkEnviado;
        
        // 1. Extrai o texto da página via web scraping
        textoExtraido = await extractTextFromLink(linkEnviado);
        
        // 2. Salva o texto em um arquivo .txt temporário para a IA conseguir ler via caminho
        const tempTxtPath = path.join(tempDir, `link-${Date.now()}.txt`);
        await fs.promises.writeFile(tempTxtPath, textoExtraido, 'utf8');
        
        try {
          // 3. Passa o caminho do arquivo temporário e a extensão 'txt'
          metadata = await resumirQualquerDocumento(tempTxtPath, 'txt', dbCategories, dbTags);
        } catch (aiErr) {
          console.warn('[UPLOAD] IA falhou ao resumir o texto do link, usando fallback:', aiErr.message);
          metadata = {
            titulo: 'Página da Web (Link Externo)',
            evento: 'Registro de Link',
            resumo: 'Link institucional cadastrado via web.',
            categoriasSugeridas: ['Gestão'],
            tagsSugeridas: ['CERNE']
          };
        } finally {
          // 4. Remove o arquivo temporário de texto
          await removeTemporaryFile(tempTxtPath);
        }
        
        tituloFinal = metadata.titulo && metadata.titulo.trim() !== '' ? metadata.titulo : 'Página da Web';
        eventoFinal = metadata.evento || 'Sem Evento';
        storagePath = null;
        mimeType = 'text/html';
        fileSize = 0;
      }
      
      // ==========================================
      // FLUXO B: PROCESSAMENTO DE ARQUIVO
      // ==========================================
      else if (req.file) {
        const tempPath = req.file.path;
        originalName = sanitizeFileName(req.file.originalname || 'arquivo');
        const extension = getFileExtension(originalName);
        mimeType = (req.file.mimetype || getMimeType(originalName)).toLowerCase();
        fileSize = Number(req.file.size || 0);

        if (fileSize > 30 * 1024 * 1024) {
          await removeTemporaryFile(tempPath);
          return res.status(413).json({ error: 'O tamanho máximo permitido é de 30 MB.' });
        }

        if (isForbiddenFile(originalName, mimeType)) {
          await removeTemporaryFile(tempPath);
          return res.status(400).json({ error: 'Tipo de arquivo não permitido por segurança.' });
        }

        console.log(`[UPLOAD] Arquivo recebido: ${originalName} (${fileSize} bytes, ${mimeType})`);

        // Extrai metadados do arquivo via IA
        metadata = await generateMetadata(tempPath, originalName, extension, dbCategories, dbTags);
        
        tituloFinal = metadata.titulo && metadata.titulo.trim() !== '' ? metadata.titulo : originalName;
        eventoFinal = metadata.evento || 'Sem Evento';
        textoExtraido = metadata.textoExtraido || '';
        tipo = extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension) ? 'imagem' : 'documento';

        // Salva no Storage e limpa o temporário
        storagePath = buildStoragePath(originalName);
        await uploadFileToSupabase(tempPath, storagePath, originalName, mimeType);
        await removeTemporaryFile(tempPath);
      }

      console.log(`[UPLOAD] Metadados consolidados:`, tituloFinal);

      // 4. Mapeamento final dos arrays de IA
      const rawCategories = metadata.categoriasSugeridas || metadata.categorias || [];
      const categoriesList = Array.isArray(rawCategories) ? rawCategories : [];
      const primaryCategory = categoriesList.length > 0 ? categoriesList[0] : '';
      const rawTags = metadata.tagsSugeridas || metadata.tags || [];
      const tagsList = Array.isArray(rawTags) ? rawTags : [];

      // 5. Query de inserção no banco de dados
      const insertQuery = `
        INSERT INTO public.evidences (
          "titulo", "nome", "tipo", "data", "evento", 
          "categoria", "categorias", "responsavel", "tags", "resumo", 
          "textoExtraido", "storage_path", "storage_filename", "original_filename", "mime_type", 
          "file_size", "link", "criadoEm", "created_by", "created_at", "updated_by", 
          "updated_at"
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7::jsonb, $8, $9::jsonb, $10, 
          $11, $12, $13, $14, $15, 
          $16, $17, $18, $19, $20, 
          $21, $22
        )
        RETURNING "id"
      `;

      let insertResult;
      try {
        insertResult = await dbClient.query(insertQuery, [
          tituloFinal,                              // $1
          originalName,                             // $2
          tipo,                                     // $3
          new Date().toLocaleDateString('pt-BR'),   // $4
          eventoFinal,                              // $5
          primaryCategory,                          // $6
          JSON.stringify(categoriesList),           // $7
          responsavel,                              // $8
          JSON.stringify(tagsList),                 // $9
          metadata.resumo || '',                    // $10
          textoExtraido,                            // $11
          storagePath,                              // $12 (será null se for link)
          storagePath ? path.basename(storagePath) : null, // $13
          originalName,                             // $14
          mimeType,                                 // $15
          fileSize,                                 // $16
          linkEnviado || null,                      // $17: link inserido aqui!
          createdAt,                                // $18
          req.user?.email || null,                  // $19
          createdAt,                                // $20
          req.user?.email || null,                  // $21
          createdAt                                 // $22
        ]);
      } catch (dbError) {
        if (storagePath) await deleteFileFromSupabase(storagePath);
        throw dbError;
      }

      const id = insertResult.rows[0]?.id;
      console.log(`[UPLOAD] Registro salvo no banco para ${id}`);

      // 6. Retorno padronizado para o front-end
      res.json({
        id,
        titulo: tituloFinal,
        nome: originalName,
        tipo,
        data: new Date().toLocaleDateString('pt-BR'),
        evento: eventoFinal,
        categoria: primaryCategory,
        categorias: categoriesList,
        responsavel: responsavel,
        tags: tagsList,
        resumo: metadata.resumo || '',
        textoExtraido: textoExtraido,
        storagePath,
        storageFilename: storagePath ? path.basename(storagePath) : null,
        originalFilename: originalName,
        mimeType,
        fileSize,
        link: linkEnviado || null,
        downloadUrl: storagePath ? buildDownloadUrl(req, id) : null
      });

    } catch (error) {
      console.error('[UPLOAD] Falha no processamento:', error);
      if (req.file && req.file.path) {
        await removeTemporaryFile(req.file.path).catch(() => {});
      }
      res.status(500).json({ error: error.message || 'Falha no processamento.' });
    }
  });
});

app.use((err, req, res, next) => {
  console.error('[SERVER] Erro interno não tratado:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});


// Adicione no final do seu server.js antes de startServer():
app.get('/api/debug-gemini', async (req, res) => {
  try {
    const teste = await resumirTextoSimples("Teste de integração CEI/UFRGS.");
    res.json({ status: "OK", resposta: teste });
  } catch (err) {
    res.status(500).json({ status: "ERRO", erro: err.message, stack: err.stack });
  }
});



function startServer() {
  // 1. Abre a porta imediatamente para a Hostinger reconhecer que o app está ativo
  app.listen(port, host, () => {
    console.log(`Servidor iniciado na porta ${port}`);
  });

  // 2. Conecta ao banco de dados em segundo plano sem travar a inicialização
  initPostgresPool()
    .then(() => {
      console.log('[SERVER] PostgreSQL inicializado.');
    })
    .catch((err) => {
      console.warn(
        '[SERVER] PostgreSQL indisponível; continuando com o servidor para autenticação e rotas públicas:',
        err.message || err
      );
    });
}

startServer();

export {
  buildStoragePath,
  getFileExtension,
  isForbiddenFile,
  serializeRow
};
