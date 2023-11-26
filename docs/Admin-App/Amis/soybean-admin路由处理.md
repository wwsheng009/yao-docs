# soybean-admin

项目地址：https://github.com/honghuangdc/soybean-admin

权限路由处理逻辑：

## 应用路由初始化过程

- 应用入口，应用初始化与配置

  `/soybean-admin/src/main.ts`

- setupRouter,配置 vue router 页面路由

  `/soybean-admin/src/router/index.ts`

- createRouterGuard 路由守卫函数,创建守卫后可以监控用户的路由切换

  `/soybean-admin/src/router/guard/index.ts`

- createPermissionGuard 在`router.beforeEach`事件里作拦截处理。判断有没有配置动态权限，如果没有直接返回。

  `/soybean-admin/src/router/guard/permission.ts`

- createDynamicRouteGuard ，判断用户的权限路由是否已经初始化，未登录情况下直接回到登录页，登录成功后再加载权限路由。如果已经初始化，调用 initAuthRoute 进行处理。

  `/soybean-admin/src/router/guard/dynamic.ts`

## 用户登录后，初始化路由

- login 用户登录处理,用户在界面上进行登录

  `/soybean-admin/src/views_builtin/login/components/pwd-login/index.vue`
  `/soybean-admin/src/views/_builtin/login/components/pwd-login/components/other-account.vue`

- handleActionAfterLogin 在用户登录成功后初始化路由信息。调用 initAuthRoute。
- updateUserRole 更换用户权限(切换账号)也会触发调用 initAuthRoute。

  `/soybean-admin/src/store/modules/auth/index.ts`

## 初始化权限路由

- initAuthRoute 初始化权限路由,在这里会判断用户的权限类型，如果是动态的，就通过接口拉取后台的数据。如果是静态的就读取本地的数据。权限的类型通过环境变量`VITE_AUTH_ROUTE_MODE`进行控制，设置成`dynamic`就是动态路由配置。

静态路由是保存在目录`D:\projects\amis\soybean-admin\src\router\modules`下所有的配置文件，这个目录下的文件会自动的加载，不需要明显的引用，每一个文件都是一个根路由配置。

`/soybean-admin/src/store/modules/route/index.ts`

- initDynamicRoute 获取用户路由数据，初始化动态路由，后端根据用户 id 查询到对应的角色类型，并将路由筛选出对应角色的路由数据返回前端。

`/soybean-admin/src/service/api/auth.ts `

- fetchUserRoutes 在这里会调用后端的接口，请求路由配置。

- handleAuthRoute 处理权限路由,在取到后端的路由配置后，把菜单信息转换成路由配置。

`/soybean-admin/src/utils/router/transform.ts`

- transformAuthRouteToVueRoutes 将权限路由转换成 vue 路由,所有多级路由都会被转换成二级路由
- transformAuthRouteToVueRoute 将单个权限路由转换成 vue 路由，在这里会有根据路由的配置中的`component`属性作不同的处理。

`component`属性是路由组件,不同的配置有不同的处理方法：

- basic: 基础布局，具有公共部分的布局
- blank: 空白布局
- multi: 多级路由布局(三级路由或三级以上时，除第一级路由和最后一级路由，其余的采用该布局)
- self: 作为子路由，使用自身的布局(作为最后一级路由，没有子路由)

组件配置示例：

```json
[
  {
    "name": "dashboard",
    "path": "/dashboard",
    "component": "basic",
    "children": [
      {
        "name": "dashboard_analysis",
        "path": "/dashboard/analysis",
        "component": "self",
        "meta": {
          "title": "分析页",
          "requiresAuth": true,
          "icon": "icon-park-outline:analysis",
          "i18nTitle": "routes.dashboard.analysis"
        }
      }
    ]
  }
]
```

multi: 多级路由布局(三级路由或三级以上时，除第一级路由和最后一级路由，其余的采用该布局)

```json
{
  "name": "multi-menu",
  "path": "/multi-menu",
  "component": "basic",
  "children": [
    {
      "name": "multi-menu_first",
      "path": "/multi-menu/first",
      "component": "multi",
      "children": [
        {
          "name": "multi-menu_first_second",
          "path": "/multi-menu/first/second",
          "component": "self",
          "meta": {
            "title": "二级菜单",
            "i18nTitle": "routes.multi-menu.first.second",
            "requiresAuth": true,
            "icon": "mdi:menu"
          }
        },
        {
          "name": "multi-menu_first_second-new",
          "path": "/multi-menu/first/second-new",
          "component": "multi",
          "children": [
            {
              "name": "multi-menu_first_second-new_third",
              "path": "/multi-menu/first/second-new/third",
              "component": "self",
              "meta": {
                "title": "三级菜单",
                "i18nTitle": "routes.multi-menu.first.second-new.third",
                "requiresAuth": true,
                "icon": "mdi:menu"
              }
            }
          ],
          "meta": {
            "title": "二级菜单(有子菜单)",
            "i18nTitle": "routes.multi-menu.first.second-new._value",
            "icon": "mdi:menu"
          }
        }
      ],
      "meta": {
        "title": "一级菜单",
        "i18nTitle": "routes.multi-menu.first._value",
        "icon": "mdi:menu"
      }
    }
  ],
  "meta": {
    "title": "多级菜单",
    "i18nTitle": "routes.multi-menu._value",
    "icon": "carbon:menu",
    "order": 8
  }
}
```
