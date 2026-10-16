import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { DraftBalasan, db } from './db.js';

export async function generateDocxBuffer(draft: DraftBalasan): Promise<Buffer> {
  const settings = db.get('pengaturan');
  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const tableBordersNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Kop Surat Dinas
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'PEMERINTAH DAERAH DAERAH ISTIMEWA YOGYAKARTA',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'DINAS PENDIDIKAN, PEMUDA, DAN OLAHRAGA',
                bold: true,
                size: 24,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: settings.nama_instansi.toUpperCase(),
                bold: true,
                size: 26,
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `${settings.alamat_instansi}\nTelepon: ${settings.telepon_instansi} | Email: ${settings.email_instansi} | Laman: ${settings.website_instansi}`,
                size: 16,
                font: 'Arial',
              }),
            ],
          }),

          // Garis Kop Pembatas
          new Paragraph({
            spacing: { after: 240 },
            border: {
              bottom: {
                color: '000000',
                space: 1,
                style: BorderStyle.DOUBLE,
                size: 12,
              },
            },
            children: [],
          }),

          // Tanggal Surat
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `${settings.kota_surat}, ${dateFormatted}`,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // Header Meta Surat (Nomor, Sifat, Lampiran, Hal & Tujuan)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBordersNone,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    borders: tableBordersNone,
                    children: [
                      new Paragraph({
                        spacing: { after: 40 },
                        children: [
                          new TextRun({ text: 'Nomor     : ', size: 22, font: 'Arial' }),
                          new TextRun({ text: draft.nomor_surat_text, bold: true, size: 22, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 40 },
                        children: [
                          new TextRun({ text: 'Sifat       : ', size: 22, font: 'Arial' }),
                          new TextRun({ text: draft.sifat || 'Biasa', size: 22, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 40 },
                        children: [
                          new TextRun({ text: 'Lampiran : ', size: 22, font: 'Arial' }),
                          new TextRun({ text: draft.lampiran || '-', size: 22, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 120 },
                        children: [
                          new TextRun({ text: 'Hal         : ', size: 22, font: 'Arial' }),
                          new TextRun({ text: draft.perihal, bold: true, size: 22, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: tableBordersNone,
                    children: [
                      new Paragraph({
                        spacing: { after: 40 },
                        children: [
                          new TextRun({ text: 'Kepada Yth.', size: 22, font: 'Arial' }),
                        ],
                      }),
                      ...draft.tujuan_surat.split('\n').map(
                        (line) =>
                          new Paragraph({
                            spacing: { after: 30 },
                            children: [
                              new TextRun({ text: line, bold: true, size: 22, font: 'Arial' }),
                            ],
                          })
                      ),
                      new Paragraph({
                        spacing: { after: 120 },
                        children: [
                          new TextRun({ text: `di ${draft.lokasi_tujuan || 'Tempat'}`, size: 22, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Paragraf Pembuka
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 180, after: 140 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: draft.teks_surat.pembuka,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // Paragraf Isi
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: draft.teks_surat.isi,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // Rincian Kegiatan (jika ada)
          ...(draft.teks_surat.rincian_kegiatan && draft.teks_surat.rincian_kegiatan.length > 0
            ? [
                new Table({
                  width: { size: 90, type: WidthType.PERCENTAGE },
                  borders: tableBordersNone,
                  rows: draft.teks_surat.rincian_kegiatan.map(
                    (item) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            width: { size: 35, type: WidthType.PERCENTAGE },
                            borders: tableBordersNone,
                            children: [
                              new Paragraph({
                                spacing: { after: 40 },
                                children: [
                                  new TextRun({ text: `• ${item.label}`, size: 22, font: 'Arial' }),
                                ],
                              }),
                            ],
                          }),
                          new TableCell({
                            width: { size: 5, type: WidthType.PERCENTAGE },
                            borders: tableBordersNone,
                            children: [
                              new Paragraph({
                                spacing: { after: 40 },
                                children: [new TextRun({ text: ':', size: 22, font: 'Arial' })],
                              }),
                            ],
                          }),
                          new TableCell({
                            width: { size: 60, type: WidthType.PERCENTAGE },
                            borders: tableBordersNone,
                            children: [
                              new Paragraph({
                                spacing: { after: 40 },
                                children: [
                                  new TextRun({ text: item.value, bold: true, size: 22, font: 'Arial' }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      })
                  ),
                }),
              ]
            : []),

          // Paragraf Penutup
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 140, after: 360 },
            indent: { firstLine: 720 },
            children: [
              new TextRun({
                text: draft.teks_surat.penutup,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),

          // Blok Tanda Tangan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBordersNone,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: tableBordersNone,
                    children: [new Paragraph({ children: [] })],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: tableBordersNone,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 40 },
                        children: [
                          new TextRun({
                            text: settings.jabatan_penandatangan,
                            bold: true,
                            size: 22,
                            font: 'Arial',
                          }),
                        ],
                      }),
                      // Ruang Kosong untuk TTD resmi Srikandi
                      new Paragraph({
                        spacing: { after: 800 },
                        children: [
                          new TextRun({
                            text: '\n\n\n',
                            size: 22,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 30 },
                        children: [
                          new TextRun({
                            text: settings.nama_kepala,
                            bold: true,
                            underline: {},
                            size: 22,
                            font: 'Arial',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `NIP. ${settings.nip_kepala}`,
                            size: 20,
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
