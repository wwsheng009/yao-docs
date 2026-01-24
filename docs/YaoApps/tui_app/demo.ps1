# TUI 外部数据传递功能演示脚本 (PowerShell 版)
# 用于测试和展示 yao tui 的外部数据传入功能

# 颜色定义
$Green = "`e[32m"
$Blue = "`e[34m"
$Yellow = "`e[33m"
$NC = "`e[0m"

Write-Host "$Blue======================================$NC"
Write-Host "$Blue  TUI 外部数据功能演示$NC"
Write-Host "$Blue======================================$NC"
Write-Host ""

# 检查是否编译了 yao-tui.exe
if (-not (Test-Path ".\yao-tui.exe")) {
    Write-Host "$Yellow警告: yao-tui.exe 未编译，正在编译...$NC"
    go build -o yao-tui.exe .\cmd\tui
    Write-Host "$Green✓ 编译完成$NC"
}

Write-Host ""
Write-Host "$Green演示场景:$NC"
Write-Host "1. 使用默认配置启动 TUI"
Write-Host "2. 覆盖标题"
Write-Host "3. 完全覆盖数据"
Write-Host "4. 多个参数合并"
Write-Host "5. 嵌套 JSON 数据"
Write-Host "6. 调试模式"
Write-Host ""

$choice = Read-Host "选择演示场景 (1-6, 0=退出)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "$Blue场景 1: 使用默认配置$NC"
        Write-Host "$Yellow命令: .\yao-tui.exe external-data-example$NC"
        Write-Host ""
        Write-Host "按任意键继续..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        .\yao-tui.exe external-data-example
    }
    "2" {
        Write-Host ""
        Write-Host "$Blue场景 2: 覆盖标题$NC"
        Write-Host "$Yellow命令: .\yao-tui.exe external-data-example :: '{\"title\":\"Custom Title\"}'$NC"
        Write-Host ""
        Write-Host "按任意键继续..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        # Windows PowerShell 中使用双引号包裹 JSON
        .\yao-tui.exe external-data-example :: '{"title":"Custom Title"}'
    }
    "3" {
        Write-Host ""
        Write-Host "$Blue场景 3: 完全覆盖数据$NC"
        Write-Host "$Yellow命令: .\yao-tui.exe external-data-example :: '{\"title\":\"Full Customize\",\"subtitle\":\"All data external\",\"items\":[\"a\",\"b\",\"c\"]}'$NC"
        Write-Host ""
        Write-Host "按任意键继续..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        .\yao-tui.exe external-data-example :: '{"title":"Full Customize","subtitle":"All data external","items":["a","b","c"]}'
    }
    "4" {
        Write-Host ""
        Write-Host "$Blue场景 4: 多个参数合并$NC"
        Write-Host "$Yellow命令: .\yao-tui.exe external-data-example :: '{\"title\":\"First\"}' :: '{\"subtitle\":\"Second\"}' :: '{\"items\":[\"merged1\",\"merged2\"]}'$NC"
        Write-Host ""
        Write-Host "按任意键继续..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        .\yao-tui.exe external-data-example :: '{"title":"First"}' :: '{"subtitle":"Second"}' :: '{"items":["merged1","merged2"]}'
    }
    "5" {
        Write-Host ""
        Write-Host "$Blue场景 5: 嵌套 JSON 数据$NC"
        Write-Host "$Yellow命令: .\yao-tui.exe external-data-example :: '{\"title\":\"Nested Data\",\"config\":{\"backgroundColor\":\"blue\",\"textColor\":\"yellow\"}}'$NC"
        Write-Host ""
        Write-Host "按任意键继续..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        .\yao-tui.exe external-data-example :: '{"title":"Nested Data","config":{"backgroundColor":"blue","textColor":"yellow"}}'
    }
    "6" {
        Write-Host ""
        Write-Host "$Blue场景 6: 调试模式$NC"
        Write-Host "$Yellow命令: .\yao-tui.exe external-data-example :: '{\"title\":\"Debug Test\"}' --verbose$NC"
        Write-Host ""
        Write-Host "按任意键继续..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        .\yao-tui.exe external-data-example :: '{"title":"Debug Test"}' --verbose
    }
    "0" {
        Write-Host "退出"
    }
    default {
        Write-Host "$Yellow无效选择$NC"
    }
}

Write-Host ""
Write-Host "$Green演示结束$NC"
Write-Host ""
Write-Host "更多示例："
Write-Host ".\yao-tui.exe external-data-example :: '{""title"":""Quick Test""}'"
Write-Host ".\yao-tui.exe external-data-example :: '{""title"":""Test"",""items"":[1,2,3,4,5]}' --verbose"
Write-Host ""
