import { StickerSet } from '../types';

const GIST_ID_KEY = 'latelier_gist_id';
const GITHUB_TOKEN_KEY = 'latelier_github_token';
const GIST_FILENAME = 'sticker-sets.json';

export interface SyncStatus {
  syncing: boolean;
  lastSync?: Date;
  error?: string;
}

/**
 * GitHub Gist Sync Service
 * Manages synchronization of sticker data with GitHub Gist
 */
export class GitHubSyncService {
  private token: string | null = null;
  private gistId: string | null = null;

  constructor() {
    // Load saved token and gist ID from localStorage
    this.token = localStorage.getItem(GITHUB_TOKEN_KEY);
    this.gistId = localStorage.getItem(GIST_ID_KEY);
  }

  /**
   * Check if user is logged in (has token)
   */
  isLoggedIn(): boolean {
    return !!this.token;
  }

  /**
   * Login with GitHub Personal Access Token
   */
  async login(token: string): Promise<void> {
    // Validate token by making a test API call
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid GitHub token');
      }

      this.token = token;
      localStorage.setItem(GITHUB_TOKEN_KEY, token);
    } catch (error) {
      throw new Error('GitHub 登入失敗：Token 無效或沒有權限');
    }
  }

  /**
   * Logout and clear stored credentials
   */
  logout(): void {
    this.token = null;
    this.gistId = null;
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    localStorage.removeItem(GIST_ID_KEY);
  }

  /**
   * Upload sticker sets to GitHub Gist
   */
  async upload(stickerSets: StickerSet[]): Promise<void> {
    if (!this.token) {
      throw new Error('未登入 GitHub');
    }

    // Validate data before upload
    let content: string;
    try {
      content = JSON.stringify(stickerSets, null, 2);

      // Verify JSON can be parsed back (validation)
      const testParse = JSON.parse(content);
      if (!Array.isArray(testParse)) {
        throw new Error('資料序列化後格式不正確');
      }
    } catch (error: any) {
      throw new Error(`資料格式化失敗：${error.message}`);
    }

    // Check size (GitHub Gist has 10MB limit per file)
    const sizeInBytes = new Blob([content]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 10) {
      throw new Error(`資料太大（${sizeInMB.toFixed(2)} MB），超過 GitHub Gist 10MB 限制。請減少貼圖集數量或圖片大小。`);
    }

    if (sizeInMB > 5) {
      console.warn(`Warning: Data size is ${sizeInMB.toFixed(2)} MB, approaching Gist limit`);
    }

    try {
      if (this.gistId) {
        // Update existing gist
        await this.updateGist(content);
      } else {
        // Create new gist
        await this.createGist(content);
      }
    } catch (error: any) {
      // Check if error is related to size or content
      if (error.message && error.message.includes('too large')) {
        throw new Error('上傳失敗：資料超過 GitHub 限制，請減少貼圖集數量');
      }
      throw new Error(`上傳失敗：${error.message}`);
    }
  }

  /**
   * Download sticker sets from GitHub Gist
   */
  async download(): Promise<StickerSet[]> {
    if (!this.token) {
      throw new Error('未登入 GitHub');
    }

    try {
      // If no gist ID is stored, try to find it by searching user's gists
      if (!this.gistId) {
        await this.findGistByDescription();
      }

      // If still no gist ID after searching, return empty array
      if (!this.gistId) {
        return [];
      }

      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Gist not found, clear stored ID and return empty
          this.gistId = null;
          localStorage.removeItem(GIST_ID_KEY);
          return [];
        }
        if (response.status === 401) {
          throw new Error('Token 已過期，請重新登入');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const gist = await response.json();
      const file = gist.files[GIST_FILENAME];

      if (!file) {
        return [];
      }

      // Check if content was truncated by GitHub API
      let content: string;
      if (file.truncated) {
        console.log('Content was truncated, fetching from raw_url:', file.raw_url);

        // Fetch full content from raw_url
        const rawResponse = await fetch(file.raw_url, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!rawResponse.ok) {
          throw new Error(`無法獲取完整內容 (HTTP ${rawResponse.status})`);
        }

        content = await rawResponse.text();
      } else {
        content = file.content;
      }

      // Check if content is empty or invalid
      if (!content || content.trim() === '') {
        console.warn('Gist content is empty');
        return [];
      }

      // Check if content is HTML instead of JSON (common error)
      if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
        throw new Error('雲端資料格式錯誤（保存了 HTML 而不是 JSON）。請刪除雲端的 Gist 並重新上傳。');
      }

      // Check content size
      const sizeInBytes = new Blob([content]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      console.log(`Downloading ${sizeInMB.toFixed(2)} MB of data from Gist`);

      // Try to parse JSON with better error handling
      try {
        const parsedData = JSON.parse(content);

        // Validate that the parsed data is an array
        if (!Array.isArray(parsedData)) {
          throw new Error('下載的資料格式不正確（應該是陣列）');
        }

        return parsedData;
      } catch (parseError: any) {
        // Provide detailed error information
        console.error('JSON parse error:', parseError);
        console.error('Content length:', content.length);
        console.error('Content preview (first 200 chars):', content.substring(0, 200));
        console.error('Content preview (last 200 chars):', content.substring(Math.max(0, content.length - 200)));

        if (parseError.message.includes('下載的資料格式不正確')) {
          throw parseError;
        }

        // Check if JSON was truncated
        if (parseError.message.includes('Unterminated') || parseError.message.includes('Unexpected end')) {
          throw new Error('下載的資料不完整，可能在上傳時被截斷。請重新上傳資料到雲端。');
        }

        throw new Error(`下載的資料格式錯誤：${parseError.message}`);
      }
    } catch (error: any) {
      // Log the full error for debugging
      console.error('GitHub download error:', error);

      // If error already has a clear message, use it
      if (error.message.includes('Token') ||
          error.message.includes('權限') ||
          error.message.includes('Gist') ||
          error.message.includes('資料格式')) {
        throw error;
      }

      // Provide more specific error messages
      if (error.name === 'SyntaxError') {
        throw new Error('下載失敗：雲端資料格式損壞，請檢查 GitHub Gist');
      }

      if (error.message.includes('fetch')) {
        throw new Error('下載失敗：網路連線問題，請檢查網路設定');
      }

      throw new Error(`下載失敗：${error.message}`);
    }
  }

  /**
   * Search for the backup gist by description
   * This allows devices to find the same gist even without the stored ID
   */
  private async findGistByDescription(): Promise<void> {
    if (!this.token) return;

    try {
      // Fetch user's gists
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token 已過期或無效，請重新登入');
        } else if (response.status === 403) {
          throw new Error('Token 權限不足，請確認已勾選「gist」權限');
        }
        throw new Error(`無法取得 Gist 列表 (HTTP ${response.status})`);
      }

      const gists = await response.json();

      // Find the gist with our backup description
      const backupGist = gists.find((gist: any) =>
        gist.description === "L'Atelier de Stickers - Backup"
      );

      if (backupGist) {
        // Store the found gist ID
        this.gistId = backupGist.id;
        localStorage.setItem(GIST_ID_KEY, backupGist.id);
      }
    } catch (error: any) {
      // Re-throw the error so it can be caught by the download function
      throw error;
    }
  }

  /**
   * Create a new private gist
   */
  private async createGist(content: string): Promise<void> {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: "L'Atelier de Stickers - Backup",
        public: false,
        files: {
          [GIST_FILENAME]: {
            content
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create gist');
    }

    const gist = await response.json();
    this.gistId = gist.id;
    localStorage.setItem(GIST_ID_KEY, gist.id);
  }

  /**
   * Update existing gist
   */
  private async updateGist(content: string): Promise<void> {
    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update gist');
    }
  }

  /**
   * Get last sync time from Gist
   */
  async getLastSyncTime(): Promise<Date | null> {
    if (!this.token || !this.gistId) {
      return null;
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const gist = await response.json();
      return new Date(gist.updated_at);
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
export const githubSync = new GitHubSyncService();
