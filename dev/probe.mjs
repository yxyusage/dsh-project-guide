// 开发探针：直接打本地 API，看树、事实和「详细」讲得怎么样。
// 用法：node dev/probe.mjs [--port 54622] [--detail] <项目路径> [相对路径]
const args = process.argv.slice(2)
let port = Number(process.env.DSH_PORT || 54622)
let wantDetail = false
const paths = []
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i]
  if (arg === '--port') {
    port = Number(args[i + 1])
    i += 1
    continue
  }
  if (arg === '--detail') {
    wantDetail = true
    continue
  }
  if (arg.startsWith('--')) {
    console.error('未知参数：' + arg)
    process.exit(1)
  }
  paths.push(arg)
}

const target = paths[0]
if (!target) {
  console.error('用法：node dev/probe.mjs [--port 54622] [--detail] <项目路径> [相对路径]')
  process.exit(1)
}
const rel = paths[1] ?? ''
const base = `http://127.0.0.1:${port}/api/project-guide`

async function get(path) {
  try {
    const res = await fetch(base + path)
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      return { ok: false, error: text.slice(0, 160) }
    }
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) }
  }
}

const tree = await get(`/tree?path=${encodeURIComponent(target)}`)
if (!tree.ok) {
  console.log('读不到树：' + tree.error)
  console.log(`（端口可能变了：看 DSH 当前的 Web 地址，或用 --port 指定，默认 ${port}）`)
  process.exit(1)
}
console.log(`=== ${tree.name}  ${tree.stats.files} 个文件 / ${tree.stats.dirs} 个目录  truncated=${tree.stats.truncated}`)
console.log('类型：' + tree.stats.languages.map(([ext, count]) => `${ext}×${count}`).join('  '))
console.log('入口：' + (tree.stats.entries.join(' ') || '-'))
console.log('顶层：' + tree.tree.children.map((child) => child.name + (child.kind === 'dir' ? '/' : '')).join(' '))

const node = await get(`/node?path=${encodeURIComponent(target)}&rel=${encodeURIComponent(rel)}&refs=1`)
if (!node.ok) {
  console.log('读不到这一项：' + node.error)
  process.exit(1)
}
const summary = node.summary
console.log(`\n=== ${node.path || '(根)'}  [${node.kind}]`)
console.log('  标题：' + summary.title)
console.log('  一句：' + summary.oneLine)
console.log('  说明：' + summary.say)
console.log('  后果：' + summary.effect)
console.log('  安全：' + summary.safety + '  （来源 ' + summary.source + '）')
if (node.kind === 'dir') {
  console.log('  内含：' + node.children.map((child) => child.name + (child.kind === 'dir' ? '/' : '')).slice(0, 20).join(' '))
  if (node.refs) console.log('  引用：' + (node.refs.imports.join(' ') || '-'))
} else {
  console.log('  行数：' + node.lines + '  导出：' + ((node.exports || []).join(' ') || '-'))
  console.log('  依赖：' + ((node.imports || []).join(' ') || '-'))
}

if (wantDetail) {
  const started = Date.now()
  const detail = await get(`/detail?path=${encodeURIComponent(target)}&rel=${encodeURIComponent(rel)}`)
  console.log(`\n--- 详细（${Date.now() - started}ms，cached=${detail.cached}） ---`)
  if (!detail.ok) console.log('  失败：' + detail.error)
  else {
    for (const [key, value] of Object.entries(detail.detail)) console.log(`  ${key}：${value}`)
  }
}
