const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const config = require('../../utils/env');
const { decryptToken } = require('../../utils/cryptoUtils');
const logger = require('../../utils/logger');

class GithubApiService {
  /**
   * Helper to create an authenticated Octokit client
   */
  getOctokit(accessToken) {
    return new Octokit({
      auth: accessToken
    });
  }

  /**
   * Get repositories accessible by the user
   */
  async getUserRepositories(user) {
    if (!user || !user.accessTokenEncrypted) {
      return [];
    }

    const token = decryptToken(user.accessTokenEncrypted, config.sessionSecret);
    if (!token) {
      return [];
    }

    try {
      const octokit = this.getOctokit(token);
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 50
      });

      return data.map(repo => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        defaultBranch: repo.default_branch,
        cloneUrl: repo.clone_url,
        htmlUrl: repo.html_url,
        description: repo.description,
        isPrivate: repo.private
      }));
    } catch (err) {
      logger.error(`[GitHub API] Failed to fetch repositories: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get pull requests for a repository from GitHub
   */
  async getPullRequests(owner, repo, accessToken) {
    const octokit = this.getOctokit(accessToken);
    try {
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc'
      });

      return data.map(pr => ({
        id: String(pr.id),
        number: pr.number,
        title: pr.title,
        description: pr.body,
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref,
        commitSha: pr.head.sha,
        state: pr.state.toUpperCase(),
        author: pr.user.login,
        htmlUrl: pr.html_url
      }));
    } catch (err) {
      logger.error(`[GitHub API] Failed to fetch PRs for ${owner}/${repo}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get changed files in a pull request
   */
  async getPullRequestFiles(owner, repo, pullNumber, accessToken) {
    try {
      const octokit = this.getOctokit(accessToken);
      const { data } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber
      });

      return data.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch
      }));
    } catch (err) {
      logger.warn(`[GitHub API] Could not fetch changed files for PR #${pullNumber}: ${err.message}`);
      return [];
    }
  }

  /**
   * Download tarball archive of repository at exact commit SHA
   */
  async downloadCommitArchive(owner, repo, commitSha, accessToken) {
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'BuildDeck-Preview-Engine'
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/tarball/${commitSha}`;
    const response = await axios.get(url, {
      headers,
      responseType: 'stream'
    });

    return response.data;
  }
}

module.exports = new GithubApiService();
