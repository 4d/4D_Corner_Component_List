// Verifies new/modified entries of OfficialComponents.json against the README requirements and comments on the PR.
module.exports = async ({ github, context, core }) => {
  const FILE = 'OfficialComponents.json';
  const MARKER = '<!-- component-check-bot -->';
  const README_URL = 'https://github.com/4d/4D_Corner_Component_List#requirements';
  const REQUIRED_TOPIC = '4d-component';
  const GITHUB_REPO_RE = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;
  const SEMVER_RE = /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
  const ICON_RE = /^(?:logo|(?:.*\/)?Resources\/logo)\.(?:svg|png)$/i;
  const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

  const pr = context.payload.pull_request;
  const ok = (v) => (v ? '✅' : '❌');
  const keyOf = (url) => (typeof url === 'string' ? url.trim().toLowerCase().replace(/\.git$/, '').replace(/\/+$/, '') : '');

  // Reads and parses the JSON file at a given ref (content is treated as data only)
  const loadList = async (owner, repo, ref) => {
    try {
      const { data } = await github.rest.repos.getContent({ owner, repo, path: FILE, ref });
      const list = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
      if (!Array.isArray(list)) return { error: 'the root element must be an array' };
      return { list };
    } catch (e) {
      return { error: e.message };
    }
  };

  // Creates or updates the single bot comment on the PR
  const upsertComment = async (body) => {
    const full = `${MARKER}\n${body}`;
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...context.repo, issue_number: pr.number, per_page: 100,
    });
    const existing = comments.find((c) => c.user?.type === 'Bot' && c.body?.includes(MARKER));
    if (existing) {
      await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body: full });
    } else {
      await github.rest.issues.createComment({ ...context.repo, issue_number: pr.number, body: full });
    }
  };

  // Checks a single entry against every README requirement
  const checkEntry = async (entry) => {
    const r = {
      title: typeof entry?.title === 'string' ? entry.title.trim() : '',
      url: entry?.repository,
      jsonErrors: [],
      description: false, topic: false, topics: [], license: false, readme: false,
      icon: false, logoUrl: null, logoOk: null,
      release: false, zipName: null, tag: null, semver: false,
    };

    if (!r.title) r.jsonErrors.push('`title` is missing or empty');
    const m = typeof r.url === 'string' ? r.url.trim().match(GITHUB_REPO_RE) : null;
    if (!m) r.jsonErrors.push('`repository` must be a valid GitHub repository URL (https://github.com/owner/repo)');
    if (entry?.path_logo !== undefined) {
      if (typeof entry.path_logo === 'string' && /^https:\/\//i.test(entry.path_logo)) r.logoUrl = entry.path_logo;
      else r.jsonErrors.push('`path_logo` must be an https URL');
    }
    if (!m) return r;

    const [, owner, repo] = m;
    let info;
    try {
      ({ data: info } = await github.rest.repos.get({ owner, repo }));
    } catch (e) {
      r.jsonErrors.push(`repository \`${owner}/${repo}\` not found or not public`);
      return r;
    }
    r.htmlUrl = info.html_url;

    r.description = !!(info.description && info.description.trim());
    r.topics = info.topics || [];
    r.topic = r.topics.includes(REQUIRED_TOPIC);
    r.license = !!info.license;

    try {
      await github.rest.repos.getReadme({ owner, repo });
      r.readme = true;
    } catch { /* no README */ }

    // path_logo takes precedence; otherwise look for logo.svg/png at the root or in a Resources folder
    if (r.logoUrl) {
      try {
        let res = await fetch(r.logoUrl, { method: 'HEAD', redirect: 'follow' });
        if (!res.ok) res = await fetch(r.logoUrl, { redirect: 'follow' });
        r.logoOk = res.ok;
      } catch {
        r.logoOk = false;
      }
      r.icon = r.logoOk;
    } else {
      try {
        const { data: tree } = await github.rest.git.getTree({ owner, repo, tree_sha: info.default_branch, recursive: 'true' });
        r.icon = tree.tree.some((t) => t.type === 'blob' && ICON_RE.test(t.path));
      } catch { /* empty repo */ }
    }

    // Latest release must contain <repo name>.zip and use a semver tag
    r.zipName = `${info.name}.zip`;
    try {
      const { data: rel } = await github.rest.repos.getLatestRelease({ owner, repo });
      r.tag = rel.tag_name;
      r.semver = SEMVER_RE.test(rel.tag_name);
      r.release = rel.assets.some((a) => a.name === r.zipName);
    } catch { /* no release */ }

    return r;
  };

  // Loads base and head versions of the file
  const base = await loadList(context.repo.owner, context.repo.repo, pr.base.sha);
  if (!pr.head.repo) {
    core.setFailed('Head repository is no longer available.');
    return;
  }
  const head = await loadList(pr.head.repo.owner.login, pr.head.repo.name, pr.head.sha);

  if (head.error) {
    await upsertComment(`Thanks for the contribution! Unfortunately \`${FILE}\` could not be parsed:\n\n\`\`\`\n${head.error}\n\`\`\`\n\nPlease fix the JSON syntax so the entries can be checked.`);
    core.setFailed(`Invalid ${FILE}: ${head.error}`);
    return;
  }

  // Detects new or modified entries (keyed by repository URL) and duplicates
  const baseMap = new Map((base.list || []).map((e) => [keyOf(e?.repository), JSON.stringify(e)]));
  const seen = new Map();
  const duplicates = [];
  for (const e of head.list) {
    const k = keyOf(e?.repository);
    if (k && seen.has(k)) duplicates.push(e.repository);
    seen.set(k, true);
  }
  const changed = head.list.filter((e) => baseMap.get(keyOf(e?.repository)) !== JSON.stringify(e));

  if (changed.length === 0 && duplicates.length === 0) {
    await upsertComment('Thanks for the contribution! No new or modified entries were detected in `OfficialComponents.json`, nothing to check.');
    return;
  }

  const results = [];
  for (const e of changed) results.push(await checkEntry(e));

  // Builds the summary table
  const n = results.length;
  const countLabel = `${NUMBERS[n] ?? n} new ${n > 1 ? 'entries' : 'entry'}`;
  const lines = [];
  lines.push(`Thanks for the contribution! I checked the ${countLabel} against the [README requirements](${README_URL}).`, '');
  lines.push('| Component | Description | `4d-component` topic | License | README | Icon | Release + ZIP | Semver tag |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    const tag = r.tag ? `${ok(r.semver)} \`${r.tag}\`` : '❌';
    lines.push(`| ${r.title || '_(no title)_'} | ${ok(r.description)} | ${ok(r.topic)} | ${ok(r.license)} | ${ok(r.readme)} | ${ok(r.icon)} | ${ok(r.release)} | ${tag} |`);
  }
  lines.push('');

  const withLogo = results.filter((r) => r.logoUrl);
  if (withLogo.length) {
    const badLogo = withLogo.filter((r) => !r.logoOk);
    if (badLogo.length === 0) lines.push('All `path_logo` URLs resolve correctly.', '');
    else lines.push('The following `path_logo` URLs do not resolve:', ...badLogo.map((r) => `- ${r.logoUrl}`), '');
  }

  // Groups failures by requirement
  const link = (r) => r.htmlUrl || r.url;
  const actions = [];
  const addAction = (filter, intro, fmt, why) => {
    const list = results.filter((r) => r.htmlUrl && filter(r));
    if (list.length) actions.push({ intro, items: list.map(fmt), why });
  };
  addAction((r) => !r.topic,
    'please add the `4d-component` topic to the following repositories (repository page → ⚙️ next to "About" → Topics):',
    (r) => `- ${link(r)} (current topics: ${r.topics.length ? r.topics.map((t) => `\`${t}\``).join(', ') : 'none'})`,
    'This topic is required so the components are indexed properly.');
  addAction((r) => !r.description,
    'please add a clear description to the following repositories (repository page → ⚙️ next to "About" → Description):',
    (r) => `- ${link(r)}`,
    'The description should explain what the component does.');
  addAction((r) => !r.license,
    'please add a license file (e.g. MIT, Apache 2.0) to the following repositories:',
    (r) => `- ${link(r)}`,
    'A license tells others how the component can be used and shared.');
  addAction((r) => !r.readme,
    'please add a README explaining installation and usage to the following repositories:',
    (r) => `- ${link(r)}`,
    'A README helps other developers quickly understand and adopt the component.');
  addAction((r) => !r.icon,
    'please add a `logo.svg` or `logo.png` at the root or in the `Resources` folder (or set a valid `path_logo`) for:',
    (r) => `- ${link(r)}`,
    'The icon is displayed in the 4D Corner.');
  addAction((r) => !r.release,
    'please publish a GitHub Release containing a ZIP asset named exactly like the repository:',
    (r) => `- ${link(r)} (expected asset: \`${r.zipName}\`${r.tag ? `, latest release: \`${r.tag}\`` : ', no release found'})`,
    'The ZIP is required for installation through the Component Manager.');
  addAction((r) => r.release && !r.semver,
    'please use a semantic version tag (`major.minor.patch`, e.g. `1.2.3`) for the latest release of:',
    (r) => `- ${link(r)} (current tag: \`${r.tag}\`)`,
    'Semantic versioning lets the Component Manager resolve versions.');

  // JSON-level problems
  const jsonIssues = results.flatMap((r) => r.jsonErrors.map((err) => `- **${r.title || r.url || 'entry'}**: ${err}`));
  jsonIssues.push(...duplicates.map((d) => `- Duplicate entry for ${d}`));
  if (jsonIssues.length) lines.push('**JSON issues in `OfficialComponents.json`:**', ...jsonIssues, '');

  for (const a of actions) {
    lines.push(`**Action required:** ${a.intro}`, ...a.items, '', a.why, '');
  }

  const failed = actions.length > 0 || jsonIssues.length > 0;
  if (failed) {
    lines.push(actions.length === 1 && jsonIssues.length === 0 && actions[0].intro.includes('topic')
      ? 'Once it is added, this PR can be merged.'
      : 'Once these points are fixed, this PR can be merged.');
  } else {
    lines.push('All requirements are met, this PR can be merged.');
  }

  await upsertComment(lines.join('\n'));
  if (failed) core.setFailed('Some component entries do not meet the README requirements.');
};
