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
export async function resumirQualquerDocumento(caminhoArquivo) {
  try {
    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado no caminho: ${caminhoArquivo}`);
    }

    const stats = fs.statSync(caminhoArquivo);
    if (stats.size === 0) {
      throw new Error('O arquivo fornecido está vazio (0 bytes).');
    }

    const extensao = path.extname(caminhoArquivo).toLowerCase();
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
            // pdf2json gera dados por página. Limitamos o texto bruto
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText);
          });
          pdfParser.loadPDF(caminhoArquivo);
        });

        // Se o PDF for muito extenso, limitamos a string aos primeiros 15.000 caracteres (~5 páginas de texto)
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
        const LIMITE_PAGINAS_OCR = 5; // 👈 TRAVA DE SEGURANÇA CONTRA TIMEOUT 504

        const document = await pdf(caminhoArquivo, { scale: 2 });

        for await (const image of document) {
          if (contadorPaginas > LIMITE_PAGINAS_OCR) {
            console.log(`Limite de ${LIMITE_PAGINAS_OCR} páginas atingido para o OCR. Interrompendo para evitar timeout.`);
            break; // Sai do loop imediatamente ao atingir 5 páginas
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

    // 4. EXCEL (.xlsx, .xls, .csv)
    else if (['.xlsx', '.xls'].includes(extensao)) {
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

    // 5. TEXTO PLANO (.txt)
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
    return await resumirTextoSimples(textoExtraido);

  } catch (error) {
    console.error(`Erro ao processar o arquivo ${caminhoArquivo}:`, error.message);
    throw error;
  }
}

/**
 * Envia o texto extraído para a IA
 */
export async function resumirTextoSimples(texto) {
  try {
    const response = await ai.models.generateContent({
      model: MODELO_PADRAO,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Você é um analista sênior de documentação do CEI/UFRGS (Centro de Empreendimentos de Informática).

Sua tarefa é analisar o texto extraído de uma evidência documental e gerar um resumo executivo direto e objetivo, dividido em EXATAMENTE DOIS PARÁGRAFOS.

Siga estritamente esta estrutura e formato:

Parágrafo 1 (Identificação e Contexto):
Comece identificando o tipo de documento/mídia e do que se trata, a quem ou o que se refere e o período ou data de ocorrência/elaboração.

Parágrafo 2 (Síntese do Conteúdo e Entregas):
Resuma em poucas frases diretas o conteúdo principal, detalhando o que foi discutido, executado ou entregue de mais relevante.

Regras importantes de formatação:
- NÃO use emojis nem marcadores em tópicos (bullet points).
- NÃO use asteriscos (**). Para aplicar negrito em termos-chave, use estritamente tags HTML <b> e </b>.
- Responda apenas com os dois parágrafos, sem títulos como "Parágrafo 1:" ou introduções.
- Seja extremamente conciso, direto e vá direto ao ponto.

Conteúdo para análise:
${texto}`
            },
          ],
        },
      ],
    });

    return response.text;
  } catch (err) {
    console.error('Erro de comunicação com a API do Gemini:', err);
    throw new Error(`Falha ao comunicar com a IA: ${err.message}`);
  }
}