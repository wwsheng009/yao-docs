# xgen 组件 Upload 在List下视频样式错乱

当我们需要上传文件时，要使用到此组件。

看源码是支持视频的
https://github.com/YaoApp/xgen/blob/a81e91cf95a91bbdaa48050bd2f928849f7d0ce2/packages/xgen/components/edit/Upload/types.ts

```ts
filetype: 'image' | 'file' | 'video'
```

##主要记录一下在list下的问题

目前由于shadow-root的原因，List下的视频上传组件样式会发生错乱
[shadow-root](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot)

##魔法修改方法
修改xgen源码，重新打包编译

xgen 
[源码位置](https://github.com/YaoApp/xgen/blob/main/packages/xgen/components/base/PureList/components/Styles/common.lsss)

更换成以下样式
```css
:host {
	.xgen-form-item {
		width: 100%;
		margin-bottom: 12px;
	}

      .sortable-ghost {
            opacity: 0;
      }


 .form_item_upload_wrap {
    padding-top: 11px;
    padding-left: 10px
}

 .form_item_upload_wrap .xgen-upload-select-picture-card, .form_item_upload_wrap .xgen-upload-list-picture-card-container {
    width: 83px;
    height: 83px
}


.video .form_item_upload_wrap .xgen-upload-select-picture-card,.video .form_item_upload_wrap .xgen-upload-list-picture-card-container {
    width: 300px;
    height: 160px
}

.video .upload_video_wrap:hover .icon_delete {
    display: flex
}

.video .upload_video_wrap .video {
    width: 100%;
    height: 160px;
    border-radius: 6px;
    object-fit: fill
}

.video .upload_video_wrap .icon_delete {
    right: -1px;
    bottom: -1px;
    z-index: 1;
    display: none;
    width: 27px;
    height: 27px;
    border-top-left-radius: 6px;
    border-bottom-right-radius: 6px;
    background-color: #fff;
    color: #000;
    cursor: pointer
}

.video .upload_video_wrap .icon_delete:hover {
    background-color: var(--color_danger)
}

.video .upload_video_wrap .icon_delete:hover .icon {
    color: #fff
}

.video .upload_video_wrap .icon_delete .icon {
    color: var(--color_danger);
    font-size: 15px
}

 .xgen-upload.xgen-upload-select-picture-card, .xgen-upload-list-picture-card-container {
    margin-right: 11px;
    margin-bottom: 11px
}

 .form_item_upload_wrap .btn_upload_wrap {
    display: flex;
    flex-direction: column
}

 .form_item_upload_wrap .btn_upload_wrap.file {
    align-items: center;
    flex-direction: row
}

 .form_item_upload_wrap .btn_upload_wrap.file.has_data {
    margin-bottom: 12px
}

 .form_item_upload_wrap .btn_upload_wrap.file .desc {
    margin-top: 0;
    margin-left: 9px
}

 .form_item_upload_wrap .btn_upload_wrap.one_file {
    justify-content: center;
    height: 150px
}

 .form_item_upload_wrap .btn_upload_wrap .desc {
    margin-top: 6px
}

 .form_item_upload_wrap .xgen-upload-list-picture .xgen-upload-list-item, .form_item_upload_wrap .xgen-upload-list-picture-card .xgen-upload-list-item {
    overflow: hidden;
    padding: 0;
    border-color: var(--color_border)
}

 .form_item_upload_wrap .xgen-upload-list-picture-card .xgen-upload-list-item-thumbnail {
    display: flex;
    align-items: center;
    justify-content: center
}

 .form_item_upload_wrap .xgen-upload-list-picture-card .xgen-upload-list-item-thumbnail, .form_item_upload_wrap .xgen-upload-list-picture-card .xgen-upload-list-item-thumbnail img {
    opacity: 1;
    object-fit: cover
}

}

```

重新打包编译。