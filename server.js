const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const rootPath = path.resolve(__dirname);
const originalsDir = path.join(rootPath, 'storage', 'originals');
const tempDir = path.join(rootPath, 'tmp');
const dbDir = path.join(rootPath, 'db');
const dbPath = path.join(dbDir, 'evidences.db');

fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir banco de dados SQLite:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS evidences (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data TEXT NOT NULL,
    evento TEXT NOT NULL,
    categoria TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    tags TEXT NOT NULL,
    resumo TEXT NOT NULL,
    textoExtraido TEXT NOT NULL,
    caminhoArquivo TEXT NOT NULL,
    criadoEm TEXT NOT NULL
  )`);
});

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

function serializeRow(row, req) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo,
    data: row.data,
    evento: row.evento,
    categoria: row.categoria,
    responsavel: row.responsavel,
    tags: JSON.parse(row.tags || '[]'),
    resumo: row.resumo,
    textoExtraido: row.textoExtraido,
    caminhoArquivo: row.caminhoArquivo,
    criadoEm: row.criadoEm,
    downloadUrl: buildDownloadUrl(req, row.id)
  };
}

app.get('/api/evidences', (req, res) => {
  db.all('SELECT * FROM evidences ORDER BY criadoEm DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar evidências no banco de dados.' });
    }
    res.json(rows.map(row => serializeRow(row, req)));
  });
});

app.get('/api/evidences/:id', (req, res) => {
  db.get('SELECT * FROM evidences WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar evidência no banco de dados.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }
    res.json(serializeRow(row, req));
  });
});

app.get('/api/file/:id', (req, res) => {
  db.get('SELECT caminhoArquivo, nome FROM evidences WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).send('Erro ao buscar arquivo.');
    }
    if (!row) {
      return res.status(404).send('Arquivo não encontrado.');
    }
    res.download(row.caminhoArquivo, row.nome);
  });
});

async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
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
        'Authorization': `Bearer ${apiKey}`,
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
    return null;
  }
}

app.get('/api/preview/:id', (req, res) => {
  db.get('SELECT caminhoArquivo, nome FROM evidences WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).send('Erro ao buscar arquivo.');
    }
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
  });
});

app.patch('/api/evidences/:id', (req, res) => {
  const { evento, categoria, responsavel, tags, resumo, data } = req.body;
  if (!evento || !categoria || !responsavel || !Array.isArray(tags) || !resumo || !data) {
    return res.status(400).json({ error: 'Dados incompletos para atualização de metadados.' });
  }

  const tagsJson = JSON.stringify(tags);
  const query = `UPDATE evidences SET evento = ?, categoria = ?, responsavel = ?, tags = ?, resumo = ?, data = ? WHERE id = ?`;
  db.run(query, [evento, categoria, responsavel, tagsJson, resumo, data, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar metadados.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Evidência não encontrada.' });
    }

    db.get('SELECT * FROM evidences WHERE id = ?', [req.params.id], (err2, row) => {
      if (err2) {
        return res.status(500).json({ error: 'Erro ao recuperar evidência atualizada.' });
      }
      res.json(serializeRow(row, req));
    });
  });
});

async function generateMetadata(filename, extension, extractedText) {
  const aiResult = await callOpenAIForMetadata(filename, extension, extractedText).catch(() => null);
  if (aiResult && typeof aiResult === 'object') {
    return {
      evento: String(aiResult.evento || 'Registro Interno').trim(),
      categoria: String(aiResult.categoria || 'Gestão').trim(),
      responsavel: String(aiResult.responsavel || 'Equipe CEI').trim(),
      tags: Array.isArray(aiResult.tags) ? aiResult.tags.map(tag => String(tag).trim()).filter(Boolean) : [],
      resumo: String(aiResult.resumo || '').trim(),
      textoExtraido: extractedText || ''
    };
  }

  return buildFallbackMetadata(filename, extension, extractedText);
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado. Use multer com nome de campo "file".' });
  }

  try {
    const originalName = req.file.originalname;
    const extension = path.extname(originalName).slice(1).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(originalName)}`;
    const destinationPath = path.join(originalsDir, filename);

    await fs.promises.rename(req.file.path, destinationPath);
    const extractedText = await extractText(destinationPath, extension);
    const metadata = await generateMetadata(originalName, extension, extractedText);

    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();
    const tagsJson = JSON.stringify(metadata.tags || []);
    const insertQuery = `INSERT INTO evidences (id, nome, tipo, data, evento, categoria, responsavel, tags, resumo, textoExtraido, caminhoArquivo, criadoEm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(insertQuery, [
      id,
      originalName,
      extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension) ? 'imagem' : 'documento',
      new Date().toLocaleDateString('pt-BR'),
      metadata.evento,
      metadata.categoria,
      metadata.responsavel,
      tagsJson,
      metadata.resumo,
      metadata.textoExtraido,
      destinationPath,
      createdAt
    ], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao salvar os metadados no banco de dados.' });
      }

      res.json({
        id,
        nome: originalName,
        tipo: extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension) ? 'imagem' : 'documento',
        data: new Date().toLocaleDateString('pt-BR'),
        evento: metadata.evento,
        categoria: metadata.categoria,
        responsavel: metadata.responsavel,
        tags: metadata.tags,
        resumo: metadata.resumo,
        textoExtraido: metadata.textoExtraido,
        downloadUrl: buildDownloadUrl(req, id)
      });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Falha no processamento do arquivo: ' + (error.message || 'erro desconhecido') });
  }
});

app.listen(port, () => {
  console.log(`Servidor CERNE iniciado em http://localhost:${port}`);
});
