<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const defaultAuthor = 'Vincent Wang'
const { frontmatter } = useData()

const author = ref(defaultAuthor)

if (frontmatter.value?.author)
  author.value = frontmatter.value?.author

const reName = (name: string) =>
  name === 'Vincent Wang' ? 'wwsheng009' : name
const pageHref = ref('')

onMounted(() => {
  pageHref.value = location.href
})

const getGithubLink = (name: string) => `https://github.com/${reName(name)}`
</script>

<template>
  <div
    class="px-[1.2rem] relative py-[1rem] border-1 border-[var(--vp-c-border)]/[.55] w-full min-h-[32px] border-solid mt-[32px] leading-[24px] rounded-[4px]"
  >
    <fa6-solid:copyright class="absolute top-[1rem] right-[1.2rem]" />
    <section class="flex flex-col gap-y-[8px] overflow-hidden">
      <div>
        <span class="font-bold">文章作者：</span>
        <span>
          <a :href="getGithubLink(author)" rel="noreferrer" target="_blank">
            {{ author }}
          </a>
        </span>
      </div>
      <div>
        <span class="font-bold">文章链接：</span>
        <span>
          <a :href="pageHref" rel="noreferrer" target="_blank">
            {{ pageHref }}
          </a>
        </span>
      </div>
      <div>
        <span class="font-bold">版权声明：</span>
        <span>
          本博客所有文章除特别声明外，均采用
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="noreferrer" target="_blank">CC BY-NC-SA
            4.0</a>
          许可协议。转载请注明来自
          <a href="https://github.com/wwsheng009/yao-docs" rel="noreferrer" target="_blank">YaoDocs</a></span>！
      </div>
    </section>
  </div>
</template>
