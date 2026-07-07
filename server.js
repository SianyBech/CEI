const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Pool } = require('pg');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const rootPath = path.resolve(__dirname);
const storageRoot = process.env.STORAGE_PATH ? path.resolve(process.env.STORAGE_PATH) : path.join(rootPath, 'storage');
const originalsDir = path.join(storageRoot, 'originals');
const tempDir = path.join(storageRoot, 'tmp');

fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

let pool = null;
let dbReady = false;

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
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.pptx'];
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(extension));
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
    criadoEm: row.criadoEm,
    downloadUrl: buildDownloadUrl(req, row.id)
  };
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
    const rows = await dbClient.many(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "criadoEm" FROM public.evidences ORDER BY "criadoEm" DESC`);
    res.json((rows || []).map((row) => serializeRow(row, req)));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao buscar evidências:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar evidências.' });
  }
});

app.get('/api/evidences/:id', async (req, res, next) => {
  try {
    const row = await dbClient.one(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "criadoEm" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
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
    const row = await dbClient.one(`SELECT "caminhoArquivo", "nome" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!row) {
      return res.status(404).send('Arquivo não encontrado.');
    }

    res.download(row.caminhoArquivo, row.nome);
  } catch (error) {
    console.error('[FILE] Erro ao buscar arquivo:', error);
    res.status(500).send('Erro ao buscar arquivo.');
  }
});

app.get('/api/preview/:id', async (req, res, next) => {
  try {
    const row = await dbClient.one(`SELECT "caminhoArquivo", "nome" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    if (!row) {
      return res.status(404).send('Arquivo não encontrado.');
    }

    const extension = path.extname(row.caminhoArquivo).toLowerCase();
    const mimeType = extension === '.pdf'
      ? 'application/pdf'
      : extension === '.png'
        ? 'image/png'
        : extension === '.jpg' || extension === '.jpeg'
          ? 'image/jpeg'
          : 'application/octet-stream';

    res.setHeader('Content-Disposition', `inline; filename="${row.nome}"`);
    res.type(mimeType);
    res.sendFile(row.caminhoArquivo);
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

    const updatedRow = await dbClient.one(`SELECT "id", "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "criadoEm" FROM public.evidences WHERE "id" = $1`, [req.params.id]);
    res.json(serializeRow(updatedRow, req));
  } catch (error) {
    console.error('[EVIDENCES] Erro ao atualizar evidência:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar metadados.' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado. Use multer com nome de campo "file".' });
  }

  const tempPath = req.file.path;
  const originalName = sanitizeFileName(req.file.originalname);
  const extension = path.extname(originalName).slice(1).toLowerCase();
  const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'pptx'];

  if (!allowedExtensions.includes(extension)) {
    return res.status(400).json({ error: 'Tipo de arquivo não suportado.' });
  }

  try {
    console.log(`[UPLOAD] Iniciando upload de ${originalName}`);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(originalName)}`;
    const destinationPath = path.join(originalsDir, filename);

    await moveFile(tempPath, destinationPath);
    console.log(`[UPLOAD] Arquivo salvo em ${destinationPath}`);

    const extractedText = await extractText(destinationPath, extension);
    console.log(`[UPLOAD] Texto extraído (${extractedText.length} caracteres)`);

    const metadata = await generateMetadata(originalName, extension, extractedText);
    console.log(`[UPLOAD] Metadados gerados para ${originalName}`);

    const createdAt = new Date().toISOString();
    const tipo = extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension) ? 'imagem' : 'documento';

    const insertQuery = `
      INSERT INTO public.evidences (
        "titulo", "nome", "tipo", "data", "evento", "categoria", "responsavel", "tags", "resumo", "textoExtraido", "caminhoArquivo", "criadoEm"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING "id"
    `;

    const insertResult = await dbClient.query(insertQuery, [
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
      destinationPath,
      createdAt
    ]);

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
      downloadUrl: buildDownloadUrl(req, id)
    });
  } catch (error) {
    console.error('[UPLOAD] Falha no processamento do arquivo:', error);
    if (tempPath && fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }

    res.status(500).json({ error: error.message || 'Falha no processamento do arquivo.' });
  }
});

app.use((err, req, res, next) => {
  console.error('[SERVER] Erro interno não tratado:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor.' });
});

async function startServer() {
  try {
    await initPostgresPool();
    app.listen(port, host, () => {
      console.log(`Servidor CERNE iniciado em http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
      console.log(`Se o servidor estiver em rede, acesse via browser: http://<IP-do-servidor>:${port}`);
    });
  } catch (error) {
    console.error('[SERVER] Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();
