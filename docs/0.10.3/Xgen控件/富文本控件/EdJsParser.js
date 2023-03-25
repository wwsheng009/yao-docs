function edjsHTML() {
  const e = ['left', 'right', 'center', 'justify']
  const t = {
    delimiter() {
      return '<br/>'
    },
    header(e) {
      const t = e.data
      return `<h${t.level}>${t.text}</h${t.level}>`
    },
    paragraph(t) {
      const r = t.data
      const n = r.alignment || r.align
      return void 0 !== n && e.includes(n)
        ? `<p style="text-align:${n};">${r.text}</p>`
        : `<p>${r.text}</p>`
    },
    list(e) {
      const t = e.data
      const r = t.style === 'unordered' ? 'ul' : 'ol'
      const n = function (e, t) {
        const r = e.map((e) => {
          if (!e.content && !e.items)
            return `<li>${e}</li>`
          let r = ''
          return (
            e.items && (r = n(e.items, t)),
            e.content ? `<li> ${e.content} </li>${r}` : void 0
          )
        })
        return `<${t}>${r.join('')}</${t}>`
      }
      return n(t.items, r)
    },
    image(e) {
      const t = e.data
      const r = t.caption ? t.caption : 'Image'
      return (
        `<img src="${t.file && t.file.url ? t.file.url : t.url
        }" alt="${r
        }" />`
      )
    },
    quote(e) {
      const t = e.data
      return `<blockquote>${t.text}</blockquote> - ${t.caption}`
    },
    code(e) {
      return `<pre><code>${e.data.code}</code></pre>`
    },
    embed(e) {
      const t = e.data
      switch (t.service) {
        case 'vimeo':
          return (
            `<iframe src="${t.embed
            }" height="${t.height
            }" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
          )
        case 'youtube':
          return (
            `<iframe width="${t.width
            }" height="${t.height
            }" src="${t.embed
            }" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
          )
        default:
          throw new Error(
            'Only Youtube and Vime Embeds are supported right now.',
          )
      }
    },
  }
  function r(e) {
    return new Error(
      `[31m The Parser function of type "${e
      }" is not defined. \n\n  Define your custom parser functions as: [34mhttps://github.com/pavittarx/editorjs-html#extend-for-custom-blocks [0m`,
    )
  }
  const n = function (e) {
    void 0 === e && (e = {})
    const i = Object.assign({}, t, e)
    return {
      parse(e) {
        return e.blocks.map((e) => {
          return i[e.type] ? i[e.type](e) : r(e.type)
        })
      },
      parseBlock(e) {
        return i[e.type] ? i[e.type](e) : r(e.type)
      },
      parseStrict(e) {
        const t = e.blocks
        const o = n(i).validate({ blocks: t })
        if (o.length) {
          throw new Error(
            `Parser Functions missing for blocks: ${o.toString()}`,
          )
        }
        for (var a = [], u = 0; u < t.length; u++) {
          if (!i[t[u].type])
            throw r(t[u].type)
          a.push(i[t[u].type](t[u]))
        }
        return a
      },
      validate(e) {
        const t = e.blocks
          .map((e) => {
            return e.type
          })
          .filter((e, t, r) => {
            return r.indexOf(e) === t
          })
        const r = Object.keys(i)
        return t.filter((e) => {
          return !r.includes(e)
        })
      },
    }
  }
  return n
}

/**
 * 转换RichText控件保存的内容成html
 * @param {*} data 需要转换的RichText控件保存的Json数组
 * @param {*} converters Block转换器对象
 * @returns 返回html文本
 */
function EdJsToHtml(data, converters) {
  const editorjs_data = {
    blocks: data,
  }
  // 可以自定义转换函数
  const edjsParser = edjsHTML()(converters)
  const htmlarray = edjsParser.parse(editorjs_data)

  let html = ''
  htmlarray.forEach((element) => {
    html += element
  })
  return html
}
function test() {
  return EdJsToHtml([
    { id: 'QyYn8M-ly4', type: 'paragraph', data: { text: '12' } },
    { id: '1ZWwAAOA70', type: 'paragraph', data: { text: '12' } },
    {
      id: '2Feuo_P1q_',
      type: 'list',
      data: {
        style: 'unordered',
        items: [
          { content: '222', items: [] },
          { content: '23123', items: [] },
          { items: [], content: '1231' },
        ],
      },
    },
    { id: 'tOt5YiHPW7', type: 'paragraph', data: { text: '1' } },
  ])
}
