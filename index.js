// dsh-project-guide — host half.
//
// 把用户的项目目录翻译成「人话导览」：
//   1. 事实层：目录树、文件数、谁引用谁 —— 自己算，不用模型，不会编。
//   2. 人话层：项目是干什么的、先看哪几个文件、每个文件夹改了会怎样。
//      常见文件夹名用本地词典（秒出、零成本）；其余交给当前默认模型补一份。
//
// 浏览器半通过同源 JSON 路由拿数据，不依赖任何 Remote 生成器。
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
const IGNORE_EXT = new Set(['.lock', '.map', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ttf', '.woff', '.woff2'])

/** 根目录里「像入口」的散文件，才值得进结构。 */
const ENTRY_FILES = /^(index\.(html?|js|ts|jsx|tsx|vue)|main\.(js|mjs|ts|py|go|rs)|app\.(js|ts|py|vue)|server\.(js|ts|mjs)|manage\.py|Makefile|docker-compose\.ya?ml)$/i

/** 递归文件数上限，防止在超大仓库里卡住。 */
const MAX_WALK = 4000
/** 进树的节点上限。 */
const MAX_NODES = 26

const cache = new Map()
const inFlight = new Set()

/* ─────────────────────────── 工具 ─────────────────────────── */

const slash = (p) => p.split(sep).join('/')
const isCode = (f) => CODE_EXT.has(extname(f).toLowerCase())

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

/** 递归数文件，并收集顶层可见的扩展名分布。 */
async function measure(abs, budget) {
  let count = 0
  const ext = new Map()
  const queue = [abs]
  while (queue.length > 0 && count < budget.limit) {
    const dir = queue.shift()
    const entries = await listDir(dir)
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
        queue.push(join(dir, entry.name))
        continue
      }
      if (!entry.isFile()) continue
      count += 1
      const e = extname(entry.name).toLowerCase() || '(无扩展名)'
      ext.set(e, (ext.get(e) ?? 0) + 1)
      if (count >= budget.limit) break
    }
  }
  budget.limit -= count
  const sorted = [...ext.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  let codeCount = 0
  for (const [name, n] of ext) if (CODE_EXT.has(name)) codeCount += n
  return { count, ext: sorted, hasCode: codeCount > 0 }
}

/** 列出直接子文件（用于卡片里的"里面有什么"）。 */
async function childFiles(abs, limit = 6) {
  const entries = await listDir(abs)
  return entries
    .filter((e) => e.isFile() && !SKIP_FILES.has(e.name) && !e.name.startsWith('.'))
    .slice(0, limit)
    .map((e) => e.name)
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
  const limited = fileNames.filter(isCode).slice(0, 30)
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
      // 归一化成相对项目根的路径，去掉扩展名
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

async function scanProject(rootPath) {
  const rootAbs = resolve(rootPath)
  const budget = { limit: MAX_WALK }
  const top = await listDir(rootAbs)
  const ignored = []

  const topDirs = []
  const topFiles = []
  for (const entry of top) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) ignored.push(entry.name + '/')
      else if (!entry.name.startsWith('.')) topDirs.push(entry.name)
      continue
    }
    if (!entry.isFile() || entry.name.startsWith('.')) continue
    // 根目录的散文件：只有像入口的才进结构，其余归到「你不用管」
    if (ENTRY_FILES.test(entry.name)) topFiles.push(entry.name)
    else ignored.push(entry.name)
  }

  const nodes = []
  const knownDirs = []

  for (const dirName of topDirs) {
    const abs = join(rootAbs, dirName)
    const measured = await measure(abs, budget)
    const files = await childFiles(abs)
    const node = {
      id: dirName,
      name: dirName,
      path: dirName,
      kind: 'dir',
      depth: 0,
      fileCount: Math.max(measured.count, files.length),
      ext: measured.ext,
      hasCode: measured.hasCode,
      files,
      children: [],
    }
    nodes.push(node)
    knownDirs.push(dirName)

    // 只给「装代码的目录」展开一层，避免把 40 个文件夹全铺开
    const sourceLike = /^(src|app|apps|packages|lib|components|server|api|source|platforms)$/i.test(dirName) || measured.hasCode
    if (sourceLike && nodes.length < MAX_NODES) {
      const subEntries = await listDir(abs)
      const subs = subEntries
        .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.'))
        .slice(0, 8)
      for (const sub of subs) {
        if (nodes.length >= MAX_NODES) break
        const subAbs = join(abs, sub.name)
        const subMeasured = await measure(subAbs, budget)
        const subFiles = await childFiles(subAbs)
        const child = {
          id: `${dirName}/${sub.name}`,
          name: sub.name,
          path: `${dirName}/${sub.name}`,
          kind: 'dir',
          depth: 1,
          fileCount: Math.max(subMeasured.count, subFiles.length),
          ext: subMeasured.ext,
          hasCode: subMeasured.hasCode,
          files: subFiles,
          children: [],
        }
        node.children.push(child)
        nodes.push(child)
        knownDirs.push(child.id)
      }
    }
  }

  for (const fileName of topFiles.slice(0, 3)) {
    nodes.push({
      id: fileName,
      name: fileName,
      path: fileName,
      kind: 'file',
      depth: 0,
      fileCount: 1,
      ext: [[extname(fileName).toLowerCase(), 1]],
      hasCode: isCode(fileName),
      files: [fileName],
      children: [],
    })
  }

  // 引用关系：谁用了谁
  const edges = new Map()
  for (const node of nodes) {
    if (node.kind !== 'dir') continue
    const imports = await collectImports(rootAbs, node.path, node.files.length > 0 ? node.files : [])
    const targets = new Set()
    for (const spec of imports) {
      const owner = ownerOf(spec, knownDirs)
      if (owner && owner !== node.id) targets.add(owner)
    }
    edges.set(node.id, [...targets])
  }
  for (const node of nodes) {
    node.imports = edges.get(node.id) ?? []
    node.importedBy = nodes.filter((n) => n.id !== node.id && (n.imports ?? []).includes(node.id)).map((n) => n.id)
  }

  const stats = nodes.reduce(
    (acc, n) => {
      acc.files += n.depth === 0 ? n.fileCount : 0
      return acc
    },
    { files: 0 },
  )

  return {
    root: slash(rootAbs),
    name: rootAbs.split(sep).filter(Boolean).pop() ?? 'project',
    nodes,
    ignored: [...new Set(ignored)].slice(0, 8),
    stats: { files: stats.files, areas: nodes.filter((n) => n.depth === 0).length },
  }
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

/** 给模型的节点上限：太多会把输出截断。 */
const PROMPT_NODES = 12

function buildPrompt(scan, compact, limit) {
  const cap = Math.max(4, Math.min(compact ? 6 : limit || PROMPT_NODES, 26))
  const top = scan.nodes.filter((node) => node.depth === 0)
  const kids = scan.nodes.filter((node) => node.depth === 1).sort((a, b) => b.fileCount - a.fileCount)
  const picked = top.slice(0, limit)
  for (const kid of kids) {
    if (picked.length >= limit) break
    picked.push(kid)
  }
  const wanted = new Set(picked.map((node) => node.path))
  const chosen = scan.nodes.filter((node) => wanted.has(node.path))

  const lines = []
  lines.push(`项目目录：${scan.root}`)
  lines.push(`一共约 ${scan.stats.files} 个文件，下面列出其中值得讲的 ${chosen.length} 块。`)
  lines.push('结构（缩进表示子块）：')
  for (const node of chosen) {
    const indent = node.depth === 1 ? '  ' : ''
    const who = node.importedBy.length > 0 ? `；被 ${node.importedBy.slice(0, 3).join('、')} 使用` : ''
    const uses = node.imports.length > 0 ? `；引用了 ${node.imports.slice(0, 3).join('、')}` : ''
    lines.push(`${indent}- ${node.path}${who}${uses}`)
    if (node.files.length > 0) lines.push(`${indent}  里面：${node.files.slice(0, 6).join('、')}`)
  }

  return [
    lines.join('\n'),
    '',
    '输出这个 JSON（areas 放最前面，别的内容可以后写）：',
    '{',
    '  "areas": [{"path": "上面某一行的路径", "title": "不超过 6 字", "say": "一句人话", "metaphor": "一个比方", "effect": "改了会怎样", "safety": "safe|careful|risky"}],',
    '  "summary": ["这个项目是干什么的", "现在能做什么", "还没做什么 / 有什么限制"],',
    '  "firstLook": [{"file": "相对路径", "why": "为什么先看它"}],',
    '  "ignore": [{"name": "文件名或文件夹名", "why": "为什么不用管"}]',
    '}',
    '',
    '要求：',
    `- areas 必须覆盖上面列出的每一个路径，一个不漏，顺序照抄，path 要一字不差。`,
    '- areas 要最先写完，免得后面写太长被截断。',
    '- title 说角色不说名字（例：「记账的规矩」而不是「store」）。',
    '- say 不超过 40 字，讲它在系统里干什么。',
    '- metaphor 是一句生活化的比方；想不出就给空字符串。',
    '- effect 讲改了之后的后果，尽量说症状（例：「页面会白屏」「数据会丢」）。',
    '- safety 只有 safe / careful / risky 三种：safe=放心改，careful=要小心，risky=别乱碰。',
    '- firstLook 的 file 必须是上面出现过的路径或其中某个文件名。',
    '- 只输出 JSON。',
  ].join('\n')
}

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

/* ───────────────────────── 组装最终地图 ───────────────────────── */

/** 取第一句话并压到一行，用来做副标题。 */
function firstClause(text, max) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (clean === '') return ''
  const cut = clean.search(/[。！？；!?;]/)
  let head = cut > 0 ? clean.slice(0, cut) : clean
  if (head.length > max) head = head.slice(0, max) + '…'
  return head
}

function mergeNarration(scan, narration) {
  // 模型写路径时常带 ./ 或末尾斜杠，这里统一归一化后再对号
  const normPath = (value) =>
    String(value ?? '').trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '').toLowerCase()

  const areas = new Map()
  const rawAreas = narration ? narration.areas : null
  if (Array.isArray(rawAreas)) {
    for (const area of rawAreas) {
      if (area && typeof area.path === 'string') areas.set(normPath(area.path), area)
    }
  } else if (rawAreas && typeof rawAreas === 'object') {
    for (const [path, area] of Object.entries(rawAreas)) {
      if (area && typeof area === 'object') areas.set(normPath(path), area)
    }
  }
  // 兼容旧格式：单独的 safety 映射
  const safety = narration && typeof narration.safety === 'object' && narration.safety ? narration.safety : {}

  for (const node of scan.nodes) {
    const heuristic = heuristicFor(node)
    const area = areas.get(normPath(node.path))
    const safetyTag = area?.safety ?? safety[node.path]
    const modelSay = typeof area?.say === 'string' && area.say.trim() !== '' ? area.say.trim() : ''
    const modelMetaphor = typeof area?.metaphor === 'string' && area.metaphor.trim() !== '' ? area.metaphor.trim() : ''
    node.title = typeof area?.title === 'string' && area.title.trim() !== '' ? area.title.trim() : heuristic.title
    // 常见文件夹名用词典里那句短的；模型补的块用模型自己那句，截到一句话
    node.oneLine = heuristic.source === 'heuristic' ? heuristic.oneLine : firstClause(modelSay, 26) || heuristic.oneLine
    node.plain = {
      lead: modelSay || heuristic.plain.lead,
      say: modelMetaphor ? '打比方：' + modelMetaphor : heuristic.plain.say,
      effect: typeof area?.effect === 'string' && area.effect.trim() !== '' ? area.effect.trim() : heuristic.plain.effect,
      safety: safetyTag === 'safe' || safetyTag === 'careful' || safetyTag === 'risky' ? safetyTag : heuristic.safety,
    }
    node.safety = node.plain.safety
    node.related = [...(node.importedBy ?? []), ...(node.imports ?? [])].slice(0, 6)
    node.deeper = deeperFor(node)
  }

  return {
    root: scan.root,
    name: scan.name,
    generatedAt: Date.now(),
    stats: scan.stats,
    nodes: scan.nodes.filter((node) => node.depth === 0),
    ignored: scan.ignored,
    summary: narration && Array.isArray(narration.summary) && narration.summary.length > 0
      ? narration.summary.slice(0, 3).map((s) => String(s).trim()).filter(Boolean)
      : fallbackSummary(scan),
    route: narration && Array.isArray(narration.firstLook) && narration.firstLook.length > 0
      ? narration.firstLook
          .filter((r) => r && typeof r.file === 'string')
          .slice(0, 3)
          .map((r) => ({ file: r.file, why: String(r.why ?? '').trim() || '先看它怎么跑起来的。' }))
      : fallbackRoute(scan),
    ignore: narration && Array.isArray(narration.ignore) && narration.ignore.length > 0
      ? narration.ignore
          .filter((r) => r && typeof r.name === 'string')
          .slice(0, 5)
          .map((r) => ({ name: r.name, why: String(r.why ?? '').trim() }))
      : scan.ignored.slice(0, 5).map((n) => ({ name: n, why: '给工具看的，不是给你看的。' })),
    narrated: Boolean(narration),
  }
}

function deeperFor(node) {
  const read = (node.files ?? []).find((f) => isCode(f)) ?? (node.files ?? [])[0] ?? node.name
  return {
    search: `「${node.title}」在项目里一般负责什么`,
    read: node.kind === 'file' ? node.path : `${node.path}/${read}`,
    ask: `「${node.path}」这块改之前我应该注意什么？`,
  }
}

function fallbackSummary(scan) {
  const top = scan.nodes.filter((n) => n.depth === 0 && n.kind === 'dir').slice(0, 3).map((n) => n.name)
  return [
    `这是一个叫 ${scan.name} 的项目，下面有 ${scan.stats.areas} 块、约 ${scan.stats.files} 个文件。`,
    top.length > 0 ? `主要的部分是：${top.join('、')}。` : '暂时只读到了很少的文件。',
    '模型还没给出完整解释，下面的内容是从目录和引用关系里直接读出来的。',
  ]
}

function fallbackRoute(scan) {
  const picks = []
  for (const node of scan.nodes) {
    const files = node.files ?? []
    const entry = files.find((f) => ENTRY_FILES.test(f))
    if (!entry) continue
    picks.push({
      file: node.kind === 'file' ? node.path : `${node.path}/${entry}`,
      why: '这是启动的地方：程序从这里开始跑，顺着它能找到后面的一切。',
    })
    if (picks.length >= 3) break
  }
  if (picks.length === 0) {
    for (const node of scan.nodes) {
      const file = (node.files ?? []).find(isCode)
      if (!file) continue
      picks.push({
        file: node.kind === 'file' ? node.path : `${node.path}/${file}`,
        why: `这里有 ${node.fileCount} 个文件，先挑一个短的看，比从头读整个项目省力。`,
      })
      if (picks.length >= 3) break
    }
  }
  return picks
}

/* ───────────────────────── 生成流程 ───────────────────────── */

async function run(entry, ctx) {
  try {
    entry.phase = '读目录'
    const scan = await scanProject(entry.path)

    entry.phase = '看引用关系'
    let narration = null
    let note = null

    if (entry.useModel) {
      entry.phase = '写人话'
      // 第一次给完整结构；如果模型把 JSON 说断了，就退成只讲顶层再试一次
      for (const compact of [false, true]) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 90000)
        try {
          const result = await callModel(ctx, buildPrompt(scan, compact, entry.limit), controller.signal)
          if (result.error) {
            note = result.error
            if (result.retryable === false) break
            continue
          }
          narration = parseJsonLoose(result.text)
          if (narration !== null) {
            note = null
            break
          }
          note = '模型这次没把 JSON 说完整，只恢复了能救回来的部分'
        } finally {
          clearTimeout(timer)
        }
      }
    } else {
      note = '这次没有用模型，只读结构'
    }

    entry.map = mergeNarration(scan, narration)
    entry.note = note
    entry.status = 'ready'
    entry.phase = 'done'
    entry.finishedAt = Date.now()
  } catch (error) {
    entry.status = 'error'
    entry.error = error instanceof Error ? error.message : String(error)
    entry.phase = 'error'
  } finally {
    inFlight.delete(entry.cacheKey)
  }
}

function ensure(ctx, path, options) {
  const useModel = options?.useModel !== false
  const limit = Math.max(4, Math.min(Number(options?.limit) || PROMPT_NODES, 26))
  const key = `${resolve(path)}|${useModel ? 'm' : 'fact'}|${limit}`
  const existing = cache.get(key)
  if (existing && existing.status === 'scanning') return existing
  if (existing && existing.status === 'ready' && !options?.force) return existing
  const entry = {
    status: 'scanning',
    phase: '排队',
    startedAt: Date.now(),
    map: null,
    error: null,
    note: null,
    useModel,
    limit,
    path: resolve(path),
    cacheKey: key,
  }
  cache.set(key, entry)
  inFlight.add(key)
  void run(entry, ctx)
  return entry
}

/* ───────────────────────── 路由 ───────────────────────── */

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
  return { projects, defaultPath, cached: [...cache.keys()] }
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

const MAX_FILE_BYTES = 400 * 1024
const CODE_EXCERPT_LINES = 140
const fileCache = new Map()

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

async function explainFile(ctx, rootPath, rel, useModel) {
  const rootAbs = resolve(rootPath)
  const abs = resolve(rootAbs, rel)
  if (!abs.toLowerCase().startsWith(rootAbs.toLowerCase())) return { ok: false, error: '路径越界，拒绝读取' }

  const info = await stat(abs).catch(() => null)
  if (!info || !info.isFile()) return { ok: false, error: '这个文件不在了' }

  const key = `${abs}|${info.mtimeMs}|${useModel ? 'm' : 'f'}`
  const cached = fileCache.get(key)
  if (cached) return cached

  if (info.size > MAX_FILE_BYTES) return { ok: false, error: '文件太大（超过 400KB），先不读' }

  const text = await readFile(abs, 'utf8').catch(() => '')
  if (text === '') return { ok: false, error: '读不出这个文件（可能是图片或二进制）' }
  const facts = analyzeSource(text)

  const base = {
    ok: true,
    rel,
    lines: facts.lines,
    names: facts.names,
    imports: facts.imports,
    exports: facts.exports,
    excerpt: facts.excerpt.split('\n').slice(0, 40).join('\n'),
    narrated: false,
    card: null,
    note: null,
  }

  if (!useModel) {
    const result = { ...base, note: '这次没有用模型' }
    fileCache.set(key, result)
    return result
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)
  try {
    const call = await callModel(ctx, buildFilePrompt(rel, facts), controller.signal, FILE_SYSTEM)
    if (call.error) return { ...base, note: call.error }
    const parsed = parseJsonLoose(call.text)
    if (!parsed) return { ...base, note: '模型这次没把 JSON 说完整' }
    const result = {
      ...base,
      narrated: true,
      card: {
        title: String(parsed.title ?? '').trim() || null,
        gist: String(parsed.gist ?? '').trim(),
        does: String(parsed.does ?? '').trim(),
        takeIn: String(parsed.takeIn ?? '').trim(),
        giveOut: String(parsed.giveOut ?? '').trim(),
        risk: String(parsed.risk ?? '').trim(),
        safety: ['safe', 'careful', 'risky'].includes(parsed.safety) ? parsed.safety : 'careful',
      },
    }
    fileCache.set(key, result)
    return result
  } finally {
    clearTimeout(timer)
  }
}

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
      path: `${API}/map`,
      handler: (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        const url = new URL(req.url ?? '/', 'http://localhost')
        const requestPath = url.searchParams.get('path')
        if (!requestPath) return json(res, 400, { ok: false, error: 'missing-path' })
        void handleMap(ctx, requestPath, false, url.searchParams).then((payload) => json(res, 200, payload)).catch((error) => {
          json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
        })
      },
    },
    {
      kind: 'exact',
      path: `${API}/file`,
      handler: (req, res) => {
        if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        const url = new URL(req.url ?? '/', 'http://localhost')
        const root = url.searchParams.get('path')
        const rel = url.searchParams.get('rel')
        if (!root || !rel) return json(res, 400, { ok: false, error: 'missing-path' })
        const useModel = url.searchParams.get('model') !== '0'
        void explainFile(ctx, root, rel, useModel)
          .then((payload) => json(res, 200, payload))
          .catch((error) => json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) }))
      },
    },
    {
      kind: 'exact',
      path: `${API}/refresh`,
      handler: (req, res) => {
        if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!requireSameOrigin(req, res)) return
        const url = new URL(req.url ?? '/', 'http://localhost')
        const requestPath = url.searchParams.get('path')
        if (!requestPath) return json(res, 400, { ok: false, error: 'missing-path' })
        void handleMap(ctx, requestPath, true, url.searchParams).then((payload) => json(res, 200, payload)).catch((error) => {
          json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
        })
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

  // 不在启动时偷读：要不要花模型的钱由页面上的设置决定，用户点开才读。
}

async function handleMap(ctx, requestPath, force, params) {
  const info = await stat(resolve(requestPath)).catch(() => null)
  if (!info || !info.isDirectory()) {
    return { ok: false, error: '这不是一个能打开的文件夹' }
  }
  const modelParam = params ? params.get('model') : null
  const limitParam = params ? params.get('limit') : null
  const entry = ensure(ctx, requestPath, {
    force,
    useModel: modelParam === null ? undefined : modelParam !== '0',
    limit: limitParam === null ? undefined : Number(limitParam),
  })
  if (entry.status === 'error') {
    return { ok: false, error: entry.error }
  }
  if (entry.status === 'ready') {
    return { ok: true, status: 'ready', map: entry.map, note: entry.note }
  }
  return { ok: true, status: 'generating', phase: entry.phase, elapsed: Date.now() - entry.startedAt }
}
