const path = require('path')
const pptxgen = require('pptxgenjs')
const html2pptx = require(path.join(__dirname, 'html2pptx.cjs'))

const SLIDES = [
  'slide1.html', 'slide2.html', 'slide3.html', 'slide4.html',
  'slide5.html', 'slide6.html', 'slide-demo.html', 'slide7.html', 'slide8.html', 'slide9.html',
]

async function main() {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = 'Grow Up'
  pptx.title = 'Grow Up 路演'

  for (let i = 0; i < SLIDES.length; i++) {
    const htmlFile = path.join(__dirname, 'slides', SLIDES[i])
    const { slide, placeholders } = await html2pptx(htmlFile, pptx)

    // 第 7 页：竞争性雷达图
    if (i === 7 && placeholders.length > 0) {
      const area = placeholders[0]
      slide.addChart(pptx.charts.RADAR, [
        {
          name: 'Grow Up',
          labels: ['长期记忆', '记忆可校准', '隐私本地化', '成长可视化', '情感人设', '对话流畅度'],
          values: [4.5, 4.5, 5, 4.5, 2, 3.5],
        },
        {
          name: 'Replika',
          labels: ['长期记忆', '记忆可校准', '隐私本地化', '成长可视化', '情感人设', '对话流畅度'],
          values: [2.5, 1, 1, 1, 5, 4],
        },
        {
          name: 'Character.AI',
          labels: ['长期记忆', '记忆可校准', '隐私本地化', '成长可视化', '情感人设', '对话流畅度'],
          values: [1.5, 0.5, 1, 1, 4, 4.5],
        },
        {
          name: 'Pi',
          labels: ['长期记忆', '记忆可校准', '隐私本地化', '成长可视化', '情感人设', '对话流畅度'],
          values: [2, 0.5, 1, 1, 3.5, 5],
        },
      ], {
        ...area,
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 9,
        chartColors: ['0E9F7E', 'C26D3A', '857D74', '3A7AB8'],
        radarStyle: 'filled',
        valAxisMaxVal: 5,
        valAxisMinVal: 0,
        catAxisLabelFontSize: 9,
        catAxisLabelFontColor: '1A2333',
        legendFontColor: '1A2333',
        showValAxisTitle: false,
        showCatAxisTitle: false,
      })
    }
  }

  const out = path.join(__dirname, '..', 'Grow-Up路演-白.pptx')
  await pptx.writeFile({ fileName: out })
  console.log('已生成:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
