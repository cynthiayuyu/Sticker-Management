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

    const content = JSON.stringify(stickerSets, null, 2);
    console.log(`[GitHub Sync] 準備上傳 ${stickerSets.length} 個貼圖集`);

    try {
      if (this.gistId) {
        console.log('[GitHub Sync] 更新現有 Gist:', this.gistId);
        // Update existing gist
        await this.updateGist(content);
      } else {
        console.log('[GitHub Sync] 建立新的 Gist');
        // Create new gist
        await this.createGist(content);
        console.log('[GitHub Sync] 新 Gist 建立成功，ID:', this.gistId);
      }
    } catch (error: any) {
      console.error('[GitHub Sync] 上傳失敗:', error);
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
      console.log('[GitHub Sync] 開始下載，當前 Gist ID:', this.gistId);

      // If no gist ID is stored, try to find it by searching user's gists
      if (!this.gistId) {
        console.log('[GitHub Sync] 本地無 Gist ID，開始搜索...');
        await this.findGistByDescription();
      }

      // If still no gist ID after searching, return empty array
      if (!this.gistId) {
        console.warn('[GitHub Sync] 搜索後仍未找到 Gist ID');
        return [];
      }

      console.log('[GitHub Sync] 從 Gist 下載資料:', this.gistId);
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        console.error('[GitHub Sync] 下載失敗:', response.status);
        if (response.status === 404) {
          // Gist not found, clear stored ID and return empty
          console.warn('[GitHub Sync] Gist 不存在，清除本地 ID');
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
        console.warn('[GitHub Sync] Gist 中未找到檔案:', GIST_FILENAME);
        return [];
      }

      const content = file.content;
      const data = JSON.parse(content);
      console.log(`[GitHub Sync] 成功下載 ${data.length} 個貼圖集`);
      return data;
    } catch (error: any) {
      console.error('[GitHub Sync] 下載時發生錯誤:', error);
      // If error already has a clear message, use it
      if (error.message.includes('Token') || error.message.includes('權限') || error.message.includes('Gist')) {
        throw error;
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
      console.log('[GitHub Sync] 搜索用戶的 Gists...');
      // Fetch user's gists
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        console.error('[GitHub Sync] 取得 Gist 列表失敗:', response.status);
        if (response.status === 401) {
          throw new Error('Token 已過期或無效，請重新登入');
        } else if (response.status === 403) {
          throw new Error('Token 權限不足，請確認已勾選「gist」權限');
        }
        throw new Error(`無法取得 Gist 列表 (HTTP ${response.status})`);
      }

      const gists = await response.json();
      console.log(`[GitHub Sync] 找到 ${gists.length} 個 Gists`);

      // Find the gist with our backup description
      const backupGist = gists.find((gist: any) =>
        gist.description === "L'Atelier de Stickers - Backup"
      );

      if (backupGist) {
        console.log('[GitHub Sync] 找到備份 Gist:', backupGist.id);
        // Store the found gist ID
        this.gistId = backupGist.id;
        localStorage.setItem(GIST_ID_KEY, backupGist.id);
      } else {
        console.warn('[GitHub Sync] 未找到備份 Gist');
      }
    } catch (error: any) {
      console.error('[GitHub Sync] 搜索 Gist 時發生錯誤:', error);
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
