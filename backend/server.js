import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const storageRoot = path.join(projectRoot, 'backend', 'storage', 'bilhetes');
const app = express();
const PORT = Number(process.env.PORT || 3001);

await mkdir(storageRoot, { recursive: true });

app.use(cors({ origin: true }));
app.use(express.json());
app.use('/storage', express.static(path.join(projectRoot, 'backend', 'storage')));

function sanitizeExt(fileName = '') {
    const ext = path.extname(fileName).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, callback) {
            const scanId = req.scanId || randomUUID();
            req.scanId = scanId;
            const currentDir = path.join(storageRoot, scanId);
            fs.mkdirSync(currentDir, { recursive: true });
            callback(null, currentDir);
        },
        filename(req, file, callback) {
            const side = file.fieldname === 'frontImage' ? 'frente' : 'verso';
            callback(null, `${side}${sanitizeExt(file.originalname)}`);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 2
    },
    fileFilter(req, file, callback) {
        if (!file.mimetype.startsWith('image/')) {
            callback(new Error('Envie apenas imagens do bilhete.'));
            return;
        }

        callback(null, true);
    }
});

function normalizeSpaces(value = '') {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeLine(value = '') {
    return normalizeSpaces(value)
        .replace(/[|]/g, 'I')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");
}

function uniqueLines(text = '') {
    return text
        .split(/\r?\n/)
        .map(normalizeLine)
        .filter(line => line.length >= 3)
        .filter((line, index, items) => items.indexOf(line) === index);
}

function pickFirstMatch(text, expressions) {
    for (const expression of expressions) {
        const match = text.match(expression);
        if (match) {
            return match[0];
        }
    }

    return '';
}

function extractName(lines) {
    const blockedWords = [
        'REPUBLICA',
        'FEDERATIVA',
        'BRASIL',
        'DOCUMENTO',
        'IDENTIDADE',
        'CARTEIRA',
        'NACIONAL',
        'VALIDADE',
        'NASCIMENTO',
        'ASSINATURA',
        'FILIACAO',
        'BILHETE',
        'MOTORISTA',
        'PASSAGEIRO',
        'CPF',
        'RG'
    ];

    const candidates = lines
        .map(line => line.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        .filter(line => /^[A-Z' -]{8,}$/.test(line))
        .filter(line => !blockedWords.some(word => line.includes(word)))
        .sort((first, second) => second.length - first.length);

    return candidates[0] || '';
}

function extractFieldByLabel(text, labels) {
    for (const label of labels) {
        const expression = new RegExp(`${label}[^\\n:]*[:\\s]+([^\\n]{4,})`, 'i');
        const match = text.match(expression);
        if (match?.[1]) {
            return normalizeSpaces(match[1]);
        }
    }

    return '';
}

function extractEssentialInfo(frontText, backText) {
    const mergedText = `${frontText}\n${backText}`;
    const normalizedLines = uniqueLines(mergedText);
    const upperLines = normalizedLines.map(line => line.toUpperCase());

    const birthDate = extractFieldByLabel(mergedText, ['nascimento', 'data de nascimento'])
        || pickFirstMatch(mergedText, [/\b\d{2}\/\d{2}\/\d{4}\b/g]);

    const validity = extractFieldByLabel(mergedText, ['validade', 'v[aá]lido at[eé]'])
        || '';

    const documentNumber = extractFieldByLabel(mergedText, ['cpf', 'registro', 'documento', 'numero', 'número'])
        || pickFirstMatch(mergedText, [
            /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
            /\b\d{11}\b/g,
            /\b\d{7,14}\b/g
        ]);

    const name = extractFieldByLabel(mergedText, ['nome', 'name']) || extractName(upperLines);

    return {
        name,
        documentNumber,
        birthDate,
        validity,
        rawText: normalizeSpaces(mergedText),
        lines: normalizedLines.slice(0, 30)
    };
}

async function runOcrForImage(filePath) {
    const result = await Tesseract.recognize(filePath, 'por+eng');
    return result.data?.text || '';
}

app.get('/api/health', (request, response) => {
    response.json({ status: 'ok' });
});

app.post(
    '/api/ocr/bilhete',
    upload.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 }
    ]),
    async (request, response) => {
        try {
            const frontFile = request.files?.frontImage?.[0];
            const backFile = request.files?.backImage?.[0];

            if (!frontFile || !backFile) {
                response.status(400).json({ error: 'Envie a frente e o verso do bilhete.' });
                return;
            }

            const [frontText, backText] = await Promise.all([
                runOcrForImage(frontFile.path),
                runOcrForImage(backFile.path)
            ]);

            const extractedData = extractEssentialInfo(frontText, backText);
            const scanId = request.scanId;
            const relativeBasePath = `storage/bilhetes/${scanId}`;

            response.json({
                scanId,
                message: 'Bilhete processado e salvo no backend com sucesso.',
                savedFiles: {
                    frontImage: `${relativeBasePath}/${path.basename(frontFile.path)}`,
                    backImage: `${relativeBasePath}/${path.basename(backFile.path)}`
                },
                extractedData: {
                    ...extractedData,
                    frontText: normalizeSpaces(frontText),
                    backText: normalizeSpaces(backText)
                }
            });
        } catch (error) {
            response.status(500).json({
                error: error instanceof Error ? error.message : 'Falha ao processar o OCR do bilhete.'
            });
        }
    }
);

app.use((error, request, response, next) => {
    if (error instanceof multer.MulterError) {
        response.status(400).json({ error: 'Falha no upload do bilhete. Verifique o tamanho dos arquivos.' });
        return;
    }

    if (error instanceof Error) {
        response.status(400).json({ error: error.message });
        return;
    }

    next(error);
});

app.listen(PORT, () => {
    console.log(`API OCR disponível em http://localhost:${PORT}`);
});
