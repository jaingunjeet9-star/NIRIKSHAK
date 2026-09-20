/**
 * Browser-compatible file saver utility.
 * Creates a temporary anchor element, triggers a download, then cleans up.
 * Works with Blob objects from docx (Packer.toBlob), jsPDF, etc.
 */
export function saveAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
