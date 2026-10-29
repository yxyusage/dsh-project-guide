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

		/* ───────────────────────── 样式 ───────────────────────── */

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
`

		/* ───────────────────────── 小工具 ───────────────────────── */

		const API = '/api/project-guide'

		const readJson = async (url, options) => {
			const response = await fetch(url, options)
			let payload = null
			try {
				payload = await response.json()
			} catch {
				payload = null
			}
			if (!response.ok || !payload || payload.ok === false) {
				throw new Error(payload && payload.error ? String(payload.error) : 'HTTP ' + response.status)
			}
			return payload
		}

		const storageGet = (key, fallback) => {
			try {
				const raw = window.localStorage.getItem(key)
				return raw === null ? fallback : JSON.parse(raw)
			} catch {
				return fallback
			}
		}
		const storageSet = (key, value) => {
			try {
				window.localStorage.setItem(key, JSON.stringify(value))
			} catch {
				/* 隐私模式下忽略 */
			}
		}

		const safetyLabel = (safety, t) =>
			safety === 'safe' ? t('safe') : safety === 'risky' ? t('risky') : t('careful')

		const flatten = (nodes, out, seen) => {
			const visited = seen || new Set()
			for (const node of nodes) {
				if (visited.has(node.path)) continue
				visited.add(node.path)
				out.push(node)
				if (node.children && node.children.length > 0) flatten(node.children, out, visited)
			}
			return out
		}

		const matches = (text, query) => query === '' || String(text).toLowerCase().indexOf(query) >= 0

		/* ───────────────────────── 图标 ───────────────────────── */

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

		/* ───────────────────────── 主组件 ───────────────────────── */

		function GuidePage(props) {
			const t = typeof props.t === 'function' ? props.t : (key) => zh[key] || key

			const [stage, setStage] = useState('boot')
			const [projectPath, setProjectPath] = useState('')
			const [map, setMap] = useState(null)
			const [phase, setPhase] = useState('')
			const [error, setError] = useState('')
			const [note, setNote] = useState('')
			const [view, setView] = useState('home')
			const [depth, setDepthState] = useState(() => {
				const saved = storageGet('lu.depth', 'plain')
				return saved === 'structure' || saved === 'code' ? saved : 'plain'
			})
			const [known, setKnown] = useState(() => new Set())
			const [notes, setNotes] = useState({})
			const [query, setQuery] = useState('')
			const [editing, setEditing] = useState(false)
			const [draft, setDraft] = useState('')
			const [picker, setPicker] = useState(false)
			const [projects, setProjects] = useState([])
			const [manual, setManual] = useState('')
			const [reload, setReload] = useState(0)
			const [busy, setBusy] = useState(false)
			const [settings, setSettings] = useState(() => {
				const saved = storageGet('lu.settings', {})
				const scope = saved && [6, 12, 18].indexOf(saved.scope) >= 0 ? saved.scope : 12
				return { model: !saved || saved.model !== false, scope }
			})
			const [showSettings, setShowSettings] = useState(false)
			const [file, setFile] = useState(null)
			const [fileData, setFileData] = useState(null)
			const [fileStatus, setFileStatus] = useState('idle')
			const [fileNonce, setFileNonce] = useState(0)
			const knownFor = useRef('')

			/* 已知的「懂了」按项目分开存 */
			useEffect(() => {
				if (!projectPath) return
				const saved = storageGet('lu.known:' + projectPath, [])
				knownFor.current = projectPath
				setKnown(new Set(Array.isArray(saved) ? saved : []))
				const savedNotes = storageGet('lu.notes:' + projectPath, {})
				setNotes(savedNotes && typeof savedNotes === 'object' ? savedNotes : {})
			}, [projectPath])

			useEffect(() => {
				if (!projectPath || knownFor.current !== projectPath) return
				storageSet('lu.known:' + projectPath, [...known])
			}, [known, projectPath])

			/* 首次进入：问一下有哪些项目 */
			useEffect(() => {
				let alive = true
				readJson(API + '/projects')
					.then((payload) => {
						if (!alive) return
						setProjects(Array.isArray(payload.projects) ? payload.projects : [])
						const remembered = storageGet('lu.path', '')
						const next = remembered || payload.defaultPath || (payload.projects[0] && payload.projects[0].path) || ''
						if (next) {
							setProjectPath(next)
							setStage('loading')
						} else {
							setStage('pick')
							setPicker(true)
						}
					})
					.catch((err) => {
						if (!alive) return
						setError(String(err && err.message ? err.message : err))
						setStage('error')
					})
				return () => {
					alive = false
				}
			}, [])

			/* 拉地图：生成中就轮询 */
			useEffect(() => {
				if (!projectPath) return undefined
				let alive = true
				let timer = null
				setStage('loading')
				setPhase('')

				const tick = () => {
					const url =
						API + '/map?path=' + encodeURIComponent(projectPath) +
						'&model=' + (settings.model ? '1' : '0') +
						'&limit=' + settings.scope
					readJson(url)
						.then((payload) => {
							if (!alive) return
							if (payload.status === 'ready') {
								setMap(payload.map)
								setNote(payload.note || '')
								setStage('ready')
								setView('home')
								return
							}
							if (payload.status === 'generating') {
								setPhase(payload.phase || '')
								timer = setTimeout(tick, 1100)
								return
							}
							setError(t('error'))
							setStage('error')
						})
						.catch((err) => {
							if (!alive) return
							setError(String(err && err.message ? err.message : err))
							setStage('error')
						})
				}
				tick()
				return () => {
					alive = false
					if (timer) clearTimeout(timer)
				}
			}, [projectPath, reload, settings.model, settings.scope])

			const mapUrl = useCallback(
				(force) =>
					(force ? API + '/refresh' : API + '/map') +
					'?path=' + encodeURIComponent(projectPath) +
					'&model=' + (settings.model ? '1' : '0') +
					'&limit=' + settings.scope,
				[projectPath, settings.model, settings.scope],
			)

			const applySettings = (patch) => {
				const next = Object.assign({}, settings, patch)
				setSettings(next)
				storageSet('lu.settings', next)
				setMap(null)
				setReload((n) => n + 1)
			}

			const openProject = useCallback((nextPath) => {
				const clean = String(nextPath || '').trim()
				if (!clean) return
				storageSet('lu.path', clean)
				setPicker(false)
				setManual('')
				setMap(null)
				setFile(null)
				setFileData(null)
				setProjectPath(clean)
				setStage('loading')
				setReload((n) => n + 1)
			}, [])

			/* 点开一个文件：只读这一个，不整份上传 */
			useEffect(() => {
				if (!file || !projectPath) return undefined
				let alive = true
				setFileStatus('loading')
				setFileData(null)
				const url =
					API + '/file?path=' + encodeURIComponent(projectPath) +
					'&rel=' + encodeURIComponent(file) +
					'&model=' + (settings.model ? '1' : '0')
				readJson(url)
					.then((payload) => {
						if (!alive) return
						setFileData(payload)
						setFileStatus('ready')
					})
					.catch((err) => {
						if (!alive) return
						setFileData({ ok: false, error: String(err && err.message ? err.message : err) })
						setFileStatus('ready')
					})
				return () => {
					alive = false
				}
			}, [file, fileNonce, projectPath, settings.model])

			const allNodes = useMemo(() => (map ? flatten(map.nodes, [], new Set()) : []), [map])
			const byId = useMemo(() => {
				const table = {}
				for (const node of allNodes) table[node.path] = node
				return table
			}, [allNodes])

			const current = view !== 'home' ? byId[view] : null
			const activeFile =
				file && (file === view || (view !== 'home' && file.startsWith(view + '/'))) ? file : null
			const areas = map ? map.nodes.filter((node) => node.depth === 0) : []
			const knownCount = areas.filter((node) => known.has(node.path)).length

			const visibleTree = useMemo(() => {
				const q = query.trim().toLowerCase()
				if (!map) return []
				if (q === '') return allNodes.filter((node) => node.depth <= 1)
				return allNodes.filter((node) => node.depth <= 1 && matches(node.path, q))
			}, [allNodes, query, map])

			const setDepth = (next) => {
				setDepthState(next)
				storageSet('lu.depth', next)
			}

			const toggleKnown = () => {
				if (!current) return
				const next = new Set(known)
				if (next.has(current.path)) next.delete(current.path)
				else next.add(current.path)
				setKnown(next)
			}

			const submitNote = () => {
				const value = draft.trim()
				if (value === '') return
				const next = Object.assign({}, notes, { [view]: value })
				setNotes(next)
				storageSet('lu.notes:' + projectPath, next)
				setEditing(false)
				setDraft('')
			}

			const refresh = () => {
				if (busy || !projectPath) return
				setBusy(true)
				readJson(mapUrl(true), { method: 'POST' })
					.then(() => {
						setReload((n) => n + 1)
					})
					.catch((err) => {
						setError(String(err && err.message ? err.message : err))
						setStage('error')
					})
					.finally(() => setBusy(false))
			}

			/* ---------- 结构块 ---------- */

			const railNode = (node) => {
				const active = view === node.path
				return h(
					'button',
					{
						key: node.path,
						className: 'lu-node' + (node.depth === 1 ? ' d1' : '') + (active ? ' on' : ''),
						onClick: () => {
							setView(node.path)
							setEditing(false)
						},
						title: node.title ? node.title + ' · ' + node.path : node.path,
					},
					known.has(node.path) ? h('span', { className: 'lu-dot' }) : null,
					h('span', { className: 'lu-nm' }, node.name),
					h('span', { className: 'lu-ct' }, node.fileCount),
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
						h('div', { className: 'lu-proj-name', title: map ? map.root : projectPath }, map ? map.name : '…'),
						projectPath
							? h('button', { className: 'lu-pick', onClick: () => setPicker(true) }, t('pick'))
							: null,
					),
					h(
						'div',
						{ className: 'lu-proj-meta' },
						map ? map.stats.files + ' ' + t('files') + ' · ' + areas.length + ' ' + t('areas') : t('subtitle'),
					),
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
					stage === 'ready'
						? [
								h(
									'button',
									{
										key: '__home',
										className: 'lu-node' + (view === 'home' ? ' on' : ''),
										onClick: () => {
											setView('home')
											setEditing(false)
										},
									},
									h('span', { className: 'lu-nm' }, t('overview')),
								),
								...visibleTree.map(railNode),
								visibleTree.length === 0 && query !== ''
									? h('div', { key: '__none', className: 'lu-empty-tree' }, t('noMatch'))
									: null,
							]
						: null,
				),
				map
					? h(
							'div',
							{ className: 'lu-progress' },
							t('known') + ' ' + knownCount + ' / ' + areas.length,
							h('div', { className: 'lu-track' }, h('i', { style: { width: (areas.length === 0 ? 0 : (knownCount / areas.length) * 100) + '%' } })),
						)
					: null,
			)

			/* ---------- 顶栏 ---------- */

			const crumbText = activeFile || (current ? current.path : t('overview'))
			const crumb = h('div', { className: 'lu-crumb' }, h('b', null, map ? map.name : ''), ' / ', crumbText)

			const top = h(
				'header',
				{ className: 'lu-top' },
				crumb,
				h('div', { className: 'lu-spacer' }),
				activeFile
					? h('button', { className: 'lu-btn', onClick: () => setFile(null) }, '← ' + t('back'))
					: null,
				current
					? h(
							'div',
							{ className: 'lu-tools' },
							h(
								'div',
								{ className: 'lu-segs' },
								h('button', { className: depth === 'plain' ? 'on' : '', onClick: () => setDepth('plain') }, t('plain')),
								h('button', { className: depth === 'structure' ? 'on' : '', onClick: () => setDepth('structure') }, t('structureDepth')),
								h('button', { className: depth === 'code' ? 'on' : '', onClick: () => setDepth('code') }, t('code')),
							),
							h(
								'button',
								{ className: 'lu-got' + (known.has(current.path) ? ' ok' : ''), onClick: toggleKnown },
								known.has(current.path) ? '✓ ' + t('known') : '✓ ' + t('gotIt'),
							),
							h(
								'button',
								{ className: 'lu-got', onClick: () => { setEditing(true); setDraft(notes[current.path] || '') } },
								t('wrong'),
							),
						)
					: null,
				h(
					'button',
					{
						className: 'lu-btn',
						onClick: () => setShowSettings((value) => !value),
						title: t('settings'),
						'aria-label': t('settings'),
					},
					'⚙',
				),
				h(
					'button',
					{ className: 'lu-btn', onClick: refresh, disabled: busy || stage !== 'ready', title: t('refresh') },
					busy ? t('refreshing') : t('refresh'),
				),
			)

			/* ---------- 导览 ---------- */

			const overview = () =>
				h(
					'div',
					{ className: 'lu-page' },
					h('div', { className: 'lu-eyebrow' }, t('overview')),
					h('h1', { className: 'lu-h1' }, map.name),
					h(
						'div',
						{ className: 'lu-lede' },
						note ? t('factsOnly') + ' · ' + note : t('narrated'),
					),
					h('ul', { className: 'lu-sum' }, (map.summary || []).map((line, index) => h('li', { key: index }, line))),

					h(
						'div',
						{ className: 'lu-sec' },
						h('div', { className: 'lu-sec-h' }, h('h2', null, t('structure')), h('span', null, '按文件多少排的')),
						h(
							'div',
							{ className: 'lu-comp' },
							areas.map((node) =>
								h('i', {
									key: node.path,
									className: node.safety || 'careful',
									style: { flexGrow: Math.min(node.fileCount, 30) + 1 },
								}),
							),
						),
						h(
							'div',
							{ className: 'lu-parts' },
							areas.map((node) =>
								h(
									'button',
									{
										key: node.path,
										className: 'lu-part',
										onClick: () => setView(node.path),
										title: node.path,
									},
									h(
										'span',
										{ className: 'lu-pname' },
										known.has(node.path) ? h('span', { className: 'lu-dot' }) : null,
										node.title || node.name,
									),
									h('span', { className: 'lu-psay' }, node.oneLine),
									h('span', { className: 'lu-pct' }, node.fileCount),
									h('span', { className: 'lu-pchev' }, '›'),
								),
							),
						),
					),

					map.route && map.route.length > 0
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('route')), h('span', null, t('routeHint'))),
								h(
									'ol',
									{ className: 'lu-route' },
									map.route.map((step, index) =>
										h(
											'li',
											{ key: index },
											h('div', { className: 'lu-num' }, index + 1),
											h(
												'div',
												null,
												h('b', null, h('span', { className: 'lu-file' }, step.file)),
												h('div', { className: 'lu-why' }, step.why),
											),
										),
									),
								),
							)
						: null,

					map.ignore && map.ignore.length > 0
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('ignore')), h('span', null, t('ignoreHint'))),
								h(
									'details',
									{ className: 'lu-fold' },
									h('summary', null, map.ignore.length + ' 个，看了也没用'),
									h(
										'div',
										{ className: 'lu-ig' },
										map.ignore.map((row, index) =>
											h(
												'div',
												{ key: index, className: 'lu-ig-row' },
												h('code', null, row.name),
												h('span', null, row.why || '给工具看的，不是给你看的。'),
											),
										),
									),
								),
							)
						: null,
				)

			/* ---------- 文件夹卡片 ---------- */

			const effectLine = (node) => {
				if (depth === 'code') {
					const ext = (node.ext || []).map(([name, count]) => name + '×' + count).join(' ')
					return (
						'这个文件夹里 ' + node.fileCount + ' 个文件' +
						(ext ? '（' + ext + '）' : '') +
						(node.importedBy && node.importedBy.length > 0 ? '；被 ' + node.importedBy.length + ' 处引用' : '；没有被别处引用') +
						(node.imports && node.imports.length > 0 ? '；它引用了 ' + node.imports.join('、') : '') +
						'。'
					)
				}
				return node.plain.effect
			}

			const card = () => {
				const node = current
				const isKnown = known.has(node.path)
				// 副标题常常就是正文的第一句，重复读一遍很傻：能拆开就拆开，拆不开就只留正文
				const sub = String(node.oneLine || '').replace(/…$/, '')
				const lead = node.plain.lead || ''
				const duplicated = sub !== '' && lead.startsWith(sub) && /^[。！？；，、\s]/.test(lead.slice(sub.length))
				const stripped = duplicated ? lead.slice(sub.length).replace(/^[。！？；，、\s]+/, '') : lead
				const split = duplicated && stripped.length >= 8
				const bodyText = split ? stripped : lead
				const showSub = duplicated ? split : true
				const body =
					depth === 'plain'
						? h(
								react.Fragment,
								null,
								bodyText !== '' ? h('p', { className: 'lu-body' }, bodyText) : null,
								node.plain.say ? h('p', { className: 'lu-say' }, node.plain.say) : null,
							)
						: bodyText !== ''
							? h('p', { className: 'lu-body' }, bodyText)
							: null

				const facts =
					depth === 'code'
						? h(
								'ul',
								{ className: 'lu-kv' },
								h('li', null, h('span', { className: 'k' }, '路径'), h('span', null, node.path)),
								h('li', null, h('span', { className: 'k' }, '文件'), h('span', null, node.fileCount + ' 个' + ((node.files || []).length > 0 ? '：' + node.files.join('、') : ''))),
								node.importedBy && node.importedBy.length > 0
									? h('li', null, h('span', { className: 'k' }, '被引用'), h('span', null, node.importedBy.join('、')))
									: null,
								node.imports && node.imports.length > 0
									? h('li', null, h('span', { className: 'k' }, '引用了'), h('span', null, node.imports.join('、')))
									: null,
							)
						: null

				return h(
					'div',
					{ className: 'lu-page' },
					h(
						'div',
						{ className: 'lu-hero' },
						h(
							'div',
							null,
							h('h1', { className: 'lu-h1', style: { marginTop: 0 } }, node.title || node.name),
							showSub ? h('div', { className: 'lu-lede' }, node.oneLine) : null,
						),
						h('span', { className: 'lu-pill ' + (node.safety || 'careful') }, safetyLabel(node.safety, t)),
					),

					notes[node.path]
						? h('div', { className: 'lu-note' }, h('b', null, t('noteTitle')), notes[node.path])
						: null,

					h(
						'div',
						{ className: 'lu-call' },
						h('div', { className: 'lu-call-h' }, depth === 'code' ? '这一层的事实' : t('effect')),
						h('p', null, effectLine(node)),
					),

					body,
					facts,

					node.kind === 'dir' && depth !== 'code' && node.files && node.files.length > 0
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('inside')), h('span', null, t('openFileHint'))),
								h(
									'div',
									{ className: 'lu-files' },
									node.files.map((name) =>
										h(
											'button',
											{
												key: name,
												className: 'lu-file-row',
												onClick: () => {
													setFile(node.kind === 'file' ? node.path : node.path + '/' + name)
													setFileNonce((n) => n + 1)
												},
											},
											h('span', { className: 'lu-file-nm' }, name),
											h('span', { className: 'lu-file-go' }, '›'),
										),
									),
								),
							)
						: null,

					node.related && node.related.length > 0
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('related'))),
								h('div', { className: 'lu-chips' }, node.related.map((rel, index) => h('span', { key: index, className: 'lu-chip' }, rel))),
							)
						: h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('related'))),
								h('div', { className: 'lu-why' }, '代码里没有直接引用它的地方，改动波及别处的可能性较小。'),
							),

					node.deeper
						? h(
								'div',
								{ className: 'lu-deep' },
								h('div', { className: 'lu-deep-row' }, h('div', { className: 'lu-deep-k' }, t('deeper')), h('div', { className: 'lu-deep-v' }, '去搜：' + node.deeper.search)),
								h('div', { className: 'lu-deep-row' }, h('div', { className: 'lu-deep-k' }), h('div', { className: 'lu-deep-v' }, '去读：', h('code', null, node.deeper.read))),
								h('div', { className: 'lu-deep-row' }, h('div', { className: 'lu-deep-k' }, '问 AI'), h('div', { className: 'lu-deep-v' }, '“' + node.deeper.ask + '”', h('em', null, '把这句话发到对话里就行。'))),
							)
						: null,

					isKnown
						? h(
								'div',
								{ className: 'lu-call', style: { marginTop: 22, borderLeftColor: 'var(--lu-ok)' } },
								h('p', { style: { color: 'var(--lu-dim)' } }, '这块你标过「懂了」，所以只留一句提醒。'),
							)
						: null,

					(() => {
						const index = areas.findIndex((item) => item.path === node.path)
						if (index < 0) return null
						const before = index > 0 ? areas[index - 1] : null
						const after = index < areas.length - 1 ? areas[index + 1] : null
						if (!before && !after) return null
						return h(
							'div',
							{ className: 'lu-nav' },
							before
								? h('button', { className: 'lu-navbtn', onClick: () => setView(before.path) }, '← ' + (before.title || before.name))
								: h('span', { className: 'lu-navbtn empty' }),
							after
								? h('button', { className: 'lu-navbtn next', onClick: () => setView(after.path) }, (after.title || after.name) + ' →')
								: h('span', { className: 'lu-navbtn empty' }),
						)
					})(),

					editing
						? h(
								'div',
								{ className: 'lu-noteform' },
								h('textarea', {
									autoFocus: true,
									value: draft,
									placeholder: t('notePlaceholder'),
									onChange: (event) => setDraft(event.target.value),
									onKeyDown: (event) => {
										if (event.key === 'Escape') {
											setEditing(false)
											setDraft('')
										}
									},
								}),
								h(
									'div',
									{ className: 'lu-row' },
									h('button', { className: 'lu-btn', onClick: submitNote }, t('noteSubmit')),
									h('button', { className: 'lu-btn', onClick: () => { setEditing(false); setDraft('') } }, t('noteCancel')),
									h('span', { className: 'lu-why', style: { marginTop: 0 } }, t('noteSaved')),
								),
							)
						: null,
				)
			}

			/* ---------- 文件卡片 ---------- */

			const fileCard = () => {
				const name = String(activeFile || '').split('/').pop()
				if (!fileData) {
					return h(
						'div',
						{ className: 'lu-page' },
						h('div', { className: 'lu-eyebrow' }, t('fileLoading')),
						h('h1', { className: 'lu-h1' }, name),
						h('div', { className: 'lu-lede' }, t('fileLoadingHint')),
						h('div', { className: 'lu-prog', style: { marginTop: 20, width: '100%' } }, h('i')),
					)
				}
				if (fileData.ok === false) {
					return h(
						'div',
						{ className: 'lu-page' },
						h('h1', { className: 'lu-h1' }, name),
						h(
							'div',
							{ className: 'lu-call' },
							h('div', { className: 'lu-call-h' }, t('fileError')),
							h('p', null, fileData.error || ''),
						),
						h(
							'div',
							{ className: 'lu-card-foot' },
							h('button', { className: 'lu-btn', onClick: () => setFileNonce((n) => n + 1) }, t('fileRetry')),
							h('button', { className: 'lu-btn', onClick: () => setFile(null) }, '← ' + t('back')),
						),
					)
				}
				const card = fileData.card
				const safety = (card && card.safety) || 'careful'
				return h(
					'div',
					{ className: 'lu-page' },
					h(
						'div',
						{ className: 'lu-hero' },
						h(
							'div',
							null,
							h('h1', { className: 'lu-h1', style: { marginTop: 0 } }, (card && card.title) || name),
							h('div', { className: 'lu-lede' }, (card && card.gist) || fileData.lines + ' 行'),
						),
						h('span', { className: 'lu-pill ' + safety }, safetyLabel(safety, t)),
					),
					card && card.risk
						? h('div', { className: 'lu-call' }, h('div', { className: 'lu-call-h' }, t('effect')), h('p', null, card.risk))
						: null,
					card && card.does
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('whatItDoes'))),
								h('p', { className: 'lu-body', style: { marginTop: 0 } }, card.does),
							)
						: null,
					h(
						'ul',
						{ className: 'lu-kv', style: { marginTop: 18 } },
						h('li', null, h('span', { className: 'k' }, t('takesIn')), h('span', null, (card && card.takeIn) || '—')),
						h('li', null, h('span', { className: 'k' }, t('givesOut')), h('span', null, (card && card.giveOut) || '—')),
						h('li', null, h('span', { className: 'k' }, '行数'), h('span', null, String(fileData.lines))),
					),
					fileData.names && fileData.names.length > 0
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, t('keyNames'))),
								h('div', { className: 'lu-chips' }, fileData.names.map((n) => h('span', { key: n, className: 'lu-chip' }, n))),
							)
						: null,
					depth === 'code' && fileData.excerpt
						? h(
								'div',
								{ className: 'lu-sec' },
								h('div', { className: 'lu-sec-h' }, h('h2', null, '代码开头'), h('span', null, '前 40 行')),
								h('pre', { className: 'lu-code' }, fileData.excerpt),
							)
						: null,
					h(
						'div',
						{ className: 'lu-card-foot' },
						h('button', { className: 'lu-btn', onClick: () => setFile(null) }, '← ' + t('back')),
						h('button', { className: 'lu-btn', onClick: () => setFileNonce((n) => n + 1) }, t('fileRetry')),
					),
					h('div', { className: 'lu-fineprint' }, card ? t('fileNote') : fileData.note || t('fileFactsOnly')),
				)
			}

			/* ---------- 设置页 ---------- */

			const settingsPage = () =>
				h(
					'div',
					{ className: 'lu-page' },
					h('div', { className: 'lu-eyebrow' }, t('settings')),
					h('h1', { className: 'lu-h1' }, t('settings')),
					h('div', { className: 'lu-lede' }, t('settingsHint')),
					h(
						'div',
						{ className: 'lu-sec' },
						h(
							'div',
							{ className: 'lu-pop-row' },
							h(
								'div',
								{ className: 'lu-pop-t' },
								h('b', null, t('useModel')),
								h('small', null, t('useModelHint')),
							),
							h(
								'button',
								{
									className: 'lu-switch' + (settings.model ? ' on' : ''),
									onClick: () => applySettings({ model: !settings.model }),
									'aria-pressed': settings.model,
									'aria-label': t('useModel'),
								},
								h('i'),
							),
						),
						h(
							'div',
							{ className: 'lu-pop-row' },
							h(
								'div',
								{ className: 'lu-pop-t' },
								h('b', null, t('scope')),
								h('small', null, t('scopeHint')),
							),
							h(
								'div',
								{ className: 'lu-segs' },
								[6, 12, 18].map((count) =>
									h(
										'button',
										{
											key: count,
											className: settings.scope === count ? 'on' : '',
											onClick: () => applySettings({ scope: count }),
										},
										count === 6 ? t('scopeFew') : count === 12 ? t('scopeNormal') : t('scopeMore'),
									),
								),
							),
						),
					),
					h(
						'div',
						{ className: 'lu-card-foot' },
						h('button', { className: 'lu-btn', onClick: () => setShowSettings(false) }, '← ' + t('close')),
					),
					h('div', { className: 'lu-fineprint' }, t('settingsHint')),
				)

			/* ---------- 底部坞 ---------- */

			const dock = current
				? h(
						'footer',
						{ className: 'lu-dock' },
						h(
							'div',
							{ className: 'lu-dock-l' },
							h('span', { className: 'lu-dock-label' }, t('depth')),
							h(
								'div',
								{ className: 'lu-segs' },
								h('button', { className: depth === 'plain' ? 'on' : '', onClick: () => setDepth('plain') }, t('plain')),
								h('button', { className: depth === 'structure' ? 'on' : '', onClick: () => setDepth('structure') }, t('structureDepth')),
								h('button', { className: depth === 'code' ? 'on' : '', onClick: () => setDepth('code') }, t('code')),
							),
							h('span', { className: 'lu-dock-sep' }),
							h(
								'button',
								{ className: 'lu-got' + (known.has(current.path) ? ' ok' : ''), onClick: toggleKnown },
								known.has(current.path) ? '✓ ' + t('known') : '✓ ' + t('gotIt'),
							),
							h(
								'button',
								{ className: 'lu-got', onClick: () => { setEditing(true); setDraft(notes[current.path] || ''); } },
								t('wrong'),
							),
						),
					)
				: null

			/* ---------- 状态页 ---------- */

			const center = (children) => h('div', { className: 'lu-center' }, ...children)

			let mainBody = null
			if (stage === 'boot' || stage === 'loading') {
				mainBody = center([
					h('div', { key: 'a', className: 'lu-spin' }),
					h('h3', { key: 'b' }, t('loading')),
					h('p', { key: 'c' }, phase ? phase : t('loadingHint')),
					h('div', { key: 'd', className: 'lu-prog' }, h('i')),
				])
			} else if (stage === 'error') {
				mainBody = center([
					h('h3', { key: 'a' }, t('error')),
					h('p', { key: 'b' }, error),
					h('button', { key: 'c', className: 'lu-btn', onClick: () => setPicker(true) }, t('pick')),
				])
			} else if (stage === 'pick') {
				mainBody = center([
					h('h3', { key: 'a' }, t('empty')),
					h('p', { key: 'b' }, t('emptyHint')),
					h('button', { key: 'c', className: 'lu-btn', onClick: () => setPicker(true) }, t('pick')),
				])
			} else if (map) {
				mainBody = h(
					'div',
					{ className: 'lu-scroll' },
					showSettings ? settingsPage() : view === 'home' ? overview() : activeFile ? fileCard() : card(),
				)
			}

			return h(
				'div',
				{ className: 'lu-app' },
				h('style', null, CSS),
				rail,
				h('section', { className: 'lu-main' }, stage === 'ready' ? top : null, mainBody),
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
										placeholder: map ? map.root : 'E:\\我的项目',
										onChange: (event) => setManual(event.target.value),
										onKeyDown: (event) => {
											if (event.key === 'Enter') openProject(manual)
										},
									}),
									h('button', { className: 'lu-btn', onClick: () => openProject(manual) }, t('open')),
								),
								h(
									'div',
									{ className: 'lu-actions' },
									h('button', { className: 'lu-btn', onClick: () => setPicker(false) }, t('close')),
								),
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
