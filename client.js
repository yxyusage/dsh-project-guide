window.__ModuleLoader__.load({
	id: 'dsh-project-guide',
	factory: (require) => {
		const react = require('react')
		const h = react.createElement
		const { useState, useEffect, useMemo, useRef, useCallback } = react

		/* ───────────────────────── 字典 ───────────────────────── */

		const NS = 'learnUp'

		const zh = {
			nav: '导览',
			title: '项目导览',
			subtitle: '把代码翻成人话',
			loading: '正在读这个项目…',
			loadingHint: '第一次打开要花十几秒，之后会缓存。',
			empty: '还没有可读的项目',
			emptyHint: '挑一个文件夹，我先看一遍再讲给你听。',
			pick: '换个项目',
			paste: '或者直接粘一个文件夹路径',
			open: '打开',
			refresh: '重新读一遍',
			refreshing: '重新读…',
			error: '没读成',
			retry: '再试一次',
			overview: '项目导览',
			what: '这个项目是干什么的',
			structure: '由这几块组成',
			structureHint: '宽度按文件多少排的',
			route: '从这看起',
			routeHint: '按这个顺序，半小时能看明白大半',
			ignore: '这些你不用管',
			ignoreHint: '属于工具，不属于这个项目',
			related: '跟谁有关系',
			deeper: '想深入',
			search: '搜索文件夹',
			depth: '讲多深',
			plain: '讲给我听',
			structureDepth: '讲清结构',
			code: '看到代码',
			effect: '改了会怎样',
			safe: '放心改',
			careful: '要小心',
			risky: '别乱碰',
			gotIt: '我懂了',
			undoGotIt: '再看一遍',
			simpler: '再讲简单点',
			wrong: '这里讲错了',
			noteTitle: '你之前更正过这里',
			notePlaceholder: '哪儿不对？比如：这个文件夹其实是放样式的，不是放数据的。',
			noteSubmit: '记下',
			noteSaved: '记在本机了，下次打开会先显示你的说法。',
			noteCancel: '取消',
			settings: '设置',
			useModel: '用模型写解释',
			useModelHint: '关掉后几秒就出来，但每块只剩结构，没有人话。',
			scope: '一次讲多少块',
			scopeHint: '块数越多越慢，也越容易讲得含糊。',
			scopeFew: '少',
			scopeNormal: '标准',
			scopeMore: '多',
			settingsHint: '改完会重新读一遍这个项目。',
			inside: '里面有什么',
			openFileHint: '点开，我讲给你听',
			fileLoading: '正在读这个文件…',
			fileLoadingHint: '只把开头和用到的片段发给模型，不整份上传。',
			fileError: '这个文件没读成',
			fileRetry: '再试一次',
			back: '回到上一块',
			whatItDoes: '它具体做了什么',
			takesIn: '它需要',
			givesOut: '它产出',
			keyNames: '里面的关键名字',
			fileFactsOnly: '这次没有用模型，只看了结构',
			fileNote: '这块的解释由模型读完这个文件后写的',
			files: '个文件',
			areas: '块',
			known: '懂了',
			narrated: '人话由模型生成，事实来自代码',
			factsOnly: '这次只有结构，没有模型解释',
			seen: '看过',
			close: '关闭',
			openFile: '去看代码',
			noMatch: '没有匹配的文件夹',
		}

		const en = {
			nav: 'Guide',
			title: 'Project Guide',
			subtitle: 'Code, in plain words',
			loading: 'Reading this project…',
			loadingHint: 'The first pass takes a few seconds; later visits are cached.',
			empty: 'No project to read yet',
			emptyHint: 'Pick a folder and I will read it before I explain it.',
			pick: 'Switch project',
			paste: 'Or paste a folder path',
			open: 'Open',
			refresh: 'Read again',
			refreshing: 'Reading…',
			error: 'Could not read it',
			retry: 'Try again',
			overview: 'Overview',
			what: 'What this project does',
			structure: 'Made of these parts',
			structureHint: 'Width follows file count',
			route: 'Start here',
			routeHint: 'In this order, most of it makes sense in half an hour',
			ignore: 'Ignore these',
			ignoreHint: 'They belong to tools, not to this project',
			related: 'Connected to',
			deeper: 'Go deeper',
			search: 'Search folders',
			depth: 'Depth',
			plain: 'Tell me',
			structureDepth: 'Structure',
			code: 'Code',
			effect: 'What breaks if I change it',
			safe: 'Safe',
			careful: 'Careful',
			risky: 'Hands off',
			gotIt: 'Got it',
			undoGotIt: 'Show again',
			simpler: 'Simpler',
			wrong: 'This is wrong',
			noteTitle: 'You corrected this before',
			notePlaceholder: 'What is wrong here?',
			noteSubmit: 'Save',
			noteSaved: 'Saved locally. It shows first next time.',
			noteCancel: 'Cancel',
			settings: 'Settings',
			useModel: 'Let the model explain',
			useModelHint: 'Off is fast, but every card is structure only.',
			scope: 'How many parts',
			scopeHint: 'More parts means slower and vaguer.',
			scopeFew: 'Few',
			scopeNormal: 'Normal',
			scopeMore: 'More',
			settingsHint: 'Changing this re-reads the project.',
			inside: 'What is inside',
			openFileHint: 'Open one and I will explain it',
			fileLoading: 'Reading this file…',
			fileLoadingHint: 'Only the head and the used parts go to the model.',
			fileError: 'Could not read this file',
			fileRetry: 'Try again',
			back: 'Back to the folder',
			whatItDoes: 'What it actually does',
			takesIn: 'It needs',
			givesOut: 'It produces',
			keyNames: 'Names inside',
			fileFactsOnly: 'No model this time, structure only',
			fileNote: 'The model read this file before explaining it',
			files: 'files',
			areas: 'parts',
			known: 'understood',
			narrated: 'Words by the model, facts from the code',
			factsOnly: 'Structure only this time',
			seen: 'seen',
			close: 'Close',
			openFile: 'Show the code',
			noMatch: 'No folder matches',
		}

const CSS = `
.lu-app{--lu-bg:var(--dsw-alias-bg-base,#131417);--lu-l1:var(--dsw-alias-bg-layer-1,#191b1f);--lu-l2:var(--dsw-alias-bg-layer-2,#202329);--lu-bd:var(--dsw-alias-border-l1,#2a2d34);--lu-bd2:var(--dsw-alias-border-l2,#3a3f48);--lu-fg:var(--dsw-alias-label-primary,#e9ebee);--lu-dim:var(--dsw-alias-label-secondary,#9aa1ab);--lu-idle:var(--dsw-alias-state-idle-primary,#6b7280);--lu-brand:var(--dsw-alias-brand-primary,#5b8cff);--lu-ok:var(--dsw-alias-state-success-primary,#3fb950);--lu-warn:var(--dsw-alias-state-warn-primary,#d29922);--lu-bad:var(--dsw-alias-state-error-primary,#f85149);
display:flex;height:100%;min-height:460px;background:var(--lu-bg);color:var(--lu-fg);font:13.5px/1.6 -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif;overflow:hidden}
.lu-app *{box-sizing:border-box}
.lu-app button{font:inherit;color:inherit}

.lu-rail{width:216px;flex:none;background:var(--dsw-specific-sidebar-fill,var(--lu-l1));border-right:1px solid var(--lu-bd);display:flex;flex-direction:column;min-height:0}
.lu-proj{padding:16px 14px 12px;border-bottom:1px solid var(--lu-bd)}
.lu-proj-row{display:flex;align-items:center;gap:8px}
.lu-proj-name{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lu-proj-meta{font-size:11.5px;color:var(--lu-dim);margin-top:3px}
.lu-pick{margin-left:auto;flex:none;border:1px solid var(--lu-bd2);background:transparent;border-radius:6px;padding:3px 8px;font-size:11.5px;color:var(--lu-dim);cursor:pointer;white-space:nowrap}
.lu-pick:hover{color:var(--lu-fg);border-color:var(--lu-idle)}
.lu-search{padding:10px 10px 6px}
.lu-search input{width:100%;background:var(--lu-l2);border:1px solid var(--lu-bd);border-radius:7px;padding:5px 9px;font:inherit;font-size:12.5px;color:var(--lu-fg);outline:none}
.lu-search input:focus{border-color:var(--lu-brand)}
.lu-search input::placeholder{color:var(--lu-idle)}
.lu-tree{flex:1;overflow:auto;padding:2px 8px 10px;min-height:0}
.lu-node{display:flex;align-items:center;gap:7px;padding:5px 9px;border-radius:6px;font-size:13px;color:var(--lu-dim);cursor:pointer;user-select:none;border:0;background:none;width:100%;text-align:left}
.lu-node:hover{background:var(--lu-l2);color:var(--lu-fg)}
.lu-node.on{background:var(--lu-l2);color:var(--lu-fg)}
.lu-node.d1{padding-left:22px}
.lu-node .lu-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lu-node .lu-ct{margin-left:auto;font-size:11px;color:var(--lu-idle);font-variant-numeric:tabular-nums;flex:none}
.lu-dot{width:5px;height:5px;border-radius:50%;background:var(--lu-ok);flex:none}
.lu-progress{padding:10px 14px 12px;border-top:1px solid var(--lu-bd);font-size:11.5px;color:var(--lu-dim)}
.lu-track{height:3px;border-radius:2px;background:var(--lu-l2);margin-top:7px;overflow:hidden}
.lu-track>i{display:block;height:100%;background:var(--lu-ok);transition:width .3s}

.lu-main{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
.lu-top{flex:none;display:flex;align-items:center;gap:10px;padding:9px 20px;border-bottom:1px solid var(--lu-bd);min-height:46px;flex-wrap:wrap;row-gap:8px}
.lu-crumb{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;color:var(--lu-idle);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:90px;flex:0 1 auto}
.lu-crumb b{font-weight:400;color:var(--lu-dim)}
.lu-spacer{flex:1}
.lu-btn{border:1px solid var(--lu-bd2);background:transparent;color:var(--lu-dim);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;white-space:nowrap}
.lu-btn:hover{color:var(--lu-fg);border-color:var(--lu-idle)}
.lu-btn[disabled]{opacity:.5;cursor:default}
.lu-scroll{flex:1;overflow:auto;min-height:0}
.lu-page{max-width:820px;padding:26px 26px 48px}

.lu-eyebrow{font-size:11.5px;color:var(--lu-idle);letter-spacing:.06em}
.lu-h1{font-size:22px;font-weight:600;margin:6px 0 4px;letter-spacing:-.01em;line-height:1.4}
.lu-lede{font-size:12.5px;color:var(--lu-dim)}
.lu-sum{margin:18px 0 0;padding:0;list-style:none}
.lu-sum li{font-size:14.5px;line-height:1.85;margin-bottom:4px;padding-left:14px;position:relative}
.lu-sum li::before{content:"";position:absolute;left:0;top:.72em;width:4px;height:4px;border-radius:50%;background:var(--lu-bd2)}
.lu-sum li:last-child{color:var(--lu-dim)}

.lu-sec{margin-top:34px}
.lu-sec-h{display:flex;align-items:baseline;gap:9px;margin-bottom:12px}
.lu-sec-h h2{font-size:13.5px;font-weight:600;margin:0}
.lu-sec-h span{font-size:11.5px;color:var(--lu-idle)}

.lu-comp{display:flex;gap:1px;height:6px;border-radius:3px;overflow:hidden;margin-bottom:10px}
.lu-comp i{display:block;height:100%;min-width:3px;background:var(--lu-bd2)}
.lu-comp i.safe{background:var(--lu-ok)}
.lu-comp i.careful{background:var(--lu-warn)}
.lu-comp i.risky{background:var(--lu-bad)}
.lu-parts{display:flex;flex-direction:column;border:1px solid var(--lu-bd);border-radius:9px;overflow:hidden;background:var(--lu-l1)}
.lu-part{display:flex;align-items:center;gap:11px;padding:10px 13px;border:0;border-bottom:1px solid var(--lu-bd);background:none;cursor:pointer;text-align:left;width:100%;font:inherit;color:inherit}
.lu-part:last-child{border-bottom:0}
.lu-part:hover{background:var(--lu-l2)}
.lu-part .lu-pname{flex:none;width:132px;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:6px}
.lu-part .lu-psay{flex:1;font-size:12px;color:var(--lu-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lu-part .lu-pct{flex:none;font-size:11px;color:var(--lu-idle);font-variant-numeric:tabular-nums}
.lu-part .lu-pchev{flex:none;color:var(--lu-idle);font-size:12px}

.lu-route{list-style:none;margin:0;padding:0}
.lu-route li{display:flex;gap:13px;padding:11px 0;border-bottom:1px dashed var(--lu-bd);align-items:flex-start}
.lu-route li:last-child{border-bottom:0}
.lu-num{width:21px;height:21px;flex:none;border-radius:50%;border:1px solid var(--lu-bd2);color:var(--lu-dim);font-size:11px;display:grid;place-items:center;margin-top:1px}
.lu-route b{display:block;font-weight:500;font-size:13px}
.lu-file{font-family:ui-monospace,Consolas,monospace;font-size:12px;color:var(--lu-brand);background:color-mix(in srgb,var(--lu-brand) 12%,transparent);border-radius:4px;padding:1px 5px}
.lu-why{font-size:12px;color:var(--lu-dim);margin-top:3px}

.lu-fold{border:1px solid var(--lu-bd);border-radius:9px;background:var(--lu-l1);overflow:hidden}
.lu-fold>summary{cursor:pointer;padding:11px 14px;font-size:13px;list-style:none;display:flex;gap:9px;align-items:center}
.lu-fold>summary::-webkit-details-marker{display:none}
.lu-fold>summary::before{content:"▸";font-size:10px;color:var(--lu-idle)}
.lu-fold[open]>summary::before{content:"▾"}
.lu-ig{padding:0 14px 12px 34px}
.lu-ig-row{display:flex;gap:10px;padding:4px 0;font-size:12.5px}
.lu-ig-row code{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;color:var(--lu-dim);min-width:110px}
.lu-ig-row span{color:var(--lu-idle)}

.lu-hero{display:flex;align-items:flex-start;gap:12px}
.lu-pill{flex:none;border-radius:20px;padding:2px 9px;font-size:11.5px;margin-top:5px}
.lu-pill.safe{color:var(--lu-ok);background:color-mix(in srgb,var(--lu-ok) 15%,transparent)}
.lu-pill.careful{color:var(--lu-warn);background:color-mix(in srgb,var(--lu-warn) 15%,transparent)}
.lu-pill.risky{color:var(--lu-bad);background:color-mix(in srgb,var(--lu-bad) 15%,transparent)}

.lu-call{margin-top:18px;border-left:3px solid var(--lu-brand);background:var(--lu-l1);border-radius:0 8px 8px 0;padding:13px 15px}
.lu-call .lu-call-h{font-size:11.5px;color:var(--lu-idle);margin-bottom:5px}
.lu-call p{margin:0;font-size:14.5px;line-height:1.8}
.lu-body{margin-top:18px;font-size:14px;line-height:1.9}
.lu-say{margin:14px 0 0;padding-left:13px;border-left:2px solid var(--lu-bd2);color:var(--lu-dim);font-size:13.5px;line-height:1.85}
.lu-kv{list-style:none;margin:14px 0 0;padding:0}
.lu-kv li{display:flex;gap:9px;padding:7px 0;border-bottom:1px dashed var(--lu-bd);font-size:13.5px;line-height:1.75}
.lu-kv li:last-child{border-bottom:0}
.lu-kv .k{flex:none;min-width:52px;color:var(--lu-idle);font-size:12px;padding-top:3px}
.lu-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.lu-chip{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;border:1px solid var(--lu-bd);border-radius:5px;padding:2px 7px;color:var(--lu-dim);background:var(--lu-l1)}
.lu-deep{margin-top:28px;border-top:1px solid var(--lu-bd);padding-top:14px}
.lu-deep-row{display:flex;gap:11px;padding:6px 0;align-items:flex-start}
.lu-deep-k{flex:none;width:52px;text-align:right;font-size:11.5px;color:var(--lu-idle);padding-top:2px}
.lu-deep-v{font-size:13px;line-height:1.7}
.lu-deep-v code{font-family:ui-monospace,Consolas,monospace;font-size:12px;color:var(--lu-brand)}
.lu-deep-v em{display:block;font-style:normal;color:var(--lu-idle);font-size:11.5px;margin-top:2px}
.lu-nav{display:flex;justify-content:flex-start;gap:10px;margin-top:36px;padding-top:16px;border-top:1px solid var(--lu-bd);flex-wrap:wrap}
.lu-navbtn{flex:0 1 auto;max-width:46%;border:1px solid var(--lu-bd);background:var(--lu-l1);border-radius:8px;padding:9px 14px;font-size:12.5px;color:var(--lu-dim);cursor:pointer;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lu-navbtn:hover{color:var(--lu-fg);border-color:var(--lu-bd2);background:var(--lu-l2)}
.lu-navbtn.next{text-align:right}
.lu-navbtn.empty{display:none}

.lu-note{margin-top:16px;border:1px solid var(--lu-warn);border-radius:8px;padding:11px 13px;background:color-mix(in srgb,var(--lu-warn) 8%,transparent);font-size:13px}
.lu-note b{display:block;font-size:11.5px;color:var(--lu-warn);font-weight:500;margin-bottom:3px}
.lu-noteform{margin-top:14px;border:1px solid var(--lu-bd);border-radius:9px;background:var(--lu-l1);padding:12px}
.lu-noteform textarea{width:100%;min-height:62px;resize:vertical;background:var(--lu-bg);color:var(--lu-fg);border:1px solid var(--lu-bd);border-radius:7px;padding:8px 10px;font:inherit;font-size:13px;outline:none}
.lu-noteform textarea:focus{border-color:var(--lu-brand)}
.lu-noteform .lu-row{display:flex;gap:8px;margin-top:8px;align-items:center}

.lu-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;row-gap:6px;flex:none}
.lu-segs{display:inline-flex;padding:2px;gap:1px;background:var(--lu-l1);border:1px solid var(--lu-bd);border-radius:7px;flex:none}
.lu-segs button{border:0;background:none;color:var(--lu-dim);padding:4px 9px;border-radius:5px;font-size:11.5px;cursor:pointer;white-space:nowrap}
.lu-segs button:hover{color:var(--lu-fg)}
.lu-segs button.on{background:var(--lu-l2);color:var(--lu-fg)}
.lu-got{border:1px solid var(--lu-bd2);background:none;color:var(--lu-dim);border-radius:6px;padding:4px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;flex:none}
.lu-got.ok{color:var(--lu-ok);border-color:color-mix(in srgb,var(--lu-ok) 45%,transparent)}
.lu-got:hover{color:var(--lu-fg)}

.lu-fineprint{margin-top:20px;font-size:11px;color:var(--lu-idle);line-height:1.7}
.lu-files{display:flex;flex-direction:column;border:1px solid var(--lu-bd);border-radius:8px;overflow:hidden;background:var(--lu-l1)}
.lu-file-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:0;border-bottom:1px solid var(--lu-bd);background:none;color:var(--lu-dim);font:12.5px/1.4 ui-monospace,Consolas,monospace;cursor:pointer;text-align:left;width:100%}
.lu-file-row:last-child{border-bottom:0}
.lu-file-row:hover{background:var(--lu-l2);color:var(--lu-fg)}
.lu-file-nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lu-file-go{color:var(--lu-idle)}
.lu-code{margin:0;padding:12px 14px;background:var(--lu-l1);border:1px solid var(--lu-bd);border-radius:8px;font:12px/1.6 ui-monospace,Consolas,monospace;color:var(--lu-dim);overflow:auto;max-height:380px;white-space:pre}

.lu-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px;text-align:center}
.lu-center h3{margin:0;font-size:15px;font-weight:600}
.lu-center p{margin:0;font-size:12.5px;color:var(--lu-dim);max-width:380px;line-height:1.7}
.lu-spin{width:26px;height:26px;border-radius:50%;border:2px solid var(--lu-bd2);border-top-color:var(--lu-brand);animation:lu-spin .9s linear infinite}
@keyframes lu-spin{to{transform:rotate(360deg)}}
.lu-prog{width:220px;height:3px;border-radius:2px;background:var(--lu-l2);overflow:hidden;margin-top:4px}
.lu-prog>i{display:block;width:40%;height:100%;background:var(--lu-brand);animation:lu-slide 1.3s ease-in-out infinite}
@keyframes lu-slide{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}

.lu-mask{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:20}
.lu-modal{width:min(460px,88%);background-color:#181b20;background-image:linear-gradient(var(--dsw-specific-sidebar-fill,transparent),var(--dsw-specific-sidebar-fill,transparent));border:1px solid var(--lu-bd2);border-radius:12px;padding:18px;box-shadow:0 18px 50px rgba(0,0,0,.6)}
.lu-modal h4{margin:0 0 4px;font-size:14px}
.lu-modal .lu-hint{font-size:11.5px;color:var(--lu-dim);margin-bottom:12px}
.lu-list{max-height:240px;overflow:auto;margin:0 -4px 12px;padding:0 4px}
.lu-list button{display:block;width:100%;text-align:left;border:1px solid transparent;background:var(--lu-l2);border-radius:7px;padding:8px 10px;margin-bottom:5px;cursor:pointer;font-size:12.5px}
.lu-list button:hover{border-color:var(--lu-bd2)}
.lu-list small{display:block;color:var(--lu-idle);font-size:11px;font-family:ui-monospace,Consolas,monospace;margin-top:2px;overflow:hidden;text-overflow:ellipsis}
.lu-modal .lu-field{display:flex;gap:7px}
.lu-modal .lu-field input{flex:1;background:var(--lu-bg);border:1px solid var(--lu-bd);border-radius:7px;padding:6px 9px;font:inherit;font-size:12px;color:var(--lu-fg);outline:none}
.lu-modal .lu-field input:focus{border-color:var(--lu-brand)}
.lu-modal .lu-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
.lu-empty-tree{padding:14px 10px;font-size:12px;color:var(--lu-idle);text-align:center}
.lu-app{position:relative}
.lu-pop-mask{position:fixed;inset:0;z-index:880}
.lu-pop{position:fixed;top:56px;right:24px;width:330px;max-width:calc(100% - 32px);background-color:#181b20;background-image:linear-gradient(var(--dsw-specific-sidebar-fill,transparent),var(--dsw-specific-sidebar-fill,transparent));border:1px solid var(--lu-bd2);border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.6);padding:14px 15px;z-index:900}
.lu-pop-h{font-size:12px;color:var(--lu-idle);margin-bottom:12px;letter-spacing:.04em}
.lu-pop-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-top:1px solid var(--lu-bd)}
.lu-pop-row:first-of-type{border-top:0;padding-top:2px}
.lu-pop-row .lu-pop-t{flex:1;min-width:0}
.lu-pop-row b{display:block;font-size:13px;font-weight:500}
.lu-pop-row small{display:block;color:var(--lu-dim);font-size:11.5px;line-height:1.5;margin-top:3px}
.lu-pop-f{margin-top:10px;padding-top:10px;border-top:1px solid var(--lu-bd);font-size:11px;color:var(--lu-idle)}
.lu-switch{width:36px;height:20px;border-radius:20px;border:1px solid var(--lu-bd2);background:var(--lu-l2);position:relative;cursor:pointer;padding:0;flex:none;margin-top:2px}
.lu-switch i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--lu-idle);transition:left .15s,background .15s}
.lu-switch.on{background:color-mix(in srgb,var(--lu-brand) 32%,transparent);border-color:var(--lu-brand)}
.lu-switch.on i{left:18px;background:var(--lu-brand)}
@media (max-width:900px){.lu-rail{width:200px}.lu-seg{min-width:72px}}

.lu-row{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;font-size:12.5px;color:var(--lu-dim);cursor:pointer;user-select:none}
.lu-row:hover{background:var(--lu-l2);color:var(--lu-fg)}
.lu-row.on{background:var(--lu-l2);color:var(--lu-fg)}
.lu-caret{width:16px;height:16px;line-height:1;display:flex;align-items:center;justify-content:center;border:0;background:none;color:var(--lu-idle);cursor:pointer;padding:0;font-size:9px;flex:none;border-radius:3px}
.lu-caret:hover{background:var(--lu-bd);color:var(--lu-fg)}
.lu-caret-space{width:16px;flex:none}
.lu-rn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lu-rc{margin-left:auto;font-size:10.5px;color:var(--lu-idle);font-variant-numeric:tabular-nums;flex:none}
.lu-ver{padding:6px 14px;font-size:10.5px;color:var(--lu-idle);border-top:1px solid var(--lu-bd)}
.lu-row-meta{display:flex;align-items:center;gap:10px;margin:10px 0 6px;flex-wrap:wrap}
.lu-badge{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--lu-bd2);color:var(--lu-dim);flex:none}
.lu-badge.safe{color:var(--lu-ok);border-color:color-mix(in srgb,var(--lu-ok) 40%,transparent)}
.lu-badge.risky{color:var(--lu-bad);border-color:color-mix(in srgb,var(--lu-bad) 40%,transparent)}
.lu-badge.unknown{color:var(--lu-idle);border-style:dashed}
.lu-badge.careful{color:var(--lu-warn);border-color:color-mix(in srgb,var(--lu-warn) 40%,transparent)}
.lu-app{--lu-rail-w:240px}
.lu-rail{width:var(--lu-rail-w);flex:none;min-width:0}
.lu-splitter{width:5px;flex:none;cursor:col-resize;background:transparent;margin-left:-3px;margin-right:-2px;position:relative;z-index:3;border-radius:3px;outline:none}
.lu-splitter:hover,.lu-splitter:focus-visible{background:var(--lu-brand)}
.lu-app.dragging{cursor:col-resize}
.lu-app.dragging *{user-select:none!important}
.lu-detail{margin-top:16px;padding:14px 16px;border:1px solid var(--lu-bd);border-radius:10px;background:var(--lu-l1)}
.lu-detail-h{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.lu-detail-t{font-weight:600;color:var(--lu-fg);font-size:13.5px}
.lu-actions-row{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;align-items:center}
.lu-note{font-size:12px;color:var(--lu-warn);margin-top:10px}
.lu-muted{font-size:11.5px;color:var(--lu-idle)}
@media (max-width:900px){.lu-app{--lu-rail-w:200px}}
`

		function GuideIcon(props) {
			const size = typeof props.size === 'number' ? props.size : 20
			return h(
				'svg',
				{
					width: size,
					height: size,
					viewBox: '0 0 24 24',
					fill: 'none',
					stroke: 'currentColor',
					strokeWidth: 1.6,
					strokeLinecap: 'round',
					strokeLinejoin: 'round',
					'aria-hidden': true,
					style: { display: 'block', opacity: props.active === false ? 0.75 : 1 },
				},
				h('rect', { x: 3.2, y: 3.6, width: 7, height: 6.4, rx: 2 }),
				h('rect', { x: 13.8, y: 3.6, width: 7, height: 6.4, rx: 2 }),
				h('rect', { x: 8.5, y: 14.4, width: 7, height: 6.4, rx: 2 }),
				h('path', { d: 'M6.7 10v2.4h10.6V10' }),
				h('path', { d: 'M12 12.4v2' }),
			)
		}

		/* ───────────────────────── v2：树 + 详情 ───────────────────────── */

		Object.assign(zh, {
			treeHint: '点文件夹展开，点名字看它是什么',
			selectHint: '点左边任意一行，这里会告诉你它是什么、改了会怎样。',
			foldersLabel: '文件夹',
			expand: '展开',
			collapse: '折叠',
			version: 'v0.2.1',
			loadingNode: '正在读这一块…',
			truncated: '目录太大，只展开了前面一部分',
			types: '文件类型',
			biggest: '最大的几块',
			entries: '入口文件',
			children: '里面有什么',
			detailSoon: '更详细的架构说明，下一步接入。',
			detail: '详细讲',
			unknown: '未评估',
			assessAll: '评估全部',
			assessing: '评估中…',
			assessedN: '这一层已评估 ',
			predicted: '预判',
			regenerate: '重新生成',
			cached: '用的是缓存',
			dragHint: '拖动调整宽度，双击复位',
			lines: '行数',
			exportsLabel: '导出的东西',
			importsLabel: '用到的东西',
			commentLabel: '开头写着',
		})

		Object.assign(en, {
			treeHint: 'Click a folder to expand, click a name to read it',
			selectHint: 'Pick a row on the left; this pane explains what it is and what breaks if you change it.',
			foldersLabel: 'Folders',
			expand: 'Expand',
			collapse: 'Collapse',
			version: 'v0.2.1',
			loadingNode: 'Reading this part…',
			truncated: 'This tree is large; only part of it is expanded',
			types: 'File types',
			biggest: 'Largest areas',
			entries: 'Entry files',
			children: 'What is inside',
			detailSoon: 'Deeper architecture notes arrive in the next step.',
			detail: 'Explain in detail',
			unknown: 'Not assessed',
			assessAll: 'Assess all',
			assessing: 'Assessing…',
			assessedN: 'Assessed this level: ',
			predicted: 'assessed',
			regenerate: 'Regenerate',
			cached: 'from cache',
			dragHint: 'Drag to resize, double-click to reset',
			lines: 'Lines',
			exportsLabel: 'Exports',
			importsLabel: 'Uses',
			commentLabel: 'File header',
		})

		const API = '/api/project-guide'

		const readJson = async (url, options) => {
			try {
				const res = await fetch(url, options)
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

		const storageGet = (key, fallback) => {
			try {
				const raw = localStorage.getItem(key)
				return raw === null ? fallback : JSON.parse(raw)
			} catch {
				return fallback
			}
		}

		const storageSet = (key, value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value))
			} catch {
				/* 隐私模式忽略 */
			}
		}

		/** 路径深度：'a' 为 0，'a/b' 为 1。 */
		const depthOf = (path) => (path === '' ? -1 : path.split('/').length - 1)

		const safetyLabel = (safety, t) =>
			safety === 'safe' ? t('safe') : safety === 'risky' ? t('risky') : safety === 'unknown' ? t('unknown') : t('careful')

		function GuidePage(props) {
			const t = typeof props.t === 'function' ? props.t : (key) => zh[key] || key

			const [stage, setStage] = useState('boot')
			const [projectPath, setProjectPath] = useState('')
			const [tree, setTree] = useState(null)
			const [error, setError] = useState('')
			const [selected, setSelected] = useState('')
			const [expanded, setExpanded] = useState(() => new Set(['']))
			const [query, setQuery] = useState('')
			const [facts, setFacts] = useState(null)
			const [factsStage, setFactsStage] = useState('idle')
			const [projects, setProjects] = useState([])
			const [manual, setManual] = useState('')
			const [picker, setPicker] = useState(false)
			const [reload, setReload] = useState(0)
			const [busy, setBusy] = useState(false)
			const [assessing, setAssessing] = useState(false)
			const [assessNote, setAssessNote] = useState('')
			const [factsNonce, setFactsNonce] = useState(0)
			const [detail, setDetail] = useState(null)
			const [detailStage, setDetailStage] = useState('idle')
			const [railAria, setRailAria] = useState(240)
			const factsCache = useRef(new Map())
			const appRef = useRef(null)

			/** 夹住拖动宽度：最小 180，最大不超过容器 60%，上限 560。 */
			const clampRail = (width) => {
				const container = (appRef.current && appRef.current.clientWidth) || window.innerWidth || 900
				const max = Math.max(240, Math.min(560, Math.round(container * 0.6)))
				const min = Math.min(180, max)
				const next = Math.round(Number(width) || 240)
				return Math.max(min, Math.min(max, next))
			}

			const setRailWidth = (width, persist) => {
				const next = clampRail(width)
				if (appRef.current) appRef.current.style.setProperty('--lu-rail-w', next + 'px')
				setRailAria(next)
				if (persist) storageSet('lu.rail', next)
				return next
			}

			/* 宽度从本地恢复，并在窗口变化时重新夹一次 */
			useEffect(() => {
				setRailWidth(storageGet('lu.rail', 240), false)
				const onResize = () => {
					const current = appRef.current
						? parseFloat(getComputedStyle(appRef.current).getPropertyValue('--lu-rail-w')) || 240
						: 240
					setRailWidth(current, false)
				}
				window.addEventListener('resize', onResize)
				return () => window.removeEventListener('resize', onResize)
			}, [])

			const startDrag = (event) => {
				const app = appRef.current
				if (!app) return
				event.preventDefault()
				const startX = event.clientX
				const startW =
					parseFloat(getComputedStyle(app).getPropertyValue('--lu-rail-w')) || 240
				app.classList.add('dragging')
				const move = (moveEvent) => {
					const next = clampRail(startW + (moveEvent.clientX - startX))
					app.style.setProperty('--lu-rail-w', next + 'px')
				}
				const finish = () => {
					app.classList.remove('dragging')
					window.removeEventListener('pointermove', move)
					window.removeEventListener('pointerup', finish)
					window.removeEventListener('pointercancel', finish)
					const current =
						parseFloat(getComputedStyle(app).getPropertyValue('--lu-rail-w')) || 240
					setRailWidth(current, true)
				}
				window.addEventListener('pointermove', move)
				window.addEventListener('pointerup', finish)
				window.addEventListener('pointercancel', finish)
			}

			const nudgeRail = (event) => {
				const current = appRef.current
					? parseFloat(getComputedStyle(appRef.current).getPropertyValue('--lu-rail-w')) || 240
					: 240
				if (event.key === 'ArrowLeft') setRailWidth(current - 16, true)
				else if (event.key === 'ArrowRight') setRailWidth(current + 16, true)
				else if (event.key === 'Home') setRailWidth(240, true)
				else return
				event.preventDefault()
			}

			/* 首次进入：先问有哪些项目 */
			useEffect(() => {
				let alive = true
				readJson(API + '/projects').then((payload) => {
					if (!alive) return
					if (payload.ok) setProjects(Array.isArray(payload.projects) ? payload.projects : [])
					const remembered = storageGet('lu.path', '')
					const next = remembered || payload.defaultPath || (payload.projects && payload.projects[0] && payload.projects[0].path) || ''
					if (next) setProjectPath(next)
					else {
						setStage('boot')
					}
				})
				return () => {
					alive = false
				}
			}, [])

			/* 读整棵树：一次 readdir 扫描，不调模型 */
			useEffect(() => {
				if (!projectPath) return undefined
				let alive = true
				setStage('loading')
				setError('')
				const url = API + '/tree?path=' + encodeURIComponent(projectPath) + (reload > 0 ? '&refresh=1' : '')
				readJson(url)
					.then((payload) => {
						if (!alive) return
						if (!payload.ok) {
							setError(payload.error || t('error'))
							setStage('error')
							return
						}
						factsCache.current = new Map()
						setTree(payload)
						setExpanded(new Set(['']))
						setSelected('')
						setStage('ready')
					})
					.catch((err) => {
						if (!alive) return
						setError(String(err && err.message ? err.message : err))
						setStage('error')
					})
				return () => {
					alive = false
				}
			}, [projectPath, reload])

			/* 选中节点：拉事实（不调模型） */
			useEffect(() => {
				if (stage !== 'ready' || selected === null) return undefined
				const cached = factsCache.current.get(selected)
				if (cached) {
					setFacts(cached)
					setFactsStage('ready')
					return undefined
				}
				let alive = true
				setFactsStage('loading')
				const url =
					API + '/node?path=' + encodeURIComponent(projectPath) +
					'&rel=' + encodeURIComponent(selected) +
					'&refs=1'
				readJson(url).then((payload) => {
					if (!alive) return
					factsCache.current.set(selected, payload)
					setFacts(payload)
					setFactsStage('ready')
				})
				return () => {
					alive = false
				}
			}, [selected, stage, projectPath, factsNonce])

			/* 换选中项就清掉上一份「详细」，避免张冠李戴 */
			useEffect(() => {
				setDetail(null)
				setDetailStage('idle')
			}, [selected, tree])

			const loadDetail = (regen) => {
				if (detailStage === 'loading' || !projectPath) return
				setDetailStage('loading')
				const url =
					API + '/detail?path=' + encodeURIComponent(projectPath) +
					'&rel=' + encodeURIComponent(selected) +
					(regen ? '&regen=1' : '')
				readJson(url).then((payload) => {
					setDetail(payload)
					setDetailStage(payload && payload.ok ? 'ready' : 'error')
				})
			}

			/* 显式「评估全部」：一次调用给这一层每个子项一个风险判断 */
			const assessAll = () => {
				if (assessing || !projectPath) return
				setAssessing(true)
				setAssessNote('')
				const url =
					API + '/assess?path=' + encodeURIComponent(projectPath) +
					'&rel=' + encodeURIComponent(selected)
				readJson(url)
					.then((payload) => {
						if (!payload.ok) {
							setAssessNote(payload.error || t('error'))
							return
						}
						const count = typeof payload.counted === 'number' ? payload.counted : (payload.assessed || []).length
						setAssessNote(t('assessedN') + count)
						factsCache.current.clear()
						setFactsNonce((n) => n + 1)
					})
					.finally(() => setAssessing(false))
			}

			const select = (node) => {
				setSelected(node.path)
				if (node.kind === 'dir') {
					setExpanded((prev) => {
						if (prev.has(node.path)) return prev
						const next = new Set(prev)
						next.add(node.path)
						return next
					})
				}
			}

			const toggle = (path) => {
				setExpanded((prev) => {
					const next = new Set(prev)
					if (next.has(path)) next.delete(path)
					else next.add(path)
					return next
				})
			}

			const openProject = (nextPath) => {
				const clean = String(nextPath || '').trim()
				if (clean === '') return
				storageSet('lu.path', clean)
				setPicker(false)
				setManual('')
				setTree(null)
				setFacts(null)
				setFactsStage('idle')
				setSelected('')
				setProjectPath(clean)
				setReload(0)
			}

			const refresh = () => {
				if (busy) return
				setBusy(true)
				setReload((n) => n + 1)
				setTimeout(() => setBusy(false), 600)
			}

			/* 展开后的行：查询时给平铺结果，否则给树 */
			const rows = useMemo(() => {
				if (!tree) return []
				const q = query.trim().toLowerCase()
				if (q !== '') {
					const out = []
					const visit = (node) => {
						if (node.path !== '' && (node.name.toLowerCase().indexOf(q) >= 0 || node.path.toLowerCase().indexOf(q) >= 0)) {
							out.push({ node, depth: Math.max(0, depthOf(node.path)) })
						}
						for (const child of node.children) visit(child)
					}
					visit(tree.tree)
					return out
				}
				const out = []
				const walk = (node, depth) => {
					out.push({ node, depth })
					if (node.kind === 'dir' && expanded.has(node.path)) {
						for (const child of node.children) walk(child, depth + 1)
					}
				}
				walk(tree.tree, 0)
				return out
			}, [tree, expanded, query])

			const rowFor = (entry) => {
				const { node, depth } = entry
				const isOpen = expanded.has(node.path)
				const isRoot = node.path === ''
				return h(
					'div',
					{
						key: node.path === '' ? '__root' : node.path,
						className: 'lu-row' + (selected === node.path ? ' on' : '') + (node.kind === 'file' ? ' file' : ''),
						style: { paddingLeft: 8 + depth * 14 },
						onClick: () => select(node),
						title: node.path || tree.name,
					},
					node.kind === 'dir'
						? h(
								'button',
								{
									className: 'lu-caret' + (isOpen ? ' open' : ''),
									onClick: (event) => {
										event.stopPropagation()
										toggle(node.path)
									},
									'aria-label': isOpen ? t('collapse') : t('expand'),
									'aria-expanded': isOpen ? 'true' : 'false',
								},
								isOpen ? '▾' : '▸',
							)
						: h('span', { className: 'lu-caret-space' }),
					h('span', { className: 'lu-rn' }, isRoot ? tree.name : node.name),
					node.kind === 'dir' ? h('span', { className: 'lu-rc' }, node.fileCount) : null,
				)
			}

			const safetyBadge = (safety) =>
				h('span', { className: 'lu-badge ' + (safety || 'careful') }, safetyLabel(safety, t))

			const childrenList = (factsNode) => {
				const items = (factsNode.children || []).filter((child) => child.kind === 'file').slice(0, 40)
				const dirs = (factsNode.children || []).filter((child) => child.kind === 'dir')
				if (items.length === 0 && dirs.length === 0) return null
				return h(
					'div',
					{ className: 'lu-sec' },
					h('div', { className: 'lu-sec-h' }, h('h2', null, t('children'))),
					h(
						'div',
						{ className: 'lu-files' },
						dirs.map((child) =>
							h(
								'button',
								{ key: child.path, className: 'lu-file-row', onClick: () => setSelected(child.path) },
								h('span', { className: 'lu-file-nm' }, child.name + '/'),
								h('span', { className: 'lu-file-go' }, child.fileCount),
							),
						),
						items.map((child) =>
							h(
								'button',
								{ key: child.path, className: 'lu-file-row', onClick: () => setSelected(child.path) },
								h('span', { className: 'lu-file-nm' }, child.name),
								h('span', { className: 'lu-file-go' }, '›'),
							),
						),
					),
				)
			}

			const statsBlock = () => {
				if (!tree || !tree.stats) return null
				const s = tree.stats
				const langs = (s.languages || []).map((item) => item[0] + '×' + item[1]).join('  ')
				return h(
					'div',
					{ className: 'lu-sec' },
					h('div', { className: 'lu-sec-h' }, h('h2', null, t('overview'))),
					h(
						'ul',
						{ className: 'lu-kv' },
						h('li', null, h('span', { className: 'k' }, t('files')), h('span', null, String(s.files))),
						h('li', null, h('span', { className: 'k' }, t('foldersLabel')), h('span', null, String(s.dirs))),
						langs !== '' ? h('li', null, h('span', { className: 'k' }, t('types')), h('span', null, langs)) : null,
						(s.entries || []).length > 0
							? h('li', null, h('span', { className: 'k' }, t('entries')), h('span', null, s.entries.join('、')))
							: null,
						(s.biggest || []).length > 0
							? h('li', null, h('span', { className: 'k' }, t('biggest')), h('span', null, s.biggest.map((item) => item.name + '(' + item.fileCount + ')').join('、')))
							: null,
					),
					s.truncated ? h('p', { className: 'lu-why' }, t('truncated')) : null,
				)
			}

			const detailBlock = () => {
				const loading = detailStage === 'loading'
				return h(
					'div',
					null,
					h(
						'div',
						{ className: 'lu-actions-row' },
						h('button', { className: 'lu-btn', onClick: () => loadDetail(false), disabled: loading }, loading ? t('loadingNode') : t('detail')),
						detail ? h('button', { className: 'lu-btn', onClick: () => loadDetail(true), disabled: loading }, t('regenerate')) : null,
						detail && detail.ok && detail.cached ? h('span', { className: 'lu-muted' }, t('cached')) : null,
					),
					detail && detail.ok === false ? h('p', { className: 'lu-note' }, detail.error || t('error')) : null,
					detail && detail.ok
						? h(
								'div',
								{ className: 'lu-detail' },
								h(
									'div',
									{ className: 'lu-detail-h' },
									h('span', { className: 'lu-detail-t' }, detail.detail.title || ''),
									safetyBadge(detail.detail.safety),
								),
								detail.detail.gist ? h('p', { className: 'lu-body' }, detail.detail.gist) : null,
								detail.detail.does ? h('p', { className: 'lu-body' }, detail.detail.does) : null,
								detail.detail.takeIn ? h('p', { className: 'lu-muted' }, t('takesIn') + '：' + detail.detail.takeIn) : null,
								detail.detail.giveOut ? h('p', { className: 'lu-muted' }, t('givesOut') + '：' + detail.detail.giveOut) : null,
								detail.detail.risk
									? h('div', { className: 'lu-call' }, h('div', { className: 'lu-call-h' }, t('effect')), h('p', null, detail.detail.risk))
									: null,
							)
						: null,
				)
			}

			const pane = () => {
				if (factsStage === 'loading') {
					return h('div', { className: 'lu-center' }, h('div', { className: 'lu-spin' }), h('h3', null, t('loadingNode')))
				}
				if (!facts) return h('div', { className: 'lu-center' }, h('h3', null, t('empty')), h('p', null, t('selectHint')))
				if (facts.ok === false) {
					return h('div', { className: 'lu-center' }, h('h3', null, t('error')), h('p', null, facts.error || ''))
				}
				const summary = facts.summary || {}
				const isRoot = facts.path === ''
				const factRows = []
				if (facts.kind === 'file') {
					factRows.push(h('li', { key: 'l' }, h('span', { className: 'k' }, t('lines')), h('span', null, String(facts.lines))))
					if ((facts.exports || []).length > 0) factRows.push(h('li', { key: 'e' }, h('span', { className: 'k' }, t('exportsLabel')), h('span', null, facts.exports.slice(0, 8).join('、'))))
					if ((facts.imports || []).length > 0) factRows.push(h('li', { key: 'i' }, h('span', { className: 'k' }, t('importsLabel')), h('span', null, facts.imports.slice(0, 8).join('、'))))
				} else {
					factRows.push(h('li', { key: 'f' }, h('span', { className: 'k' }, t('files')), h('span', null, String(facts.fileCount))))
					factRows.push(h('li', { key: 't' }, h('span', { className: 'k' }, t('types')), h('span', null, (facts.ext || []).map((item) => item[0] + '×' + item[1]).join('  ') || '—')))
				}
				return h(
					'div',
					{ className: 'lu-scroll' },
					h(
						'div',
						{ className: 'lu-page' },
						h('div', { className: 'lu-eyebrow' }, isRoot ? t('overview') : facts.kind === 'dir' ? t('foldersLabel') : t('files')),
						h('h1', { className: 'lu-h1' }, summary.title || facts.name),
						summary.oneLine ? h('p', { className: 'lu-lede' }, summary.oneLine) : null,
						h('div', { className: 'lu-row-meta' }, h('code', { className: 'lu-crumb' }, facts.path || (tree ? tree.root : '')), safetyBadge(summary.safety), summary.source === 'model' && summary.why ? h('span', { className: 'lu-muted', title: summary.why }, t('predicted')) : null),
						assessNote ? h('p', { className: 'lu-why' }, assessNote) : null,
						summary.say ? h('p', { className: 'lu-body' }, summary.say) : null,
						summary.effect ? h('div', { className: 'lu-call' }, h('div', { className: 'lu-call-h' }, t('effect')), h('p', null, summary.effect)) : null,
						isRoot ? statsBlock() : null,
						h('div', { className: 'lu-sec' }, h('ul', { className: 'lu-kv' }, factRows)),
						facts.kind === 'file' && facts.comment
							? h('div', { className: 'lu-sec' }, h('div', { className: 'lu-sec-h' }, h('h2', null, t('commentLabel'))), h('p', { className: 'lu-body' }, facts.comment))
							: null,
						facts.kind === 'dir' ? childrenList(facts) : null,
						detailBlock(),
					),
				)
			}

			const rail = h(
				'aside',
				{ className: 'lu-rail' },
				h(
					'div',
					{ className: 'lu-proj' },
					h(
						'div',
						{ className: 'lu-proj-row' },
						h('div', { className: 'lu-proj-name', title: projectPath }, tree ? tree.name : '…'),
						projectPath ? h('button', { className: 'lu-pick', onClick: () => setPicker(true) }, t('pick')) : null,
					),
					h('div', { className: 'lu-proj-meta' }, tree ? t('treeHint') : t('subtitle')),
				),
				h(
					'div',
					{ className: 'lu-search' },
					h('input', {
						value: query,
						placeholder: t('search'),
						onChange: (event) => setQuery(event.target.value),
						'aria-label': t('search'),
					}),
				),
				h(
					'nav',
					{ className: 'lu-tree' },
					stage === 'ready' ? rows.map(rowFor) : null,
					stage === 'ready' && rows.length === 0 && query !== '' ? h('div', { className: 'lu-empty-tree' }, t('noMatch')) : null,
				),
				h('div', { className: 'lu-ver' }, t('version')),
			)

			const top = h(
				'header',
				{ className: 'lu-top' },
				h('div', { className: 'lu-crumb' }, h('b', null, tree ? tree.name : ''), ' / ', selected === '' ? t('overview') : selected),
				h('div', { className: 'lu-spacer' }),
				h('button', { className: 'lu-btn', onClick: assessAll, disabled: assessing }, assessing ? t('assessing') : t('assessAll')),
				h('button', { className: 'lu-btn', onClick: refresh, disabled: busy }, busy ? t('refreshing') : t('refresh')),
			)

			let body = null
			if (stage === 'boot' || stage === 'loading') {
				body = h('div', { className: 'lu-center' }, h('div', { className: 'lu-spin' }), h('h3', null, t('loading')), h('p', null, t('loadingHint')))
			} else if (stage === 'error') {
				body = h(
					'div',
					{ className: 'lu-center' },
					h('h3', null, t('error')),
					h('p', null, error),
					h('button', { className: 'lu-btn', onClick: () => setReload((n) => n + 1) }, t('retry')),
				)
			} else {
				body = pane()
			}

			return h(
				'div',
				{ className: 'lu-app', ref: appRef },
				h('style', null, CSS),
				rail,
				h('div', {
					className: 'lu-splitter',
					role: 'separator',
					'aria-orientation': 'vertical',
					'aria-valuemin': 180,
					'aria-valuemax': 560,
					'aria-valuenow': railAria,
					tabIndex: 0,
					title: t('dragHint'),
					onPointerDown: startDrag,
					onDoubleClick: () => setRailWidth(240, true),
					onKeyDown: nudgeRail,
				}),
				h('section', { className: 'lu-main' }, stage === 'ready' ? top : null, body),
				picker
					? h(
							'div',
							{ className: 'lu-mask', onClick: () => setPicker(false) },
							h(
								'div',
								{ className: 'lu-modal', onClick: (event) => event.stopPropagation() },
								h('h4', null, t('pick')),
								h('div', { className: 'lu-hint' }, t('paste')),
								projects.length > 0
									? h(
											'div',
											{ className: 'lu-list' },
											projects.map((project) =>
												h(
													'button',
													{ key: project.id, onClick: () => openProject(project.path) },
													project.title,
													h('small', null, project.path),
												),
											),
										)
									: null,
								h(
									'div',
									{ className: 'lu-field' },
									h('input', {
										value: manual,
										placeholder: tree ? tree.root : 'E:\\我的项目',
										onChange: (event) => setManual(event.target.value),
										onKeyDown: (event) => {
											if (event.key === 'Enter') openProject(manual)
										},
									}),
									h('button', { className: 'lu-btn', onClick: () => openProject(manual) }, t('open')),
								),
								h('div', { className: 'lu-actions' }, h('button', { className: 'lu-btn', onClick: () => setPicker(false) }, t('close'))),
							),
						)
					: null,
			)
		}

		/* ───────────────────────── 入口 ───────────────────────── */

		const PANEL = 'project-guide'

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'project-guide: dictionaries')
			const t = ctx.locale.bind(NS)

			let disposeIcon = null
			let disposePage = null

			disposeIcon = ctx.slots.inject('sidebar.panellist', () =>
				ctx.slots.register(
					{ name: 'sidebar.panellist', id: PANEL, order: 30, label: () => t('nav'), locale: NS },
					(props) => h(GuideIcon, { size: props.size, active: props.active }),
				),
			)

			disposePage = ctx.slots.inject('main', () =>
				ctx.slots.register({ name: 'main', key: PANEL, locale: NS }, (props) => h(GuidePage, props)),
			)

			ctx.effect(() => () => {
				if (typeof disposeIcon === 'function') disposeIcon()
				if (typeof disposePage === 'function') disposePage()
			}, 'project-guide: panel')
		}

		return { apply, inject: ['slots', 'locale'] }
	},
})
