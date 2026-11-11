// Rasterizes the report pages (DOM nodes) and saves them as one A4 PDF. Both libraries are loaded on demand.
export const saveReportPdf = async (pages, fileName, title) => {
  const [{ toPng, getFontEmbedCSS }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  await document.fonts.ready;
  const fontEmbedCSS = await getFontEmbedCSS(pages[0]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title, author: 'שבושון', creator: 'שבושון' });
  for (let i = 0; i < pages.length; i++) {
    const png = await toPng(pages[i], { pixelRatio: 3, fontEmbedCSS, cacheBust: false });
    if (i > 0) pdf.addPage();
    pdf.addImage(png, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }
  pdf.save(fileName);
};
