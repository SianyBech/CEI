const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const rootPath = path.resolve(__dirname);
const storageRoot = process.env.STORAGE_PATH ? path.resolve(process.env.STORAGE_PATH) : path.join(rootPath, 'storage');
const tempDir = path.join(storageRoot, 'tmp');

fs.mkdirSync(tempDir, { recursive: true });

let pool = null;
let dbReady = false;
let supabaseClient = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY;
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
    await pool.query('UPDATE public.evidences SET "original_filename" = COALESCE("original_filename", "nome") WHERE "original_filename" IS NULL');
    await pool.query('UPDATE public.evidences SET "storage_filename" = COALESCE("storage_filename", "nome") WHERE "storage_filename" IS NULL');
    await pool.query('UPDATE public.evidences SET "mime_type" = COALESCE("mime_type", CASE WHEN "tipo" = \'pdf\' THEN \'application/pdf\' ELSE \'application/octet-stream\' END) WHERE "mime_type" IS NULL');
    await pool.query('UPDATE public.evidences SET "file_size" = COALESCE("file_size", 0) WHERE "file_size" IS NULL');
    dbReady = true;
    console.log('[DB] Tabela public.evidences pronta.');
  } catch (error) {
    console.error('[DB] Erro ao criar a tabela evidences:', error);
    throw error;
  }
}

const upload = multer({
  dest: tempDir,
  limits: {
    fileSize: 30 * 1024 * 1024
  },
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
app.use('/static', express.static(path.join(rootPath, 'src')));
app.use(express.static(rootPath));

function buildDownloadUrl(req, evidenceId) {
  return `/api/file/${encodeURIComponent(evidenceId)}`;
}

function sanitizeFileName(fileName) {
  const baseName = path.basename(fileName || 'arquivo');
  return baseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'arquivo';
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

function serializeRow(row, req) {
  if (!row) return null;

  return {
    id: row.id,
    titulo: row.titulo || row.nome,
    nome: row.nome,
    tipo: row.tipo,
    data: row.data,
    evento: row.evento,
    categoria: row.categoria,
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

function buildStoragePath(fileName = '') {
  const extension = path.extname(fileName || '').toLowerCase();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `evidencias/${year}/${month}/${randomUUID()}${extension}`;
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

async function uploadFileToSupabase(filePath, storagePath, originalName, mimeType) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Configuração do Supabase Storage indisponível.');
  }

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

function buildFallbackMetadata(originalName, extension, extractedText) {
  const lowerName = originalName.toLowerCase();
  const metadata = {
    evento: 'Registro Interno',
    categoria: 'Gestão',
    responsavel: 'Equipe CEI',
    tags: ['CERNE', 'Evidência'],
    resumo: 'Documento analisado localmente com extração de texto e classificação inicial.',
    textoExtraido: extractedText || 'Conteúdo não pôde ser extraído automaticamente.'
  };

  if (lowerName.includes('ata') || lowerName.includes('reuni')) {
    metadata.categoria = 'Planejamento';
    metadata.evento = 'Ata de Reunião';
    metadata.tags = ['Ata', 'Reunião', 'Planejamento'];
    metadata.resumo = 'Ata gerada a partir do arquivo com informações de planejamento e decisões.';
  } else if (lowerName.includes('workshop') || lowerName.includes('curso') || lowerName.includes('capacitacao') || lowerName.includes('capacitação') || lowerName.includes('palestra')) {
    metadata.categoria = 'Capacitação';
    metadata.evento = 'Evento de Capacitação';
    metadata.tags = ['Capacitação', 'Treinamento', 'Workshop'];
    metadata.resumo = 'Documento de evento ou capacitação identificado a partir do nome do arquivo.';
  } else if (lowerName.includes('contrato') || lowerName.includes('termo') || lowerName.includes('acordo') || lowerName.includes('convenio') || lowerName.includes('convênio')) {
    metadata.categoria = 'Assessoria';
    metadata.evento = 'Contrato / Termo';
    metadata.tags = ['Contrato', 'Assessoria', 'Jurídico'];
    metadata.resumo = 'Documento jurídico ou de assessoria catalogado automaticamente.';
  } else if (lowerName.includes('relatorio') || lowerName.includes('relatório') || lowerName.includes('financeiro') || lowerName.includes('contas')) {
    metadata.categoria = 'Gestão';
    metadata.evento = 'Relatório de Gestão';
    metadata.tags = ['Gestão', 'Relatório', 'Financeiro'];
    metadata.resumo = 'Relatório de gestão ou prestação de contas extraído do documento.';
  } else if (lowerName.includes('certificado') || lowerName.includes('diploma')) {
    metadata.categoria = 'Qualificação';
    metadata.evento = 'Certificado';
    metadata.tags = ['Certificado', 'Qualificação'];
    metadata.resumo = 'Certificado ou documento de qualificação detectado a partir do nome do arquivo.';
  } else if (lowerName.includes('sustentabilidade') || lowerName.includes('ambiental') || lowerName.includes('esg') || lowerName.includes('ecologico')) {
    metadata.categoria = 'Sustentabilidade';
    metadata.evento = 'Relatório de Sustentabilidade';
    metadata.tags = ['Sustentabilidade', 'ESG'];
    metadata.resumo = 'Documento com foco em práticas sustentáveis e ambientais.';
  }

  if (!metadata.resumo && extractedText) {
    metadata.resumo = extractedText.slice(0, 220).replace(/\s+/g, ' ') + '...';
  }

  return metadata;
}

async function callOpenAIForMetadata(filename, extension, extractedText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Você é um assistente responsável por extrair metadados estruturados do conteúdo de um documento. Retorne apenas um JSON válido com os campos: evento, categoria, responsavel, tags, resumo. Use o texto disponível abaixo.\n\nNome do arquivo: ${filename}\nTipo de arquivo: ${extension}\nTexto extraído: ${extractedText || '[sem texto extraído]'}\n\nRegras: \n1. O campo categoria deve ser uma das: Capacitação, Planejamento, Gestão, Assessoria, Sustentabilidade, Qualificação. \n2. O campo tags deve ser uma lista de até 6 palavras ou expressões curtas. \n3. O campo resumo deve ter no máximo 280 caracteres. \n4. Retorne apenas JSON válido, sem comentários, sem explicações adicionais.\n\nJSON:`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: prompt,
        max_output_tokens: 400
      })
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    let output = '';
    if (Array.isArray(body.output) && body.output.length > 0) {
      const firstOutput = body.output[0];
      if (Array.isArray(firstOutput.content)) {
        const textPiece = firstOutput.content.find((piece) => piece.type === 'output_text');
        if (textPiece && typeof textPiece.text === 'string') {
          output = textPiece.text;
        } else if (firstOutput.content.length > 0 && typeof firstOutput.content[0].text === 'string') {
          output = firstOutput.content[0].text;
        }
      } else if (typeof firstOutput.content === 'string') {
        output = firstOutput.content;
      }
    }

    const jsonText = output.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('[AI] Erro ao gerar metadados com OpenAI:', error);
    return null;
  }
}

async function generateMetadata(filename, extension, extractedText) {
  const aiResult = await callOpenAIForMetadata(filename, extension, extractedText).catch(() => null);
  if (aiResult && typeof aiResult === 'object') {
    return {
      evento: String(aiResult.evento || 'Registro Interno').trim(),
      categoria: String(aiResult.categoria || 'Gestão').trim(),
      responsavel: String(aiResult.responsavel || 'Equipe CEI').trim(),
      tags: Array.isArray(aiResult.tags) ? aiResult.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      resumo: String(aiResult.resumo || '').trim(),
      textoExtraido: extractedText || ''
    };
  }

  return buildFallbackMetadata(filename, extension, extractedText);
}

app.get('/api/evidences', async (req, res, next) => {
  try {
    console.log('[EVIDENCES] Buscando evidências...');
    const rows = await dbClient.many(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "criadoEm" FROM public.evidences ORDER BY "criadoEm" DESC`);
    res.json((rows || []).map((row) => serializeRow(row, req)));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao buscar evidências:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar evidências.' });
  }
});

app.get('/api/evidences/:id', async (req, res, next) => {
  try {
    const row = await dbClient.one(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "criadoEm" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!row) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    res.json(serializeRow(row, req));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao buscar evidência:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar evidência.' });
  }
});

app.get('/api/file/:id', async (req, res, next) => {
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

app.get('/api/preview/:id', async (req, res, next) => {
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

app.patch('/api/evidences/:id', async (req, res, next) => {
  try {
    const { titulo, evento, categoria, responsavel, tags, resumo, data } = req.body;
    if (!titulo || !evento || !categoria || !responsavel || !Array.isArray(tags) || !resumo || !data) {
      return res.status(400).json({ error: 'Dados incompletos para atualização de metadados.' });
    }

    const result = await dbClient.run(`UPDATE public.evidences SET "titulo" = $1, "evento" = $2, "categoria" = $3, "responsavel" = $4, "tags" = $5, "resumo" = $6, "data" = $7 WHERE "id" = $8`, [titulo, evento, categoria, responsavel, JSON.stringify(tags), resumo, data, req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    const updatedRow = await dbClient.one(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "criadoEm" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    res.json(serializeRow(updatedRow, req));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao atualizar evidência:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar metadados.' });
  }
});

app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'O tamanho máximo permitido é de 30 MB.' });
      }

      if (err.message === 'Tipo de arquivo não permitido por segurança.') {
        return res.status(400).json({ error: 'Tipo de arquivo não permitido por segurança.' });
      }

      console.error('[UPLOAD] Erro ao processar multipart:', err);
      return res.status(400).json({ error: 'Erro ao receber o arquivo enviado.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado. Use multer com nome de campo "file".' });
    }

    const tempPath = req.file.path;
    const originalName = sanitizeFileName(req.file.originalname || 'arquivo');
    const extension = getFileExtension(originalName);
    const mimeType = (req.file.mimetype || getMimeType(originalName)).toLowerCase();
    const fileSize = Number(req.file.size || 0);

    if (fileSize > 30 * 1024 * 1024) {
      await removeTemporaryFile(tempPath);
      return res.status(413).json({ error: 'O tamanho máximo permitido é de 30 MB.' });
    }

    if (isForbiddenFile(originalName, mimeType)) {
      await removeTemporaryFile(tempPath);
      return res.status(400).json({ error: 'Tipo de arquivo não permitido por segurança.' });
    }

    try {
      console.log(`[UPLOAD] Iniciando upload de ${originalName}`);
      console.log(`[UPLOAD] Arquivo recebido: ${originalName} (${fileSize} bytes, ${mimeType})`);

      const extractedText = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'pptx'].includes(extension)
        ? await extractText(tempPath, extension)
        : '';
      console.log(`[UPLOAD] Texto extraído (${extractedText.length} caracteres)`);

      const metadata = await generateMetadata(originalName, extension, extractedText);
      const processingNote = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'pptx'].includes(extension)
        ? ''
        : 'Formato não suportado para processamento automático.';

      if (processingNote) {
        metadata.resumo = [metadata.resumo, processingNote].filter(Boolean).join(' ').slice(0, 280);
      }

      console.log(`[UPLOAD] Metadados gerados para ${originalName}`);

      const storagePath = buildStoragePath(originalName);
      await uploadFileToSupabase(tempPath, storagePath, originalName, mimeType);
      console.log(`[UPLOAD] Upload realizado para o Supabase Storage: ${storagePath}`);

      await removeTemporaryFile(tempPath);
      console.log(`[UPLOAD] Arquivo temporário removido`);

      const createdAt = new Date().toISOString();
      const tipo = extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension) ? 'imagem' : 'documento';

      const insertQuery = `
        INSERT INTO public.evidences (
          "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "storage_path", "storage_filename", "original_filename", "mime_type", "file_size", "criadoEm"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING "id"
      `;

      let insertResult;

      try {
        insertResult = await dbClient.query(insertQuery, [
          originalName,
          originalName,
          tipo,
          new Date().toLocaleDateString('pt-BR'),
          metadata.evento,
          metadata.categoria,
          metadata.responsavel,
          JSON.stringify(metadata.tags || []),
          metadata.resumo,
          metadata.textoExtraido,
          storagePath,
          path.basename(storagePath),
          originalName,
          mimeType,
          fileSize,
          createdAt
        ]);
      } catch (dbError) {
        await deleteFileFromSupabase(storagePath);
        throw dbError;
      }

      const id = insertResult.rows[0]?.id;
      console.log(`[UPLOAD] Registro salvo no banco para ${id}`);

      res.json({
        id,
        titulo: originalName,
        nome: originalName,
        tipo,
        data: new Date().toLocaleDateString('pt-BR'),
        evento: metadata.evento,
        categoria: metadata.categoria,
        responsavel: metadata.responsavel,
        tags: metadata.tags,
        resumo: metadata.resumo,
        textoExtraido: metadata.textoExtraido,
        storagePath,
        storageFilename: path.basename(storagePath),
        originalFilename: originalName,
        mimeType,
        fileSize,
        downloadUrl: buildDownloadUrl(req, id)
      });
    } catch (error) {
      console.error('[UPLOAD] Falha no processamento do arquivo:', error);
      await removeTemporaryFile(tempPath);
      res.status(500).json({ error: error.message || 'Falha no processamento do arquivo.' });
    }
  });
});

app.use((err, req, res, next) => {
  console.error('[SERVER] Erro interno não tratado:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});

function startServer() {
  app.listen(port, host, () => {
    console.log(`Servidor CERNE iniciado em http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    console.log(`Se o servidor estiver em rede, acesse via browser: http://<IP-do-servidor>:${port}`);
  });

  initPostgresPool()
    .then(() => {
      console.log('[SERVER] Inicialização do PostgreSQL concluída.');
    })
    .catch((error) => {
      console.error('[SERVER] Falha na inicialização do PostgreSQL:', error);
    });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  buildStoragePath,
  getFileExtension,
  isForbiddenFile,
  serializeRow
};
