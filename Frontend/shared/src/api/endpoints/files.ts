// Files API endpoints

export const FILES_ENDPOINTS = {
  UPLOAD: '/files/upload',
  GET_DOWNLOAD_URL: (fileId: number) => `/files/${fileId}/download`,
} as const;
