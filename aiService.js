import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import PDFParser from 'pdf2json';
import { pdf } from 'pdf-to-img';

// 1. Obtém a chave e o modelo das variáveis de ambiente
const apiKey = process.env.GEMINI_API_KEY;
const MODELO_PADRAO = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// 2. Validação antecipada
if (!apiKey) {
  console.error('CRÍTICO: GEMINI_API_KEY não foi encontrada no arquivo .env ou no painel da Hostinger!');
}

// 3. Inicialização da SDK
const ai = new GoogleGenAI({ apiKey });

/**
 * Função Universal para ler e resumir QUALQUER arquivo.
 */
// Importante: Caso não tenha o AdmZip neste arquivo, adicione a linha abaixo no topo do aiService.js
// import AdmZip from 'adm-zip';

export async function resumirQualquerDocumento(caminhoArquivo, extensaoArquivo, categoriasDoBanco = [], tagsDoBanco = []) {
  try {
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado no caminho: ${caminhoArquivo}`);
    }

    const stats = fs.statSync(caminhoArquivo);
    if (stats.size === 0) {
      throw new Error('O arquivo fornecido está vazio (0 bytes).');
    }

    // 💡 A MÁGICA ACONTECE AQUI: Usamos a extensão passada pelo server.js!
    // Garantimos que a extensão sempre comece com um ponto e seja minúscula.
    const extensao = extensaoArquivo.startsWith('.') 
      ? extensaoArquivo.toLowerCase() 
      : `.${extensaoArquivo.toLowerCase()}`;
      
    let textoExtraido = '';

    // 1. IMAGENS
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(extensao)) {
      console.log('Executando OCR na imagem...');
      const resultado = await Tesseract.recognize(caminhoArquivo, 'por');
      textoExtraido = resultado.data.text;
    }

    // 2. PDF
    else if (extensao === '.pdf') {
      console.log('Tentando extrair texto direto do PDF...');
      
      try {
        textoExtraido = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on('pdfParser_dataError', errData => reject(new Error(errData.parserError)));
          pdfParser.on('pdfParser_dataReady', () => {
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText);
          });
          pdfParser.loadPDF(caminhoArquivo);
        });

        if (textoExtraido && textoExtraido.length > 15000) {
          console.log('PDF longo detectado. Limitando o texto extraído para as primeiras páginas...');
          textoExtraido = textoExtraido.substring(0, 15000);
        }

      } catch (pdfErr) {
        console.warn('Estrutura de texto do PDF indisponível. Convertendo páginas do PDF em imagem para OCR...');
      }

      // Fallback para PDF escaneado (OCR via Tesseract)
      if (!textoExtraido || textoExtraido.trim().length === 0) {
        let contadorPaginas = 1;
        const LIMITE_PAGINAS_OCR = 5;

        const document = await pdf(caminhoArquivo, { scale: 2 });

        for await (const image of document) {
          if (contadorPaginas > LIMITE_PAGINAS_OCR) {
            console.log(`Limite de ${LIMITE_PAGINAS_OCR} páginas atingido para o OCR. Interrompendo para evitar timeout.`);
            break;
          }

          console.log(`Lendo página ${contadorPaginas} de ${LIMITE_PAGINAS_OCR} via OCR...`);
          const resultadoOcr = await Tesseract.recognize(image, 'por');
          textoExtraido += `\n--- PÁGINA ${contadorPaginas} ---\n` + resultadoOcr.data.text;
          contadorPaginas++;
        }
      }
    }

    // 3. WORD (.docx)
    else if (extensao === '.docx') {
      const resultado = await mammoth.extractRawText({ path: caminhoArquivo });
      textoExtraido = resultado.value;
    }

    // 4. POWERPOINT (.pptx)
    else if (extensao === '.pptx') {
      console.log('Extraindo texto de apresentação PPTX...');
      const zip = new AdmZip(caminhoArquivo);
      const slides = zip.getEntries().filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'));
      textoExtraido = slides
        .map((entry) => entry.getData().toString('utf8'))
        .join('\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // 5. EXCEL (.xlsx, .xls, .csv)
    else if (['.xlsx', '.xls', '.csv'].includes(extensao)) {
      const fileBuffer = fs.readFileSync(caminhoArquivo);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      let textoPlanilha = '';
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        if (csvData.trim()) {
          textoPlanilha += `--- Aba: ${sheetName} ---\n${csvData}\n\n`;
        }
      });

      textoExtraido = textoPlanilha;
    }

    // 6. TEXTO PLANO (.txt)
    else if (extensao === '.txt') {
      textoExtraido = fs.readFileSync(caminhoArquivo, 'utf-8');
    }

    else {
      throw new Error(`Formato de arquivo não suportado: ${extensao}`);
    }

    if (!textoExtraido || textoExtraido.trim().length === 0) {
      throw new Error('Não foi possível extrair nenhum texto legível do arquivo.');
    }

    console.log('Texto extraído com sucesso. Enviando para o Gemini...');
    const resultadoIA = await resumirTextoSimples(textoExtraido, categoriasDoBanco, tagsDoBanco);
    
    // Anexa o texto extraído original ao retorno da IA
    return {
      ...resultadoIA,
      textoExtraido
    };

  } catch (error) {
    // Melhoria no log para mostrar exatamente a extensão que falhou
    console.error(`[AI SERVICE] Erro ao processar o arquivo (Extensão: ${extensaoArquivo}):`, error.message);
    throw error;
  }
}

/**
 * Função auxiliar interna para tentar novamente em caso de falha de rede/API
 */
async function chamarComRetry(fn, maxRetries = 3, delay = 1000) {
  for (let tentativa = 1; tentativa <= maxRetries; tentativa++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`[AI SERVICE] Tentativa ${tentativa} de ${maxRetries} falhou: ${error.message}`);
      if (tentativa === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * tentativa));
    }
  }
}

/**
 * Envia o texto extraído para a IA e gera título, evento, resumo, categorias e tags
 */
export async function resumirTextoSimples(texto, categoriasDoBanco = [], tagsDoBanco = []) {
  try {
    const listaCategorias = categoriasDoBanco.length > 0 
      ? categoriasDoBanco.join(', ') 
      : 'Capacitação, Planejamento, Gestão, Assessoria, Sustentabilidade, Qualificação';

    const listaTags = tagsDoBanco.length > 0 
      ? tagsDoBanco.join(', ') 
      : 'CERNE, Gestão, Capacitação, Assessoria, Sustentabilidade, Qualificação';

    const prompt = `Você é um analista sênior de documentação do CEI/UFRGS (Centro de Empreendimentos de Informática).

Sua tarefa é analisar o texto extraído de uma evidência documental e retornar EXATAMENTE um objeto JSON válido.

A estrutura do JSON deve ser obrigatoriamente:
{
  "titulo": "Crie um título curto, objetivo e profissional (máximo 6 palavras) que resuma perfeitamente a essência da evidência.",
  "evento": "Identifique o nome do evento, reunião ou atividade de origem (ex: Mentoria Tecnológica, Ata de Reunião de Alinhamento). Se não houver, use 'Sem Evento'.",
  "resumo": "Dois parágrafos em texto plano contendo a identificação do documento e a síntese das entregas principais. Use estritamente tags HTML <b> e </b> para destacar termos-chave.",
  "categoriasSugeridas": ["Array com NO MÍNIMO 1 e NO MÁXIMO 3 categorias escolhidas EXCLUSIVAMENTE da lista permitida"],
  "tagsSugeridas": ["Array com NO MÍNIMO 1 e NO MÁXIMO 3 tags escolhidas EXCLUSIVAMENTE da lista permitida"]
}

REGRAS DE SELEÇÃO DE CATEGORIAS E TAGS:
1. Categorias permitidas: [${listaCategorias}]
2. Tags permitidas: [${listaTags}]
3. Escolha entre 1 a 3 categorias e de 1 a 3 tags da lista fornecida.

Conteúdo para análise:
${texto}`;

    // Envolve a chamada da API do Gemini com o mecanismo de Retry
    const response = await chamarComRetry(async () => {
      return await ai.models.generateContent({
        model: MODELO_PADRAO,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
    }, 3, 1200);

    const rawText = response.text || '';
    
    // Captura estritamente o bloco JSON entre chaves e limpa formatações Markdown indesejadas
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`A IA não retornou uma estrutura JSON válida. Resposta: ${rawText}`);
    }

    const jsonString = jsonMatch[0]
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(jsonString);
  } catch (err) {
    console.error('[GEMINI] Erro ao processar ou converter resposta da IA:', err);
    throw new Error(`Falha ao comunicar com a IA: ${err.message}`);
  }
}