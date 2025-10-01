import JSZip from 'jszip';
import type { WorkbenchImage } from '../types';

/**
 * Downloads a single image to the user's device
 */
export async function downloadSingleImage(image: WorkbenchImage): Promise<void> {
  try {
    const response = await fetch(image.url);
    const blob = await response.blob();

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const extension = image.file?.type.split('/')[1] || 'png';
    const filename = `bananaboard-${timestamp}.${extension}`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw error;
  }
}

/**
 * Downloads multiple images (individually for 2 images, as ZIP for 3+)
 */
export async function downloadMultipleImages(images: WorkbenchImage[]): Promise<void> {
  if (images.length === 0) return;

  if (images.length === 1) {
    return downloadSingleImage(images[0]);
  }

  if (images.length === 2) {
    // Download individually with small delay to prevent popup blocker
    for (let i = 0; i < images.length; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await downloadSingleImage(images[i]);
    }
    return;
  }

  // 3+ images: create ZIP
  return downloadImagesAsZip(images);
}

/**
 * Downloads multiple images as a single ZIP file
 */
async function downloadImagesAsZip(images: WorkbenchImage[]): Promise<void> {
  try {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // Add each image to the ZIP
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const response = await fetch(image.url);
      const blob = await response.blob();

      // Generate filename for each image
      const extension = image.file?.type.split('/')[1] || blob.type.split('/')[1] || 'png';
      const filename = `image-${i + 1}.${extension}`;

      zip.file(filename, blob);
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bananaboard-images-${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to create ZIP:', error);
    throw error;
  }
}

/**
 * Copies a single image to the clipboard
 * Note: Only works for single images, not multiple
 */
export async function copyImageToClipboard(image: WorkbenchImage): Promise<void> {
  try {
    const response = await fetch(image.url);
    const blob = await response.blob();

    // Check if clipboard API is supported
    if (!navigator.clipboard || !ClipboardItem) {
      throw new Error('Clipboard API not supported');
    }

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    throw error;
  }
}