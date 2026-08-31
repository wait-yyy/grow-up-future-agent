import os

d = 'F:/black/dcrdci/pptx-work/slides'

# 有序替换：先处理 #ffffff 文字色，再处理背景色
replacements = [
    ('#ffffff', '#1a2333'),    # slide6 白色文字 -> 深色文字
    ('#0a0e14', '#ffffff'),    # 背景深黑蓝 -> 纯白
    ('#d8dde5', '#3a4655'),    # 亮灰白 -> 深灰
    ('#e8eaed', '#1a2333'),    # 主文字白 -> 深蓝黑
    ('#9ba3af', '#5a6572'),    # 次文字灰 -> 中灰
    ('#5c6672', '#8a93a0'),    # 浅文字 -> 浅灰
    ('#11161e', '#f4f6f8'),    # 卡片深灰 -> 浅灰白
    ('#232a36', '#e3e7ec'),    # 边框 -> 浅灰
    ('#2fdbb0', '#0e9f7e'),    # 主色青绿 -> 深青绿
    ('#ff6b3b', '#e0552a'),    # 橙色 -> 深橙红
    ('rgba(47,219,176,0.15)', 'rgba(14,159,126,0.10)'),
    ('rgba(47,219,176,0.08)', 'rgba(14,159,126,0.06)'),
    ('rgba(47,219,176,0.05)', 'rgba(14,159,126,0.05)'),
    ('rgba(47,219,176,0.1)', 'rgba(14,159,126,0.08)'),
]

for fn in sorted(os.listdir(d)):
    if not fn.endswith('.html'):
        continue
    p = os.path.join(d, fn)
    with open(p, encoding='utf-8') as f:
        c = f.read()
    for old, new in replacements:
        c = c.replace(old, new)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
    print('done', fn)

print('全部完成')
