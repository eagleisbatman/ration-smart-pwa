import { ref } from 'vue';

export function useImageUpload() {
  const imageData = ref<string | null>(null); // base64 data URL
  const isCapturing = ref(false);

  // Capture from camera
  async function captureFromCamera(): Promise<string | null> {
    return selectImage('environment'); // Use rear camera
  }

  // Select from gallery
  async function selectFromGallery(): Promise<string | null> {
    return selectImage();
  }

  // Core: create a hidden input[type=file], trigger it, read as base64
  async function selectImage(capture?: string): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (capture) {
        input.setAttribute('capture', capture);
      }
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        isCapturing.value = true;
        try {
          const compressed = await compressImage(file, 800, 0.7);
          imageData.value = compressed;
          resolve(compressed);
        } finally {
          isCapturing.value = false;
        }
      };
      input.click();
    });
  }

  // Compress image to max dimension and quality
  async function compressImage(
    file: File,
    maxDimension: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  function clearImage() {
    imageData.value = null;
  }

  return {
    imageData,
    isCapturing,
    captureFromCamera,
    selectFromGallery,
    clearImage,
  };
}
