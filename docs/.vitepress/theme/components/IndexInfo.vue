<script setup lang="ts">
import { VPTeamPage, VPTeamPageTitle, VPTeamMembers } from 'vitepress/theme';

const members = [
  {
    avatar: 'https://www.github.com/wwsheng009.png',
    name: 'Vincent Wang',
    title: 'open source developer.',
    links: [{ icon: 'github', link: 'https://github.com/wwsheng009' }],
  },
];
</script>
<template>
  <!-- <VPTeamPage>
    <VPTeamPageTitle>
      <template #title> 核心成员介绍 </template>
    </VPTeamPageTitle>
    <VPTeamMembers :members="members" />
  </VPTeamPage> -->
  <!-- <DataPanel /> -->

  <HomeContributors />
</template>
