// dsh-project-guide — host half (v2, tree-first).
//
// 打开项目只做一件事：把整棵目录树扫出来（只 readdir，不读文件内容、不调模型）。
// 解释按需生成：点开节点给事实，点「详细」才请模型写人话。
import { readdir, stat, readFile } from 'node:fs/promises'
import { join, resolve, extname, sep } from 'node:path'

/** Cordis 插件名，与 cordis.patch.yml 的 insert id 一致。 */
export const name = 'project-guide'
/** 只依赖 http 载体；模型与工作区服务都是可选的。 */
export const inject = ['webServer']

const API = '/api/project-guide'

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out', '.next', '.nuxt',
  '.output', '.vercel', '.svelte-kit', 'coverage', '.cache', '.parcel-cache',
  '__pycache__', '.venv', 'venv', 'env', '.idea', '.vscode', '.DS_Store',
  'target', 'obj', 'vendor', 'bin', 'pods', '.turbo', '.pnpm-store', 'tmp', 'logs',
])

const SKIP_FILES = new Set([
  '.DS_Store', 'Thumbs.db', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
  'bun.lockb', '.gitignore', '.gitattributes', '.npmrc', '.editorconfig',
])

const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro'])

/** 根目录里「像入口」的散文件，用于「从这看起」。 */
const ENTRY_FILES = /^(index\.(html?|js|ts|jsx|tsx|vue)|main\.(js|mjs|ts|py|go|rs)|app\.(js|ts|py|vue)|server\.(js|ts|mjs)|manage\.py|Makefile|docker-compose\.ya?ml)$/i

/** 目录树递归深度上限。 */
const MAX_DEPTH = 8
/** 树里节点总数上限，防止超大仓库把浏览器撑爆。 */
const MAX_NODES_TREE = 5000
/** 单个目录最多列出的文件数，超出部分标记截断。 */
const MAX_FILES_LIST = 200
/** 算引用关系时每个目录最多读的代码文件数。 */
const MAX_REF_FILES = 30
/** 单文件读取上限。 */
const MAX_FILE_BYTES = 400 * 1024
/** 发给模型的代码摘录行数。 */
const CODE_EXCERPT_LINES = 140
/** 目录树缓存存活时间；目录 mtime 不随深层变化，所以加个上限。 */
const TREE_TTL = 30_000

/** 中文 / 英文混排的稳定排序：文件夹在前，组内自然序。 */
const collator = new Intl.Collator(['zh-Hans-CN', 'en'], { numeric: true, sensitivity: 'base' })

const treeCache = new Map()
const detailCache = new Map()

const slash = (p) => p.split(sep).join('/')
const isCode = (f) => CODE_EXT.has(extname(f).toLowerCase())
const joinPath = (base, name) => (base === '' ? name : base + '/' + name)

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

function isSameOriginRequest(req) {
  const site = req.headers['sec-fetch-site']
  if (typeof site === 'string' && site === 'cross-site') return false
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    const host = req.headers.host
    if (typeof host !== 'string' || host === '') return false
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      return false
    }
  }
  return true
}

function requireSameOrigin(req, res) {
  if (isSameOriginRequest(req)) return true
  json(res, 403, { ok: false, error: 'cross-site-request-rejected' })
  return false
}

/* ───────────────────────── 扫描：事实层 ───────────────────────── */

async function listDir(abs) {
  try {
    return await readdir(abs, { withFileTypes: true })
  } catch {
    return []
  }
}

function makeDirNode(name, path, depth) {
  return {
    name,
    path,
    kind: 'dir',
    depth,
    fileCount: 0,
    hasCode: false,
    ext: [],
    children: [],
    truncated: false,
  }
}

/** 文件夹在前，组内按名称。 */
function byKindThenName(a, b) {
  if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
  return collator.compare(a.name, b.name)
}

function topExt(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}

/**
 * 一次递归：边列目录边建节点，文件数在回溯时累加。
 * budget 是全局的，耗尽后只标记 truncated，不再往下展开。
 */
async function walkDir(abs, node, budget) {
  const entries = await listDir(abs)
  const dirNames = []
  const fileNames = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      dirNames.push(entry.name)
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue
      fileNames.push(entry.name)
    }
  }
  dirNames.sort(collator.compare)
  fileNames.sort(collator.compare)

  const ext = new Map()
  let count = 0
  let hasCode = false
  for (const name of fileNames) {
    const e = extname(name).toLowerCase() || '(无扩展名)'
    ext.set(e, (ext.get(e) ?? 0) + 1)
    budget.ext.set(e, (budget.ext.get(e) ?? 0) + 1)
    if (CODE_EXT.has(e)) hasCode = true
    count += 1
  }

  for (const name of dirNames) {
    if (budget.nodes <= 0) {
      budget.truncated = true
      break
    }
    const child = makeDirNode(name, joinPath(node.path, name), node.depth + 1)
    budget.nodes -= 1
    budget.dirs += 1
    node.children.push(child)
    if (child.depth < MAX_DEPTH) {
      const sub = await walkDir(join(abs, name), child, budget)
      count += sub.count
      if (sub.hasCode) hasCode = true
      for (const [k, v] of sub.ext) ext.set(k, (ext.get(k) ?? 0) + v)
    } else {
      child.truncated = true
    }
  }

  const shown = fileNames.slice(0, MAX_FILES_LIST)
  if (shown.length < fileNames.length) node.truncated = true
  for (const name of shown) {
    if (budget.nodes <= 0) {
      budget.truncated = true
      break
    }
    const e = extname(name).toLowerCase()
    budget.nodes -= 1
    node.children.push({
      name,
      path: joinPath(node.path, name),
      kind: 'file',
      depth: node.depth + 1,
      fileCount: 1,
      hasCode: CODE_EXT.has(e),
      ext: [[e || '(无扩展名)', 1]],
      children: [],
      truncated: false,
    })
  }

  node.children.sort(byKindThenName)
  node.fileCount = count
  node.hasCode = hasCode
  node.ext = topExt(ext, 3)
  return { count, hasCode, ext }
}

/**
 * 扫整棵树。force=true 时忽略缓存（「重新读一遍结构」）。
 * 返回 { ok, root, name, tree, stats } 或 { ok:false, error }。
 */
async function scanTree(rootPath, force) {
  const rootAbs = resolve(rootPath)
  const info = await stat(rootAbs).catch(() => null)
  if (!info || !info.isDirectory()) return { ok: false, error: '这不是一个能打开的文件夹' }

  const hit = treeCache.get(rootAbs)
  if (!force && hit && Date.now() - hit.at < TREE_TTL) return hit.payload

  const name = info.name || rootAbs.split(sep).filter(Boolean).pop() || 'project'
  const root = makeDirNode(name, '', 0)
  const budget = { nodes: MAX_NODES_TREE - 1, dirs: 0, truncated: false, ext: new Map() }
  await walkDir(rootAbs, root, budget)

  const payload = {
    ok: true,
    root: slash(rootAbs),
    name,
    tree: root,
    stats: {
      files: root.fileCount,
      dirs: budget.dirs,
      truncated: budget.truncated,
      languages: topExt(budget.ext, 8),
      entries: root.children
        .filter((child) => child.kind === 'file' && ENTRY_FILES.test(child.name))
        .slice(0, 5)
        .map((child) => child.path),
      biggest: root.children
        .filter((child) => child.kind === 'dir')
        .slice()
        .sort((a, b) => b.fileCount - a.fileCount)
        .slice(0, 5)
        .map((child) => ({ name: child.name, path: child.path, fileCount: child.fileCount })),
    },
  }
  treeCache.set(rootAbs, { at: Date.now(), payload })
  return payload
}

/** rel 为空表示根；越界返回 null。用分隔符判断，避免 /proj 命中 /proj-secret。 */
function insidePath(rootAbs, rel) {
  const abs = resolve(rootAbs, String(rel ?? ''))
  if (abs === rootAbs) return abs
  const base = rootAbs.endsWith(sep) ? rootAbs : rootAbs + sep
  return abs.startsWith(base) ? abs : null
}

/** 按路径在树里找节点。 */
function findNode(root, rel) {
  if (!rel) return root
  const parts = String(rel).replace(/\\/g, '/').split('/').filter(Boolean)
  let node = root
  for (const part of parts) {
    const next = node.children.find((child) => child.name === part)
    if (!next) return null
    node = next
  }
  return node
}

/** 树里所有目录路径，用于把 import 归到最近的目录。 */
function collectDirPaths(root, out = []) {
  if (root.kind === 'dir' && root.path !== '') out.push(root.path)
  for (const child of root.children) {
    if (child.kind === 'dir') collectDirPaths(child, out)
  }
  return out
}

/** 读一个目录下的代码文件，抽出内部相对引用（只认 ./ 与 ../）。 */
async function collectImports(rootAbs, relDir, fileNames) {
  const out = new Set()
  const pattern = new RegExp(
    "(?:^|[\\s;])(?:import|export)[\\s\\S]{0,200}?from\\s*['\"]([^'\"\\n]+)['\"]" +
      "|require\\s*\\(\\s*['\"]([^'\"\\n]+)['\"]\\s*\\)" +
      "|import\\s*\\(\\s*['\"]([^'\"\\n]+)['\"]\\s*\\)" +
      "|^\\s*import\\s*['\"]([^'\"\\n]+)['\"]",
    'gm',
  )
  const limited = fileNames.filter(isCode).slice(0, MAX_REF_FILES)
  for (const fileName of limited) {
    let text
    try {
      text = await readFile(join(rootAbs, relDir, fileName), 'utf8')
    } catch {
      continue
    }
    if (text.length > 200000) text = text.slice(0, 200000)
    pattern.lastIndex = 0
    let m
    while ((m = pattern.exec(text)) !== null) {
      const spec = m[1] ?? m[2] ?? m[3] ?? m[4]
      if (!spec || !(spec.startsWith('./') || spec.startsWith('../'))) continue
      const parts = slash(join(relDir, spec)).split('/')
      const stack = []
      for (const part of parts) {
        if (part === '..') stack.pop()
        else if (part && part !== '.') stack.push(part)
      }
      const base = stack.join('/').replace(/\.(js|mjs|cjs|jsx|ts|tsx|vue|svelte|astro)$/i, '')
      out.add(base)
      if (out.size > 60) return out
    }
  }
  return out
}

/** 顶层节点最可能的归属：'src/components/Button' → 'src/components' */
function ownerOf(spec, knownDirs) {
  let best = null
  for (const dir of knownDirs) {
    if (spec === dir || spec.startsWith(dir + '/')) {
      if (best === null || dir.length > best.length) best = dir
    }
  }
  return best
}

/** 点开一个文件夹时才算引用关系；被谁引用需要全项目索引，本版不做。 */
async function refsFor(rootAbs, node, tree) {
  if (node.kind !== 'dir') return { imports: [], importedBy: [] }
  const files = node.children.filter((child) => child.kind === 'file' && child.hasCode).map((child) => child.name)
  if (files.length === 0) return { imports: [], importedBy: [] }
  const specs = await collectImports(rootAbs, node.path, files)
  const dirs = collectDirPaths(tree)
  const imports = [...new Set([...specs].map((spec) => ownerOf(spec, dirs)).filter((dir) => dir && dir !== node.path))]
  return { imports: imports.slice(0, 8), importedBy: [] }
}

/* ───────────────────── 人话层：本地词典 ─────────────────────
   常见目录名先给一版能用的解释。模型能补就补，补不上也不至于空白。 */

const KNOW = {
  src: {
    title: '项目的主体',
    oneLine: '真正干活的代码都在这',
    say: '几乎所有功能都写在这个文件夹里。外面那些配置文件只是给工具看的。',
    effect: '改这里就是在改功能本身，影响范围取决于你动的是哪个子文件夹。',
    safety: 'careful',
  },
  components: {
    title: '页面上的零件',
    oneLine: '按钮、卡片、弹窗这类可复用的东西',
    say: '这里放着一块块界面零件。它们不负责存取数据，只负责长什么样、点了有什么反应。',
    effect: '只影响样子和点击手感，不会动到数据。整个项目里最安全的地方。',
    safety: 'safe',
  },
  pages: {
    title: '一个页面就是一屏',
    oneLine: '用户能点到的每个界面',
    say: '这里每个文件对应你看到的一屏。一屏上摆什么、点了跳去哪，都在这写。',
    effect: '改这里会马上看见变化。页面之间通常互不影响，改坏一个不至于全站崩。',
    safety: 'careful',
  },
  views: {
    title: '一个页面就是一屏',
    oneLine: '用户能点到的每个界面',
    say: '这里每个文件对应你看到的一屏，负责摆内容、接数据、处理点击。',
    effect: '改这里会直接改变界面。页面之间大多互不影响。',
    safety: 'careful',
  },
  store: {
    title: '数据的中转站',
    oneLine: '所有数据都从这里进出',
    say: '项目里的数据几乎都放在这，而且这里规定了「一条数据」长什么样。页面不自己存，都来这儿拿。',
    effect: '改这里会同时影响多个页面，是最容易一处改、多处崩的地方。动之前先说清楚要改什么。',
    safety: 'risky',
  },
  state: {
    title: '数据的中转站',
    oneLine: '所有数据都从这里进出',
    say: '全局的数据都放在这，页面从这里读、往这里写。',
    effect: '被多个页面共用，改动会连锁，属于要小心的一层。',
    safety: 'risky',
  },
  api: {
    title: '跟服务器说话的地方',
    oneLine: '所有网络请求的出口',
    say: '前端要拿数据、要提交，都得经过这里。这里决定了跟哪个地址、用什么方式说话。',
    effect: '改错这里，界面不会报错，只会「数据出不来」，看起来像页面坏了。',
    safety: 'careful',
  },
  server: {
    title: '后端：存东西的地方',
    oneLine: '接收请求，读写数据库',
    say: '这是跑在后面的那一半。负责把数据存进去、再取出来，前端看不到它但全靠它。',
    effect: '改这里不会改变界面长相；但接口一旦对不上，前端会静默拿不到数据。',
    safety: 'careful',
  },
  backend: {
    title: '后端：存东西的地方',
    oneLine: '接收请求，读写数据库',
    say: '跑在后面的那一半：接请求、查数据库、把结果送回去。',
    effect: '接口形状变了会连带前端，但界面本身不会变样。',
    safety: 'careful',
  },
  utils: {
    title: '公用小工具',
    oneLine: '到处都会用到的零碎函数',
    say: '比如格式化日期、算钱、拼字符串。很多地方都会调用这里。',
    effect: '看着不起眼，但被很多地方用，改了一个函数可能到处出问题。',
    safety: 'careful',
  },
  lib: {
    title: '公用小工具',
    oneLine: '被多处复用的功能',
    say: '把重复的逻辑收在这里，别的地方直接调用。',
    effect: '被多处引用，改之前最好先看看谁在用。',
    safety: 'careful',
  },
  hooks: {
    title: '可复用的行为',
    oneLine: '把重复的交互逻辑抽出来',
    say: '比如「加载中怎么显示」「滚动到哪触发」，抽成可复用的片段给页面用。',
    effect: '只影响使用它的那几个页面。',
    safety: 'careful',
  },
  styles: {
    title: '配色和排版',
    oneLine: '全站的颜色、字号、间距',
    say: '整个站点的样子都定在这。改这里，所有页面一起变。',
    effect: '改颜色最安全；改字号可能让某些地方挤在一起，改完三页都看一眼。',
    safety: 'safe',
  },
  assets: {
    title: '图片和素材',
    oneLine: '图片、图标、字体',
    say: '界面里用到的图片都放这，原样发给浏览器。',
    effect: '换图很安全；删掉正在被用的图，页面上会留一个破图标。',
    safety: 'safe',
  },
  public: {
    title: '原样发出去的文件',
    oneLine: '图片、图标、浏览器标签上的小图',
    say: '这里的东西不做任何加工，直接发给浏览器。',
    effect: '换图很安全；删文件不会报错，只会让页面上出现破图。',
    safety: 'safe',
  },
  static: {
    title: '原样发出去的文件',
    oneLine: '不参与打包的静态资源',
    say: '这里的东西会按原路径直接提供给浏览器。',
    effect: '动它只影响引用到的那一处。',
    safety: 'safe',
  },
  docs: {
    title: '说明文档',
    oneLine: '给人看的文字，不是代码',
    say: '项目的说明、设计稿、备忘都在这。不参与运行。',
    effect: '改了不影响程序，可以放心动。',
    safety: 'safe',
  },
  tests: {
    title: '自动检查',
    oneLine: '验证功能有没有被改坏',
    say: '这里的代码会自己跑一遍功能，告诉你有没有改坏东西。',
    effect: '改这里的代码不影响产品本身，但可能让检查报错。',
    safety: 'safe',
  },
  scripts: {
    title: '干活的脚本',
    oneLine: '打包、发布、批量处理用的小程序',
    say: '这些不是产品的一部分，是给你自己在终端里跑的工具。',
    effect: '改错了只影响你跑脚本，不影响线上功能。',
    safety: 'careful',
  },
  types: {
    title: '数据长什么样的定义',
    oneLine: '规定每样数据有哪些字段',
    say: '这里是「形状说明书」：一条记录该有哪几个字段、什么类型。',
    effect: '改了字段名，所有用这个字段的地方都会一起报错，但报错是好事，能一眼找全。',
    safety: 'careful',
  },
  config: {
    title: '设置',
    oneLine: '端口、地址、开关',
    say: '程序启动时要读的设置都在这。',
    effect: '改错通常表现为「起不来」或「连不上」，不会悄悄坏。',
    safety: 'careful',
  },
  web: {
    title: '网页本身',
    oneLine: '在浏览器里跑的那部分',
    say: '用户打开链接看到的东西都在这里：页面、样式、交互。',
    effect: '改这里会直接改变用户看到的样子。',
    safety: 'careful',
  },
  core: {
    title: '核心逻辑',
    oneLine: '不依赖界面的那部分本事',
    say: '项目真正的能力都在这里，界面只是它的外壳。',
    effect: '这里是地基，改错了整栋楼都晃。动之前最好先问一句「会影响哪些地方」。',
    safety: 'risky',
  },
  desktop: {
    title: '桌面端外壳',
    oneLine: '把网页装进一个桌面窗口',
    say: '同一套界面，换一种方式打开：变成你电脑上的一个应用程序。',
    effect: '只影响桌面版，不影响网页版。',
    safety: 'careful',
  },
  mobile: {
    title: '手机端外壳',
    oneLine: '装到手机上的那一层',
    say: '把同一套内容打包成手机上能装的程序。',
    effect: '只影响手机版。',
    safety: 'careful',
  },
  android: {
    title: '安卓端',
    oneLine: '给安卓手机用的那部分',
    say: '让这个项目能在安卓手机上运行所需的专用文件。',
    effect: '改动只在安卓上生效，需要专门工具才能打包。',
    safety: 'careful',
  },
  ios: {
    title: '苹果端',
    oneLine: '给 iPhone 用的那部分',
    say: '让这个项目能在 iPhone 上运行所需的专用文件。',
    effect: '改动只在苹果设备上生效。',
    safety: 'careful',
  },
  client: {
    title: '前端',
    oneLine: '用户直接看到的那一层',
    say: '负责显示和交互的部分；它自己不存数据，数据从后端拿。',
    effect: '改这里用户马上能看见。',
    safety: 'careful',
  },
  shared: {
    title: '共用的东西',
    oneLine: '前后端都会用到的定义',
    say: '两边都要用的约定和工具放在这里，避免各写一份对不上。',
    effect: '一处改动会同时影响两边。',
    safety: 'careful',
  },
  ui: {
    title: '界面零件',
    oneLine: '按钮、卡片这类可见的部件',
    say: '把界面上重复出现的东西做成零件，页面拿来拼。',
    effect: '只影响样子，不动功能。',
    safety: 'safe',
  },
  admin: {
    title: '后台管理',
    oneLine: '只有内部人会用到的界面',
    say: '给运营或管理员用的页面，普通用户看不到。',
    effect: '只影响后台，不会影响普通用户那一侧。',
    safety: 'safe',
  },
  apps: {
    title: '多个应用',
    oneLine: '一个仓库里装着好几个可以单独运行的程序',
    say: '这里每个子文件夹都是一个能单独跑的应用，它们共用同一份基础设施。',
    effect: '改公共部分会影响所有应用；改单个应用只影响它自己。',
    safety: 'careful',
  },
  packages: {
    title: '多个小包',
    oneLine: '拆开来复用的零件库',
    say: '把功能拆成一个个独立的小块，谁需要谁引用。',
    effect: '改一个包，所有引用它的地方都会变。',
    safety: 'careful',
  },
  platforms: {
    title: '各平台的专用代码',
    oneLine: '安卓、桌面、iOS 各一套',
    say: '同一个项目要在不同设备上运行，每个平台都需要自己那一套启动文件。',
    effect: '改动通常只影响对应平台，但打包时容易出问题。',
    safety: 'careful',
  },
  build: {
    title: '打包脚本',
    oneLine: '把源码变成能发布的东西',
    say: '把写好的代码压缩、合并、变成可以发布出去的文件。',
    effect: '改错了只影响打包，不影响你现在看到的效果。',
    safety: 'safe',
  },
  qa: {
    title: '检查工具',
    oneLine: '自动挑毛病的小程序',
    say: '自动跑一遍，看看有没有写错、有没有坏掉的地方。',
    effect: '只影响检查结果，不影响产品。',
    safety: 'safe',
  },
  routes: {
    title: '地址对照表',
    oneLine: '哪个网址交给哪段代码',
    say: '这里列着「用户访问某个网址时，交给谁去处理」的对照关系。',
    effect: '删掉一条，那个网址就没人接，访问会变成 404。',
    safety: 'careful',
  },
  controllers: {
    title: '接请求的柜台',
    oneLine: '每种请求由谁来办',
    say: '用户的每个动作先到这里，它负责检查要什么，然后叫后面的人干活。',
    effect: '改错这里，功能会整个不响应，或者返回看不懂的错误。',
    safety: 'careful',
  },
  models: {
    title: '数据的形状',
    oneLine: '一条数据长什么样',
    say: '这里规定「一条数据」有哪些字段、什么类型。存和取都按这个形状来。',
    effect: '改这里会同时影响存进去和读出来的地方，最容易一处改、多处坏。',
    safety: 'risky',
  },
  services: {
    title: '业务的做法',
    oneLine: '一件事具体怎么办',
    say: '把「怎么办一件事」的步骤集中放在这里，别的地方只负责调用。',
    effect: '改这里会影响所有调用它的地方，但不会直接改变界面长相。',
    safety: 'careful',
  },
  middleware: {
    title: '进门前的关卡',
    oneLine: '请求先过一遍检查',
    say: '每个请求进来先经过这里，检查身份、记日志、挡掉不合规的。',
    effect: '改错会影响所有请求：可能全部被拦下，也可能该拦的没拦住。',
    safety: 'risky',
  },
  db: {
    title: '存东西的地方',
    oneLine: '真正落地保存数据',
    say: '负责连接数据库、把数据写进去或者读出来。',
    effect: '改错了最常见的是「界面没报错，但数据不显示」。',
    safety: 'risky',
  },
  database: {
    title: '存东西的地方',
    oneLine: '真正落地保存数据',
    say: '负责连接数据库、把数据写进去或者读出来。',
    effect: '改错了最常见的是「界面没报错，但数据不显示」。',
    safety: 'risky',
  },
  migrations: {
    title: '改表的记录',
    oneLine: '数据库结构的变更历史',
    say: '每一次给数据表加字段、改类型，都留一条记录在这里，按顺序执行。',
    effect: '顺序错了或者和线上不一致，就可能丢数据；这类改动要先备份。',
    safety: 'risky',
  },
  schemas: {
    title: '数据的规矩',
    oneLine: '什么数据算合法',
    say: '定义每个字段的类型和限制，进来出去都要先过这套规矩。',
    effect: '放宽或收紧都会影响已有数据，老数据可能突然不合法。',
    safety: 'careful',
  },
  handlers: {
    title: '一件事的处理器',
    oneLine: '收到通知后做什么',
    say: '每种事情发生时会走这里，它在里面决定接下来做哪几步。',
    effect: '改错会让某类事情悄悄不发生，界面上看不出来。',
    safety: 'careful',
  },
  workers: {
    title: '后台干活的',
    oneLine: '不占界面的重活',
    say: '有些活太慢，不能挡着用户，就交给这里的后台进程慢慢做。',
    effect: '改错不会白屏，而是「点了没反应」或者数据一直不更新。',
    safety: 'careful',
  },
  jobs: {
    title: '排队要做的事',
    oneLine: '一件件等着被处理',
    say: '把要做的事排成队，由后台一件件取出来执行。',
    effect: '改错可能让任务重复执行，或者排着队永远不动。',
    safety: 'careful',
  },
  queue: {
    title: '排队的地方',
    oneLine: '任务先进先出',
    say: '所有待办任务在这里排队，谁先来谁先被拿走。',
    effect: '改错会丢任务或卡住整条流水线，属于要小心的一层。',
    safety: 'risky',
  },
  events: {
    title: '通知站',
    oneLine: '事情发生后广播给别人',
    say: '一件事做完后在这里喊一声，关心这件事的模块各自去做自己的部分。',
    effect: '改错会让某些「顺带做的事」不做了，症状很隐蔽。',
    safety: 'careful',
  },
  i18n: {
    title: '界面语言对照',
    oneLine: '同一句话的中英版本',
    say: '界面上每句话都按名字存在这里，一份中文一份英文，切换语言就是换一份。',
    effect: '漏一个词，界面上那个位置会显示成代号；改坏符号可能导致整份读不出来。',
    safety: 'safe',
  },
  locales: {
    title: '界面语言对照',
    oneLine: '同一句话的中英版本',
    say: '界面上每句话都按名字存在这里，一份中文一份英文，切换语言就是换一份。',
    effect: '漏一个词，界面上那个位置会显示成代号；改坏符号可能导致整份读不出来。',
    safety: 'safe',
  },
  templates: {
    title: '填空的模板',
    oneLine: '把变量填进固定格式',
    say: '这里放着固定的版式，真正生成内容时把具体值填进空位。',
    effect: '改错只会影响生成出来的样子，不会让程序跑不起来。',
    safety: 'safe',
  },
  themes: {
    title: '换皮肤的地方',
    oneLine: '颜色和样式的一套套方案',
    say: '每种主题是一套颜色和间距，换主题就是换这一套值。',
    effect: '改错只影响长相，不影响功能。',
    safety: 'safe',
  },
  plugins: {
    title: '外挂',
    oneLine: '可以插拔的扩展',
    say: '核心之外的能力放在这里，加载时才接进来，可以按需开关。',
    effect: '改错可能让某个扩展整体失效，主程序通常还能跑。',
    safety: 'careful',
  },
  sdk: {
    title: '给外部用的工具包',
    oneLine: '别人接入你时用的那层',
    say: '把内部能力包成一套对外的说法，外部只用这一层，不用关心里面怎么实现。',
    effect: '改了对外说法，用它的外部程序可能跟着坏，属于要小心的接口。',
    safety: 'careful',
  },
  integrations: {
    title: '跟别人对接',
    oneLine: '和外部服务打交道的代码',
    say: '每个外部服务在这里有一份对接代码，负责地址、鉴权和格式转换。',
    effect: '对方接口一变这里就得改；改错了症状通常是「数据不来」。',
    safety: 'careful',
  },
  cli: {
    title: '命令行入口',
    oneLine: '在终端里敲的那条命令',
    say: '从终端启动程序时先走这里：解析你敲的参数，再叫真正的逻辑。',
    effect: '改错会让命令报错或者参数不认，但不影响别的方式启动。',
    safety: 'careful',
  },
  infra: {
    title: '上线的地基',
    oneLine: '服务器和环境的定义',
    say: '用代码描述线上要几台机器、什么配置、怎么连起来。',
    effect: '改错可能让整套环境起不来；这类改动通常要走审批和演练。',
    safety: 'risky',
  },
  deploy: {
    title: '上线的步骤',
    oneLine: '把新版本放上去的流程',
    say: '把「怎么发布」写成步骤：打包、上传、重启、检查。',
    effect: '改错可能导致发布中断或旧版本被覆盖，动手前先确认。',
    safety: 'risky',
  },
  docker: {
    title: '装进盒子的配方',
    oneLine: '把项目打包成可搬运的容器',
    say: '定义这个项目运行需要什么环境，打成一致的盒子，到哪里都一样跑。',
    effect: '改错容器起不来，本地开发一般不受影响。',
    safety: 'careful',
  },
  k8s: {
    title: '集群调度',
    oneLine: '一堆机器上怎么分配服务',
    say: '告诉集群要跑几个副本、怎么扩缩容、挂了怎么重启。',
    effect: '改错可能让服务起不来或流量分错，属于高风险改动。',
    safety: 'risky',
  },
  ci: {
    title: '自动检查',
    oneLine: '每次提交后自动跑一遍',
    say: '提交代码后自动装依赖、跑测试、做检查，不合格就拦下。',
    effect: '改错可能让检查永远不通过，或者该拦的没拦住。',
    safety: 'safe',
  },
  examples: {
    title: '示例',
    oneLine: '给人照着抄的用法',
    say: '每个例子演示一种用法，通常可以独立运行。',
    effect: '不参与主流程，改了不影响程序。',
    safety: 'safe',
  },
  fixtures: {
    title: '测试用的假数据',
    oneLine: '测试里替代真实数据',
    say: '测试时不碰真实数据，用这里准备好的固定样本，结果才可重复。',
    effect: '改了可能让测试对不上而失败；不影响线上。',
    safety: 'safe',
  },
  mocks: {
    title: '替身',
    oneLine: '测试里假装的外部服务',
    say: '测试时不去真调外部服务，用这里的替身返回固定结果。',
    effect: '替身和真实行为不一致时，测试会「假通过」。',
    safety: 'safe',
  },
  e2e: {
    title: '端到端测试',
    oneLine: '像真人一样点一遍',
    say: '用程序模拟真人操作，从打开界面一直点到结果出现。',
    effect: '改错会误报或漏报，通常不影响线上功能。',
    safety: 'safe',
  },
  stories: {
    title: '组件展示页',
    oneLine: '把零件一个个摆出来看',
    say: '每个界面零件在这里单独展示，方便调样式、看各种状态。',
    effect: '不参与正式运行，改了不影响产品。',
    safety: 'safe',
  },
  dashboard: {
    title: '看板',
    oneLine: '一屏看完关键指标',
    say: '把重要数字和图表集中摆在一屏，供人快速判断现状。',
    effect: '改错通常只是显示不对，不动底层数据。',
    safety: 'careful',
  },
}

/** 根目录常见文件，单独给一句人话，避免「这是项目里的一个文件」这种废话。 */
const FILE_KNOW = {
  'readme.md': { title: '说明书', oneLine: '作者写给使用者的说明', say: '这里写着这个项目是什么、怎么装、怎么跑。想快速搞懂一个项目，先读它最省时间。', effect: '改了不影响程序运行，但会改变别人对这个项目的理解。', safety: 'safe' },
  'license': { title: '使用许可', oneLine: '法律文本：别人能不能用、怎么用', say: '一份法律文件，规定这个项目可以被怎样使用和分发。', effect: '删了或改了会改变授权，通常不是你能随手动的东西。', safety: 'careful' },
  'package.json': { title: '项目的身份证', oneLine: '叫什么、依赖什么、怎么启动', say: '写着项目名字、用到哪些现成的库、有哪些命令可以跑。想加新功能需要装新库时，才来这里。', effect: '删依赖或改错字段，整个项目会起不来或依赖装不上。', safety: 'careful' },
  'changelog.md': { title: '更新记录', oneLine: '每一版改了什么', say: '按时间记录每次版本更新做了什么。不参与运行。', effect: '只是记录，改了不影响程序。', safety: 'safe' },
  'contributing.md': { title: '怎么参与', oneLine: '给协作者看的开发规范', say: '告诉别人怎么提问题、怎么提交代码。不参与运行。', effect: '改了不影响程序。', safety: 'safe' },
  'index.html': { title: '网页的入口', oneLine: '浏览器打开就开始跑', say: '整个网站从这里启动，它把真正的程序加载进来。通常很短，基本不用改。', effect: '改错了会整页白屏，而且看不出错在哪。', safety: 'risky' },
  'dockerfile': { title: '打包成容器的配方', oneLine: '怎么把项目装进一个盒子', say: '一份说明书，告诉工具如何把项目打包成可以到处运行的容器。', effect: '改错了容器起不来；不影响本地开发。', safety: 'careful' },
  'tsconfig.json': {
    title: '编译设置',
    oneLine: '代码怎么翻译成能跑的形式',
    say: '规定代码的版本、严格程度、哪些文件参与编译。',
    effect: '改严了会冒出一堆报错，改松了错误会漏到运行时。',
    safety: 'careful',
  },
  'jsconfig.json': {
    title: '编辑器设置',
    oneLine: '让编辑器更懂这个项目',
    say: '告诉编辑器去哪找代码、怎么理解路径别名。',
    effect: '只影响编辑体验，不影响运行。',
    safety: 'safe',
  },
  'vite.config.ts': {
    title: '打包设置',
    oneLine: '开发服务器和打包怎么跑',
    say: '规定开发时怎么起服务、打包时怎么合并压缩、有哪些快捷路径。',
    effect: '改错会让开发服务器起不来或打包失败。',
    safety: 'careful',
  },
  'vite.config.js': {
    title: '打包设置',
    oneLine: '开发服务器和打包怎么跑',
    say: '规定开发时怎么起服务、打包时怎么合并压缩、有哪些快捷路径。',
    effect: '改错会让开发服务器起不来或打包失败。',
    safety: 'careful',
  },
  'webpack.config.js': {
    title: '打包设置',
    oneLine: '把很多文件合成几个',
    say: '规定从哪个文件开始、怎么合并、怎么处理各种类型的文件。',
    effect: '改错会让打包失败，页面直接白屏。',
    safety: 'careful',
  },
  'jest.config.js': {
    title: '测试设置',
    oneLine: '测试怎么跑、跑哪些',
    say: '规定测试文件在哪、用什么环境跑、覆盖率怎么算。',
    effect: '改错会导致测试一个都跑不起来，或漏跑一大片。',
    safety: 'safe',
  },
  'vitest.config.ts': {
    title: '测试设置',
    oneLine: '测试怎么跑、跑哪些',
    say: '规定测试文件在哪、用什么环境跑、覆盖率怎么算。',
    effect: '改错会导致测试一个都跑不起来，或漏跑一大片。',
    safety: 'safe',
  },
  'tailwind.config.js': {
    title: '样式设置',
    oneLine: '有哪些颜色和间距可用',
    say: '定义可用的颜色、字号、间距，样式里只能用这里出现过的值。',
    effect: '删掉一个值，用到它的地方会突然没样式。',
    safety: 'safe',
  },
  'postcss.config.js': {
    title: '样式处理',
    oneLine: '样式文件先怎么加工',
    say: '规定样式在交给浏览器之前要经过哪些加工步骤。',
    effect: '改错会让样式整体失效，页面变成没有排版的纯文字。',
    safety: 'careful',
  },
  'docker-compose.yml': {
    title: '几个盒子的组合',
    oneLine: '一次启动整套服务',
    say: '把数据库、后端、前端这些盒子写成一份清单，一条命令全部起来。',
    effect: '改错可能整套起不来，或者端口撞车。',
    safety: 'careful',
  },
  makefile: {
    title: '命令快捷方式',
    oneLine: '把常用命令起个短名字',
    say: '把一长串命令收成一个短名字，敲一下就跑完。',
    effect: '改错会让对应命令失效，不影响程序本身。',
    safety: 'careful',
  },
  'requirements.txt': {
    title: '依赖清单',
    oneLine: '要装哪些现成的库',
    say: '列出这个项目依赖的库和版本，装环境时按这份清单来。',
    effect: '改错版本会装不上，或者装上了跑不对。',
    safety: 'careful',
  },
  'pyproject.toml': {
    title: '项目说明与依赖',
    oneLine: '名字、依赖、构建方式',
    say: '把项目信息和依赖写在一处，工具按它来安装和打包。',
    effect: '改错会导致装不上或打包失败。',
    safety: 'careful',
  },
  'manifest.json': {
    title: '应用说明',
    oneLine: '叫什么、要什么权限',
    say: '告诉宿主这个应用的名字、图标、需要哪些权限。',
    effect: '改错可能导致应用装不上，或缺少权限而功能失效。',
    safety: 'careful',
  },
}

function heuristicFor(node) {
  const base = node.name.toLowerCase()
  const known = node.kind === 'file' ? FILE_KNOW[base] ?? KNOW[base] : KNOW[base]
  const ext = (node.ext ?? []).map(([e]) => e)
  if (known) {
    return {
      title: known.title,
      oneLine: known.oneLine,
      plain: { lead: known.say, say: '', effect: known.effect, safety: known.safety },
      safety: known.safety,
      source: 'heuristic',
    }
  }
  const isCodeish = typeof node.hasCode === 'boolean' ? node.hasCode : ext.some((e) => CODE_EXT.has(e))
  return {
    title: node.name,
    oneLine: node.kind === 'file' ? `项目里的一个文件` : `项目里的一块，共 ${node.fileCount} 个文件`,
    plain: {
      lead: node.kind === 'file'
        ? '这是项目里的一个文件。模型还没给出解释，你可以先看它被谁引用。'
        : `这里装着这个项目的 ${node.fileCount} 个文件。还没人给它写过一句人话解释。`,
      say: '',
      effect: isCodeish
        ? '它参与运行，改动可能影响功能。具体影响范围看下面「跟谁有关系」。'
        : '这里主要是非代码文件，改了大概率只影响外观或说明。',
      safety: isCodeish ? 'careful' : 'safe',
    },
    safety: isCodeish ? 'careful' : 'safe',
    source: 'facts',
  }
}

/* ───────────────────── 人话层：模型（可选） ───────────────────── */

const SYSTEM = [
  '你是一个把代码项目翻译成「人话」的向导，读者是完全不懂编程的人。',
  '你的任务不是复述目录结构，而是让读者明白「这块在系统里扮演什么角色」。',
  '规则：',
  '1. 不出现术语缩写；必须用到的词，后面跟一句解释。',
  '2. 不说「这里包含 N 个文件」——文件数量谁都会数，读者要的是意思。',
  '3. 说「这块改了会怎样」，而不是「这块负责什么」：读者关心的是敢不敢动。',
  '4. 打比方要具体、生活化，不要用「就像一个模块」这种同义反复。',
  '5. 不确定就说不确定，不要编造项目名、框架名、第三方服务。',
  '6. 只输出 JSON，不要 Markdown 代码块，不要解释。',
].join('\n')

/** 模型偶尔会把 JSON 说断（截断、多余逗号）。尽量抢救，救不回来才算失败。 */
function closeBrackets(text) {
  const stack = []
  let inString = false
  let escaped = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }
  let out = text
  if (inString) out += '"'
  out = out.replace(/,\s*$/, '')
  while (stack.length > 0) out += stack.pop()
  return out
}

function parseJsonLoose(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  const slice = start >= 0 && end > start ? body.slice(start, end + 1) : body.slice(Math.max(0, start))
  const attempts = [
    slice,
    slice.replace(/,\s*([}\]])/g, '$1'),
    closeBrackets(slice.replace(/,\s*([}\]])/g, '$1')),
    closeBrackets(body.slice(Math.max(0, start)).replace(/,\s*([}\]])/g, '$1')),
  ]
  for (const candidate of attempts) {
    if (!candidate) continue
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      /* 下一个 */
    }
  }
  return null
}

async function callModel(ctx, prompt, signal, system) {
  const llm = ctx.get('llm')
  if (!llm || typeof llm.stream !== 'function') return { error: '模型服务不可用', retryable: false }
  const selection = ctx.get('agentDefaultModel')?.currentSelection?.()
  const provider = selection?.provider
  const model = selection?.model
  if (!provider || !model) return { error: '还没有选择默认模型', retryable: false }

  const tryOnce = async (content) => {
    const chunks = []
    for await (const chunk of llm.stream({
      provider,
      model,
      system: system ?? SYSTEM,
      messages: [{ role: 'user', content }],
      maxTokens: 2800,
      temperature: 0.35,
      signal,
    })) {
      if (chunk && chunk.type === 'text-delta') chunks.push(chunk.text)
      if (chunk && chunk.type === 'finish' && chunk.reason && chunk.reason.kind === 'error') {
        throw new Error(chunk.reason.failure?.message ?? '模型调用失败')
      }
    }
    return chunks.join('')
  }

  try {
    const text = await tryOnce([{ type: 'text', text: prompt }])
    return { text }
  } catch (error) {
    try {
      // 有些适配器只接受字符串 content
      const text = await tryOnce(prompt)
      return { text }
    } catch {
      return { error: error instanceof Error ? error.message : String(error), retryable: false }
    }
  }
}

/* ───────────────────── 代码层：单个文件 ───────────────────── */

const FILE_SYSTEM = [
  '你在给一个完全不懂编程的人解释一段代码。',
  '规则：',
  '1. 不要复述语法，不要出现「函数」「参数」「异步」这类词，除非你立刻用一句人话跟上。',
  '2. 讲它「替这个项目做了什么」，而不是「它实现了什么」。',
  '3. 说清它拿什么、给什么，以及改坏了会看到什么症状。',
  '4. 不确定就说不确定，不要编造它没做过的事。',
  '5. 只输出 JSON。',
].join('\n')

/** 从源码里抽事实：行数、开头注释、依赖、导出的名字。 */
function analyzeSource(text) {
  const lines = text.split(/\r?\n/)
  const head = lines.slice(0, 40).join('\n')
  const block = /^\s*\/\*\*?[\s\S]*?\*\//.exec(head)
  const lineComments = /^\s*(?:\/\/[^\n]*\n?)+/.exec(head)
  const comment = String((block && block[0]) || (lineComments && lineComments[0]) || '')
    .replace(/^\s*\/\*\*?|\*\/\s*$/g, '')
    .replace(/^\s*(?:\/\/|\*)\s?/gm, '')
    .trim()

  const imports = [...text.matchAll(/(?:from\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/g)]
    .map((m) => m[1] || m[2])
    .filter(Boolean)
  const exported = [...text.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_$]+)/g)].map((m) => m[1])
  const named = [...text.matchAll(/(?:function\s+([A-Za-z0-9_$]+)\s*\(|(?:const|let)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>)/g)]
    .map((m) => m[1] || m[2])
    .filter(Boolean)

  return {
    lines: lines.length,
    bytes: Buffer.byteLength(text),
    comment: comment.slice(0, 400),
    imports: [...new Set(imports)].slice(0, 12),
    exports: [...new Set(exported)].slice(0, 14),
    names: [...new Set([...exported, ...named])].slice(0, 16),
    excerpt: lines.slice(0, CODE_EXCERPT_LINES).join('\n').slice(0, 7000),
  }
}

function buildFilePrompt(rel, info) {
  const bits = [`文件：${rel}`, `共 ${info.lines} 行。`]
  if (info.comment) bits.push(`文件开头写着：${info.comment}`)
  if (info.imports.length > 0) bits.push(`它用到：${info.imports.join('、')}`)
  if (info.names.length > 0) bits.push(`里面这些东西：${info.names.join('、')}`)
  bits.push('代码：', '```', info.excerpt, '```', '')
  bits.push(
    '输出 JSON：',
    '{',
    '  "title": "不超过 8 字，说它是干什么的",',
    '  "gist": "一句话：它在整个项目里扮演什么角色",',
    '  "does": "2~3 句：它具体做了什么，按发生顺序说",',
    '  "takeIn": "它需要什么才能干活；不需要就说「不需要」",',
    '  "giveOut": "它产出什么给谁用",',
    '  "risk": "改了它，会看到什么症状",',
    '  "safety": "safe|careful|risky"',
    '}',
    '只输出 JSON。',
  )
  return bits.join('\n')
}


/* ───────────────────────── 事实与精简文案 ───────────────────────── */

/** 「去哪里接着看」的三条线索。 */
function deeperFor(node) {
  const read = (node.children ?? []).find((child) => child.kind === 'file' && isCode(child.name))
  return {
    search: `「${node.name}」在项目里一般负责什么`,
    read: node.path === '' ? node.name : node.path,
    ask: `「${node.path || node.name}」这块改之前我应该注意什么？`,
    file: read ? read.path : null,
  }
}

/** 词典 + 事实拼出来的精简文案。 */
function heuristicSummary(node) {
  const heuristic = heuristicFor(node)
  return {
    title: heuristic.title,
    oneLine: heuristic.oneLine,
    say: heuristic.plain.lead,
    effect: heuristic.plain.effect,
    safety: heuristic.safety,
    source: heuristic.source,
  }
}

/** 根节点说整个项目，而不是「项目里的一块」。 */
function projectSummary(tree) {
  const langs = (tree.stats.languages ?? [])
    .slice(0, 3)
    .map(([ext, count]) => `${ext}×${count}`)
    .join('  ')
  const biggest = (tree.stats.biggest ?? [])
    .slice(0, 3)
    .map((item) => `${item.name}（${item.fileCount}）`)
    .join('、')
  return {
    title: tree.name,
    oneLine: `${tree.stats.dirs} 个文件夹、${tree.stats.files} 个文件`,
    say: `主要文件类型是 ${langs || '一些散文件'}${biggest === '' ? '' : `；比较大的区域有 ${biggest}`}。左边可以逐层展开。`,
    effect: '改动的影响取决于你动的是哪一块：点开具体文件夹或文件，这里会说明改了会怎样。',
    safety: 'careful',
    source: 'facts',
  }
}

/**
 * 点开节点时拿事实。文件夹只读树（零 IO），文件才读内容。
 * 返回直接给浏览器的精简结构，不含模型输出。
 */
async function nodeFacts(rootAbs, rel, options) {
  const abs = insidePath(rootAbs, rel)
  if (!abs) return { ok: false, error: '路径越界，拒绝读取' }
  const info = await stat(abs).catch(() => null)
  if (!info) return { ok: false, error: '这个位置不在了' }

  const tree = await scanTree(rootAbs)
  if (!tree.ok) return tree
  const node = findNode(tree.tree, rel)
  if (!node) return { ok: false, error: '树里找不到这个位置' }

  const summary = rel === '' ? projectSummary(tree) : heuristicSummary(node)
  const deeper = deeperFor(node)

  if (info.isDirectory()) {
    const refs = options?.refs ? await refsFor(rootAbs, node, tree.tree) : null
    return {
      ok: true,
      kind: 'dir',
      path: node.path,
      name: node.name,
      fileCount: node.fileCount,
      hasCode: node.hasCode,
      ext: node.ext,
      truncated: Boolean(node.truncated),
      children: node.children.map((child) => ({
        name: child.name,
        path: child.path,
        kind: child.kind,
        fileCount: child.fileCount,
        hasCode: child.hasCode,
      })),
      summary,
      deeper,
      refs,
    }
  }

  if (info.size > MAX_FILE_BYTES) return { ok: false, error: '文件太大（超过 400KB），先不读' }
  const text = await readFile(abs, 'utf8').catch(() => '')
  if (text === '') return { ok: false, error: '读不出这个文件（可能是图片或二进制）' }
  const facts = analyzeSource(text)
  const payload = {
    ok: true,
    kind: 'file',
    path: node.path,
    name: node.name,
    lines: facts.lines,
    bytes: facts.bytes,
    comment: facts.comment,
    names: facts.names,
    imports: facts.imports,
    exports: facts.exports,
    summary,
    deeper,
  }
  if (options?.excerpt) payload.excerpt = facts.excerpt.split('\n').slice(0, 40).join('\n')
  return payload
}

/* ───────────────────── 详细解释：点按钮才调模型 ───────────────────── */

const FOLDER_SYSTEM = [
  '你在给一个完全不懂编程的人解释项目里的一个文件夹。',
  '规则：',
  '1. 不出现术语缩写；必须用到的词，后面跟一句解释。',
  '2. 说这个文件夹在项目里扮演什么角色，不要逐个罗列文件名。',
  '3. 说「改了会怎样」，而不是只说「负责什么」：读者关心的是敢不敢动。',
  '4. 打比方要具体、生活化，不要用「就像一个模块」这种同义反复。',
  '5. 不确定就说不确定，不要编造框架名、服务名。',
  '6. 只输出 JSON，不要 Markdown 代码块。',
].join('\n')

function buildFolderPrompt(node, isRoot) {
  const dirs = node.children.filter((child) => child.kind === 'dir')
  const files = node.children.filter((child) => child.kind === 'file')
  const lines = []
  lines.push(isRoot ? `这是一个项目，名叫 ${node.name}。` : `文件夹：${node.path}`)
  lines.push(`里面共 ${node.fileCount} 个文件、${dirs.length} 个子文件夹。`)
  if (dirs.length > 0) lines.push(`子文件夹：${dirs.slice(0, 12).map((child) => child.name).join('、')}`)
  if (files.length > 0) lines.push(`直接包含的文件：${files.slice(0, 20).map((child) => child.name).join('、')}`)
  const ext = (node.ext ?? []).map(([name, count]) => `${name}×${count}`).join(' ')
  if (ext !== '') lines.push(`文件类型：${ext}`)
  lines.push(
    '',
    '输出 JSON：',
    '{',
    '  "title": "不超过 8 字，说它的角色",',
    '  "gist": "一句话：它在整个项目里扮演什么角色",',
    '  "does": "2~3 句：里面的东西合起来做了什么，按发生顺序说",',
    '  "risk": "改了它，会看到什么症状",',
    '  "safety": "safe|careful|risky"',
    '}',
    '只输出 JSON。',
  )
  return lines.join('\n')
}

/**
 * 生成「详细」解释。按文件 mtime / 目录 mtime+规模缓存；
 * regen=true 时忽略缓存重新问一次。
 */
async function detailFor(ctx, rootAbs, rel, options) {
  const abs = insidePath(rootAbs, rel)
  if (!abs) return { ok: false, error: '路径越界，拒绝读取' }
  const info = await stat(abs).catch(() => null)
  if (!info) return { ok: false, error: '这个位置不在了' }

  const tree = await scanTree(rootAbs)
  if (!tree.ok) return tree
  const node = findNode(tree.tree, rel)
  if (!node) return { ok: false, error: '树里找不到这个位置' }

  const isFile = info.isFile()
  const sig = isFile ? String(info.mtimeMs) : `${info.mtimeMs}:${node.children.length}:${node.fileCount}`
  const key = `${abs}|${isFile ? 'f' : 'd'}|${sig}`

  if (!options?.regen) {
    const hit = detailCache.get(key)
    if (hit) return { ok: true, kind: isFile ? 'file' : 'dir', detail: hit, cached: true }
  }

  if (isFile) {
    if (info.size > MAX_FILE_BYTES) return { ok: false, error: '文件太大（超过 400KB），先不读' }
    const text = await readFile(abs, 'utf8').catch(() => '')
    if (text === '') return { ok: false, error: '读不出这个文件（可能是图片或二进制）' }
    const facts = analyzeSource(text)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    try {
      const call = await callModel(ctx, buildFilePrompt(node.path, facts), controller.signal, FILE_SYSTEM)
      if (call.error) return { ok: false, error: call.error }
      const parsed = parseJsonLoose(call.text)
      if (!parsed) return { ok: false, error: '模型这次没把 JSON 说完整，再点一次「重新生成」试试' }
      const detail = {
        title: String(parsed.title ?? '').trim() || node.name,
        gist: String(parsed.gist ?? '').trim(),
        does: String(parsed.does ?? '').trim(),
        takeIn: String(parsed.takeIn ?? '').trim(),
        giveOut: String(parsed.giveOut ?? '').trim(),
        risk: String(parsed.risk ?? '').trim(),
        safety: ['safe', 'careful', 'risky'].includes(parsed.safety) ? parsed.safety : 'careful',
      }
      detailCache.set(key, detail)
      return { ok: true, kind: 'file', detail, cached: false }
    } finally {
      clearTimeout(timer)
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90000)
  try {
    const call = await callModel(ctx, buildFolderPrompt(node, rel === ''), controller.signal, FOLDER_SYSTEM)
    if (call.error) return { ok: false, error: call.error }
    const parsed = parseJsonLoose(call.text)
    if (!parsed) return { ok: false, error: '模型这次没把 JSON 说完整，再点一次「重新生成」试试' }
    const detail = {
      title: String(parsed.title ?? '').trim() || node.name,
      gist: String(parsed.gist ?? '').trim(),
      does: String(parsed.does ?? '').trim(),
      risk: String(parsed.risk ?? '').trim(),
      safety: ['safe', 'careful', 'risky'].includes(parsed.safety) ? parsed.safety : 'careful',
    }
    detailCache.set(key, detail)
    return { ok: true, kind: 'dir', detail, cached: false }
  } finally {
    clearTimeout(timer)
  }
}

/* ───────────────────────── 项目列表 ───────────────────────── */

function projectList(ctx) {
  const registry = ctx.get('workspaceRegistry')
  const projects = []
  try {
    for (const workspace of registry?.list?.() ?? []) {
      const path = workspace?.path ?? workspace?.directory ?? workspace?.root
      if (typeof path === 'string' && path.length > 0) {
        projects.push({ id: String(workspace.id ?? path), title: String(workspace.title ?? workspace.name ?? path), path })
      }
    }
  } catch {
    /* 注册表不可用就退回默认目录 */
  }

  let defaultPath = projects.length > 0 ? projects[0].path : null
  if (!defaultPath) {
    try {
      defaultPath = ctx.get('workingDirectory')?.defaultDirectory ?? null
    } catch {
      defaultPath = null
    }
  }
  if (!defaultPath) {
    try {
      defaultPath = process.cwd()
    } catch {
      defaultPath = null
    }
  }
  return { projects, defaultPath }
}

/* ───────────────────────── 路由 ───────────────────────── */

export function apply(ctx) {
  const routes = [
    {
      kind: 'exact',
      path: `${API}/projects`,
      handler: (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        json(res, 200, { ok: true, ...projectList(ctx) })
      },
    },
    {
      kind: 'exact',
      path: `${API}/tree`,
      handler: (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        const url = new URL(req.url ?? '/', 'http://localhost')
        const requestPath = url.searchParams.get('path')
        if (!requestPath) return json(res, 400, { ok: false, error: 'missing-path' })
        const force = url.searchParams.get('refresh') === '1'
        void scanTree(requestPath, force)
          .then((payload) => json(res, 200, payload))
          .catch((error) => json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) }))
      },
    },
    {
      kind: 'exact',
      path: `${API}/node`,
      handler: (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        const url = new URL(req.url ?? '/', 'http://localhost')
        const root = url.searchParams.get('path')
        if (!root) return json(res, 400, { ok: false, error: 'missing-path' })
        const rel = url.searchParams.get('rel') ?? ''
        const refs = url.searchParams.get('refs') === '1'
        void nodeFacts(resolve(root), rel, { refs })
          .then((payload) => json(res, 200, payload))
          .catch((error) => json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) }))
      },
    },
    {
      kind: 'exact',
      path: `${API}/detail`,
      handler: (req, res) => {
        if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        const url = new URL(req.url ?? '/', 'http://localhost')
        const root = url.searchParams.get('path')
        if (!root) return json(res, 400, { ok: false, error: 'missing-path' })
        const rel = url.searchParams.get('rel') ?? ''
        const regen = url.searchParams.get('regen') === '1'
        void detailFor(ctx, resolve(root), rel, { regen })
          .then((payload) => json(res, 200, payload))
          .catch((error) => json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) }))
      },
    },
  ]

  ctx.effect(() => {
    const disposers = []
    try {
      for (const route of routes) disposers.push(ctx.webServer.register(route))
    } catch (error) {
      for (const dispose of disposers) dispose()
      throw error
    }
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, 'project-guide: routes')
}
