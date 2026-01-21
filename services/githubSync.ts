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

    try {
      if (this.gistId) {
        // Update existing gist
        await this.updateGist(content);
      } else {
        // Create new gist
        await this.createGist(content);
      }
    } catch (error: any) {
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

    // If no gist ID is stored, try to find it by searching user's gists
    if (!this.gistId) {
      await this.findGistByDescription();
    }

    // If still no gist ID after searching, return empty array
    if (!this.gistId) {
      return [];
    }

    try {
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
        throw new Error(`HTTP ${response.status}`);
      }

      const gist = await response.json();
      const file = gist.files[GIST_FILENAME];

      if (!file) {
        return [];
      }

      const content = file.content;
      return JSON.parse(content);
    } catch (error: any) {
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
        return;
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
    } catch (error) {
      console.error('Failed to search for gist:', error);
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
