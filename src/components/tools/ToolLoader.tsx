'use client';

/**
 * Lazy registry for tool UIs: every tool component loads as its own
 * on-demand chunk. The shared page bundle no longer includes all 95
 * tool components (First Load JS on tool pages drops by ~600 kB).
 */
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

type Loader = () => ReactNode;

const MergePDFTool = dynamic(() => import('@/components/tools/merge').then(m => m.MergePDFTool), { ssr: true });
const SplitPDFTool = dynamic(() => import('@/components/tools/split').then(m => m.SplitPDFTool), { ssr: true });
const DeletePagesTool = dynamic(() => import('@/components/tools/delete').then(m => m.DeletePagesTool), { ssr: true });
const RotatePDFTool = dynamic(() => import('@/components/tools/rotate').then(m => m.RotatePDFTool), { ssr: true });
const RotateCustomTool = dynamic(() => import('@/components/tools/rotate-custom/RotateCustomTool').then(m => m.RotateCustomTool), { ssr: true });
const AddBlankPageTool = dynamic(() => import('@/components/tools/add-blank-page').then(m => m.AddBlankPageTool), { ssr: true });
const ReversePagesTool = dynamic(() => import('@/components/tools/reverse').then(m => m.ReversePagesTool), { ssr: true });
const NUpPDFTool = dynamic(() => import('@/components/tools/n-up').then(m => m.NUpPDFTool), { ssr: true });
const GridCombineTool = dynamic(() => import('@/components/tools/grid-combine').then(m => m.GridCombineTool), { ssr: true });
const AlternateMergeTool = dynamic(() => import('@/components/tools/alternate-merge').then(m => m.AlternateMergeTool), { ssr: true });
const DividePagesTool = dynamic(() => import('@/components/tools/divide').then(m => m.DividePagesTool), { ssr: true });
const CombineSinglePageTool = dynamic(() => import('@/components/tools/combine-single-page').then(m => m.CombineSinglePageTool), { ssr: true });
const PosterizePDFTool = dynamic(() => import('@/components/tools/posterize').then(m => m.PosterizePDFTool), { ssr: true });
const PDFMultiTool = dynamic(() => import('@/components/tools/pdf-multi-tool').then(m => m.PDFMultiTool), { ssr: true });
const AddAttachmentsTool = dynamic(() => import('@/components/tools/add-attachments').then(m => m.AddAttachmentsTool), { ssr: true });
const ExtractAttachmentsTool = dynamic(() => import('@/components/tools/extract-attachments').then(m => m.ExtractAttachmentsTool), { ssr: true });
const ExtractImagesTool = dynamic(() => import('@/components/tools/extract-images').then(m => m.ExtractImagesTool), { ssr: true });
const EditAttachmentsTool = dynamic(() => import('@/components/tools/edit-attachments').then(m => m.EditAttachmentsTool), { ssr: true });
const ViewMetadataTool = dynamic(() => import('@/components/tools/view-metadata').then(m => m.ViewMetadataTool), { ssr: true });
const EditMetadataTool = dynamic(() => import('@/components/tools/edit-metadata').then(m => m.EditMetadataTool), { ssr: true });
const PDFsToZipTool = dynamic(() => import('@/components/tools/pdf-to-zip').then(m => m.PDFsToZipTool), { ssr: true });
const ComparePDFsTool = dynamic(() => import('@/components/tools/compare-pdfs').then(m => m.ComparePDFsTool), { ssr: true });
const EditPDFTool = dynamic(() => import('@/components/tools/edit-pdf').then(m => m.EditPDFTool), { ssr: true });
const ImageToPDFTool = dynamic(() => import('@/components/tools/image-to-pdf').then(m => m.ImageToPDFTool), { ssr: true });
const PSDToPDFTool = dynamic(() => import('@/components/tools/psd-to-pdf').then(m => m.PSDToPDFTool), { ssr: true });
const TextToPDFTool = dynamic(() => import('@/components/tools/text-to-pdf').then(m => m.TextToPDFTool), { ssr: true });
const JSONToPDFTool = dynamic(() => import('@/components/tools/json-to-pdf').then(m => m.JSONToPDFTool), { ssr: true });
const CompressPDFTool = dynamic(() => import('@/components/tools/compress').then(m => m.CompressPDFTool), { ssr: true });
const SignPDFTool = dynamic(() => import('@/components/tools/sign').then(m => m.SignPDFTool), { ssr: true });
const CropPDFTool = dynamic(() => import('@/components/tools/crop').then(m => m.CropPDFTool), { ssr: true });
const FixPageSizeTool = dynamic(() => import('@/components/tools/fix-page-size').then(m => m.FixPageSizeTool), { ssr: true });
const OrganizePDFTool = dynamic(() => import('@/components/tools/organize').then(m => m.OrganizePDFTool), { ssr: true });
const ExtractPagesTool = dynamic(() => import('@/components/tools/extract').then(m => m.ExtractPagesTool), { ssr: true });
const BookmarkTool = dynamic(() => import('@/components/tools/bookmark').then(m => m.BookmarkTool), { ssr: true });
const PageNumbersTool = dynamic(() => import('@/components/tools/page-numbers').then(m => m.PageNumbersTool), { ssr: true });
const WatermarkTool = dynamic(() => import('@/components/tools/watermark').then(m => m.WatermarkTool), { ssr: true });
const HeaderFooterTool = dynamic(() => import('@/components/tools/header-footer').then(m => m.HeaderFooterTool), { ssr: true });
const InvertColorsTool = dynamic(() => import('@/components/tools/invert-colors').then(m => m.InvertColorsTool), { ssr: true });
const BackgroundColorTool = dynamic(() => import('@/components/tools/background-color').then(m => m.BackgroundColorTool), { ssr: true });
const TextColorTool = dynamic(() => import('@/components/tools/text-color').then(m => m.TextColorTool), { ssr: true });
const TableOfContentsTool = dynamic(() => import('@/components/tools/table-of-contents').then(m => m.TableOfContentsTool), { ssr: true });
const StampsTool = dynamic(() => import('@/components/tools/stamps').then(m => m.StampsTool), { ssr: true });
const RemoveAnnotationsTool = dynamic(() => import('@/components/tools/remove-annotations').then(m => m.RemoveAnnotationsTool), { ssr: true });
const FormFillerTool = dynamic(() => import('@/components/tools/form-filler').then(m => m.FormFillerTool), { ssr: true });
const FormCreatorTool = dynamic(() => import('@/components/tools/form-creator').then(m => m.FormCreatorTool), { ssr: true });
const RemoveBlankPagesTool = dynamic(() => import('@/components/tools/remove-blank-pages').then(m => m.RemoveBlankPagesTool), { ssr: true });
const PDFToImageTool = dynamic(() => import('@/components/tools/pdf-to-image').then(m => m.PDFToImageTool), { ssr: true });
const PDFToSVGTool = dynamic(() => import('@/components/tools/pdf-to-svg').then(m => m.PDFToSVGTool), { ssr: true });
const PDFToGreyscaleTool = dynamic(() => import('@/components/tools/pdf-to-greyscale').then(m => m.PDFToGreyscaleTool), { ssr: true });
const PDFToJSONTool = dynamic(() => import('@/components/tools/pdf-to-json').then(m => m.PDFToJSONTool), { ssr: true });
const PDFToDocxTool = dynamic(() => import('@/components/tools/pdf-to-docx').then(m => m.PDFToDocxTool), { ssr: true });
const PDFToPptxTool = dynamic(() => import('@/components/tools/pdf-to-pptx').then(m => m.PDFToPptxTool), { ssr: true });
const PDFToExcelTool = dynamic(() => import('@/components/tools/pdf-to-excel').then(m => m.PDFToExcelTool), { ssr: true });
const OCRPDFTool = dynamic(() => import('@/components/tools/ocr').then(m => m.OCRPDFTool), { ssr: true });
const LinearizePDFTool = dynamic(() => import('@/components/tools/linearize').then(m => m.LinearizePDFTool), { ssr: true });
const PageDimensionsTool = dynamic(() => import('@/components/tools/page-dimensions').then(m => m.PageDimensionsTool), { ssr: true });
const RemoveRestrictionsTool = dynamic(() => import('@/components/tools/remove-restrictions').then(m => m.RemoveRestrictionsTool), { ssr: true });
const RepairPDFTool = dynamic(() => import('@/components/tools/repair').then(m => m.RepairPDFTool), { ssr: true });
const EncryptPDFTool = dynamic(() => import('@/components/tools/encrypt').then(m => m.EncryptPDFTool), { ssr: true });
const DecryptPDFTool = dynamic(() => import('@/components/tools/decrypt').then(m => m.DecryptPDFTool), { ssr: true });
const SanitizePDFTool = dynamic(() => import('@/components/tools/sanitize').then(m => m.SanitizePDFTool), { ssr: true });
const FlattenPDFTool = dynamic(() => import('@/components/tools/flatten').then(m => m.FlattenPDFTool), { ssr: true });
const RemoveMetadataTool = dynamic(() => import('@/components/tools/remove-metadata').then(m => m.RemoveMetadataTool), { ssr: true });
const ChangePermissionsTool = dynamic(() => import('@/components/tools/change-permissions').then(m => m.ChangePermissionsTool), { ssr: true });
const WordToPDFTool = dynamic(() => import('@/components/tools/word-to-pdf').then(m => m.WordToPDFTool), { ssr: true });
const ExcelToPDFTool = dynamic(() => import('@/components/tools/excel-to-pdf').then(m => m.ExcelToPDFTool), { ssr: true });
const PPTXToPDFTool = dynamic(() => import('@/components/tools/pptx-to-pdf').then(m => m.PPTXToPDFTool), { ssr: true });
const XPSToPDFTool = dynamic(() => import('@/components/tools/xps-to-pdf').then(m => m.XPSToPDFTool), { ssr: true });
const RTFToPDFTool = dynamic(() => import('@/components/tools/rtf-to-pdf').then(m => m.RTFToPDFTool), { ssr: true });
const EPUBToPDFTool = dynamic(() => import('@/components/tools/epub-to-pdf').then(m => m.EPUBToPDFTool), { ssr: true });
const MOBIToPDFTool = dynamic(() => import('@/components/tools/mobi-to-pdf').then(m => m.MOBIToPDFTool), { ssr: true });
const FB2ToPDFTool = dynamic(() => import('@/components/tools/fb2-to-pdf').then(m => m.FB2ToPDFTool), { ssr: true });
const DJVUToPDFTool = dynamic(() => import('@/components/tools/djvu-to-pdf').then(m => m.DJVUToPDFTool), { ssr: true });
const DeskewPDFTool = dynamic(() => import('@/components/tools/deskew').then(m => m.DeskewPDFTool), { ssr: true });
const PDFBookletTool = dynamic(() => import('@/components/tools/pdf-booklet').then(m => m.PDFBookletTool), { ssr: true });
const RasterizePDFTool = dynamic(() => import('@/components/tools/rasterize').then(m => m.RasterizePDFTool), { ssr: true });
const MarkdownToPDFTool = dynamic(() => import('@/components/tools/markdown-to-pdf').then(m => m.MarkdownToPDFTool), { ssr: true });
const EmailToPDFTool = dynamic(() => import('@/components/tools/email-to-pdf').then(m => m.EmailToPDFTool), { ssr: true });
const CBZToPDFTool = dynamic(() => import('@/components/tools/cbz-to-pdf').then(m => m.CBZToPDFTool), { ssr: true });
const PDFToPDFATool = dynamic(() => import('@/components/tools/pdf-to-pdfa').then(m => m.PDFToPDFATool), { ssr: true });
const FontToOutlineTool = dynamic(() => import('@/components/tools/font-to-outline').then(m => m.FontToOutlineTool), { ssr: true });
const ExtractTablesTool = dynamic(() => import('@/components/tools/extract-tables').then(m => m.ExtractTablesTool), { ssr: true });
const OCGManagerTool = dynamic(() => import('@/components/tools/ocg-manager').then(m => m.OCGManagerTool), { ssr: true });
const PDFReaderTool = dynamic(() => import('@/components/tools/pdf-reader').then(m => m.PDFReaderTool), { ssr: true });

const registry: Record<string, Loader> = {
  'merge-pdf': () => <MergePDFTool />,
  'split-pdf': () => <SplitPDFTool />,
  'delete-pages': () => <DeletePagesTool />,
  'rotate-pdf': () => <RotatePDFTool />,
  'rotate-custom': () => <RotateCustomTool />,
  'add-blank-page': () => <AddBlankPageTool />,
  'reverse-pages': () => <ReversePagesTool />,
  'n-up-pdf': () => <NUpPDFTool />,
  'grid-combine': () => <GridCombineTool />,
  'alternate-merge': () => <AlternateMergeTool />,
  'divide-pages': () => <DividePagesTool />,
  'combine-single-page': () => <CombineSinglePageTool />,
  'posterize-pdf': () => <PosterizePDFTool />,
  'pdf-multi-tool': () => <PDFMultiTool />,
  'add-attachments': () => <AddAttachmentsTool />,
  'extract-attachments': () => <ExtractAttachmentsTool />,
  'extract-images': () => <ExtractImagesTool />,
  'edit-attachments': () => <EditAttachmentsTool />,
  'view-metadata': () => <ViewMetadataTool />,
  'edit-metadata': () => <EditMetadataTool />,
  'pdf-to-zip': () => <PDFsToZipTool />,
  'compare-pdfs': () => <ComparePDFsTool />,
  'edit-pdf': () => <EditPDFTool />,
  'image-to-pdf': () => <ImageToPDFTool />,
  'jpg-to-pdf': () => <ImageToPDFTool imageType="jpg" />,
  'png-to-pdf': () => <ImageToPDFTool imageType="png" />,
  'webp-to-pdf': () => <ImageToPDFTool imageType="webp" />,
  'bmp-to-pdf': () => <ImageToPDFTool imageType="bmp" />,
  'tiff-to-pdf': () => <ImageToPDFTool imageType="tiff" />,
  'svg-to-pdf': () => <ImageToPDFTool imageType="svg" />,
  'heic-to-pdf': () => <ImageToPDFTool imageType="heic" />,
  'psd-to-pdf': () => <PSDToPDFTool />,
  'txt-to-pdf': () => <TextToPDFTool />,
  'json-to-pdf': () => <JSONToPDFTool />,
  'compress-pdf': () => <CompressPDFTool />,
  'sign-pdf': () => <SignPDFTool />,
  'crop-pdf': () => <CropPDFTool />,
  'fix-page-size': () => <FixPageSizeTool />,
  'organize-pdf': () => <OrganizePDFTool />,
  'extract-pages': () => <ExtractPagesTool />,
  'bookmark': () => <BookmarkTool />,
  'page-numbers': () => <PageNumbersTool />,
  'add-watermark': () => <WatermarkTool />,
  'header-footer': () => <HeaderFooterTool />,
  'invert-colors': () => <InvertColorsTool />,
  'background-color': () => <BackgroundColorTool />,
  'text-color': () => <TextColorTool />,
  'table-of-contents': () => <TableOfContentsTool />,
  'add-stamps': () => <StampsTool />,
  'remove-annotations': () => <RemoveAnnotationsTool />,
  'form-filler': () => <FormFillerTool />,
  'form-creator': () => <FormCreatorTool />,
  'remove-blank-pages': () => <RemoveBlankPagesTool />,
  'pdf-to-jpg': () => <PDFToImageTool outputFormat="jpg" />,
  'pdf-to-png': () => <PDFToImageTool outputFormat="png" />,
  'pdf-to-webp': () => <PDFToImageTool outputFormat="webp" />,
  'pdf-to-bmp': () => <PDFToImageTool outputFormat="bmp" />,
  'pdf-to-tiff': () => <PDFToImageTool outputFormat="tiff" />,
  'pdf-to-svg': () => <PDFToSVGTool />,
  'pdf-to-greyscale': () => <PDFToGreyscaleTool />,
  'pdf-to-json': () => <PDFToJSONTool />,
  'pdf-to-docx': () => <PDFToDocxTool />,
  'pdf-to-pptx': () => <PDFToPptxTool />,
  'pdf-to-excel': () => <PDFToExcelTool />,
  'ocr-pdf': () => <OCRPDFTool />,
  'linearize-pdf': () => <LinearizePDFTool />,
  'page-dimensions': () => <PageDimensionsTool />,
  'remove-restrictions': () => <RemoveRestrictionsTool />,
  'repair-pdf': () => <RepairPDFTool />,
  'encrypt-pdf': () => <EncryptPDFTool />,
  'decrypt-pdf': () => <DecryptPDFTool />,
  'sanitize-pdf': () => <SanitizePDFTool />,
  'flatten-pdf': () => <FlattenPDFTool />,
  'remove-metadata': () => <RemoveMetadataTool />,
  'change-permissions': () => <ChangePermissionsTool />,
  'word-to-pdf': () => <WordToPDFTool />,
  'excel-to-pdf': () => <ExcelToPDFTool />,
  'pptx-to-pdf': () => <PPTXToPDFTool />,
  'xps-to-pdf': () => <XPSToPDFTool />,
  'rtf-to-pdf': () => <RTFToPDFTool />,
  'epub-to-pdf': () => <EPUBToPDFTool />,
  'mobi-to-pdf': () => <MOBIToPDFTool />,
  'fb2-to-pdf': () => <FB2ToPDFTool />,
  'djvu-to-pdf': () => <DJVUToPDFTool />,
  'deskew-pdf': () => <DeskewPDFTool />,
  'pdf-booklet': () => <PDFBookletTool />,
  'rasterize-pdf': () => <RasterizePDFTool />,
  'markdown-to-pdf': () => <MarkdownToPDFTool />,
  'email-to-pdf': () => <EmailToPDFTool />,
  'cbz-to-pdf': () => <CBZToPDFTool />,
  'pdf-to-pdfa': () => <PDFToPDFATool />,
  'font-to-outline': () => <FontToOutlineTool />,
  'extract-tables': () => <ExtractTablesTool />,
  'ocg-manager': () => <OCGManagerTool />,
  'pdf-reader': () => <PDFReaderTool />,
};

export default function ToolLoader({ toolId }: { toolId: string }) {
  const render = registry[toolId];
  if (!render) return null;
  return <>{render()}</>;
}
